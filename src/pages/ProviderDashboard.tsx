import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Star, History, CheckCircle2, IndianRupee, LayoutDashboard, LogOut, Bell, Briefcase, Mail, Lock, AlertCircle, MessageCircle, X, Send, User, Clock, Phone } from 'lucide-react';
import { apiClient } from '../api/client';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

import { ActiveJobCard } from '../components/provider/ActiveJobCard';
import { ActiveBookingCapsule } from '../components/provider/ActiveBookingCapsule';
import { ChatModal } from '../components/common/ChatModal';

export const ProviderDashboard = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(() => {
    const saved = localStorage.getItem('provider');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState<'jobs' | 'history' | 'revenue' | 'profile'>('jobs');
  const [bookings, setBookings] = useState<any[]>([]);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showServiceChargeModal, setShowServiceChargeModal] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [serviceCharge, setServiceCharge] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedRequestedBooking, setSelectedRequestedBooking] = useState<any>(null);
  const [selectedHistoryBooking, setSelectedHistoryBooking] = useState<any>(null);
  const [selectedActiveBooking, setSelectedActiveBooking] = useState<any>(null);
  const [hideCapsule, setHideCapsule] = useState(false);

  // Revenue states
  const [revenueStats, setRevenueStats] = useState({ total: 0, jobs: 0, platformFee: 0 });
  const [reviews, setReviews] = useState<any[]>([]);

  // Profile states
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(provider?.profilePhotoUrl || '');
  const [skills, setSkills] = useState(provider?.skills || '');
  const [experience, setExperience] = useState(provider?.experienceYears || '');
  const [languages, setLanguages] = useState(provider?.languages || '');
  const [workingHoursStart, setWorkingHoursStart] = useState(provider?.workingHoursStart || '09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState(provider?.workingHoursEnd || '18:00');
  const [workingDays, setWorkingDays] = useState(provider?.workingDays || 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY');
  const [savingProfile, setSavingProfile] = useState(false);

  // Withdrawal states
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const stompClient = useRef<Client | null>(null);
  const chatStompClient = useRef<Client | null>(null);

  const requested = bookings.filter(b => b.status === 'REQUESTED');
  const active = bookings.filter(b => b.status === 'ACCEPTED' || b.status === 'STARTED').sort((a, b) => {
    const timeA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : new Date(a.createdAt).getTime();
    const timeB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : new Date(b.createdAt).getTime();
    return timeA - timeB;
  });

  const activeBooking = active.length > 0 ? active[0] : null;

  useEffect(() => {
    if (provider) {
      fetchBookings();
      fetchRevenueData();
      connectWebSocket();
      setProfilePhotoUrl(provider.profilePhotoUrl || '');
      setSkills(provider.skills || '');
      setExperience(provider.experienceYears || '');
      setLanguages(provider.languages || '');
      setWorkingHoursStart(provider.workingHoursStart || '09:00');
      setWorkingHoursEnd(provider.workingHoursEnd || '18:00');
      setWorkingDays(provider.workingDays || 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY');
    }
    return () => {
      if (stompClient.current) stompClient.current.deactivate();
      if (chatStompClient.current) chatStompClient.current.deactivate();
    };
  }, [provider?.id]);

  useEffect(() => {
    if (activeBooking && activeBooking.status === 'ACCEPTED') {
      apiClient.get(`/chat/${activeBooking.id}`).then(res => setChatMessages(res.data)).catch(console.error);

      const socket = new SockJS('http://localhost:8085/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
          client.subscribe(`/topic/chat/${activeBooking.id}`, (msg) => {
            const m = JSON.parse(msg.body);
            setChatMessages(prev => [...prev, m]);
            if (!showChat) {
              setUnreadCount(prev => prev + 1);
            }
          });
        }
      });
      client.activate();
      chatStompClient.current = client;

      return () => {
        client.deactivate();
      };
    }
  }, [activeBooking?.id, activeBooking?.status]);

  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  const handleSendMessage = (text: string) => {
    if (!chatStompClient.current || !activeBooking) return;
    const msg = { senderId: provider?.id, senderRole: 'PROVIDER', message: text };
    chatStompClient.current.publish({ destination: `/app/chat/${activeBooking.id}`, body: JSON.stringify(msg) });
  };

  const connectWebSocket = () => {
    const socket = new SockJS('http://localhost:8085/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: function (str) { console.log(str); },
      onConnect: () => {
        client.subscribe(`/topic/provider/${provider.id}`, () => {
          setNewOrderCount(prev => prev + 1);
          fetchBookings(); // Refresh list
        });
      },
    });
    client.activate();
    stompClient.current = client;
  };

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get(`/bookings/provider/${provider.id}`);
      setBookings(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const bResponse = await apiClient.get(`/bookings/provider/${provider.id}`);
      const bks = bResponse.data;
      let total = 0;
      let pFee = 0;
      let jobs = 0;
      bks.forEach((b: any) => {
        if (b.status === 'COMPLETED') {
          jobs++;
          if (b.serviceCharge) total += b.serviceCharge;
          if (b.platformFee) pFee += b.platformFee;
        }
      });
      setRevenueStats({ total, jobs, platformFee: pFee });

      const rResponse = await apiClient.get(`/reviews/provider/${provider.id}`);
      setReviews(rResponse.data);

      const wResponse = await apiClient.get(`/withdrawals/provider/${provider.id}`);
      setWithdrawals(wResponse.data);
      
      const pResponse = await apiClient.get(`/providers/${provider.id}`);
      setProvider(pResponse.data);
      localStorage.setItem('provider', JSON.stringify(pResponse.data));
    } catch (e) {
      console.error(e);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    if (parseFloat(withdrawAmount) > (provider.walletBalance || 0)) {
       alert("Insufficient wallet balance.");
       return;
    }
    setWithdrawing(true);
    try {
       await apiClient.post('/withdrawals/request', {
         providerId: provider.id,
         amount: parseFloat(withdrawAmount)
       });
       setShowWithdrawModal(false);
       setWithdrawAmount('');
       fetchRevenueData();
       alert("Withdrawal requested successfully!");
    } catch (e) {
       console.error(e);
       alert("Failed to request withdrawal.");
    }
    setWithdrawing(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/provider-login', { email, password });
      setProvider(response.data.provider);
      localStorage.setItem('provider', JSON.stringify(response.data.provider));
      localStorage.setItem('token', response.data.token);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (bookingId: string, status: string, charge?: number, otpStr?: string) => {
    try {
      const payload: any = { status };
      if (charge !== undefined) payload.serviceCharge = charge.toString();
      if (otpStr) payload.otp = otpStr;
      await apiClient.post(`/bookings/${bookingId}/status`, payload);
      fetchBookings();
      if (status === 'COMPLETED') fetchRevenueData();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || "Status update failed.");
      throw e;
    }
  };

  const completeJob = () => {
    if (!showServiceChargeModal || !serviceCharge) return;
    handleStatusUpdate(showServiceChargeModal, 'COMPLETED', parseFloat(serviceCharge)).then(() => {
      setShowServiceChargeModal(null);
      setServiceCharge('');
    }).catch(() => {});
  };

  const startJob = () => {
    if (!showOtpModal || !otpValue) return;
    handleStatusUpdate(showOtpModal, 'STARTED', undefined, otpValue).then(() => {
      setShowOtpModal(null);
      setOtpValue('');
    }).catch(() => {});
  };

  const cancelActiveJob = (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this job?")) return;
    handleStatusUpdate(bookingId, 'CANCELLED');
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !provider.isOnline;
      await apiClient.put(`/providers/${provider.id}/profile`, { isOnline: newStatus });
      const updatedProvider = { ...provider, isOnline: newStatus };
      setProvider(updatedProvider);
      localStorage.setItem('provider', JSON.stringify(updatedProvider));
    } catch (e) {
      console.error(e);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiClient.put(`/providers/${provider.id}/profile`, {
        profilePhotoUrl,
        skills,
        experienceYears: experience ? parseInt(experience as string) : null,
        languages,
        workingHoursStart,
        workingHoursEnd,
        workingDays
      });
      const updatedProvider = { ...provider, profilePhotoUrl, skills, experienceYears: experience ? parseInt(experience as string) : null, languages, workingHoursStart, workingHoursEnd, workingDays };
      setProvider(updatedProvider);
      localStorage.setItem('provider', JSON.stringify(updatedProvider));
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile. Ensure backend endpoint exists.');
    }
    setSavingProfile(false);
  };

  // ===== LOGIN SCREEN =====
  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-10 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Briefcase className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-slate-800 text-center">Provider Login</h2>
          <p className="text-slate-500 mb-6 text-sm text-center">Login with your registered email and password</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors font-medium text-slate-800"
                  placeholder="provider@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  required type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors font-medium text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mt-2">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  const history = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'REJECTED' || b.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-black tracking-tight">Mitra<span className="text-blue-400">Pro</span></span>
          </div>
          <div className="mb-8">
            <h3 className="text-sm text-slate-400 font-bold mb-1">BUSINESS</h3>
            <p className="font-bold text-lg">{provider.businessName}</p>
            <p className="text-slate-400 text-sm">{provider.fullName}</p>
            <span className="inline-block mt-2 bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-md font-medium border border-slate-700">
              {provider.serviceCategory?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => {setActiveTab('jobs'); setNewOrderCount(0);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5" /> Active Jobs
            {newOrderCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{newOrderCount}</span>}
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <History className="w-5 h-5" /> History
          </button>
          <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'revenue' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <IndianRupee className="w-5 h-5" /> Revenue
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <User className="w-5 h-5" /> Profile Settings
          </button>
        </nav>

        <div className="p-4">
          <button onClick={() => { setProvider(null); localStorage.removeItem('provider'); localStorage.removeItem('token'); window.location.href = '/'; }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        <header className="flex justify-between items-center mb-8">
           <h1 className="text-3xl font-black text-slate-800 capitalize">{activeTab}</h1>
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 mr-4 border-r border-slate-200 pr-6">
               <span className="text-sm font-bold text-slate-500">Status</span>
               <button 
                 onClick={toggleOnlineStatus}
                 className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${provider.isOnline !== false ? 'bg-green-500' : 'bg-slate-300'}`}
               >
                 <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${provider.isOnline !== false ? 'translate-x-8' : 'translate-x-1'}`} />
               </button>
               <span className={`text-sm font-bold w-12 ${provider.isOnline !== false ? 'text-green-600' : 'text-slate-500'}`}>{provider.isOnline !== false ? 'Online' : 'Offline'}</span>
             </div>

             <div className="relative cursor-pointer">
               <Bell className="w-6 h-6 text-slate-400 hover:text-slate-600 transition-colors" />
               {newOrderCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-slate-50 rounded-full animate-pulse"></span>}
             </div>
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 ml-2">
               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold overflow-hidden">
                 {provider.profilePhotoUrl ? <img src={provider.profilePhotoUrl} className="w-full h-full object-cover" /> : (provider.fullName || provider.name || provider.businessName || 'P').charAt(0)}
               </div>
               <span className="font-bold text-slate-700 hidden md:block">{provider.fullName || provider.name || provider.businessName || 'Provider'}</span>
             </div>
           </div>
        </header>

        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h2 className="text-xl font-black text-slate-800 mb-4">Current Jobs</h2>
              {active.length > 0 ? (
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                  {active.map(job => (
                    <ActiveJobCard key={job.id} job={job} onClick={() => setSelectedActiveBooking(job)} />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500">
                  <p className="font-bold">No active jobs.</p>
                  <p className="text-sm mt-1">Accept a request to start.</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-black text-slate-800">Incoming Requests</h2>
                 <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">{requested.length} New</span>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                {requested.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                     <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                     <p className="text-lg font-bold">Waiting for requests...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {requested.map((booking: any) => (
                      <div key={booking.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800">{booking.problemDescription}</h3>
                          <p className="text-sm text-slate-500 flex items-start mt-1">
                            <MapPin className="w-4 h-4 mr-1 mt-0.5 shrink-0 text-slate-400" />
                            {booking.address}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => setSelectedRequestedBooking(booking)} className="flex-1 sm:flex-none bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-6 py-2.5 rounded-xl font-bold transition-colors">
                            View Details
                          </button>
                          <button onClick={() => handleStatusUpdate(booking.id, 'ACCEPTED')} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-colors">
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200">
                   <th className="p-4 font-bold text-slate-600">Date</th>
                   <th className="p-4 font-bold text-slate-600">Problem</th>
                   <th className="p-4 font-bold text-slate-600">Status</th>
                   <th className="p-4 font-bold text-slate-600 text-right">Service Charge</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {history.map(b => (
                   <tr key={b.id} onClick={() => setSelectedHistoryBooking(b)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                     <td className="p-4 text-slate-600 text-sm">{new Date(b.createdAt).toLocaleDateString()}</td>
                     <td className="p-4 font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{b.problemDescription}</td>
                     <td className="p-4">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {b.status}
                       </span>
                     </td>
                     <td className="p-4 text-right font-bold text-slate-800">
                       {b.serviceCharge ? `₹${b.serviceCharge.toFixed(2)}` : '-'}
                     </td>
                   </tr>
                 ))}
                 {history.length === 0 && (
                   <tr><td colSpan={4} className="p-8 text-center text-slate-400">No history available</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
               <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><IndianRupee className="w-32 h-32" /></div>
                 <p className="text-blue-100 font-bold mb-2 relative z-10">Wallet Balance</p>
                 <h2 className="text-5xl font-black flex items-center relative z-10 mb-6">
                   <IndianRupee className="w-10 h-10 mr-1" /> {(provider?.walletBalance || 0).toFixed(2)}
                 </h2>
                 <button 
                   onClick={() => setShowWithdrawModal(true)}
                   className="bg-white/20 hover:bg-white/30 backdrop-blur text-white font-bold py-3 px-6 rounded-xl transition-colors relative z-10 w-full"
                 >
                   Withdraw Funds
                 </button>
               </div>

               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                 <p className="text-slate-500 font-bold mb-1">Total Earnings</p>
                 <h2 className="text-3xl font-black text-slate-800 flex items-center"><IndianRupee className="w-6 h-6 mr-1" /> {revenueStats.total.toFixed(2)}</h2>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                 <p className="text-slate-500 font-bold mb-1">Platform Fees Paid</p>
                 <h2 className="text-3xl font-black text-slate-800 flex items-center"><IndianRupee className="w-6 h-6 mr-1" /> {revenueStats.platformFee.toFixed(2)}</h2>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                 <p className="text-slate-500 font-bold mb-1">Jobs Completed</p>
                 <h2 className="text-3xl font-black text-slate-800">{revenueStats.jobs}</h2>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-black text-slate-800 mb-6">Withdrawal History</h2>
                {withdrawals.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No withdrawals yet.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3 font-bold text-slate-600 text-sm">Date</th>
                        <th className="p-3 font-bold text-slate-600 text-sm">Amount</th>
                        <th className="p-3 font-bold text-slate-600 text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawals.map(w => (
                        <tr key={w.id}>
                          <td className="p-3 text-slate-600 text-sm">{new Date(w.requestedAt).toLocaleDateString()}</td>
                          <td className="p-3 font-bold text-slate-800 text-sm">₹{w.amount.toFixed(2)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${w.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : w.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-black text-slate-800 mb-6">Recent Reviews</h2>
                {reviews.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No reviews yet.</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((r: any) => (
                      <div key={r.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                        <p className="text-slate-700 text-sm italic">"{r.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-4xl border-4 border-blue-50 shadow-inner">
                  {provider?.fullName?.charAt(0) || provider?.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">{provider?.fullName || provider?.name || provider?.businessName}</h2>
                  <span className="inline-block mt-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Service Provider</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 shrink-0 text-slate-500"><User className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">Full Name / Business</p>
                    <p className="text-lg font-bold text-slate-800">{provider?.fullName || provider?.name || provider?.businessName}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 shrink-0 text-slate-500"><Mail className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">Email Address</p>
                    <p className="text-lg font-bold text-slate-800">{provider?.email || 'Not Provided'}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 shrink-0 text-slate-500"><Phone className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">Phone Number</p>
                    <p className="text-lg font-bold text-slate-800">{provider?.phone ? `+91 ${provider.phone}` : 'Not Provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-black text-slate-800 mb-6">Professional Details</h2>
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Profile Photo URL</label>
                  <input type="text" value={profilePhotoUrl} onChange={e => setProfilePhotoUrl(e.target.value)} placeholder="https://example.com/photo.jpg" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none" />
                  {profilePhotoUrl && <img src={profilePhotoUrl} className="w-20 h-20 rounded-full object-cover mt-4 shadow-md" />}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Specialized Skills (Comma separated)</label>
                  <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="E.g., Deep Cleaning, AC Repair, Engine Tuning" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Years of Experience</label>
                    <input type="number" value={experience} onChange={e => setExperience(e.target.value)} placeholder="E.g., 5" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Languages Spoken</label>
                    <input type="text" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="English, Hindi" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Working Hours Start</label>
                    <input type="time" value={workingHoursStart} onChange={e => setWorkingHoursStart(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Working Hours End</label>
                    <input type="time" value={workingHoursEnd} onChange={e => setWorkingHoursEnd(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Working Days (Comma separated)</label>
                  <input type="text" value={workingDays} onChange={e => setWorkingDays(e.target.value.toUpperCase())} placeholder="MONDAY,TUESDAY,WEDNESDAY..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none uppercase font-medium" />
                  <p className="text-xs text-slate-500 mt-2">Valid values: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button type="submit" disabled={savingProfile} className="bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg">
                    {savingProfile ? 'Saving...' : 'Save Profile Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeBooking && (
          <ActiveBookingCapsule 
            booking={activeBooking} 
            onCancel={() => cancelActiveJob(activeBooking.id)} 
            onOpenChat={() => setShowChat(true)} 
            onOpenActiveJob={() => setActiveTab('jobs')}
            unreadCount={unreadCount}
          />
        )}

      </div>

      <ChatModal isOpen={showChat} onClose={() => setShowChat(false)} messages={chatMessages} onSendMessage={handleSendMessage} userRole="PROVIDER" userId={provider?.id} />
      {/* Service Charge Modal */}
      {showServiceChargeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Job Completed!</h3>
            <p className="text-slate-500 mb-6">Enter the total service charge for this job. The platform will deduct a 5% commission.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-1">Service Charge (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  value={serviceCharge} 
                  onChange={e => setServiceCharge(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 outline-none font-bold text-slate-800 text-lg"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              {serviceCharge && (
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Platform Fee: ₹{(parseFloat(serviceCharge) * 0.05).toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowServiceChargeModal(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={completeJob} disabled={!serviceCharge} className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Withdraw Funds</h3>
            <p className="text-slate-500 mb-6">Available Balance: ₹{(provider?.walletBalance || 0).toFixed(2)}</p>
            
            <form onSubmit={handleWithdraw}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-1">Amount to Withdraw (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input 
                    type="number" 
                    value={withdrawAmount} 
                    onChange={e => setWithdrawAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-800 text-lg"
                    placeholder="0.00"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={withdrawing || !withdrawAmount} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg">
                  {withdrawing ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedHistoryBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-black text-slate-800">Job Details</h2>
              <button onClick={() => setSelectedHistoryBooking(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-slate-500 font-bold mb-1">Date</p>
                  <p className="font-medium text-slate-800">{new Date(selectedHistoryBooking.createdAt).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${selectedHistoryBooking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : selectedHistoryBooking.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selectedHistoryBooking.status}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-500 font-bold mb-2">Service Location</p>
                <div className="flex items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-blue-500 mr-3 shrink-0 mt-0.5" />
                  <p className="text-slate-700 font-medium">{selectedHistoryBooking.address}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-500 font-bold mb-2">Problem Description</p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 font-medium">
                  {selectedHistoryBooking.problemDescription}
                </div>
              </div>

              {selectedHistoryBooking.status === 'COMPLETED' && selectedHistoryBooking.totalBill && (
                <div>
                  <p className="text-sm text-slate-500 font-bold mb-2">Earnings Breakdown</p>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Service Charge (Earned)</span>
                      <span className="text-green-600">₹{selectedHistoryBooking.serviceCharge?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Platform Fee (5%)</span>
                      <span className="text-red-500">-₹{selectedHistoryBooking.platformFee?.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between text-lg font-black text-slate-800">
                      <span>Customer Paid</span>
                      <span>₹{selectedHistoryBooking.totalBill?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requested Booking Details Modal */}
      {selectedRequestedBooking && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-slate-800">Booking Request Details</h2>
              <button onClick={() => setSelectedRequestedBooking(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">Problem Description</p>
                <p className="text-lg font-bold text-slate-800">{selectedRequestedBooking.problemDescription}</p>
              </div>
              
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-slate-400 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1">Customer Location</p>
                  <p className="text-slate-700 font-medium">{selectedRequestedBooking.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-1">SCHEDULED FOR</p>
                  <p className="font-bold text-slate-800">
                    {selectedRequestedBooking.scheduledFor ? new Date(selectedRequestedBooking.scheduledFor).toLocaleString() : 'Immediate'}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-1">PAYMENT METHOD</p>
                  <p className="font-bold text-slate-800">{selectedRequestedBooking.paymentMethod || 'CASH'}</p>
                </div>
              </div>

              {selectedRequestedBooking.specialInstructions && (
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1">Special Instructions</p>
                  <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100">
                    {selectedRequestedBooking.specialInstructions}
                  </div>
                </div>
              )}
              
              {selectedRequestedBooking.problemImageUrls && (
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-2">Attached Images</p>
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                    <img src="https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&q=80&w=200" alt="Problem attachment" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => {
                handleStatusUpdate(selectedRequestedBooking.id, 'REJECTED');
                setSelectedRequestedBooking(null);
              }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">
                Reject
              </button>
              <button onClick={() => {
                handleStatusUpdate(selectedRequestedBooking.id, 'ACCEPTED');
                setSelectedRequestedBooking(null);
              }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-colors">
                Accept Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Booking Capsule (floating) */}
      {activeBooking && activeTab === 'jobs' && !hideCapsule && (
        <div 
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            setSelectedActiveBooking(activeBooking);
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-[100] animate-in slide-in-from-bottom-10 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">
               <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Active Job</p>
              <p className="text-xs text-green-300 font-medium">In Progress</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChat(true)} className="relative bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors">
              <MessageCircle className="w-4 h-4" /> Chat
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">{unreadCount}</span>}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setHideCapsule(true); }} className="text-slate-400 hover:text-white p-2 rounded-full transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Active Booking Details Modal */}
      {selectedActiveBooking && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-slate-800">Active Job Details</h2>
              <button onClick={() => setSelectedActiveBooking(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">Problem Description</p>
                <p className="text-lg font-bold text-slate-800">{selectedActiveBooking.problemDescription}</p>
              </div>
              
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-slate-400 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1">Customer Location</p>
                  <p className="text-slate-700 font-medium">{selectedActiveBooking.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-1">SCHEDULED FOR</p>
                  <p className="font-bold text-slate-800">
                    {selectedActiveBooking.scheduledFor ? new Date(selectedActiveBooking.scheduledFor).toLocaleString() : 'Immediate'}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-1">PAYMENT METHOD</p>
                  <p className="font-bold text-slate-800">{selectedActiveBooking.paymentMethod || 'CASH'}</p>
                </div>
              </div>

              {selectedActiveBooking.specialInstructions && (
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-1">Special Instructions</p>
                  <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100">
                    {selectedActiveBooking.specialInstructions}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {selectedActiveBooking.status === 'ACCEPTED' ? (
                <>
                  <button onClick={() => {
                    if (window.confirm("Are you sure you want to cancel this order?")) {
                      handleStatusUpdate(selectedActiveBooking.id, 'CANCELLED');
                      setSelectedActiveBooking(null);
                    }
                  }} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold transition-colors">
                    Cancel Order
                  </button>
                  <button onClick={() => {
                    setShowOtpModal(selectedActiveBooking.id);
                    setSelectedActiveBooking(null);
                  }} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center transition-colors">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Arrived / Start Job
                  </button>
                </>
              ) : (
                <button onClick={() => {
                  setShowServiceChargeModal(selectedActiveBooking.id);
                  setSelectedActiveBooking(null);
                }} className="flex-[2] bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center justify-center transition-colors">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Start Job</h3>
            <p className="text-slate-500 mb-6">Please enter the 4-digit OTP provided by the customer to start this job.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-1">Customer OTP</label>
              <input 
                type="text" 
                maxLength={4}
                value={otpValue} 
                onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-center tracking-[1em] text-slate-800 text-2xl"
                placeholder="••••"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => {setShowOtpModal(null); setOtpValue('');}} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={startJob} disabled={otpValue.length !== 4} className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                Verify & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
