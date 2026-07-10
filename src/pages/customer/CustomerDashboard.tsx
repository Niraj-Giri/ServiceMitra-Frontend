import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { getMyTasks } from '../../api/tasks';
import type { Booking, TaskRequest, TaskStatus } from '../../types';
import { 
  Plus, Calendar, Clock, MapPin, Star, 
  MessageSquare, Phone, RefreshCw, XCircle, CalendarClock, AlertTriangle,
  Gift, Copy, Check, Zap, ChevronRight
} from 'lucide-react';
import { ChatBox } from '../../components/chat/ChatBox';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab')?.toUpperCase() as any) || 'UPCOMING';
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tasks, setTasks] = useState<TaskRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TASKS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTES' | 'LOYALTY'>(
    ['TASKS', 'COMPLETED', 'CANCELLED', 'DISPUTES', 'LOYALTY'].includes(initialTab) ? initialTab as any : 'TASKS'
  );
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

  // Loyalty & Reward Points States
  const [loyaltyData, setLoyaltyData] = useState<{ pointsBalance: number; history: any[] }>({ pointsBalance: 0, history: [] });
  const [referrerPhone, setReferrerPhone] = useState('');
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLoyaltyData = async () => {
    try {
      const response = await apiClient.get('/loyalty/points');
      setLoyaltyData(response.data);
    } catch (err) {
      console.error('Failed to fetch loyalty data', err);
    }
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referrerPhone.trim()) return;
    setApplyingReferral(true);
    setReferralError(null);
    setReferralSuccess(null);
    try {
      await apiClient.post('/loyalty/referral', {
        referrerPhone: referrerPhone.trim()
      });
      setReferralSuccess('Referral bonus claimed successfully!');
      setReferrerPhone('');
      fetchLoyaltyData(); // reload points balance
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error?.message || err.message;
      setReferralError(serverMessage || 'Failed to claim referral bonus. Make sure the phone number is correct.');
    } finally {
      setApplyingReferral(false);
    }
  };

  const handleCopyCode = () => {
    if (!user?.phone) return;
    navigator.clipboard.writeText(user.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      const data = await getMyTasks();
      const mapped = data.map(t => {
        const acceptedQuote = t.quotes?.find(q => q.id === t.acceptedQuoteId);
        return {
          id: t.id,
          serviceName: t.serviceName || t.category,
          scheduledAt: t.preferredDate || t.createdAt,
          status: t.status,
          totalBill: t.finalAmountNpr,
          baseAmount: t.finalAmountNpr,
          amountNpr: t.finalAmountNpr,
          platformFee: t.platformFee,
          provider: acceptedQuote ? {
            name: acceptedQuote.providerBusinessName || acceptedQuote.providerName,
            phone: acceptedQuote.providerName,
            ratingCache: acceptedQuote.providerRating
          } : null,
          address: t.address,
          notes: t.description
        };
      }) as any;
      setBookings(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await getMyTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchTasks();
    fetchComplaints();
  }, []);

  useEffect(() => {
    setSearchParams({ tab: activeTab.toLowerCase() });
    if (activeTab === 'LOYALTY') {
      fetchLoyaltyData();
    }
    if (activeTab === 'TASKS') {
      fetchTasks();
    }
  }, [activeTab]);

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

  const upcomingBookings = bookings.filter(b => !['COMPLETED', 'CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROVIDER', 'CANCELLED_BY_ADMIN'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter(b => ['CANCELLED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROVIDER', 'CANCELLED_BY_ADMIN'].includes(b.status));

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
            Post a Task
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
              <div className="text-sm font-semibold text-slate-500">My Tasks</div>
              <div className="text-3xl font-extrabold text-slate-950">{tasks.length}</div>
            </div>
          </div>
        </div>
        <div className="service-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500">Active Tasks</div>
              <div className="text-3xl font-extrabold text-slate-950">{tasks.filter(t => !['COMPLETED','CANCELLED','EXPIRED'].includes(t.status)).length}</div>
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
          <div className="inline-flex gap-1 p-1 bg-slate-100/80 rounded-2xl md:rounded-full w-full md:w-fit overflow-x-auto whitespace-nowrap scrollbar-none">
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
              onClick={() => setActiveTab('TASKS')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition duration-200 ${
                activeTab === 'TASKS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              My Tasks ({tasks.length})
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
            <button
              onClick={() => setActiveTab('LOYALTY')}
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition duration-200 ${
                activeTab === 'LOYALTY'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Referrals & Rewards
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading details...</div>
        ) : activeTab === 'TASKS' ? (
          <div className="space-y-3 animate-fadeIn">
            {tasks.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-400 mx-auto">
                  <Zap className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">No tasks yet</p>
                  <p className="text-sm text-slate-400 mt-1">Post a task and get quotes from nearby providers!</p>
                </div>
                <button
                  onClick={() => navigate('/services')}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/25"
                >
                  <Plus className="h-4 w-4" /> Post Your First Task
                </button>
              </div>
            ) : (
              tasks.map(task => {
                const statusColors: Record<string, string> = {
                  OPEN: 'bg-emerald-100 text-emerald-700',
                  QUOTING: 'bg-blue-100 text-blue-700',
                  ACCEPTED: 'bg-violet-100 text-violet-700',
                  STARTED: 'bg-orange-100 text-orange-700',
                  COMPLETED: 'bg-slate-100 text-slate-600',
                  CANCELLED: 'bg-red-100 text-red-600',
                  EXPIRED: 'bg-slate-100 text-slate-400',
                };
                const statusLabel: Record<string, string> = {
                  OPEN: 'Open — Awaiting Quotes',
                  QUOTING: `${task.quotes?.length ?? 0} Quote(s) Received`,
                  ACCEPTED: 'Provider Accepted',
                  STARTED: 'In Progress',
                  COMPLETED: 'Completed',
                  CANCELLED: 'Cancelled',
                  EXPIRED: 'Expired',
                };
                const activeQuoteCount = task.quotes?.filter(q => q.status === 'PENDING' || q.status === 'COUNTER_OFFERED').length ?? 0;
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/task/${task.id}`)}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-black text-lg">
                      {(task.serviceName || task.category || 'S').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-extrabold text-slate-900 text-sm truncate">{task.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[task.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {statusLabel[task.status] ?? task.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.address.substring(0, 35)}{task.address.length > 35 ? '…' : ''}</span>
                        <span>Budget: Rs. {task.budgetMinNpr.toLocaleString()} – {task.budgetMaxNpr.toLocaleString()}</span>
                        {activeQuoteCount > 0 && (
                          <span className="font-bold text-blue-600">{activeQuoteCount} active quote{activeQuoteCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 shrink-0 transition" />
                  </div>
                );
              })
            )}
          </div>
        ) : activeTab === 'LOYALTY' ? (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Row: Balance and Share cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Balance Box */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
                  <Gift className="h-48 w-48" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-blue-100 block mb-1">Total Reward Points</span>
                  <span className="text-5xl font-black font-mono">{loyaltyData.pointsBalance}</span>
                  <p className="text-[11px] text-blue-100/80 mt-2 font-medium">
                    Equivalent to <span className="font-bold">Rs. {loyaltyData.pointsBalance}</span> checkout discount!
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                  <span className="text-blue-100 font-medium">Points validity: Lifetime</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full font-extrabold uppercase text-[9px] tracking-wider">Level 1 Member</span>
                </div>
              </div>

              {/* Share and Claim Referrals */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base mb-1">Referral Program</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Share your phone number with your friends. When they register using it, you both get <span className="font-bold text-blue-600">30 reward points</span>!
                  </p>
                  
                  {/* Share code */}
                  <div className="mt-4 flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Referral Code</span>
                      <span className="font-bold text-slate-800 text-sm font-mono">{user?.phone}</span>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition text-slate-500 hover:text-blue-600 shadow-sm"
                      title="Copy code"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600 animate-scale-in" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Claim referral input */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <form onSubmit={handleApplyReferral} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Enter Referrer's Phone Number</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={referrerPhone}
                          onChange={(e) => setReferrerPhone(e.target.value)}
                          placeholder="e.g. 98XXXXXXXX"
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs bg-white font-mono"
                        />
                        <button
                          type="submit"
                          disabled={applyingReferral || !referrerPhone.trim()}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          {applyingReferral ? 'Claiming...' : 'Claim Bonus'}
                        </button>
                      </div>
                    </div>
                    {referralSuccess && <p className="text-[11px] font-bold text-emerald-600 animate-fadeIn">{referralSuccess}</p>}
                    {referralError && <p className="text-[11px] font-bold text-rose-600 animate-fadeIn">{referralError}</p>}
                  </form>
                </div>
              </div>
            </div>

            {/* Bottom Section: Points History ledger */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-base mb-4">Points Transaction History</h3>
              
              {!loyaltyData.history || loyaltyData.history.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs italic">
                  No points transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {loyaltyData.history.map((item: any) => {
                    const isCredit = item.points > 0;
                    return (
                      <div key={item.id} className="py-3.5 flex justify-between items-center gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="font-extrabold text-slate-800 block text-sm">
                            {item.description}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium font-mono">
                            {new Date(item.createdAt).toLocaleString()} | Action: {item.actionType}
                          </span>
                        </div>
                        <span className={`font-extrabold text-sm font-mono shrink-0 ${
                          isCredit ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isCredit ? '+' : ''}{item.points} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
