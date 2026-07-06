import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Booking } from '../../types';
import { 
  Plus, Calendar, Clock, MapPin, Star, 
  MessageSquare, Phone, RefreshCw, XCircle, CalendarClock, AlertTriangle
} from 'lucide-react';
import { ChatBox } from '../../components/chat/ChatBox';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTES'>('UPCOMING');
  const [chatBookingId, setChatBookingId] = useState<number | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Complaints States
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<any | null>(null);
  const [complaintMessages, setComplaintMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchComplaints = async () => {
    try {
      const response = await apiClient.get('/complaints');
      if (response.data.success) {
        setComplaints(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    }
  };

  const handleLoadComplaintMessages = async (complaint: any) => {
    setActiveComplaint(complaint);
    try {
      const response = await apiClient.get(`/complaints/${complaint.id}/messages`);
      if (response.data.success) {
        setComplaintMessages(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load complaint messages', err);
    }
  };

  const handleSendComplaintMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeComplaint || !replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const response = await apiClient.post(`/complaints/${activeComplaint.id}/messages`, {
        content: replyMessage
      });
      if (response.data.success) {
        setComplaintMessages([...complaintMessages, response.data.data]);
        setReplyMessage('');
      }
    } catch (err) {
      console.error('Failed to send reply', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleBooking || !rescheduleDateTime) return;
    setRescheduling(true);
    try {
      await apiClient.post(`/bookings/${rescheduleBooking.id}/reschedule`, {
        scheduledAt: rescheduleDateTime
      });
      setAlertConfig({ title: "Rescheduled", message: "Booking rescheduled successfully!", type: "success" });
      setRescheduleBooking(null);
      setRescheduleDateTime('');
      fetchBookings();
    } catch (err: any) {
      setAlertConfig({ 
        title: "Reschedule Failed", 
        message: err.response?.data?.message || "Failed to reschedule booking. Please ensure the selected time is at least 1 hour from now.", 
        type: "error" 
      });
    } finally {
      setRescheduling(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/bookings/user');
      setBookings(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchComplaints();
  }, []);

  const handleCancelBooking = async (id: number) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        await apiClient.put(`/bookings/${id}/cancel`);
        setAlertConfig({ title: "Cancelled", message: "Booking cancelled successfully.", type: "success" });
        fetchBookings();
      } catch (err: any) {
        setAlertConfig({ 
          title: "Cancellation Failed", 
          message: err.response?.data?.message || "Failed to cancel booking.", 
          type: "error" 
        });
      }
    }
  };

  const getServiceImage = (serviceName?: string) => {
    const name = (serviceName || '').toLowerCase();
    if (name.includes('clean') || name.includes('wash') || name.includes('broom')) {
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=150&q=80';
    }
    if (name.includes('electric') || name.includes('wire') || name.includes('light') || name.includes('fan')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=150&q=80';
    }
    if (name.includes('plumb') || name.includes('pipe') || name.includes('leak') || name.includes('tap') || name.includes('water')) {
      return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=150&q=80';
    }
    if (name.includes('paint') || name.includes('wall') || name.includes('decor')) {
      return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=150&q=80';
    }
    if (name.includes('ac') || name.includes('condition') || name.includes('cool') || name.includes('heat')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=150&q=80';
    }
    return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=150&q=80';
  };

  const formatBookingDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatBookingTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  const upcomingBookings = bookings.filter(b => !['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROVIDER', 'CANCELLED_BY_ADMIN'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter(b => ['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROVIDER', 'CANCELLED_BY_ADMIN'].includes(b.status));

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'UPCOMING':
        return upcomingBookings;
      case 'COMPLETED':
        return completedBookings;
      case 'CANCELLED':
        return cancelledBookings;
      default:
        return [];
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="glass-panel flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Customer dashboard</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Welcome, {user?.name || 'Customer'}</h1>
          <p className="text-slate-500 mt-2">Book services, track visits, and manage your bookings in one place.</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Book a Service
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="service-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500">Total Bookings</div>
              <div className="text-3xl font-extrabold text-slate-950">{bookings.length}</div>
            </div>
          </div>
        </div>
        <div className="service-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <CalendarClock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500">Active Requests</div>
              <div className="text-3xl font-extrabold text-slate-950">{bookings.filter(booking => !['COMPLETED', 'CANCELLED'].includes(booking.status)).length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">My Bookings</h2>
            <p className="mt-1 text-sm text-slate-500">Manage and track your tasks</p>
          </div>
          
          {/* Pill Tabs */}
          <div className="inline-flex gap-1 p-1 bg-slate-100/80 rounded-full w-fit">
            <button
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition duration-200 ${
                activeTab === 'UPCOMING'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition duration-200 ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Completed ({completedBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition duration-200 ${
                activeTab === 'CANCELLED'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cancelled ({cancelledBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('DISPUTES')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition duration-200 ${
                activeTab === 'DISPUTES'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Disputes ({complaints.length})
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading details...</div>
        ) : activeTab === 'DISPUTES' ? (
          complaints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="font-bold text-slate-900">No disputes logged yet</div>
              <p className="mt-1 text-sm text-slate-500">You can file a complaint directly from any completed booking's tracking page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Complaints list */}
              <div className="lg:col-span-1 space-y-3">
                {complaints.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => handleLoadComplaintMessages(c)}
                    className={`p-4 border rounded-2xl cursor-pointer transition ${
                      activeComplaint?.id === c.id ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="font-bold text-rose-600">Dispute #{c.id}</span>
                      <span className={`px-2 py-0.5 rounded font-extrabold ${
                        c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>{c.status}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm truncate">{c.subject}</h4>
                    <p className="text-xs text-slate-500 truncate mt-1">{c.description}</p>
                  </div>
                ))}
              </div>

              {/* Right Column: Messages Thread */}
              <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between h-[450px]">
                {activeComplaint ? (
                  <div className="flex flex-col h-full justify-between overflow-hidden">
                    <div className="overflow-hidden flex flex-col flex-1">
                      <div className="border-b border-slate-200 pb-3 mb-4 shrink-0">
                        <h4 className="font-extrabold text-slate-950 text-base">{activeComplaint.subject}</h4>
                        <p className="text-xs text-slate-500 mt-1">{activeComplaint.description}</p>
                      </div>
                      <div className="space-y-3 overflow-y-auto flex-1 pr-2 pb-4">
                        {complaintMessages.map((msg) => (
                          <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'CUSTOMER' ? 'items-end' : 'items-start'}`}>
                            <div className={`p-2.5 rounded-2xl max-w-xs text-xs ${
                              msg.senderRole === 'CUSTOMER' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
                            }`}>
                              <p>{msg.content}</p>
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1">{msg.senderRole} • Just now</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <form onSubmit={handleSendComplaintMessage} className="flex gap-2 border-t border-slate-200 pt-3 mt-4 shrink-0">
                      <input 
                        type="text" 
                        placeholder="Type a message to discuss with Admin..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        className="flex-1 p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 py-1.5 px-4 text-xs text-white font-bold rounded-xl transition">
                        {sendingReply ? 'Sending...' : 'Send'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                    Select a dispute ticket from the list to view logs.
                  </div>
                )}
              </div>
            </div>
          )
        ) : getFilteredBookings().length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="font-bold text-slate-900">No {activeTab.toLowerCase()} bookings yet</div>
            <p className="mt-1 text-sm text-slate-500">Choose a service from the catalog to make a booking.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredBookings().map(booking => {
              const isUpcoming = !['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROVIDER', 'CANCELLED_BY_ADMIN'].includes(booking.status);
              const isCompleted = booking.status === 'COMPLETED';
              const isCancelled = ['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROVIDER', 'CANCELLED_BY_ADMIN'].includes(booking.status);
              
              return (
                <div 
                  key={booking.id} 
                  onClick={() => navigate(`/tracking/${booking.id}`)}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition duration-300 cursor-pointer hover:border-blue-100"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* Left Side: Service Image */}
                    <div className="shrink-0 flex items-center justify-center">
                      <img 
                        src={getServiceImage(booking.serviceName)} 
                        alt={booking.serviceName} 
                        className="w-24 h-24 rounded-2xl object-cover shadow-sm bg-slate-100"
                      />
                    </div>

                    {/* Center / Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Title & Status Badge */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tracking/${booking.id}`);
                            }}
                            className="font-bold text-slate-900 text-lg hover:text-blue-600 cursor-pointer transition truncate pr-4"
                          >
                            {booking.serviceName || 'Service Request'}
                          </h3>
                          
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isUpcoming ? 'bg-blue-600 text-white' :
                            isCompleted ? 'bg-green-600 text-white' :
                            'bg-red-600 text-white'
                          }`}>
                            {isUpcoming && <Clock className="w-3.5 h-3.5" />}
                            {isCompleted && <Star className="w-3.5 h-3.5 fill-current" />}
                            {isCancelled && <XCircle className="w-3.5 h-3.5" />}
                            {isUpcoming ? 'Upcoming' : booking.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                          </span>
                        </div>

                        {/* Provider Name */}
                        <div className="mt-1">
                          {booking.provider ? (
                            <span 
                              className="text-emerald-600 font-bold text-sm hover:underline cursor-pointer" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/tracking/${booking.id}`);
                              }}
                            >
                              {booking.provider.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold text-sm italic">
                              Assigning provider...
                            </span>
                          )}
                        </div>

                        {/* Two Column Grid of Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm text-slate-500">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{formatBookingDate(booking.scheduledAt)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{formatBookingTime(booking.scheduledAt)}</span>
                          </div>

                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate" title={booking.address}>{booking.address || 'Address not specified'}</span>
                          </div>

                          {booking.provider && (
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                              <span className="truncate font-semibold text-slate-700">
                                {(booking.provider.rating ?? booking.provider.ratingCache ?? 5.0).toFixed(1)} rating
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Buttons Row */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-50">
                        {/* Price */}
                        <div className="text-slate-900 font-medium">
                          Total: <span className="font-extrabold text-lg text-slate-950">Rs. {booking.totalBill || booking.baseAmount || booking.amountNpr || 0}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                          {/* Message */}
                          {isUpcoming && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatBookingId(booking.id);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-blue-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold rounded-xl text-sm transition"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Message
                            </button>
                          )}

                          {/* Call */}
                          {isUpcoming && booking.provider?.phone && (
                            <a
                              href={`tel:${booking.provider.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-blue-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold rounded-xl text-sm transition"
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </a>
                          )}

                          {/* Reschedule */}
                          {isUpcoming && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                try {
                                  const date = new Date(booking.scheduledAt);
                                  const tzoffset = date.getTimezoneOffset() * 60000;
                                  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
                                  setRescheduleDateTime(localISOTime);
                                } catch (err) {
                                  setRescheduleDateTime('');
                                }
                                setRescheduleBooking(booking);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Reschedule
                            </button>
                          )}

                          {/* Cancel */}
                          {isUpcoming && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelBooking(booking.id);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-bold rounded-xl text-sm transition border border-red-100 hover:border-red-200"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {chatBookingId !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setChatBookingId(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-lg h-[600px] overflow-hidden flex flex-col shadow-2xl relative animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setChatBookingId(null)}
              className="absolute top-3.5 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition font-bold"
            >
              ✕
            </button>
            <div className="flex-1 h-full">
              <ChatBox bookingId={chatBookingId} />
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setRescheduleBooking(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setRescheduleBooking(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reschedule Service</h3>
            <p className="text-slate-500 text-sm mb-4">
              Choose a new date and time for booking #{rescheduleBooking.id} ({rescheduleBooking.serviceName}).
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Date & Time</label>
                <input
                  type="datetime-local"
                  value={rescheduleDateTime}
                  onChange={e => setRescheduleDateTime(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-slate-400 mt-1.5">Note: Appointments must be scheduled at least 1 hour from now.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleRescheduleSubmit}
                  disabled={rescheduling || !rescheduleDateTime}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 text-sm"
                >
                  {rescheduling ? "Rescheduling..." : "Confirm"}
                </button>
                <button
                  onClick={() => setRescheduleBooking(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
