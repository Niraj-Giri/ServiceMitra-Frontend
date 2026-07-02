import React from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';

export const ActiveBookingCapsule = ({ booking, onCancel, onOpenChat, onOpenActiveJob, unreadCount }: { booking: any, onCancel: () => void, onOpenChat: () => void, onOpenActiveJob: () => void, unreadCount: number }) => {
  if (!booking) return null;
  return (
    <div 
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onOpenActiveJob();
      }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-[100] animate-in slide-in-from-bottom-10 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors"
    >
      <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center font-bold">
           <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm">Active Job</p>
          <p className="text-xs text-green-300 font-medium">Head to customer</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onOpenChat} className="relative bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors">
          <MessageCircle className="w-4 h-4" /> Chat
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">{unreadCount}</span>}
        </button>
        <button onClick={onCancel} className="text-slate-300 hover:text-red-400 font-bold text-sm px-2 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
};
