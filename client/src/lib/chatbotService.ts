export interface ChatbotResponse {
  message: string;
  data?: any;
  suggestions?: string[];
}

export class ChatbotService {
  static async sendMessage(message: string): Promise<ChatbotResponse> {
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      return {
        message: result.message || "I apologize, but I couldn't process your request.",
        data: result.data,
        suggestions: result.suggestions || this.getDefaultSuggestions()
      };
    } catch (error) {
      console.error('Chatbot API call failed:', error);
      return this.getFallbackResponse(message);
    }
  }

  private static getFallbackResponse(message: string): ChatbotResponse {
    const msg = message.toLowerCase();
    
    if (msg.includes('fee') || msg.includes('payment') || msg.includes('money')) {
      return {
        message: "I cannot provide information about fees or payments. Please contact the administration directly for all fee-related queries. I'm here to help with student academic information, attendance, and general coaching center questions.",
        suggestions: [
          "Show today's attendance",
          "Student statistics by grade",
          "Help me draft a parent message",
          "What can you help with?"
        ]
      };
    }
    
    return {
      message: "I'm currently having trouble connecting to the advanced AI system. I'm your AI Teaching Assistant for Excellence Coaching Center, and I can help you with student information, attendance tracking, and administrative tasks. Please try your question again.",
      suggestions: this.getDefaultSuggestions()
    };
  }

  private static getDefaultSuggestions(): string[] {
    return [
      "Show today's attendance",
      "Student statistics by grade", 
      "Help me contact parents",
      "What can you help with?",
      "Draft a parent message",
      "Show absent students"
    ];
  }
}