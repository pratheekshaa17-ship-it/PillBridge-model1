import React, { useState, useEffect } from 'react';
import { Mail, MailOpen, Trash2, User, Clock } from 'lucide-react';
import { apiClient, Message } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface MessagesProps {
  onUnreadCountChange?: () => void;
}

export function Messages({ onUnreadCountChange }: MessagesProps = {}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const data = await apiClient.messages.getByUserId(user!._id, filter === 'unread');
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
      // Notify parent component to update unread count
      if (onUnreadCountChange) {
        onUnreadCountChange();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await apiClient.messages.delete(messageId);
      setMessages(messages.filter(msg => msg._id !== messageId));
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.read && message.recipient_id === user?._id) {
      await handleMarkAsRead(message._id);
    }
  };

  const filteredMessages = messages.filter(msg => 
    filter === 'all' || (filter === 'unread' && !msg.read && msg.recipient_id === user?._id)
  );

  const unreadCount = messages.filter(msg => !msg.read && msg.recipient_id === user?._id).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Mail className="h-6 w-6 mr-2" />
            Messages
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => {setFilter('all'); fetchMessages();}}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            All Messages
          </button>
          <button
            onClick={() => {setFilter('unread'); fetchMessages();}}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {filter === 'unread' ? 'No Unread Messages' : 'No Messages'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'unread' 
              ? 'You have no unread messages at the moment.'
              : 'You have no messages yet.'}
          </p>
        </div>
      ) : (
        <div className="flex h-96">
          {/* Messages List */}
          <div className="w-1/2 border-r border-gray-200 dark:border-slate-700 overflow-y-auto">
            {filteredMessages.map((message) => (
              <div
                key={message._id}
                onClick={() => handleMessageClick(message)}
                className={`p-4 border-b border-gray-100 dark:border-slate-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                  selectedMessage?._id === message._id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-500/30' : ''
                } ${
                  !message.read && message.recipient_id === user?._id ? 'bg-blue-25 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {!message.read && message.recipient_id === user?._id ? (
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    ) : (
                      <MailOpen className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                          {message.sender_id === user?._id ? `To: ${message.recipient_name}` : `From: ${message.sender_name}`}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate mt-1">
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {message.content.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(message.created_at).toLocaleDateString()}
                    </div>
                    {message.sender_id === user?._id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(message._id);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 dark:hover:text-red-300 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedMessage ? (
              <div className="p-6">
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedMessage.subject}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <p><strong>From:</strong> {selectedMessage.sender_name} ({selectedMessage.sender_role})</p>
                      <p><strong>To:</strong> {selectedMessage.recipient_name} ({selectedMessage.recipient_role})</p>
                    </div>
                    <div className="text-right">
                      <p>{new Date(selectedMessage.created_at).toLocaleDateString()}</p>
                      <p>{new Date(selectedMessage.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>Select a message to read</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
