import OpenAI from "openai";
import { storage } from "./storage";
import { Student } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatbotResponse {
  message: string;
  data?: any;
  suggestions?: string[];
}

export class AdvancedChatbotService {
  private static async getStudentContext(): Promise<{students: Student[], attendanceStats: any, generalStats: any}> {
    const students = await storage.getStudents();
    const allStudents = await this.getAllStudents(); // Include inactive students
    
    // Get attendance statistics without fee information
    const attendanceRecords = await storage.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.filter(record => 
      record.date.toISOString().split('T')[0] === today
    );
    
    const presentToday = todayAttendance.filter(r => r.status === 'present').length;
    const absentToday = todayAttendance.filter(r => r.status === 'absent').length;
    const attendanceRate = students.length > 0 ? Math.round((presentToday / students.length) * 100) : 0;

    // Grade distribution
    const gradeStats = allStudents.reduce((acc, student) => {
      acc[student.grade] = (acc[student.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      students: allStudents,
      attendanceStats: {
        totalStudents: students.length,
        presentToday,
        absentToday,
        attendanceRate,
        todayDate: today
      },
      generalStats: {
        totalActiveStudents: students.length,
        totalAllStudents: allStudents.length,
        gradeDistribution: gradeStats
      }
    };
  }

  private static async getAllStudents(): Promise<Student[]> {
    // Get both active and inactive students for chatbot context
    return await storage.getAllStudents();
  }

  private static getSystemPrompt(context: any): string {
    return `You are an advanced AI Assistant for Excellence Coaching Center, designed to help teachers and administrators with student-related queries. 

CRITICAL SECURITY RULES:
1. NEVER reveal, discuss, or mention any fee-related information (amounts, payments, dues, etc.)
2. NEVER provide financial data of any kind
3. If asked about fees, politely redirect to "Please contact the administration for fee-related queries"

AVAILABLE INFORMATION:
- Student details (names, grades, contact info, enrollment status)
- Attendance patterns and statistics  
- General coaching center information
- Academic performance discussions

CURRENT CONTEXT:
- Total Active Students: ${context.generalStats.totalActiveStudents}
- Total Students (including inactive): ${context.generalStats.totalAllStudents}
- Today's Attendance: ${context.attendanceStats.presentToday} present, ${context.attendanceStats.absentToday} absent
- Attendance Rate Today: ${context.attendanceStats.attendanceRate}%
- Grade Distribution: ${JSON.stringify(context.generalStats.gradeDistribution)}

CAPABILITIES:
1. Student Information: Provide details about active and inactive students
2. Attendance Analysis: Discuss attendance patterns and trends
3. Academic Guidance: Suggest improvements for student performance
4. Administrative Support: Help with general coaching center queries
5. Parent Communication: Draft messages about student progress (excluding fees)

RESPONSE FORMAT:
- Be professional and helpful
- Provide actionable insights
- Suggest follow-up questions when appropriate
- Use the student data context to give specific answers
- Always maintain student privacy appropriately

Remember: You can discuss both active and inactive students' academic information, but NEVER any financial information.`;
  }

  static async processMessage(message: string): Promise<ChatbotResponse> {
    try {
      // Check for fee-related keywords and block them
      const feeKeywords = ['fee', 'payment', 'money', 'cost', 'price', 'bill', 'invoice', 'amount', 'paid', 'due', 'owe', 'rupee', 'dollar', '$', '₹'];
      const messageWords = message.toLowerCase().split(/\s+/);
      const containsFeeKeyword = feeKeywords.some(keyword => 
        messageWords.some(word => word.includes(keyword))
      );

      if (containsFeeKeyword) {
        return {
          message: "I apologize, but I cannot provide information about fees or payments. Please contact the administration directly for all fee-related queries. I'm here to help with student academic information, attendance, and general coaching center questions.",
          suggestions: [
            "Tell me about today's attendance",
            "Show me student performance trends", 
            "Help me draft a parent communication",
            "What are the grade-wise statistics?"
          ]
        };
      }

      const context = await this.getStudentContext();

      if (!process.env.OPENAI_API_KEY) {
        return this.getRuleBasedResponse(message, context);
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(context)
          },
          {
            role: "user", 
            content: message
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 600,
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        message: result.response || result.message || "I apologize, but I couldn't process your request. Please try rephrasing your question.",
        data: result.data,
        suggestions: result.suggestions || this.getDefaultSuggestions()
      };
      
    } catch (error) {
      console.error('Advanced chatbot error:', error);
      const context = await this.getStudentContext();
      return this.getRuleBasedResponse(message, context);
    }
  }

  private static getRuleBasedResponse(message: string, context: any): ChatbotResponse {
    const msg = message.toLowerCase();
    
    if (msg.includes('attendance') || msg.includes('present') || msg.includes('absent')) {
      return {
        message: `Today's attendance summary:\n\n📊 **Current Status:**\n- Present: ${context.attendanceStats.presentToday} students\n- Absent: ${context.attendanceStats.absentToday} students\n- Attendance Rate: ${context.attendanceStats.attendanceRate}%\n- Total Active Students: ${context.attendanceStats.totalStudents}\n\nWould you like me to provide more detailed attendance analysis or help with absence follow-ups?`,
        suggestions: [
          "Show me absent students today",
          "Attendance trends this week",
          "Help draft absence notifications"
        ]
      };
    }
    
    if (msg.includes('student') && (msg.includes('count') || msg.includes('total') || msg.includes('how many'))) {
      return {
        message: `📋 **Student Statistics:**\n\n- **Active Students:** ${context.generalStats.totalActiveStudents}\n- **Total Students:** ${context.generalStats.totalAllStudents}\n\n**Grade Distribution:**\n${Object.entries(context.generalStats.gradeDistribution).map(([grade, count]) => `- Grade ${grade}: ${count} students`).join('\n')}\n\nI can provide more detailed information about any specific grade or help you analyze student data.`,
        suggestions: [
          "Tell me about Grade 10 students",
          "Show me recent enrollments",
          "Help me contact parents"
        ]
      };
    }
    
    if (msg.includes('grade') || msg.includes('class')) {
      const gradeMatch = msg.match(/grade\s*(\w+)|class\s*(\w+)/i);
      if (gradeMatch) {
        const grade = gradeMatch[1] || gradeMatch[2];
        const gradeCount = context.generalStats.gradeDistribution[grade] || 0;
        return {
          message: `📚 **Grade ${grade} Information:**\n\n- Total Students: ${gradeCount}\n- This represents ${gradeCount > 0 ? Math.round((gradeCount / context.generalStats.totalAllStudents) * 100) : 0}% of all students\n\nI can help you with grade-specific attendance analysis, performance tracking, or parent communication for this grade.`,
          suggestions: [
            `Grade ${grade} attendance today`,
            `Contact Grade ${grade} parents`,
            "Compare grade performance"
          ]
        };
      }
    }
    
    if (msg.includes('help') || msg.includes('what can you do')) {
      return {
        message: `🤖 **AI Teaching Assistant Capabilities:**\n\n✅ **Student Management:**\n- Student information and enrollment status\n- Grade-wise analysis and statistics\n- Contact information lookup\n\n✅ **Attendance Support:**\n- Daily attendance summaries\n- Trend analysis and patterns\n- Absence tracking and follow-ups\n\n✅ **Communication Help:**\n- Draft parent notifications\n- Academic progress messages\n- General announcements\n\n✅ **Administrative Tasks:**\n- Generate reports and insights\n- Student performance analysis\n- Coaching center statistics\n\n❌ **What I Cannot Do:**\n- Fee or payment information (contact admin)\n- Modify student records directly\n- Access sensitive personal data beyond basics\n\nHow can I assist you today?`,
        suggestions: [
          "Today's attendance summary",
          "Help me contact parents", 
          "Show student statistics",
          "Draft an announcement"
        ]
      };
    }
    
    return {
      message: `I'm your AI Teaching Assistant for Excellence Coaching Center. I can help you with student information, attendance tracking, academic insights, and administrative tasks.\n\n**Popular Commands:**\n- "Show me today's attendance"\n- "Tell me about Grade 10 students" \n- "Help me draft a parent message"\n- "What are our student statistics?"\n\nWhat would you like to know?`,
      suggestions: this.getDefaultSuggestions()
    };
  }

  private static getDefaultSuggestions(): string[] {
    return [
      "Show today's attendance",
      "Student statistics by grade",
      "Help me contact parents",
      "Recent attendance trends",
      "Draft parent communication",
      "What can you help me with?"
    ];
  }
}