import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Settings, Zap, AlertCircle } from "lucide-react";
import { StorageService } from "@/lib/storage";
import { ChatbotService } from "@/lib/chatbotService";
import { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";

export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isApiConnected, setIsApiConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved API key
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      ChatbotService.setApiKey(savedApiKey);
    }

    // Initialize with welcome message
    setMessages([{
      id: 1,
      sender: 'assistant',
      message: "Hello! I'm your AI assistant for Excellence Coaching Center. I can help you with student queries, attendance tracking, fee management, and generate reports. What would you like to know?",
      timestamp: new Date().toISOString()
    }]);
  }, []);

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
        message: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
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

  const handleSaveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    ChatbotService.setApiKey(apiKey);
    toast.success('API key saved successfully');
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key first');
      return;
    }

    try {
      ChatbotService.setApiKey(apiKey);
      const isConnected = await ChatbotService.testConnection();
      setIsApiConnected(isConnected);
      
      if (isConnected) {
        toast.success('AI connection successful');
      } else {
        toast.error('AI connection failed');
      }
    } catch (error) {
      setIsApiConnected(false);
      toast.error('Failed to test AI connection');
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

  const quickQueries = [
    "Show me today's attendance summary",
    "Which students have overdue fees?",
    "Show enrollment statistics by grade",
    "Generate monthly revenue report",
    "List students with low attendance",
    "Show notification statistics"
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
              <h3 className="text-lg font-semibold text-gray-900">Admin Chatbot Assistant</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isApiConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {isApiConnected ? 'AI Assistant Active' : 'AI Assistant Ready'}
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

        {/* Chat Input */}
        <div className="flex items-center space-x-3">
          <Input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about students, attendance, fees, or anything else..."
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

      {/* AI Configuration */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>AI Configuration</span>
        </h4>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="mb-2"
              data-testid="input-api-key"
            />
            <p className="text-xs text-gray-500">
              Your API key is stored locally and never transmitted to our servers
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSaveApiKey}
              className="btn-primary"
              data-testid="button-save-api-key"
            >
              <Settings className="w-4 h-4 mr-2" />
              Save API Key
            </Button>
            
            <Button
              onClick={handleTestConnection}
              variant="outline"
              data-testid="button-test-ai-connection"
            >
              <Zap className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
          </div>

          {!apiKey && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> Without an API key, the chatbot will use rule-based responses. 
                For advanced AI capabilities, please configure your OpenAI API key.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
