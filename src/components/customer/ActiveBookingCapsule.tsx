import React, { useState, useEffect } from 'react';
import { Wrench, MessageCircle, X } from 'lucide-react';
import { apiClient } from '../../api/client';

export const ActiveBookingCapsule = ({ booking, onOpenChat, onOpenTracking, unreadCount, onClose }: { booking: any, onOpenChat: () => void, onOpenTracking: (providerDetails: any) => void, unreadCount: number, onClose: () => void }) => {
  const [providerDetails, setProviderDetails] = useState<any>(null);

  useEffect(() => {
    if (booking?.providerId) {
      apiClient.get(`/providers/${booking.providerId}`).then(res => setProviderDetails(res.data)).catch(console.error);
    }
  }, [booking?.providerId]);

  if (!booking) return null;
  return (
    <div 
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onOpenTracking(providerDetails);
      }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-[100] animate-in slide-in-from-bottom-10 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors`}
    >
      <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
           <Wrench className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm">{providerDetails ? (providerDetails.name || providerDetails.business) : 'Active Request'}</p>
          <p className="text-xs text-blue-300 font-medium">{booking.status === 'REQUESTED' ? 'Waiting for Provider...' : 'Provider Assigned'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {(booking.status === 'ACCEPTED' || booking.status === 'STARTED') && (
          <button onClick={onOpenChat} className="relative bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors">
            <MessageCircle className="w-4 h-4" /> Chat
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">{unreadCount}</span>}
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-slate-400 hover:text-white p-2 rounded-full transition-colors ml-1">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
