import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Booking } from '../../types';
import { ChatBox } from '../../components/chat/ChatBox';
import { useAuth } from '../../hooks/useAuth';

export const ProviderJobDetail: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchUser } = useAuth();
  const [inputOtp, setInputOtp] = useState('');
  const [enteringOtp, setEnteringOtp] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchBooking = async () => {
    try {
      const response = await apiClient.get(`/bookings/provider/${bookingId}`);
      setBooking(response.data);
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

  const handleAction = async (action: 'accept' | 'reject') => {
    if (!booking) return;
    try {
      await apiClient.put(`/bookings/${booking.id}/${action}`);
      fetchBooking();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartJob = async () => {
    if (!booking) return;
    try {
      await apiClient.put(`/bookings/${booking.id}/start?otp=${inputOtp}`);
      setEnteringOtp(false);
      setInputOtp('');
      fetchBooking();
    } catch (err: any) {
      setAlertConfig({
        title: "Start Failed",
        message: err.response?.data?.message || 'Failed to start job. Please check the OTP.',
        type: "error"
      });
    }
  };

  const handleCompleteJob = async () => {
    if (!booking) return;
    try {
      await apiClient.post(`/bookings/${booking.id}/complete`);
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

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/provider/dashboard')}
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5"
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

      <div className={isPastTask ? "max-w-2xl mx-auto" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
        {/* Left Side: Job Details */}
        <div className={isPastTask ? "w-full space-y-6" : "lg:col-span-1 space-y-6"}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
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
                <span className="font-semibold text-gray-800">{new Date(booking.scheduledAt).toLocaleString()}</span>
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
              {bookingStatus === 'ASSIGNED' && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAction('accept')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition"
                  >
                    Accept Job
                  </button>
                  <button 
                    onClick={() => handleAction('reject')}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-xl transition border border-red-200"
                  >
                    Reject
                  </button>
                </div>
              )}

              {bookingStatus === 'ACCEPTED' && (
                <div>
                  {enteringOtp ? (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Enter OTP from Customer</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          maxLength={4}
                          placeholder="1234"
                          value={inputOtp}
                          onChange={e => setInputOtp(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-center tracking-widest text-lg font-bold"
                        />
                        <button 
                          onClick={handleStartJob}
                          disabled={inputOtp.length !== 4}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 rounded-lg transition disabled:opacity-50"
                        >
                          Start
                        </button>
                        <button 
                          onClick={() => { setEnteringOtp(false); setInputOtp(''); }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 rounded-lg transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setEnteringOtp(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
                    >
                      Start Job (Enter OTP)
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
        {!isPastTask && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[600px] flex flex-col">
              <div className="bg-blue-600 p-4 text-white">
                <h3 className="font-bold">Chat with Customer</h3>
                <p className="text-blue-100 text-sm">Ask clarifying questions here</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatBox bookingId={Number(bookingId)} />
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
