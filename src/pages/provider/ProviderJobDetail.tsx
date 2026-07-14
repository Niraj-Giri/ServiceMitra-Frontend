import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Booking } from '../../types';
import { ChatBox } from '../../components/chat/ChatBox';
import { useAuth } from '../../hooks/useAuth';
import { getTaskById, startTask, completeTask } from '../../api/tasks';

export const ProviderJobDetail: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchUser } = useAuth();
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');

  const getTimeRemainingStr = (scheduledAtStr: string) => {
    const now = new Date();
    const target = new Date(scheduledAtStr);
    const diffMs = target.getTime() - now.getTime();
    if (isNaN(diffMs)) return 'Time not set';
    
    const isPast = diffMs < 0;
    const absDiff = Math.abs(diffMs);
    
    const mins = Math.floor(absDiff / 60000) % 60;
    const hours = Math.floor(absDiff / 3600000) % 24;
    const days = Math.floor(absDiff / 86400000);
    
    let timeStr = '';
    if (days > 0) {
      timeStr += `${days}d `;
    }
    if (hours > 0 || days > 0) {
      timeStr += `${hours}h `;
    }
    timeStr += `${mins}m`;
    
    return isPast ? `${timeStr} ago` : `${timeStr} left`;
  };

  const fetchBooking = async () => {
    try {
      const task = await getTaskById(Number(bookingId), true);
      const mapped: Booking = {
        id: task.id,
        serviceName: task.serviceName || task.category,
        scheduledAt: task.preferredDate || task.createdAt,
        customer: task.customer ? { name: task.customer.name, phone: task.customer.phone } : null,
        address: task.address,
        notes: task.description,
        status: task.status as any,
        amountNpr: task.finalAmountNpr,
        baseAmount: task.finalAmountNpr,
        totalBill: task.finalAmountNpr,
        platformFee: task.platformFee,
        providerEarnings: task.finalAmountNpr ? task.finalAmountNpr * 0.90 : 0
      } as any;
      setBooking(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchBooking, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const handleStartJob = async () => {
    if (!booking) return;
    if (!otp.trim()) {
      setAlertConfig({
        title: "Validation Error",
        message: "OTP is required to start the job.",
        type: "error"
      });
      return;
    }
    try {
      await startTask(booking.id, otp.trim());
      setShowOtpInput(false);
      setOtp('');
      await fetchBooking();
    } catch (err: any) {
      setAlertConfig({
        title: "Start Failed",
        message: err.response?.data?.message || 'Failed to start job.',
        type: "error"
      });
    }
  };

  const handleCompleteJob = async () => {
    if (!booking) return;
    try {
      await completeTask(booking.id);
      await fetchBooking();
      await fetchUser(); // Refresh user provider earnings immediately
    } catch (err: any) {
      setAlertConfig({
        title: "Complete Failed",
        message: err.response?.data?.message || 'Failed to complete job.',
        type: "error"
      });
    }
  };

  if (loading) return <div className="text-center py-20">Loading job details...</div>;
  if (!booking) return <div className="text-center py-20 text-red-500">Job not found.</div>;

  const bookingStatus = (booking.status || '').toUpperCase();
  const isPastTask = ['COMPLETED', 'CANCELLED'].includes(bookingStatus);
  const showChat = ['ACCEPTED', 'STARTED'].includes(bookingStatus);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button 
          onClick={() => navigate('/provider/dashboard')}
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 text-sm"
        >
          ← Back to Dashboard
        </button>
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
          bookingStatus === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
          bookingStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {bookingStatus === 'ASSIGNED' ? 'NEW REQUEST' : bookingStatus}
        </span>
      </div>

      <div className={showChat ? "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8" : "max-w-2xl mx-auto"}>
        {/* Left Side: Job Details */}
        <div className={showChat ? "lg:col-span-1 space-y-6" : "w-full space-y-6"}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">
              {isPastTask ? 'Completed Job Summary' : 'Job Details'}
            </h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider mb-0.5">Service Type</span>
                <span className="font-semibold text-gray-800 text-base">{booking.serviceName || 'Service'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider mb-0.5">Scheduled Time</span>
                <span className="font-semibold text-gray-800 flex flex-wrap items-center gap-2 mt-0.5">
                  <span>{new Date(booking.scheduledAt).toLocaleString()}</span>
                  {bookingStatus === 'ACCEPTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {getTimeRemainingStr(booking.scheduledAt)}
                    </span>
                  )}
                  {bookingStatus === 'STARTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      In Progress ({getTimeRemainingStr(booking.scheduledAt)} elapsed)
                    </span>
                  )}
                </span>
              </div>
              
              {booking.customer && (
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider mb-0.5">Customer Contact</span>
                  <span className="font-semibold text-gray-800 block text-base">{booking.customer.name}</span>
                  {bookingStatus !== 'ASSIGNED' && booking.customer.phone && (
                    <span className="text-gray-500 block">{booking.customer.phone}</span>
                  )}
                </div>
              )}

              {booking.address && (
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider mb-0.5">Location Address</span>
                  <span className="font-semibold text-gray-800">{booking.address}</span>
                </div>
              )}

              {booking.notes && (
                <div>
                  <span className="text-xs text-gray-400 block uppercase font-bold tracking-wider mb-0.5">Problem Description</span>
                  <span className="text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 block mt-1">{booking.notes}</span>
                </div>
              )}

              {bookingStatus === 'COMPLETED' && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-1">Billing Details</span>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Service Charge</span>
                    <span className="font-semibold text-slate-800">Rs. {booking.totalBill || booking.baseAmount || booking.amountNpr || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Platform Fee (10%)</span>
                    <span className="font-semibold text-slate-800">Rs. {booking.platformFee !== undefined && booking.platformFee !== null ? booking.platformFee : (((booking.baseAmount || booking.amountNpr || 0) * 0.10).toFixed(2))}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-dashed border-slate-200 pt-2 font-bold text-slate-800">
                    <span>Your Earnings</span>
                    <span className="text-green-600">Rs. {booking.providerEarnings !== undefined && booking.providerEarnings !== null ? booking.providerEarnings : (((booking.baseAmount || booking.amountNpr || 0) * 0.90).toFixed(2))}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Block */}
            <div className="border-t border-gray-100 pt-6 space-y-3">
              {bookingStatus === 'ACCEPTED' && (
                <div className="space-y-3">
                  {showOtpInput ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Enter Start Job OTP</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter OTP (e.g. 1234)"
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleStartJob}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => setShowOtpInput(false)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-2 rounded-lg text-sm transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowOtpInput(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
                    >
                      Start Job
                    </button>
                  )}
                </div>
              )}

              {bookingStatus === 'STARTED' && (
                <button 
                  onClick={handleCompleteJob}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
                >
                  Complete Job
                </button>
              )}

              {bookingStatus === 'COMPLETED' && (
                <div className="text-sm text-green-700 font-semibold bg-green-50 p-3 rounded-xl text-center">
                  Job Completed successfully!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Chat */}
        {(bookingStatus === 'ACCEPTED' || bookingStatus === 'STARTED') && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[380px] sm:h-[500px] lg:h-[600px] flex flex-col">
              <div className="bg-blue-600 p-4 text-white">
                <h3 className="font-bold">Chat with Customer</h3>
                <p className="text-blue-100 text-sm">Ask clarifying questions here</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatBox taskRequestId={Number(bookingId)} />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Alert Modal */}
      {alertConfig && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
          onClick={() => setAlertConfig(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
              alertConfig.type === 'success' ? 'bg-green-50 text-green-600' :
              alertConfig.type === 'error' ? 'bg-red-50 text-red-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              <span className="text-xl font-bold">
                {alertConfig.type === 'success' ? '✓' : alertConfig.type === 'error' ? '✕' : 'ℹ'}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">{alertConfig.title}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{alertConfig.message}</p>
            <button
              onClick={() => setAlertConfig(null)}
              className={`w-full font-bold py-3 rounded-xl transition ${
                alertConfig.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                alertConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
