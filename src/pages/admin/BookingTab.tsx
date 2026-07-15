import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Search, ChevronLeft, ChevronRight, 
  Download, Eye, X, User, Wrench, ShieldAlert, Send
} from 'lucide-react';
import { exportToCSV } from './csvUtils';

interface Booking {
  id: number;
  status: string;
  serviceId: number;
  serviceName: string;
  customer: {
    id: number;
    name: string;
    phone: string | null;
    profilePhoto: string | null;
  } | null;
  provider: {
    id: number;
    name: string;
    phone: string | null;
    profilePhoto: string | null;
    rating: number;
    totalJobs: number;
  } | null;
  address: string;
  notes: string | null;
  scheduledAt: string;
  baseAmount: number;
  platformFee: number | null;
  totalBill: number | null;
  providerEarnings: number | null;
  pointsRedeemed: number | null;
  pointsDiscountNpr: number | null;
  startOtp: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdAt: string;
}

interface BookingTabProps {
  onRefreshStats: () => void;
  onSelectBooking?: (id: number) => void;
}

export const BookingTab: React.FC<BookingTabProps> = ({ onRefreshStats, onSelectBooking }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  // Selected booking state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Quick Action form inputs
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [internalMemo, setInternalMemo] = useState('');

  // Confirmation dialogs
  const [confirmConfig, setConfirmConfig] = useState<{
    action: () => Promise<void>;
    message: string;
  } | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/bookings', {
        params: {
          status: statusFilter,
          search,
          page,
          size,
          sortBy: 'id',
          sortDir: 'DESC'
        }
      });
      const data = response.data;
      setBookings(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load bookings', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [search, statusFilter, page]);

  const loadBookingDetails = async (booking: Booking) => {
    setSelectedBooking(booking);
    setTimelineLoading(true);
    setRescheduleDate(booking.scheduledAt.substring(0, 16));
    try {
      const resT = await apiClient.get(`/admin/bookings/${booking.id}/timeline`);
      setTimeline(resT.data || []);
      
      // Fetch eligible providers for re-assignment
      const resP = await apiClient.get('/admin/providers', {
        params: { status: 'APPROVED' }
      });
      // Filter matching category if needed
      setAvailableProviders(resP.data.content || []);
    } catch (err) {
      console.error('Failed to load timeline or providers', err);
    }
    setTimelineLoading(false);
  };

  const handleAssignProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !selectedProviderId) return;
    setConfirmConfig({
      message: `Are you sure you want to assign provider #${selectedProviderId} to booking #${selectedBooking.id}?`,
      action: async () => {
        try {
          await apiClient.put(`/admin/bookings/${selectedBooking.id}/assign`, {
            providerId: parseInt(selectedProviderId)
          });
          alert('Provider assigned successfully');
          setSelectedProviderId('');
          // Refresh details
          loadBookingDetails(selectedBooking);
          fetchBookings();
        } catch (err) {
          alert('Failed to assign provider');
        }
      }
    });
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !rescheduleDate) return;
    setConfirmConfig({
      message: `Reschedule booking #${selectedBooking.id} to ${new Date(rescheduleDate).toLocaleString()}?`,
      action: async () => {
        try {
          await apiClient.put(`/admin/bookings/${selectedBooking.id}/reschedule`, {
            scheduledAt: new Date(rescheduleDate).toISOString()
          });
          alert('Booking rescheduled successfully');
          loadBookingDetails(selectedBooking);
          fetchBookings();
        } catch (err) {
          alert('Failed to reschedule booking');
        }
      }
    });
  };

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !cancelReason.trim()) return;
    setConfirmConfig({
      message: `Are you sure you want to FORCE CANCEL booking #${selectedBooking.id}?`,
      action: async () => {
        try {
          await apiClient.put(`/admin/bookings/${selectedBooking.id}/cancel`, {
            reason: cancelReason
          });
          alert('Booking cancelled successfully');
          setCancelReason('');
          loadBookingDetails(selectedBooking);
          fetchBookings();
          onRefreshStats();
        } catch (err) {
          alert('Failed to cancel booking');
        }
      }
    });
  };

  const handleRefundBooking = async () => {
    if (!selectedBooking) return;
    setConfirmConfig({
      message: `Process and log a cash refund for completed booking #${selectedBooking.id}?`,
      action: async () => {
        try {
          await apiClient.put(`/admin/bookings/${selectedBooking.id}/refund`);
          alert('Refund processed successfully');
          loadBookingDetails(selectedBooking);
          fetchBookings();
        } catch (err) {
          alert('Failed to process refund');
        }
      }
    });
  };

  const handleAddMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !internalMemo.trim()) return;
    try {
      await apiClient.post(`/admin/bookings/${selectedBooking.id}/notes`, {
        note: internalMemo
      });
      setInternalMemo('');
      // Reload timeline to show the new memo note
      loadBookingDetails(selectedBooking);
    } catch (err) {
      alert('Failed to post note');
    }
  };

  const handleExport = () => {
    const csvData = bookings.map(b => ({
      ID: b.id,
      Service: b.serviceName,
      Customer: b.customer?.name || 'N/A',
      Provider: b.provider?.name || 'N/A',
      ScheduledTime: b.scheduledAt,
      TotalBill: b.totalBill,
      Status: b.status
    }));
    exportToCSV(csvData, 'bookings_list');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 min-w-[280px] items-center gap-3 relative">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, customer, provider, service name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs font-semibold bg-slate-50">
            {['ALL', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'STARTED', 'COMPLETED', 'CANCELLED'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 transition-all ${statusFilter === f ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Bookings Portal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Provider</th>
                <th className="px-6 py-4">Scheduled Time</th>
                <th className="px-6 py-4">Total Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/20">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">#{b.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{b.serviceName}</td>
                  <td className="px-6 py-4 text-slate-600">{b.customer?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-slate-600">{b.provider?.name || <span className="text-slate-400 italic">Unassigned</span>}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(b.scheduledAt).toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">Rs. {b.totalBill ?? b.baseAmount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      b.status === 'STARTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      b.status === 'ACCEPTED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      b.status === 'CANCELLED_BY_ADMIN' || b.status.startsWith('CANCELLED') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectBooking ? onSelectBooking(b.id) : loadBookingDetails(b)}
                      className="px-2.5 py-1 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Details & Actions
                    </button>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs italic">
                    No bookings logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>Showing {bookings.length} of {totalElements} bookings</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOOKING DETAILS & TIMELINE MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] relative animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Booking Details #{selectedBooking.id}</h3>
                <p className="text-xs text-slate-400 mt-1">Service Listing: <span className="font-bold text-slate-700">{selectedBooking.serviceName}</span> • Requested: {new Date(selectedBooking.createdAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-slate-700 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Timeline Feed & Internal Memo logging */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Timeline */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-4">Operations Timeline</span>
                    {timelineLoading ? (
                      <div className="text-center py-6 text-slate-400">Loading timeline...</div>
                    ) : (
                      <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        {/* Custom visual timeline points */}
                        {timeline.map((t, idx) => (
                          <div key={idx} className="flex gap-4 relative">
                            <div className="h-6 w-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0 z-10">
                              {idx + 1}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block">{t.status}</span>
                              <p className="text-[11px] text-slate-500 mt-0.5">{t.notes}</p>
                              <span className="text-[9px] text-slate-400 block mt-1">{new Date(t.updatedAt).toLocaleString()} by {t.updatedBy}</span>
                            </div>
                          </div>
                        ))}
                        {timeline.length === 0 && (
                          <div className="text-slate-400 italic text-center py-4">No events logged.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Note Memo Form */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-3">Internal Operations Memo</span>
                    <form onSubmit={handleAddMemo} className="space-y-3">
                      <textarea
                        required
                        rows={2}
                        placeholder="Log status notes, call summaries, dispute updates..."
                        value={internalMemo}
                        onChange={e => setInternalMemo(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 text-[11px]"
                      >
                        <Send className="h-3.5 w-3.5" /> Save Internal Memo
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right Side: Details details, Related Parties & Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* General details */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-2">Location Address</span>
                      <p className="font-semibold text-slate-700">{selectedBooking.address}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-2">Job Schedule details</span>
                      <p className="font-semibold text-slate-700">{new Date(selectedBooking.scheduledAt).toLocaleString()}</p>
                      {selectedBooking.startOtp && (
                        <p className="text-[11px] text-blue-600 font-bold mt-1">Start OTP Token: {selectedBooking.startOtp}</p>
                      )}
                    </div>
                  </div>

                  {/* Customer and Provider Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-200 border border-slate-350 rounded-full flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Customer Details</span>
                        <p className="font-bold text-slate-800 mt-0.5">{selectedBooking.customer?.name || 'N/A'}</p>
                        <p className="text-slate-500 font-semibold">{selectedBooking.customer?.phone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Provider */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-200 border border-slate-350 rounded-full flex items-center justify-center shrink-0">
                        <Wrench className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Provider details</span>
                        {selectedBooking.provider ? (
                          <>
                            <p className="font-bold text-slate-800 mt-0.5">{selectedBooking.provider.name}</p>
                            <p className="text-slate-500 font-semibold">{selectedBooking.provider.phone || 'N/A'}</p>
                          </>
                        ) : (
                          <p className="text-slate-400 italic mt-0.5">Unassigned direct dispatch</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financials details block */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-3">Invoice & Pricing Summary</span>
                    <div className="grid grid-cols-4 gap-4 text-center font-semibold">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block mb-1">Base Price</span>
                        <span className="font-bold text-slate-800 text-sm">Rs. {selectedBooking.baseAmount}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block mb-1">Redeemed Discount</span>
                        <span className="font-bold text-rose-500 text-sm">-Rs. {selectedBooking.pointsDiscountNpr ?? 0}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block mb-1">Platform Commission</span>
                        <span className="font-bold text-blue-600 text-sm">Rs. {selectedBooking.platformFee ?? 0}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block mb-1">Total Bill</span>
                        <span className="font-bold text-slate-900 text-sm">Rs. {selectedBooking.totalBill ?? selectedBooking.baseAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Admin Actions forms */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Mediation & Actions</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Reassign Provider */}
                      <form onSubmit={handleAssignProvider} className="space-y-2">
                        <label className="block text-slate-500 font-semibold">Manually Assign Provider</label>
                        <div className="flex gap-2">
                          <select
                            required
                            value={selectedProviderId}
                            onChange={e => setSelectedProviderId(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-bold"
                          >
                            <option value="">Choose Provider...</option>
                            {availableProviders.map(p => (
                              <option key={p.id} value={p.id}>{p.businessName} ({p.serviceCategory})</option>
                            ))}
                          </select>
                          <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg">Assign</button>
                        </div>
                      </form>

                      {/* Reschedule */}
                      <form onSubmit={handleReschedule} className="space-y-2">
                        <label className="block text-slate-500 font-semibold">Reschedule Booking Time</label>
                        <div className="flex gap-2">
                          <input
                            type="datetime-local"
                            required
                            value={rescheduleDate}
                            onChange={e => setRescheduleDate(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg font-bold"
                          />
                          <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg">Reschedule</button>
                        </div>
                      </form>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      
                      {/* Force Cancel */}
                      <form onSubmit={handleCancelBooking} className="space-y-2">
                        <label className="block text-slate-500 font-semibold">Force Cancel Booking (Admin mediation)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Cancellation reason detail log..."
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg"
                          />
                          <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg">Cancel</button>
                        </div>
                      </form>

                      {/* Refund trigger */}
                      <div className="space-y-2 flex flex-col justify-end">
                        <label className="block text-slate-500 font-semibold">Financial Refund (COD compensation)</label>
                        <button
                          type="button"
                          onClick={handleRefundBooking}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-lg transition"
                        >
                          Issue cash Refund
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center animate-scale-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">Mediation Confirmation</h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">{confirmConfig.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmConfig(null)}
                className="flex-1 font-bold py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await confirmConfig.action();
                  setConfirmConfig(null);
                }}
                className="flex-1 font-bold py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
