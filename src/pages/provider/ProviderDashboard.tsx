import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Booking, TaskRequest, Quote } from '../../types';
import { getAvailableTasks, submitQuote, getMyQuotes, respondToCounter, withdrawQuote, getProviderTasks } from '../../api/tasks';
import { 
  TrendingUp, Award, Briefcase, 
  CheckCircle2, XCircle, Clock, Filter, AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

type Tab = 'CURRENT_JOB' | 'HISTORY' | 'EARNINGS' | 'INCENTIVES' | 'SETTINGS' | 'DISPUTES' | 'MARKETPLACE' | 'MY_BIDS';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('CURRENT_JOB');

  // Marketplace States
  const [availableTasks, setAvailableTasks] = useState<TaskRequest[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submittingQuoteId, setSubmittingQuoteId] = useState<number | null>(null);
  const [quotePrice, setQuotePrice] = useState<string>('');
  const [quoteMessage, setQuoteMessage] = useState<string>('');
  const [myQuotes, setMyQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Provider Incentives & Bonuses States
  const [incentivesData, setIncentivesData] = useState<{ totalEarnedIncentives: number; pendingPayoutIncentives: number; incentives: any[] }>({
    totalEarnedIncentives: 0,
    pendingPayoutIncentives: 0,
    incentives: []
  });

  const fetchIncentivesData = async () => {
    try {
      const response = await apiClient.get('/incentives/provider');
      setIncentivesData(response.data);
    } catch (err) {
      console.error('Failed to fetch provider incentives:', err);
    }
  };
  
  // Settings State
  const [isOnline, setIsOnline] = useState(user?.provider?.isOnline ?? true);
  const [workingHoursStart, setWorkingHoursStart] = useState(user?.provider?.workingHoursStart || '09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState(user?.provider?.workingHoursEnd || '18:00');
  const [savingSettings, setSavingSettings] = useState(false);
  const { fetchUser } = useAuth();
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Earnings Filter State
  const [earningsFilter, setEarningsFilter] = useState<'ALL' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH'>('ALL');

  // Disputes States
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

  const fetchBookings = async () => {
    if (user?.provider?.status === 'PENDING' || user?.provider?.status === 'REJECTED') {
      setLoading(false);
      return;
    }
    try {
      const tasks = await getProviderTasks();
      const mapped = tasks.map(t => ({
        id: t.id,
        serviceName: t.serviceName || t.category,
        scheduledAt: t.preferredDate || t.createdAt,
        user: t.customer ? { name: t.customer.name, phone: t.customer.phone } : null,
        address: t.address,
        notes: t.description,
        status: t.status,
        amountNpr: t.finalAmountNpr,
        baseAmount: t.finalAmountNpr,
        totalBill: t.finalAmountNpr,
        platformFee: t.platformFee,
        providerEarnings: t.finalAmountNpr ? t.finalAmountNpr * 0.90 : 0
      })) as any;
      setBookings(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchComplaints();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'INCENTIVES') {
      fetchIncentivesData();
    }
    if (activeTab === 'MARKETPLACE') {
      fetchAvailableTasks();
    }
    if (activeTab === 'MY_BIDS') {
      fetchMyQuotes();
    }
  }, [activeTab]);

  const fetchAvailableTasks = async () => {
    if (user?.provider?.status !== 'APPROVED') return;
    setLoadingTasks(true);
    try {
      const tasks = await getAvailableTasks();
      setAvailableTasks(tasks);
    } catch (err) {
      console.error('Failed to fetch available tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleSubmitQuote = async (taskId: number) => {
    if (!quotePrice || Number(quotePrice) <= 0) {
      setAlertConfig({
        title: "Validation Error",
        message: "Please enter a valid quote price.",
        type: "error"
      });
      return;
    }
    try {
      await submitQuote(taskId, Number(quotePrice), quoteMessage);
      setAlertConfig({
        title: "Quote Submitted",
        message: "Your bid has been submitted successfully!",
        type: "success"
      });
      setSubmittingQuoteId(null);
      setQuotePrice('');
      setQuoteMessage('');
      fetchAvailableTasks();
    } catch (err: any) {
      setAlertConfig({
        title: "Failed to Submit Quote",
        message: err.response?.data?.message || "Something went wrong.",
        type: "error"
      });
    }
  };

  const fetchMyQuotes = async () => {
    if (user?.provider?.status !== 'APPROVED') return;
    setLoadingQuotes(true);
    try {
      const quotes = await getMyQuotes();
      setMyQuotes(quotes);
    } catch (err) {
      console.error('Failed to fetch my quotes:', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleRespondToCounter = async (taskId: number, quoteId: number, accept: boolean) => {
    try {
      await respondToCounter(taskId, quoteId, accept);
      setAlertConfig({
        title: accept ? "Counter Accepted" : "Counter Declined",
        message: accept ? "You accepted the counter-offer! Job is now assigned to you." : "You declined the counter-offer.",
        type: accept ? "success" : "info"
      });
      fetchMyQuotes();
      fetchBookings(); // refresh active bookings list too
    } catch (err: any) {
      setAlertConfig({
        title: "Error",
        message: err.response?.data?.message || "Action failed.",
        type: "error"
      });
    }
  };

  const handleWithdrawQuote = async (taskId: number, quoteId: number) => {
    if (!window.confirm("Are you sure you want to withdraw this quote?")) return;
    try {
      await withdrawQuote(taskId, quoteId);
      setAlertConfig({
        title: "Quote Withdrawn",
        message: "Your bid has been successfully withdrawn.",
        type: "success"
      });
      fetchMyQuotes();
    } catch (err: any) {
      setAlertConfig({
        title: "Error",
        message: err.response?.data?.message || "Failed to withdraw quote.",
        type: "error"
      });
    }
  };

  const [activeOtpBookingId, setActiveOtpBookingId] = useState<number | null>(null);
  const [inputOtp, setInputOtp] = useState('');

  const handleAction = async (id: number, action: 'accept' | 'reject') => {
    try {
      await apiClient.put(`/bookings/${id}/${action}`);
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartJob = async (id: number) => {
    try {
      await startTask(id);
      setAlertConfig({
        title: "Job Started",
        message: "You have started the job successfully!",
        type: "success"
      });
      fetchBookings();
    } catch (err: any) {
      setAlertConfig({
        title: "Start Job Failed",
        message: err.response?.data?.message || 'Failed to start job.',
        type: "error"
      });
    }
  };

  const handleCompleteJob = async (id: number) => {
    try {
      await completeTask(id);
      setAlertConfig({
        title: "Job Completed",
        message: "You have completed the job successfully!",
        type: "success"
      });
      fetchBookings();
      await fetchUser();
    } catch (err: any) {
      setAlertConfig({
        title: "Complete Job Failed",
        message: err.response?.data?.message || 'Failed to complete job.',
        type: "error"
      });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await apiClient.put('/providers/profile', {
        isOnline,
        workingHoursStart,
        workingHoursEnd
      });
      setAlertConfig({
        title: "Settings Saved",
        message: "Settings saved successfully!",
        type: "success"
      });
    } catch (err) {
      setAlertConfig({
        title: "Save Failed",
        message: "Failed to save settings. Please try again.",
        type: "error"
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (user?.provider?.status === 'PENDING') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-yellow-50 text-yellow-800 p-6 rounded-2xl shadow-sm border border-yellow-100 max-w-lg w-full">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold mb-2">Account Under Review</h2>
          <p className="text-yellow-700">Your account is currently under review by an administrator. You will be notified once your application is approved.</p>
        </div>
      </div>
    );
  }

  if (user?.provider?.status === 'REJECTED') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-red-50 text-red-800 p-6 rounded-2xl shadow-sm border border-red-100 max-w-lg w-full">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Application Rejected</h2>
          <p className="text-red-700">Your account application was rejected. Please contact support for more information.</p>
        </div>
      </div>
    );
  }

  const currentJobs = bookings.filter(b => !['COMPLETED', 'CANCELLED'].includes((b.status || '').toUpperCase()));
  const pastJobs = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes((b.status || '').toUpperCase()));
  const completedJobs = bookings.filter(b => (b.status || '').toUpperCase() === 'COMPLETED');
  const cancelledJobs = bookings.filter(b => (b.status || '').toUpperCase() === 'CANCELLED');

  const completedJobsCount = completedJobs.length;
  const cancelledJobsCount = cancelledJobs.length;
  const ongoingJobsCount = currentJobs.length;

  // Filtered earnings list & metrics calculation
  const getFilteredBookings = () => {
    const now = new Date();
    return completedJobs.filter(b => {
      const jobDate = new Date(b.scheduledAt);
      if (earningsFilter === '7_DAYS') {
        const diffTime = Math.abs(now.getTime() - jobDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (earningsFilter === '30_DAYS') {
        const diffTime = Math.abs(now.getTime() - jobDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
      if (earningsFilter === 'THIS_MONTH') {
        return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
      }
      return true; // ALL
    });
  };

  const filteredBookings = getFilteredBookings();

  const filteredTotalEarnings = filteredBookings.reduce((sum, b) => {
    const amt = b.amountNpr || b.baseAmount || 0;
    return sum + (amt * 0.90);
  }, 0);

  const getHighestEarningInADay = () => {
    const dailyEarnings: Record<string, number> = {};
    filteredBookings.forEach(b => {
      const dateStr = new Date(b.scheduledAt).toISOString().split('T')[0];
      const amt = (b.amountNpr || b.baseAmount || 0) * 0.90;
      dailyEarnings[dateStr] = (dailyEarnings[dateStr] || 0) + amt;
    });
    const values = Object.values(dailyEarnings);
    return values.length > 0 ? Math.max(...values) : 0;
  };

  const highestEarningInADay = getHighestEarningInADay();

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySums = Array(12).fill(0);
    
    completedJobs.forEach(b => {
      const d = new Date(b.scheduledAt);
      const monthIdx = d.getMonth();
      const amt = (b.amountNpr || b.baseAmount || 0) * 0.90;
      monthlySums[monthIdx] += amt;
    });
    
    return months.map((month, idx) => ({
      name: month,
      amount: monthlySums[idx]
    })).filter(m => m.amount > 0 || new Date().getMonth() >= months.indexOf(m.name));
  };

  const renderBookingList = (list: Booking[], emptyMsg: string) => {
    if (loading) return <div className="text-center py-10 text-gray-500">Loading...</div>;
    if (list.length === 0) return <div className="text-gray-500 text-sm italic py-8">{emptyMsg}</div>;

    return (
      <div className="space-y-4">
        {list.map(booking => (
          <div key={booking.id} className="p-4 border border-gray-100 rounded-xl hover:border-blue-500 transition group bg-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                  Booking #{booking.id} - {booking.serviceName || 'Service'}
                </div>
                <div className="text-sm text-gray-500 mt-1 mb-3">
                  Scheduled for: {new Date(booking.scheduledAt).toLocaleString()}
                </div>
                
                {booking.user && (
                  <div className="text-sm text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Customer Details</span>
                    <div className="font-semibold text-slate-800">{booking.user.name}</div>
                    {(booking.status || '').toUpperCase() !== 'ASSIGNED' && (
                      <div className="text-slate-500 text-xs mt-0.5">{booking.user.phone}</div>
                    )}
                  </div>
                )}
                
                {booking.address && (
                  <div className="text-sm text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Service Address</span>
                    {booking.address}
                  </div>
                )}
                
                {booking.notes && (
                  <div className="text-sm text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Problem Description</span>
                    {booking.notes}
                  </div>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                (booking.status || '').toUpperCase() === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                (booking.status || '').toUpperCase() === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                (booking.status || '').toUpperCase() === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {(booking.status || '').toUpperCase() === 'ASSIGNED' ? 'NEW REQUEST' : (booking.status || '').toUpperCase()}
              </span>
            </div>

            {(booking.status || '').toUpperCase() === 'ASSIGNED' && (
              <div className="flex gap-3 mt-4 border-t border-gray-100 pt-4">
                <button 
                  onClick={() => handleAction(booking.id, 'accept')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  Accept Job
                </button>
                <button 
                  onClick={() => handleAction(booking.id, 'reject')}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-lg transition border border-red-200"
                >
                  Reject
                </button>
              </div>
            )}

            {(booking.status || '').toUpperCase() === 'ACCEPTED' && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <button 
                  onClick={() => handleStartJob(booking.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
                >
                  Start Job
                </button>
              </div>
            )}

            {(booking.status || '').toUpperCase() === 'STARTED' && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <button 
                  onClick={() => handleCompleteJob(booking.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition"
                >
                  Complete Job
                </button>
              </div>
            )}

            {['ACCEPTED', 'STARTED', 'COMPLETED', 'CANCELLED'].includes((booking.status || '').toUpperCase()) && (
              <div className="mt-3">
                <button 
                  onClick={() => navigate(`/provider/job/${booking.id}`)}
                  className="w-full bg-gray-50 hover:bg-blue-50 text-blue-600 font-medium py-2 rounded-lg transition border border-gray-200 hover:border-blue-200"
                >
                  {['COMPLETED', 'CANCELLED'].includes((booking.status || '').toUpperCase()) 
                    ? 'View Details' 
                    : 'View Details & Chat'}
                </button>
              </div>
            )}
            
            {(booking.status || '').toUpperCase() === 'COMPLETED' && (
              <div className="mt-4 border-t border-gray-100 pt-4 text-sm text-green-700 font-medium flex justify-between">
                <span>Earned: Rs. {booking.totalBill}</span>
                <span>Platform Fee: Rs. {booking.platformFee}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[80vh] gap-6">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <h2 className="font-bold text-gray-900 truncate">{user?.provider?.businessName || user?.name}</h2>
          <p className="text-sm text-gray-500 truncate">{user?.provider?.serviceCategory || 'Service Provider'}</p>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible space-x-1 md:space-x-0 md:space-y-1 pb-3 md:pb-0 whitespace-nowrap border-b md:border-b-0 border-slate-100">
          <button 
            onClick={() => setActiveTab('CURRENT_JOB')}
            className={`text-center md:text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'CURRENT_JOB' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Current Job ({currentJobs.length})
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`text-center md:text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'HISTORY' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Job History
          </button>
          <button 
            onClick={() => setActiveTab('EARNINGS')}
            className={`text-center md:text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'EARNINGS' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Earnings & Stats
          </button>
          <button 
            onClick={() => setActiveTab('INCENTIVES')}
            className={`text-center md:text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'INCENTIVES' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Milestones & Incentives
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`text-center md:text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'SETTINGS' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Settings & Availability
          </button>
          <button 
            onClick={() => setActiveTab('DISPUTES')}
            className={`text-center md:text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'DISPUTES' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Disputes & Complaints ({complaints.length})
          </button>
          <button 
            onClick={() => setActiveTab('MARKETPLACE')}
            className={`text-center md:text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'MARKETPLACE' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Find Jobs (Marketplace)
          </button>
          <button 
            onClick={() => setActiveTab('MY_BIDS')}
            className={`text-center md:text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'MY_BIDS' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            My Bids (Quotes)
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        
        {/* Top Header Metrics (always visible or hideable depending on tab) */}
        {activeTab === 'CURRENT_JOB' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 font-medium mb-1">Jobs Completed</div>
              <div className="text-2xl font-bold text-gray-900">{completedJobsCount}</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 font-medium mb-1">Rating</div>
              <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {user?.provider?.ratingCache ? Number(user.provider.ratingCache).toFixed(1) : '5.0'} <span className="text-lg">⭐</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
          {activeTab === 'CURRENT_JOB' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-4">Active & Pending Requests</h3>
              {renderBookingList(currentJobs, 'No active or pending jobs right now.')}
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-4">Job History</h3>
              
              {/* Job Stats Header */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600/80 block">Completed</span>
                    <span className="text-xl font-extrabold text-slate-800">{completedJobsCount}</span>
                  </div>
                </div>

                <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-red-600/80 block">Cancelled</span>
                    <span className="text-xl font-extrabold text-slate-800">{cancelledJobsCount}</span>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600/80 block">Ongoing</span>
                    <span className="text-xl font-extrabold text-slate-800">{ongoingJobsCount}</span>
                  </div>
                </div>
              </div>

              {renderBookingList(pastJobs, 'You have not completed any jobs yet.')}
            </div>
          )}

          {activeTab === 'EARNINGS' && (
            <div>
              <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-4">Earnings & Stats</h3>
              
              {/* Earnings Stats Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50/40 border border-blue-100 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Earnings</span>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    Rs. {filteredTotalEarnings.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block mt-1">90% of total revenue after fees</span>
                </div>

                <div className="bg-orange-50/40 border border-orange-100 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest in a Day</span>
                    <Award className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    Rs. {highestEarningInADay.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block mt-1">Peak daily performance</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Jobs Fulfilled</span>
                    <Briefcase className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {filteredBookings.length}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block mt-1">In selected period</span>
                </div>
              </div>

              {/* Filter Period Box */}
              <div className="flex justify-between items-center mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700 font-extrabold text-sm">
                  <Filter className="h-4 w-4 text-blue-600" /> Filter Period:
                </div>
                <select
                  value={earningsFilter}
                  onChange={e => setEarningsFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Time</option>
                  <option value="7_DAYS">Last 7 Days</option>
                  <option value="30_DAYS">Last 30 Days</option>
                  <option value="THIS_MONTH">This Month</option>
                </select>
              </div>

              {/* Recharts Trend Area Chart */}
              <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Monthly Earnings Trend</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getMonthlyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} 
                        formatter={(value) => [`Rs. ${Number(value).toFixed(2)}`, 'Earnings']}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmt)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Earning Transactions Table List */}
              <h4 className="text-sm font-extrabold text-slate-900 mb-4">Earnings History</h4>
              {filteredBookings.length === 0 ? (
                <div className="text-slate-400 text-xs italic py-6">No completed earnings found in this period.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Job ID</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Gross Bill</th>
                        <th className="pb-3 font-semibold">Platform Fee (10%)</th>
                        <th className="pb-3 font-semibold text-right">Net Earning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => {
                        const baseAmt = b.amountNpr || b.baseAmount || b.totalBill || 0;
                        const fee = baseAmt * 0.10;
                        const net = baseAmt * 0.90;
                        return (
                          <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                            <td className="py-3 font-bold text-slate-800">#{b.id} - {b.serviceName}</td>
                            <td className="py-3 text-slate-600 font-semibold">{b.user?.name || 'Customer'}</td>
                            <td className="py-3 text-slate-400 font-semibold">{new Date(b.scheduledAt).toLocaleDateString()}</td>
                            <td className="py-3 text-slate-500 font-bold">Rs. {baseAmt.toFixed(2)}</td>
                            <td className="py-3 text-red-500 font-semibold">Rs. {fee.toFixed(2)}</td>
                            <td className="py-3 font-bold text-emerald-600 text-right">Rs. {net.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'INCENTIVES' && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-4">Milestones & Cash Incentives</h3>

              {/* Incentives Summary Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Earned Bonuses</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    Rs. {Number(incentivesData.totalEarnedIncentives).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Milestone awards & promotional bonuses</span>
                </div>

                <div className="bg-blue-50/40 border border-blue-100 p-5 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Pending Release Payout</span>
                  <div className="text-2xl font-black text-blue-600 font-mono">
                    Rs. {Number(incentivesData.pendingPayoutIncentives).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">To be released with the next payout batch</span>
                </div>
              </div>

              {/* Milestone Progress Bar */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Completed Jobs Milestone Tracker</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Earn Rs. 500.00 cash bonus for every 5 completed jobs!
                  </p>
                </div>
                
                {(() => {
                  const totalJobs = user?.provider?.totalJobs || 0;
                  const currentCycle = totalJobs % 5;
                  const needed = 5 - currentCycle;
                  const percent = (currentCycle / 5) * 100;
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">Milestone Progress: {currentCycle}/5 jobs</span>
                        <span className="text-blue-600">{needed} more jobs to unlock Rs. 500 bonus!</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Incentives Ledger List */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
                <h4 className="font-extrabold text-slate-900 text-sm mb-4">Incentives Payout Ledger</h4>
                
                {!incentivesData.incentives || incentivesData.incentives.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs italic">
                    No milestone bonuses or incentives recorded yet. Complete jobs to start earning!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Bonus Type</th>
                          <th className="pb-3 font-semibold">Earned Date</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incentivesData.incentives.map((inc: any) => (
                          <tr key={inc.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                            <td className="py-3 font-bold text-slate-800">
                              <div>{inc.description}</div>
                              {inc.bookingId && <div className="text-[10px] text-slate-400 font-normal">Linked to Booking #{inc.bookingId}</div>}
                            </td>
                            <td className="py-3 text-slate-500 font-semibold">{new Date(inc.createdAt).toLocaleString()}</td>
                            <td className="py-3 font-bold text-slate-800">Rs. {Number(inc.amount).toFixed(2)}</td>
                            <td className="py-3 text-right">
                              <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase tracking-wider ${
                                inc.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {inc.status === 'PAID' ? 'Released' : 'Pending Payout'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'MARKETPLACE' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-4">Available Marketplace Jobs</h3>
              {loadingTasks ? (
                <div className="text-center py-10 text-gray-500">Loading open tasks...</div>
              ) : availableTasks.length === 0 ? (
                <div className="text-gray-500 text-sm italic py-8">No open jobs found in your category or area.</div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {availableTasks.map(task => (
                    <div key={task.id} className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-blue-500 transition space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-extrabold text-slate-900">{task.title}</h4>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                            {task.serviceName || task.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Budget Range</span>
                          <span className="text-lg font-black text-emerald-600">
                            Rs. {task.budgetMinNpr} - Rs. {task.budgetMaxNpr}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        {task.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500 font-bold">
                        {task.address && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">📍</span> {task.address}
                          </div>
                        )}
                        {task.preferredDate && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">📅</span> Preferred Date: {new Date(task.preferredDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {submittingQuoteId === task.id ? (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Submit Your Quote</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Your Price (NPR)</label>
                              <input 
                                type="number" 
                                placeholder="E.g. 1200"
                                value={quotePrice}
                                onChange={e => setQuotePrice(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Pitch / Message</label>
                              <input 
                                type="text" 
                                placeholder="E.g. I can do it today..."
                                value={quoteMessage}
                                onChange={e => setQuoteMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <button 
                              onClick={() => handleSubmitQuote(task.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                            >
                              Submit Bid
                            </button>
                            <button 
                              onClick={() => { setSubmittingQuoteId(null); setQuotePrice(''); setQuoteMessage(''); }}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSubmittingQuoteId(task.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition shadow-sm text-sm"
                        >
                          Offer a Quote / Bid
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'MY_BIDS' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-4">My Submitted Bids (Quotes)</h3>
              {loadingQuotes ? (
                <div className="text-center py-10 text-gray-500">Loading your bids...</div>
              ) : myQuotes.length === 0 ? (
                <div className="text-gray-500 text-sm italic py-8">You have not submitted any bids yet. Go to 'Find Jobs' to submit your first bid.</div>
              ) : (
                <div className="space-y-4">
                  {myQuotes.map(quote => {
                    const statusColors: Record<string, string> = {
                      PENDING: 'bg-blue-100 text-blue-700',
                      COUNTER_OFFERED: 'bg-amber-100 text-amber-700 animate-pulse',
                      ACCEPTED: 'bg-green-100 text-green-700',
                      REJECTED: 'bg-red-100 text-red-700',
                      WITHDRAWN: 'bg-slate-100 text-slate-500',
                    };
                    return (
                      <div key={quote.id} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-blue-200 transition space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm">Quote #{quote.id}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Submitted on: {new Date(quote.createdAt).toLocaleString()}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusColors[quote.status] ?? 'bg-slate-100 text-slate-500'}`}>
                            {quote.status.replace('_', ' ')}
                          </span>
                        </div>

                        {quote.message && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                            "{quote.message}"
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-50">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Your Offer</span>
                            <span className="text-sm font-black text-slate-800">Rs. {quote.quotedPriceNpr.toLocaleString()}</span>
                          </div>

                          {quote.status === 'COUNTER_OFFERED' && quote.counterPriceNpr && (
                            <div className="space-y-1 text-right">
                              <span className="text-[10px] text-amber-500 block uppercase tracking-wider">Customer Counter Offer</span>
                              <span className="text-sm font-black text-amber-600">Rs. {quote.counterPriceNpr.toLocaleString()}</span>
                            </div>
                          )}

                          {quote.status === 'ACCEPTED' && quote.finalPriceNpr && (
                            <div className="space-y-1 text-right">
                              <span className="text-[10px] text-emerald-500 block uppercase tracking-wider">Final Agreed Price</span>
                              <span className="text-sm font-black text-emerald-600">Rs. {quote.finalPriceNpr.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {quote.status === 'COUNTER_OFFERED' && (
                          <div className="flex gap-2 pt-3 border-t border-slate-50">
                            <button 
                              onClick={() => handleRespondToCounter(quote.taskRequestId, quote.id, true)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 rounded-xl transition shadow-sm"
                            >
                              Accept Counter Offer
                            </button>
                            <button 
                              onClick={() => handleRespondToCounter(quote.taskRequestId, quote.id, false)}
                              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 rounded-xl transition border border-red-100"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {quote.status === 'PENDING' && (
                          <div className="pt-3 border-t border-slate-50 flex justify-end">
                            <button 
                              onClick={() => handleWithdrawQuote(quote.taskRequestId, quote.id)}
                              className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold text-xs px-4 py-2 rounded-xl transition border border-slate-200/60 hover:border-red-200"
                            >
                              Withdraw Quote
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div>
              <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-4">Settings & Availability</h3>
              
              <div className="max-w-md space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Accepting Jobs</h4>
                    <p className="text-sm text-gray-500">Toggle to go offline and stop receiving requests.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Working Hours</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                      <input 
                        type="time" 
                        value={workingHoursStart}
                        onChange={(e) => setWorkingHoursStart(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">End Time</label>
                      <input 
                        type="time" 
                        value={workingHoursEnd}
                        onChange={(e) => setWorkingHoursEnd(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition mt-4"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'DISPUTES' && (
            <div>
              <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-4">Disputes & Complaints</h3>
              {complaints.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <p className="text-gray-500 text-sm italic">No disputes or complaints are logged against you.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: List */}
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
                              <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'PROVIDER' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-2.5 rounded-2xl max-w-xs text-xs ${
                                  msg.senderRole === 'PROVIDER' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
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
              )}
            </div>
          )}
        </div>
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
