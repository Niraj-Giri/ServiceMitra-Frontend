import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';

interface ChatMessage {
  id: number;
  senderId: number;
  senderRole: string;
  content: string;
  createdAt: string;
}

export const ChatBox: React.FC<{ bookingId: number }> = ({ bookingId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const response = await apiClient.get(
        `/chat/bookings/${bookingId}/messages`
      );
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await apiClient.post(`/chat/bookings/${bookingId}/messages`, {
        senderId: user.id,
        senderRole: user.role,
        content: newMessage,
      });

      setNewMessage('');
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700">
          💬 Chat with {user?.role === 'CUSTOMER' ? 'Service Provider' : 'Customer'}
        </h2>
        <p className="text-xs text-gray-400">
          Only chat related to this service booking
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center mt-16">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-500 text-sm">
              Start your conversation about the service
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Ask questions, share updates, or coordinate timing
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.senderId) === String(user?.id);

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {/* Role label */}
                  <div className="text-[10px] opacity-70 mb-1">
                    {msg.senderRole === 'PROVIDER'
                      ? '👨‍🔧 Provider'
                      : '👤 Customer'}
                  </div>

                  {/* Message */}
                  <div className="break-words">{msg.content}</div>

                  {/* Time */}
                  <div className="text-[10px] mt-1 opacity-60 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          >
            ➤
          </button>
        </form>

        {/* Safety note */}
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Do not share phone numbers or personal contact details
        </p>
      </div>
    </div>
  );
};