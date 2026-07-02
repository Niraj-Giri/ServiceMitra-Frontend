import React from 'react';
import { MapPin, X } from 'lucide-react';

export const BookingDetailsModal = ({ isOpen, onClose, booking }: { isOpen: boolean, onClose: () => void, booking: any }) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h2 className="text-xl font-black text-slate-800">Booking Details</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm text-slate-500 font-bold mb-1">Date</p>
              <p className="font-medium text-slate-800">{new Date(booking.createdAt).toLocaleString()}</p>
            </div>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : booking.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {booking.status}
            </span>
          </div>

          <div className="mb-6">
            <p className="text-sm text-slate-500 font-bold mb-2">Service Location</p>
            <div className="flex items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <MapPin className="w-5 h-5 text-blue-500 mr-3 shrink-0 mt-0.5" />
              <p className="text-slate-700 font-medium">{booking.address}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-slate-500 font-bold mb-2">Problem Description</p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 font-medium">
              {booking.problemDescription}
            </div>
          </div>

          {booking.status === 'COMPLETED' && booking.totalBill && (
            <div>
              <p className="text-sm text-slate-500 font-bold mb-2">Bill Breakdown</p>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Service Charge</span>
                  <span>₹{booking.serviceCharge?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Platform Fee</span>
                  <span>₹{booking.platformFee?.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between text-lg font-black text-slate-800">
                  <span>Total Paid</span>
                  <span>₹{booking.totalBill?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
