import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Settings, Zap, AlertCircle, Mail } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { ChatbotService, ChatbotResponse } from "@/lib/chatbotService";
import { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";

export function Chatbot() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminMessageSubject, setAdminMessageSubject] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage = isAdmin 
      ? "Hello! I'm your advanced AI assistant for Excellence Coaching Center. I can help you with student information, attendance tracking, and administrative tasks, but I cannot provide fee information. What would you like to know?"
      : "Hello! I'm your AI teaching assistant. I can help you with student information, attendance queries, and answer general questions about the coaching center. I cannot provide fee information. What would you like to know?";
    
    setMessages([{
      id: 1,
      sender: 'assistant',
      message: welcomeMessage,
      timestamp: new Date().toISOString()
    }]);

    setSuggestions([
      "Show today's attendance",
      "Student statistics by grade",
      "Help me draft a parent message",
      "What can you help with?"
    ]);
  }, [isAdmin]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      message: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await ChatbotService.sendMessage(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        message: response.message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        message: "I apologize, but I encountered an error. Please try again or check your API configuration.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get response from chatbot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };



  const handleQuickQuery = (query: string) => {
    setInputMessage(query);
    // Auto-send after a brief delay
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      sender: 'assistant',
      message: "Chat cleared! How can I help you today?",
      timestamp: new Date().toISOString()
    }]);
    toast.success('Chat history cleared');
  };

  const handleSendAdminMessage = () => {
    if (!adminMessage.trim() || !adminMessageSubject.trim()) return;
    
    // Add notification for admin
    StorageService.addNotification({
      type: 'info',
      message: `New message from ${user?.name}: ${adminMessageSubject}`,
      read: false
    });
    
    // Clear the form
    setAdminMessage('');
    setAdminMessageSubject('');
    
    toast.success('Message sent to admin successfully');
  };

  const quickQueries = [
    "Show me today's attendance summary",
    "Show enrollment statistics by grade", 
    "List students with low attendance",
    "Help me draft a parent message",
    "Show Grade 10 student details",
    "What are the attendance trends?"
  ];

  return (
    <div className="space-y-6">
      {/* Chatbot Interface */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isAdmin ? 'Admin Chatbot Assistant' : 'Teacher Chatbot Assistant'}
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  Advanced AI Assistant Active
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={clearChat}
            variant="outline"
            className="text-sm"
            data-testid="button-clear-chat"
          >
            Clear Chat
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="h-64 overflow-y-auto space-y-3 mb-4 p-4 bg-gray-50 rounded-lg" data-testid="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'assistant' 
                  ? 'bg-violet-500' 
                  : 'bg-blue-500'
              }`}>
                {message.sender === 'assistant' ? (
                  <MessageSquare className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-white text-xs font-bold">U</span>
                )}
              </div>
              <div className="flex-1">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-800" data-testid={`message-${message.id}`}>
                    {message.message}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.sender === 'assistant' ? 'AI Assistant' : 'You'} • 
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuery(suggestion)}
                  className="px-3 py-1 text-xs bg-violet-100 text-violet-700 rounded-full hover:bg-violet-200 transition-colors"
                  data-testid={`suggestion-${index}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="flex items-center space-x-3">
          <Input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about students, attendance, or anything else..."
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="btn-primary"
            data-testid="button-send-message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Queries</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuery(query)}
              className="p-3 text-left border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors"
              data-testid={`quick-query-${index}`}
            >
              <div className="font-medium text-gray-900 text-sm">
                {query.split(' ').slice(0, 3).join(' ')}
              </div>
              <div className="text-sm text-gray-600 mt-1">{query}</div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Status Information */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>AI Assistant Status</span>
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-sm text-green-800">
              <strong>Advanced AI Active:</strong> Your AI Teaching Assistant is powered by OpenAI GPT-4o and can help with student information, attendance tracking, and administrative tasks. Fee information is restricted for security.
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <h5 className="font-medium text-gray-900 mb-2">AI Capabilities:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>Student information and academic details (active and inactive students)</li>
              <li>Attendance analysis and trend reporting</li>
              <li>Parent communication assistance</li>
              <li>Administrative task support</li>
              <li>General coaching center information</li>
            </ul>
            
            <h5 className="font-medium text-gray-900 mt-3 mb-2">Security Restrictions:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>Cannot access or discuss fee information</li>
              <li>Cannot modify student records directly</li>
              <li>Cannot access sensitive financial data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Teacher-to-Admin Messaging - Teacher Only */}
      {!isAdmin && (
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Message Admin</span>
          </h4>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="messageSubject">Subject</Label>
              <Input
                id="messageSubject"
                value={adminMessageSubject}
                onChange={(e) => setAdminMessageSubject(e.target.value)}
                placeholder="Enter message subject"
                data-testid="input-admin-message-subject"
              />
            </div>
            
            <div>
              <Label htmlFor="adminMessage">Message</Label>
              <Textarea
                id="adminMessage"
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Write your message to the admin..."
                rows={4}
                data-testid="textarea-admin-message"
              />
            </div>
            
            <Button
              onClick={handleSendAdminMessage}
              className="btn-primary"
              disabled={!adminMessage.trim() || !adminMessageSubject.trim()}
              data-testid="button-send-admin-message"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Message to Admin
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
