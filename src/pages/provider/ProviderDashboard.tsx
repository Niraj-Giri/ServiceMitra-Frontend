import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Booking } from '../../types';

type Tab = 'CURRENT_JOB' | 'HISTORY' | 'SETTINGS';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('CURRENT_JOB');
  
  // Settings State
  const [isOnline, setIsOnline] = useState(user?.provider?.isOnline ?? true);
  const [workingHoursStart, setWorkingHoursStart] = useState(user?.provider?.workingHoursStart || '09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState(user?.provider?.workingHoursEnd || '18:00');
  const [savingSettings, setSavingSettings] = useState(false);
  const { fetchUser } = useAuth();
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchBookings = async () => {
    if (user?.provider?.status === 'PENDING' || user?.provider?.status === 'REJECTED') {
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get('/bookings/provider');
      setBookings(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [user]);

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
      await apiClient.put(`/bookings/${id}/start?otp=${inputOtp}`);
      setActiveOtpBookingId(null);
      setInputOtp('');
      fetchBookings();
    } catch (err: any) {
      setAlertConfig({
        title: "Start Job Failed",
        message: err.response?.data?.message || 'Failed to start job. Please check the OTP.',
        type: "error"
      });
    }
  };

  const handleCompleteJob = async (id: number) => {
    try {
      await apiClient.put(`/bookings/${id}/complete`);
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
                {activeOtpBookingId === booking.id ? (
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Enter Customer OTP to Start</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        maxLength={4}
                        placeholder="E.g. 1234"
                        value={inputOtp}
                        onChange={e => setInputOtp(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-center tracking-widest text-lg font-bold"
                      />
                      <button 
                        onClick={() => handleStartJob(booking.id)}
                        disabled={inputOtp.length !== 4}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 rounded-lg transition disabled:opacity-50"
                      >
                        Start
                      </button>
                      <button 
                        onClick={() => { setActiveOtpBookingId(null); setInputOtp(''); }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setActiveOtpBookingId(booking.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
                  >
                    Start Job (Enter OTP)
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

        <nav className="flex flex-col space-y-1">
          <button 
            onClick={() => setActiveTab('CURRENT_JOB')}
            className={`text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'CURRENT_JOB' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Current Job ({currentJobs.length})
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'HISTORY' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`text-left px-4 py-3 rounded-lg font-medium transition ${activeTab === 'SETTINGS' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Settings & Availability
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
              <div className="text-2xl font-bold text-gray-900">{user?.provider?.totalJobs || 0}</div>
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
              {renderBookingList(pastJobs, 'You have not completed any jobs yet.')}
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
