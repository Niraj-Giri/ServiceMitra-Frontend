import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  ArrowLeft, User, Wrench, Clock, ShieldAlert, Loader2
} from 'lucide-react';

interface BookingDetailsPageProps {
  bookingId: number;
  onBack: () => void;
  onRefreshStats?: () => void;
}

export const BookingDetailsPage: React.FC<BookingDetailsPageProps> = ({ bookingId, onBack, onRefreshStats }) => {
  const [booking, setBooking] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Actions states
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [internalMemo, setInternalMemo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [bookRes, timeRes, provRes] = await Promise.all([
        apiClient.get(`/admin/bookings/${bookingId}`),
        apiClient.get(`/admin/bookings/${bookingId}/timeline`),
        apiClient.get('/admin/providers', { params: { status: 'APPROVED' } })
      ]);
      const b = bookRes.data?.data || bookRes.data;
      setBooking(b);
      setTimeline(timeRes.data?.data || timeRes.data || []);
      setAvailableProviders(provRes.data?.content || provRes.data || []);
      if (b.scheduledAt) {
        setRescheduleDate(b.scheduledAt.substring(0, 16));
      }
    } catch (err) {
      console.error('Failed to load booking details', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [bookingId]);

  const handleAssignProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProviderId) return;
    if (!confirm('Are you sure you want to assign this provider?')) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/bookings/${bookingId}/assign`, {
        providerId: parseInt(selectedProviderId)
      });
      alert('Provider assigned successfully');
      setSelectedProviderId('');
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch {
      alert('Failed to assign provider');
    }
    setActionLoading(false);
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    if (!confirm('Are you sure you want to reschedule this booking?')) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/bookings/${bookingId}/reschedule`, {
        scheduledAt: rescheduleDate
      });
      alert('Booking rescheduled successfully');
      loadAllData();
    } catch {
      alert('Failed to reschedule booking');
    }
    setActionLoading(false);
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/bookings/${bookingId}/cancel`, {
        reason: cancelReason
      });
      alert('Booking cancelled successfully');
      setCancelReason('');
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch {
      alert('Failed to cancel booking');
    }
    setActionLoading(false);
  };

  const handleSaveMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalMemo.trim()) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/bookings/${bookingId}/memo`, {
        memo: internalMemo
      });
      alert('Internal tracking note saved successfully');
      setInternalMemo('');
      loadAllData();
    } catch {
      alert('Failed to save tracking note');
    }
    setActionLoading(false);
  };

  if (loading || !booking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 text-xs text-slate-700 font-semibold">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Booking Details #{booking.id}</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Created: {new Date(booking.createdAt).toLocaleString()}</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
          booking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          booking.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
          'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bill breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Financial Ledger</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-400 font-bold block mb-1">Base Price</span>
                <span className="font-mono text-sm font-bold text-slate-800">₹{booking.baseAmount}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Platform Commission</span>
                <span className="font-mono text-sm font-bold text-slate-800">₹{booking.platformFee || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Total Bill</span>
                <span className="font-mono text-sm font-extrabold text-blue-600">₹{booking.totalBill || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Provider Earnings</span>
                <span className="font-mono text-sm font-bold text-emerald-600">₹{booking.providerEarnings || 0}</span>
              </div>
            </div>
            {booking.pointsDiscountNpr && (
              <div className="mt-3 pt-3 border-t border-slate-50 text-[10px] text-indigo-600 font-bold">
                * Reward Points Discount applied: ₹{booking.pointsDiscountNpr} ({booking.pointsRedeemed} points)
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Payment Details</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block font-bold mb-0.5">Method:</span>
                    <span className="font-extrabold uppercase text-slate-700">{booking.paymentMethod || 'ONLINE'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold mb-0.5">Status:</span>
                    <span className="font-extrabold uppercase text-slate-700">{booking.paymentStatus || 'UNPAID'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold mb-0.5">Amount:</span>
                    <span className="font-bold font-mono text-slate-700">₹{booking.totalBill || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold mb-0.5">Received By:</span>
                    <span className="font-extrabold uppercase text-slate-700">{booking.paymentReceivedBy || 'PLATFORM'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Platform Commission</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400 block font-bold mb-0.5">Amount:</span>
                    <span className="font-bold font-mono text-slate-700">₹{booking.platformFee || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold mb-0.5">Status:</span>
                    <span className={`font-extrabold uppercase ${
                      booking.commissionStatus === 'AUTO_DEDUCTED' ? 'text-emerald-600' :
                      booking.commissionStatus === 'PAID' ? 'text-blue-600' : 'text-amber-600'
                    }`}>
                      {booking.commissionStatus || 'PENDING'}
                    </span>
                  </div>
                  {booking.commissionDueDate && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-bold mb-0.5">Due Date:</span>
                      <span className="font-bold text-slate-700">{new Date(booking.commissionDueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Provider Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-1">
                <User className="h-4 w-4 text-slate-400" />
                <h4 className="text-xs font-extrabold text-slate-800">Customer context</h4>
              </div>
              {booking.customer ? (
                <div className="space-y-2">
                  <p><span className="text-slate-400">Name:</span> <span className="font-bold text-slate-800">{booking.customer.name}</span></p>
                  <p><span className="text-slate-400">Phone:</span> <span className="text-slate-700">{booking.customer.phone || 'N/A'}</span></p>
                  <p><span className="text-slate-400">Service Address:</span> <span className="text-slate-700 leading-normal block mt-0.5">{booking.address}</span></p>
                </div>
              ) : <p className="text-slate-400 italic">No customer context linked.</p>}
            </div>

            {/* Provider Details */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-1">
                <Wrench className="h-4 w-4 text-slate-400" />
                <h4 className="text-xs font-extrabold text-slate-800">Assigned Provider</h4>
              </div>
              {booking.provider ? (
                <div className="space-y-2">
                  <p><span className="text-slate-400">Name:</span> <span className="font-bold text-slate-800">{booking.provider.name}</span></p>
                  <p><span className="text-slate-400">Phone:</span> <span className="text-slate-700">{booking.provider.phone || 'N/A'}</span></p>
                  <p><span className="text-slate-400">Provider Rating:</span> <span className="text-amber-500 font-bold">{booking.provider.rating} ★</span></p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-amber-600 font-bold flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Unassigned Booking</p>
                  <form onSubmit={handleAssignProvider} className="space-y-2">
                    <select
                      value={selectedProviderId}
                      onChange={e => setSelectedProviderId(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
                    >
                      <option value="">Select approved provider...</option>
                      {availableProviders.map(p => (
                        <option key={p.id} value={p.id}>#{p.id} - {p.name} ({p.serviceCategory})</option>
                      ))}
                    </select>
                    <button type="submit" disabled={actionLoading || !selectedProviderId} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition disabled:opacity-40">
                      Assign Provider
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Booking Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Job Progression Timeline</h3>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {timeline.map((t, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  <div className="h-6.5 w-6.5 bg-blue-50 border border-blue-200 text-blue-500 rounded-full flex items-center justify-center shrink-0 z-10">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">{t.status || t.description}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(t.createdAt).toLocaleString()}</span>
                    {t.notes && <span className="text-[10px] text-slate-500 block mt-1 leading-normal italic">{t.notes}</span>}
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="text-slate-400 italic text-center py-4">No progress logs recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Administrative Tools */}
        <div className="space-y-6">
          {/* Reschedule */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-1">Reschedule slot</h4>
            <form onSubmit={handleReschedule} className="space-y-3">
              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
              />
              <button type="submit" disabled={actionLoading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition">
                Reschedule Booking
              </button>
            </form>
          </div>

          {/* Cancellation */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-1">Force Cancel job</h4>
            <form onSubmit={handleCancel} className="space-y-3">
              <input
                type="text"
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
              />
              <button type="submit" disabled={actionLoading || !cancelReason.trim()} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl transition disabled:opacity-40">
                Cancel Booking
              </button>
            </form>
          </div>

          {/* Internal Tracking notes */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-1">Internal Mediation Memo</h4>
            <form onSubmit={handleSaveMemo} className="space-y-3">
              <textarea
                rows={4}
                placeholder="Type tracking memo notes here..."
                value={internalMemo}
                onChange={e => setInternalMemo(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none"
              />
              <button type="submit" disabled={actionLoading || !internalMemo.trim()} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition disabled:opacity-40">
                Log Memo Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
