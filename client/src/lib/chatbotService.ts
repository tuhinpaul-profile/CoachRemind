import { Student, Fee, AttendanceRecord } from '@/types';
import { StorageService } from './storage';

export class ChatbotService {
  private static apiKey: string = '';

  static setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  static async sendMessage(message: string): Promise<string> {
    // If no API key provided, use rule-based responses
    if (!this.apiKey || !this.apiKey.startsWith('sk-')) {
      return this.getRuleBasedResponse(message);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: message
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      return result.response || result.message || 'I apologize, but I could not process your request.';
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      // Fallback to rule-based response
      return this.getRuleBasedResponse(message);
    }
  }

  private static getSystemPrompt(): string {
    const students = StorageService.getStudents();
    const fees = StorageService.getFees();
    const attendance = StorageService.getAttendance();
    const settings = StorageService.getSettings();

    // Calculate current stats
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance[today] || {};
    const presentCount = Object.values(todayAttendance).filter(status => status === 'present').length;
    const absentCount = Object.values(todayAttendance).filter(status => status === 'absent').length;
    const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

    const totalRevenue = fees.filter(fee => fee.status === 'paid').reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
    const pendingFees = fees.filter(fee => fee.status === 'pending').length;
    const overdueFees = fees.filter(fee => fee.status === 'overdue').length;

    const gradeStats = students.reduce((acc, student) => {
      acc[student.grade] = (acc[student.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `You are an AI assistant for ${settings.centerName}, a coaching center management system. You have access to real-time data and should provide helpful, accurate responses about students, attendance, fees, and operations.

Current System Data:
- Total Students: ${students.length}
- Grade Distribution: ${Object.entries(gradeStats).map(([grade, count]) => `${grade}: ${count}`).join(', ')}
- Today's Attendance: ${presentCount} present, ${absentCount} absent (${attendanceRate}% attendance rate)
- Fee Status: ${pendingFees} pending, ${overdueFees} overdue
- Total Revenue: ₹${totalRevenue.toLocaleString()}

You can help with:
1. Attendance queries and statistics
2. Fee management and payment tracking
3. Student information and enrollment data
4. Revenue and financial reports
5. General coaching center operations

Always respond in JSON format with a "response" field containing your answer. Be helpful, professional, and provide specific data when possible. If asked about specific students, provide relevant information while maintaining privacy. For statistical queries, give exact numbers and percentages.`;
  }

  private static getRuleBasedResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    const students = StorageService.getStudents();
    const fees = StorageService.getFees();
    const attendance = StorageService.getAttendance();

    // Calculate stats for responses
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance[today] || {};
    const presentCount = Object.values(todayAttendance).filter(status => status === 'present').length;
    const absentCount = Object.values(todayAttendance).filter(status => status === 'absent').length;
    const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

    const overdueFees = fees.filter(fee => fee.status === 'overdue');
    const pendingFees = fees.filter(fee => fee.status === 'pending');
    const totalRevenue = fees.filter(fee => fee.status === 'paid').reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);

    // Attendance queries
    if (lowerMessage.includes('attendance') || lowerMessage.includes('present') || lowerMessage.includes('absent')) {
      if (lowerMessage.includes('today')) {
        return `Today's attendance summary:\n• Total students: ${students.length}\n• Present: ${presentCount}\n• Absent: ${absentCount}\n• Attendance rate: ${attendanceRate}%\n\nWould you like me to show you which students are absent today?`;
      }
      
      if (lowerMessage.includes('rate') || lowerMessage.includes('percentage')) {
        return `Current attendance rate is ${attendanceRate}%. This is based on today's attendance where ${presentCount} out of ${students.length} students are present.`;
      }

      if (lowerMessage.includes('low') || lowerMessage.includes('poor')) {
        const absentStudents = students.filter(student => todayAttendance[student.id] === 'absent');
        if (absentStudents.length > 0) {
          return `Students with attendance issues today:\n${absentStudents.map(s => `• ${s.name} (${s.grade})`).join('\n')}\n\nWould you like me to send absence notifications to their parents?`;
        } else {
          return 'Great news! No students are absent today. Everyone is present for classes.';
        }
      }

      return `Attendance system is active. Today's stats: ${presentCount} present, ${absentCount} absent. Overall attendance rate: ${attendanceRate}%. How can I help you with attendance management?`;
    }

    // Fee queries
    if (lowerMessage.includes('fee') || lowerMessage.includes('payment') || lowerMessage.includes('revenue') || lowerMessage.includes('money')) {
      if (lowerMessage.includes('overdue') || lowerMessage.includes('late')) {
        if (overdueFees.length > 0) {
          const overdueStudents = overdueFees.map(fee => {
            const student = students.find(s => s.id === fee.studentId);
            return student ? `• ${student.name} (${student.grade}) - ₹${fee.amount}` : null;
          }).filter(Boolean);
          
          return `Overdue fees (${overdueFees.length} students):\n${overdueStudents.join('\n')}\n\nTotal overdue amount: ₹${overdueFees.reduce((sum, fee) => sum + fee.amount, 0).toLocaleString()}\n\nShould I send payment reminders?`;
        } else {
          return 'Excellent! No overdue fees at the moment. All students are up to date with their payments.';
        }
      }

      if (lowerMessage.includes('pending') || lowerMessage.includes('due')) {
        if (pendingFees.length > 0) {
          return `Pending fee payments: ${pendingFees.length} students\nTotal pending amount: ₹${pendingFees.reduce((sum, fee) => sum + fee.amount, 0).toLocaleString()}\n\nThese payments are due soon. Would you like me to send reminders?`;
        } else {
          return 'All fees are either paid or overdue. No pending payments at the moment.';
        }
      }

      if (lowerMessage.includes('revenue') || lowerMessage.includes('collection') || lowerMessage.includes('income')) {
        const monthlyCollection = fees
          .filter(fee => fee.status === 'paid' && fee.paidDate)
          .filter(fee => {
            const paidDate = new Date(fee.paidDate!);
            const now = new Date();
            return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);

        return `Revenue Summary:\n• Total collected: ₹${totalRevenue.toLocaleString()}\n• This month: ₹${monthlyCollection.toLocaleString()}\n• Outstanding: ₹${(overdueFees.reduce((sum, fee) => sum + fee.amount, 0) + pendingFees.reduce((sum, fee) => sum + fee.amount, 0)).toLocaleString()}\n\nCollection rate this month: ${monthlyCollection > 0 ? 'Good' : 'Needs attention'}`;
      }

      return `Fee management overview:\n• Overdue: ${overdueFees.length} students\n• Pending: ${pendingFees.length} students\n• Total revenue: ₹${totalRevenue.toLocaleString()}\n\nHow can I help with fee management?`;
    }

    // Student queries
    if (lowerMessage.includes('student') || lowerMessage.includes('enrollment') || lowerMessage.includes('grade')) {
      const gradeStats = students.reduce((acc, student) => {
        acc[student.grade] = (acc[student.grade] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      if (lowerMessage.includes('total') || lowerMessage.includes('how many')) {
        return `Student enrollment summary:\n• Total students: ${students.length}\n• Grade distribution:\n${Object.entries(gradeStats).map(([grade, count]) => `  - ${grade}: ${count} students`).join('\n')}\n\nAll students are currently active in the system.`;
      }

      if (lowerMessage.includes('grade') && Object.keys(gradeStats).some(grade => lowerMessage.includes(grade.toLowerCase()))) {
        const requestedGrade = Object.keys(gradeStats).find(grade => lowerMessage.includes(grade.toLowerCase()));
        if (requestedGrade) {
          const gradeStudents = students.filter(s => s.grade === requestedGrade);
          return `${requestedGrade} students (${gradeStudents.length} total):\n${gradeStudents.map(s => `• ${s.name} - Roll: ${s.rollNumber}`).join('\n')}\n\nWould you like specific details about any student?`;
        }
      }

      return `Student management system contains ${students.length} active students across grades ${Object.keys(gradeStats).join(', ')}. What specific information do you need?`;
    }

    // Notification queries
    if (lowerMessage.includes('notification') || lowerMessage.includes('remind') || lowerMessage.includes('alert') || lowerMessage.includes('email')) {
      if (lowerMessage.includes('send') || lowerMessage.includes('remind')) {
        return `I can help you send notifications for:\n• Absence alerts to parents\n• Fee payment reminders\n• Custom messages to specific groups\n\nWhich type of notification would you like to send? Please specify your requirements.`;
      }

      return `Notification system is ready. I can help you send automated alerts for attendance and fees, or custom messages to parents and students. What notifications do you need?`;
    }

    // Report queries
    if (lowerMessage.includes('report') || lowerMessage.includes('statistics') || lowerMessage.includes('analytics')) {
      return `Available reports:\n• Attendance reports with trends\n• Fee collection summaries\n• Student directory with contact details\n• Monthly revenue analytics\n\nI can also export data to PDF or Excel formats. Which report would you like to generate?`;
    }

    // General greetings and help
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return `Hello! I'm your AI assistant for Excellence Coaching Center. I can help you with:\n\n📊 Attendance tracking and reports\n💰 Fee management and reminders\n👥 Student information and enrollment\n📧 Automated notifications\n📈 Analytics and reporting\n\nWhat would you like to know about today?`;
    }

    // Default response
    return `I'm here to help with coaching center management! I can assist with:\n\n• Attendance tracking ("What's today's attendance?")\n• Fee management ("Show overdue fees")\n• Student information ("How many students in grade 10?")\n• Reports and analytics ("Generate attendance report")\n• Notifications ("Send fee reminders")\n\nWhat specific information do you need?`;
  }

  static async testConnection(): Promise<boolean> {
    if (!this.apiKey || !this.apiKey.startsWith('sk-')) {
      return false;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}
