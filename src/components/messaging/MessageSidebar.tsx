import React, { useState, useEffect } from 'react';
import { Mail, MailOpen, User, Clock, X, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient, Message } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface MessageSidebarProps {
  onUnreadCountChange?: () => void;
}

export function MessageSidebar({ onUnreadCountChange }: MessageSidebarProps = {}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
      // Refresh messages every minute
      const interval = setInterval(fetchMessages, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const data = await apiClient.messages.getByUserId(user!._id);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await apiClient.messages.markAsRead(messageId);
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, read: true, read_at: new Date().toISOString() } : msg
      ));
      if (onUnreadCountChange) {
        onUnreadCountChange();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(selectedMessage?._id === message._id ? null : message);
    if (!message.read && message.recipient_id === user?._id) {
      await handleMarkAsRead(message._id);
    }
  };

  const unreadMessages = messages.filter(msg => !msg.read && msg.recipient_id === user?._id);
  const displayedMessages = showOnlyUnread ? unreadMessages : messages.slice(0, 10);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 dark:bg-slate-700/50 rounded"></div>
          <div className="h-16 bg-gray-100 dark:bg-slate-700/50 rounded"></div>
          <div className="h-16 bg-gray-100 dark:bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-semibold">Messages</h3>
            {unreadMessages.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadMessages.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Filter Buttons */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowOnlyUnread(false)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  !showOnlyUnread
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setShowOnlyUnread(true)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  showOnlyUnread
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                }`}
              >
                Unread ({unreadMessages.length})
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="max-h-80 lg:max-h-96 overflow-y-auto">
            {displayedMessages.length === 0 ? (
              <div className="p-6 text-center">
                <Mail className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {showOnlyUnread ? 'No unread messages' : 'No messages yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {displayedMessages.map((message) => (
                  <div key={message._id}>
                    <div
                      onClick={() => handleMessageClick(message)}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                        !message.read && message.recipient_id === user?._id ? 'bg-blue-25 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                      } ${
                        selectedMessage?._id === message._id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {!message.read && message.recipient_id === user?._id ? (
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <MailOpen className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 mb-1">
                            <User className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {message.sender_id === user?._id ? `To: ${message.recipient_name}` : `From: ${message.sender_name}`}
                            </p>
                          </div>
                          <p className={`text-sm truncate ${
                            !message.read && message.recipient_id === user?._id ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {message.subject}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 mr-2">
                              {message.content.substring(0, 30)}...
                            </p>
                            <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(message.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Message Content */}
                    {selectedMessage?._id === message._id && (
                      <div className="px-4 pb-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
                        <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 max-w-full">
                          <div className="mb-3 pb-3 border-b border-gray-100 dark:border-slate-700">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm break-words">
                              {message.subject}
                            </h4>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <p><strong>From:</strong> {message.sender_name} ({message.sender_role})</p>
                              <p><strong>Date:</strong> {new Date(message.created_at).toLocaleDateString()} at {new Date(message.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words overflow-hidden">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {messages.length > 10 && !showOnlyUnread && (
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing 10 of {messages.length} messages
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
