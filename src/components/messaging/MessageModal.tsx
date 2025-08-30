import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { apiClient, User } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: User;
}

export function MessageModal({ isOpen, onClose, recipient }: MessageModalProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || sending) return;

    setSending(true);
    try {
      const messageData = {
        sender_id: user._id,
        sender_name: user.full_name,
        sender_role: user.role,
        recipient_id: recipient._id,
        recipient_name: recipient.full_name,
        recipient_role: recipient.role,
        subject: subject.trim(),
        content: content.trim(),
        read: false
      };

      await apiClient.messages.create(messageData);
      
      // Reset form and close modal
      setSubject('');
      setContent('');
      onClose();
      
      // Show success message
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Send Message</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            disabled={sending}
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-200">
            <span className="font-medium">To:</span> {recipient.full_name}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300">{recipient.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
              placeholder="Enter message subject"
              required
              disabled={sending}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:placeholder-gray-400"
              placeholder="Type your message here..."
              required
              disabled={sending}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !subject.trim() || !content.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 dark:disabled:bg-slate-600"
            >
              {sending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
