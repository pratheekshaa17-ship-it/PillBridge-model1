import React, { useState, useEffect, useRef } from 'react';
import { apiClient, Message } from '../../lib/api';
import { Send, Bot, User, Activity } from 'lucide-react';

interface ChatMessage {
  _id?: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp?: string;
}

interface AIChatPanelProps {
  patientId: string | null;
  patientName: string | null;
}

export function AIChatPanel({ patientId, patientName }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (patientId) {
      fetchHistory();
    } else {
      setMessages([]);
    }
  }, [patientId]);

  const fetchHistory = async () => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      const history = await apiClient.ai.getChatHistory(patientId);
      const formattedHistory = history.map(h => ({ sender: h.sender, content: h.content, _id: h._id, timestamp: h.created_at } as ChatMessage));
      setMessages(formattedHistory);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !patientId) return;

    const userMessage: ChatMessage = { sender: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.ai.chat(patientId, currentInput);
      const aiMessage: ChatMessage = { sender: 'ai', content: response.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = { sender: 'ai', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const suggestedPrompts = [
    "Summarize today’s logs",
    "Any missed doses?",
    "Show mood trends for the past week",
    "Generate caregiver advice"
  ];

  if (!patientId) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <Activity className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">AI Assistant</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a patient to start a conversation.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        AI Assistant for <span className="text-blue-600 dark:text-blue-400">{patientName}</span>
      </h2>
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 h-96 flex flex-col">
        <div className="flex-grow p-4 overflow-y-auto border-b border-gray-200 dark:border-slate-700 mb-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'ai' && <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                <div className={`px-4 py-2 rounded-2xl max-w-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none dark:bg-slate-700 dark:text-gray-200'}`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
                {msg.sender === 'user' && <User className="h-6 w-6 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-slate-700 text-gray-800 rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <div className="mb-2 flex flex-wrap gap-2">
                {suggestedPrompts.map(prompt => (
                    <button
                        key={prompt}
                        onClick={() => handleSuggestedPrompt(prompt)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200 transition-colors dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900/80"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI assistant..."
                className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
                disabled={isLoading}
            />
            <button
                type="submit"
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-slate-600"
                disabled={isLoading || !input.trim()}
            >
                <Send className="h-5 w-5" />
            </button>
            </form>
        </div>
      </div>
    </div>
  );
}
