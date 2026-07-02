import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export const ChatModal = ({ isOpen, onClose, messages, onSendMessage, userRole, userId, title = "Chat with Provider" }: any) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
               <MessageCircle className="w-5 h-5" />
             </div>
             <h2 className="font-bold text-slate-800">{title}</h2>
           </div>
           <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full">
             <X className="w-5 h-5" />
           </button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
           {messages.map((m: any, i: number) => {
             const isMe = m.senderRole === userRole && m.senderId === userId;
             return (
               <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                   <p className="text-sm">{m.message}</p>
                   <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                     {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </p>
                 </div>
               </div>
             )
           })}
           <div ref={messagesEndRef} />
         </div>
         <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0">
           <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-slate-100 rounded-full px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
           <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-50 shadow-md hover:bg-blue-700 transition-colors">
             <Send className="w-5 h-5 -ml-1" />
           </button>
         </form>
      </div>
    </div>
  );
};
