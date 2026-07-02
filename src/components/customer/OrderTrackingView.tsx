import React from 'react';
import { MessageCircle } from 'lucide-react';

export const OrderTrackingView = ({ booking, provider, onCancel, onOpenChat, unreadCount }: any) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col relative overflow-hidden animate-in fade-in z-10 p-8">
      <h2 className="text-2xl font-black text-slate-800 mb-6">Order Status</h2>
      
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <p className="text-slate-500 font-bold">Status</p>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${booking.status === 'ACCEPTED' || booking.status === 'STARTED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {booking.status === 'REQUESTED' ? 'Waiting for Provider...' : booking.status === 'STARTED' ? 'Job In Progress' : 'Provider Assigned'}
          </span>
        </div>
        
        <p className="text-sm font-bold text-slate-500 mb-1">Problem Description</p>
        <p className="text-lg font-bold text-slate-800 mb-4">{booking.problemDescription}</p>

        <p className="text-sm font-bold text-slate-500 mb-1">Service Location</p>
        <p className="text-slate-700 font-medium">{booking.address}</p>
      </div>

      {booking.status === 'ACCEPTED' && booking.startOtp && (
        <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 shadow-sm">
          <div>
            <p className="font-black text-yellow-800 text-lg">Start Job OTP</p>
            <p className="text-yellow-700 font-medium text-sm mt-1">Share this PIN with your mechanic when they arrive to start the job.</p>
          </div>
          <div className="bg-white px-8 py-4 rounded-xl border border-yellow-200 shadow-sm shrink-0">
            <span className="font-black text-4xl tracking-[0.25em] text-slate-800 ml-2">{booking.startOtp}</span>
          </div>
        </div>
      )}

      {(booking.status === 'ACCEPTED' || booking.status === 'STARTED') && provider && (
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-2xl text-blue-600 mr-4 shadow-sm">
               {provider.name?.charAt(0) || 'P'}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-lg">{provider.businessName || provider.business}</p>
              <p className="text-slate-600 font-medium">{provider.name}</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={onOpenChat} className="relative bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2">
               <MessageCircle className="w-5 h-5" /> Chat with Provider
               {unreadCount > 0 && <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm">{unreadCount}</span>}
             </button>
          </div>
        </div>
      )}

      <div className="mt-auto pt-8 border-t border-slate-100 flex justify-end">
        <button onClick={onCancel} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-6 py-3 rounded-xl transition-colors">
          Cancel Order
        </button>
      </div>
    </div>
  );
};
