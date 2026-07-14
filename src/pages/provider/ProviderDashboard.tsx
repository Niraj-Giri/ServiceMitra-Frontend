import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Booking, TaskRequest, Quote } from '../../types';
import { getAvailableTasks, submitQuote, getMyQuotes, respondToCounter, withdrawQuote, getProviderTasks, startTask, completeTask } from '../../api/tasks';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import { ProviderEarnings } from '../../components/provider/ProviderEarnings';
import { ProviderIncentives } from '../../components/provider/ProviderIncentives';
import { ProviderDisputes } from '../../components/provider/ProviderDisputes';

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
  const [startOtpMap, setStartOtpMap] = useState<Record<number, string>>({});
  const [showOtpInputMap, setShowOtpInputMap] = useState<Record<number, boolean>>({});

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


  const handleAction = async (id: number, action: 'accept' | 'reject') => {
    try {
      await apiClient.put(`/bookings/${id}/${action}`);
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartJob = async (id: number) => {
    const otp = startOtpMap[id];
    if (!otp || !otp.trim()) {
      setAlertConfig({
        title: "Validation Error",
        message: "OTP is required to start the job.",
        type: "error"
      });
      return;
    }
    try {
      await startTask(id, otp.trim());
      setAlertConfig({
        title: "Job Started",
        message: "You have started the job successfully!",
        type: "success"
      });
      setShowOtpInputMap({ ...showOtpInputMap, [id]: false });
      setStartOtpMap({ ...startOtpMap, [id]: '' });
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
                <div className="text-sm text-gray-500 mt-1 mb-3 flex flex-wrap items-center gap-2">
                  <span>Scheduled for: {new Date(booking.scheduledAt).toLocaleString()}</span>
                  {(booking.status || '').toUpperCase() === 'ACCEPTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="h-3.5 w-3.5" /> {getTimeRemainingStr(booking.scheduledAt)}
                    </span>
                  )}
                  {(booking.status || '').toUpperCase() === 'STARTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      <Clock className="h-3.5 w-3.5" /> In Progress ({getTimeRemainingStr(booking.scheduledAt)} elapsed)
                    </span>
                  )}
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
                {showOtpInputMap[booking.id] ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Enter Start Job OTP</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter OTP (e.g. 1234)"
                        value={startOtpMap[booking.id] || ''}
                        onChange={e => setStartOtpMap({ ...startOtpMap, [booking.id]: e.target.value })}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleStartJob(booking.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition"
                      >
                        Verify & Start
                      </button>
                      <button
                        onClick={() => setShowOtpInputMap({ ...showOtpInputMap, [booking.id]: false })}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-2 rounded-lg text-sm transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowOtpInputMap({ ...showOtpInputMap, [booking.id]: true })}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
                  >
                    Start Job
                  </button>
                )}
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
            <ProviderEarnings
              completedJobs={completedJobs}
              earningsFilter={earningsFilter}
              onSetEarningsFilter={setEarningsFilter}
            />
          )}

          {activeTab === 'INCENTIVES' && (
            <ProviderIncentives
              incentivesData={incentivesData}
              totalJobs={user?.provider?.totalJobs || 0}
            />
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
            <ProviderDisputes
              complaints={complaints}
              activeComplaint={activeComplaint}
              complaintMessages={complaintMessages}
              replyMessage={replyMessage}
              sendingReply={sendingReply}
              onSelectComplaint={handleLoadComplaintMessages}
              onSendReply={handleSendComplaintMessage}
              onSetReplyMessage={setReplyMessage}
            />
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
