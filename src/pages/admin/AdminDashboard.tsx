import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { 
  LayoutDashboard, Users, Wrench, ShieldCheck, ClipboardList, 
  Settings, Activity, DollarSign, AlertTriangle, 
  Send, RefreshCw, Plus, FileText, Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell 
} from 'recharts';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

interface Provider {
  id: number;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  serviceCategory: string;
  address: string;
  status: string;
  isOnline: boolean;
  ratingCache: number;
  totalJobs: number;
  experienceYears: number;
  skills: string;
  profilePhotoUrl: string;
  panFileUrl: string;
  citizenFileUrl: string;
  bankDetails: string;
  certificatesUrls: string;
  acceptanceRate: number;
  commissionPercentage: number | null;
}

interface Booking {
  id: number;
  user?: { name: string; phone: string };
  provider?: { name: string; businessName: string };
  serviceListing?: { name: string };
  amountNpr?: number;
  totalBill?: number;
  address?: string;
  scheduledAt?: string;
  status: string;
  paymentStatus: string;
}

interface ServiceListing {
  id: number;
  category: string;
  name: string;
  description: string;
  basePrice: number;
  isActive: boolean;
}

interface PayoutRequest {
  id: number;
  providerId: number;
  amount: number;
  status: string;
  createdAt: string;
}

interface Transaction {
  id: number;
  bookingId: number;
  customerId: number;
  providerId: number;
  amount: number;
  commission: number;
  providerEarnings: number;
  status: string;
  transactionId: string;
  createdAt: string;
}

interface Complaint {
  id: number;
  bookingId: number;
  customerId: number;
  providerId: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  evidenceUrl: string;
  createdAt: string;
}

interface ComplaintMessage {
  id: number;
  complaintId: number;
  senderRole: string;
  content: string;
  createdAt: string;
}

interface AuditLog {
  id: number;
  admin: string;
  action: string;
  entity: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  ipAddress: string;
}

interface PlatformSettings {
  platformName: string;
  commissionPercentage: number;
  supportNumber: string;
  cancellationPolicy: string;
  bookingRadius: number;
  workingHours: string;
  paymentGateway: string;
}

export const AdminDashboard: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Backend Data States
  const [analytics, setAnalytics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: 'ServiceMitra',
    commissionPercentage: 10,
    supportNumber: '9800000000',
    cancellationPolicy: '',
    bookingRadius: 15,
    workingHours: '08:00-20:00',
    paymentGateway: 'COD'
  });

  // Action / Edit Modal States
  const [loading, setLoading] = useState<boolean>(true);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);
  const [newService, setNewService] = useState<boolean>(false);
  const [newServiceData, setNewServiceData] = useState({ category: 'ELECTRICAL', name: '', description: '', basePrice: 0 });
  const [complaintThread, setComplaintThread] = useState<Complaint | null>(null);
  const [complaintMessages, setComplaintMessages] = useState<ComplaintMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState<string>('');
  
  // Scheduling Settings State
  const [scheduling, setScheduling] = useState({
    workingHours: '08:00-20:00',
    slotDuration: 60,
    maxDailyBookings: 20
  });

  // Broadcast Notification State
  const [broadcast, setBroadcast] = useState({ target: 'ALL_CUSTOMERS', type: 'PUSH', content: '' });

  // Core Data Loading
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [resAnal, resChart, resCust, resProv, resBook, resServ, resTx, resPay, resComp, resAudit, resSet] = await Promise.all([
        apiClient.get('/admin/analytics/summary'),
        apiClient.get('/admin/analytics/charts'),
        apiClient.get('/admin/customers'),
        apiClient.get('/admin/providers'),
        apiClient.get('/admin/bookings'),
        apiClient.get('/admin/services'),
        apiClient.get('/admin/payments/transactions'),
        apiClient.get('/admin/payments/payouts'),
        apiClient.get('/admin/complaints'),
        apiClient.get('/admin/audit-logs'),
        apiClient.get('/admin/settings')
      ]);

      setAnalytics(resAnal.data);
      setCharts(resChart.data);
      setCustomers(resCust.data);
      setProviders(resProv.data);
      setBookings(resBook.data.content || resBook.data);
      setServices(resServ.data);
      setTransactions(resTx.data);
      setPayouts(resPay.data);
      setComplaints(resComp.data);
      setAuditLogs(resAudit.data);
      setSettings(resSet.data);
    } catch (err) {
      console.error('Failed to load admin suite data', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Action Handlers
  const handleApproveProvider = async (id: number) => {
    try {
      await apiClient.put(`/admin/providers/${id}/approve`);
      alert('Provider approved successfully');
      loadDashboardData();
    } catch (err) {
      alert('Failed to approve provider');
    }
  };

  const handleRejectProvider = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await apiClient.put(`/admin/providers/${id}/reject`, { reason });
      alert('Provider rejected');
      loadDashboardData();
    } catch (err) {
      alert('Failed to reject provider');
    }
  };

  const handleToggleCustomer = async (id: number, active: boolean) => {
    try {
      const endpoint = active ? 'activate' : 'suspend';
      await apiClient.put(`/admin/customers/${id}/${endpoint}`);
      alert(`Customer status updated`);
      loadDashboardData();
    } catch (err) {
      alert('Failed to update customer status');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    try {
      await apiClient.put(`/admin/customers/${editCustomer.id}`, {
        name: editCustomer.name,
        email: editCustomer.email
      });
      alert('Customer updated successfully');
      setEditCustomer(null);
      loadDashboardData();
    } catch (err) {
      alert('Failed to update customer');
    }
  };

  const handleToggleProvider = async (id: number, status: string) => {
    try {
      const endpoint = status === 'SUSPENDED' ? 'suspend' : 'activate';
      await apiClient.put(`/admin/providers/${id}/${endpoint}`, { reason: 'Updated by admin' });
      alert(`Provider status updated`);
      loadDashboardData();
    } catch (err) {
      alert('Failed to update provider status');
    }
  };

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProvider) return;
    try {
      await apiClient.put(`/admin/providers/${editProvider.id}/commission`, {
        commissionPercentage: editProvider.commissionPercentage
      });
      await apiClient.put(`/admin/providers/${editProvider.id}/assign-area`, {
        address: editProvider.address
      });
      alert('Provider updated successfully');
      setEditProvider(null);
      loadDashboardData();
    } catch (err) {
      alert('Failed to update provider details');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/services', newServiceData);
      alert('Service created successfully');
      setNewService(false);
      setNewServiceData({ category: 'ELECTRICAL', name: '', description: '', basePrice: 0 });
      loadDashboardData();
    } catch (err) {
      alert('Failed to create service listing');
    }
  };

  const handleDeactivateService = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await apiClient.delete(`/admin/services/${id}`);
      alert('Service deactivated');
      loadDashboardData();
    } catch (err) {
      alert('Failed to deactivate service');
    }
  };

  const handleCancelBooking = async (id: number) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    try {
      await apiClient.put(`/admin/bookings/${id}/cancel`, { reason });
      alert('Booking cancelled');
      loadDashboardData();
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  const handleRefundBooking = async (id: number) => {
    if (!confirm('Issue refund to customer wallet?')) return;
    try {
      await apiClient.put(`/admin/bookings/${id}/refund`);
      alert('Refund issued successfully');
      loadDashboardData();
    } catch (err) {
      alert('Failed to issue refund');
    }
  };

  const handleReleasePayout = async (id: number) => {
    try {
      await apiClient.put(`/admin/payments/payouts/${id}/release`);
      alert('Payout released successfully');
      loadDashboardData();
    } catch (err) {
      alert('Failed to release payout');
    }
  };

  const handleHoldPayout = async (id: number) => {
    try {
      await apiClient.put(`/admin/payments/payouts/${id}/hold`);
      alert('Payout placed on hold');
      loadDashboardData();
    } catch (err) {
      alert('Failed to hold payout');
    }
  };

  const handleLoadComplaintMessages = async (complaint: Complaint) => {
    setComplaintThread(complaint);
    try {
      const response = await apiClient.get(`/admin/complaints/${complaint.id}/messages`);
      setComplaintMessages(response.data);
    } catch (err) {
      console.error('Failed to load messages');
    }
  };

  const handleSendComplaintMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintThread || !replyMessage.trim()) return;
    try {
      const res = await apiClient.post(`/admin/complaints/${complaintThread.id}/messages`, {
        content: replyMessage
      });
      setComplaintMessages([...complaintMessages, res.data]);
      setReplyMessage('');
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const handleResolveComplaint = async (id: number) => {
    try {
      await apiClient.put(`/admin/complaints/${id}/resolve`);
      alert('Complaint resolved successfully');
      setComplaintThread(null);
      loadDashboardData();
    } catch (err) {
      alert('Failed to resolve complaint');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/notifications/broadcast', broadcast);
      alert('Broadcast notification sent successfully');
      setBroadcast({ ...broadcast, content: '' });
    } catch (err) {
      alert('Failed to send broadcast');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put('/admin/settings', settings);
      alert('Platform settings updated successfully');
      loadDashboardData();
    } catch (err) {
      alert('Failed to update platform settings');
    }
  };

  // Color constants for charts
  const COLORS = ['#3b82f6', '#4f46e5', '#f59e0b', '#10b981', '#ec4899'];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">M</div>
            <span className="font-extrabold text-lg tracking-wider">Mitra Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'providers', label: 'Providers', icon: Wrench },
            { id: 'kyc', label: 'KYC Documents', icon: ShieldCheck },
            { id: 'bookings', label: 'Bookings Portal', icon: ClipboardList },
            { id: 'services', label: 'Service Catalog', icon: Settings },
            { id: 'scheduling', label: 'Scheduling Settings', icon: Calendar },
            { id: 'payments', label: 'Payments & Payouts', icon: DollarSign },
            { id: 'complaints', label: 'Complaints Box', icon: AlertTriangle },
            { id: 'broadcast', label: 'Broadcast Messages', icon: Send },
            { id: 'settings', label: 'Platform Config', icon: Settings },
            { id: 'audit', label: 'Audit Logs', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          v1.0.0 • Production Dashboard
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold capitalize text-slate-950">{activeTab.replace('-', ' ')} Control Panel</h1>
          </div>
          <Button onClick={loadDashboardData} className="gap-2 bg-blue-600 hover:bg-blue-700 text-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </header>

        <div className="p-8 flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Synching live databases...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 1. DASHBOARD VIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Customers', val: analytics?.totalCustomers ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
                      { label: 'Total Providers', val: analytics?.totalProviders ?? 0, icon: Wrench, color: 'bg-indigo-50 text-indigo-600' },
                      { label: 'Online Providers', val: analytics?.onlineProviders ?? 0, icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
                      { label: 'Pending KYC Review', val: analytics?.pendingProviderReviews ?? 0, icon: ShieldCheck, color: 'bg-amber-50 text-amber-600' },
                      { label: 'Active Bookings', val: analytics?.activeBookings ?? 0, icon: ClipboardList, color: 'bg-indigo-50 text-indigo-600' },
                      { label: 'Platform Commission (10%)', val: `Rs. ${analytics?.totalRevenue ?? 0}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
                      { label: 'Pending Complaints', val: analytics?.pendingComplaints ?? 0, icon: AlertTriangle, color: 'bg-rose-50 text-rose-600' },
                    ].map((card, idx) => {
                      const Icon = card.icon;
                      return (
                        <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{card.label}</p>
                            <h3 className="text-2xl font-bold mt-1 text-slate-900">{card.val}</h3>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Charts Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-4 text-base">Bookings Dispatch Rate (Last 6 Days)</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={charts?.bookingsPerDay || []}>
                            <XAxis dataKey="date" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-4 text-base">Monthly Platform Revenue</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={charts?.revenuePerMonth || []}>
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Pie Chart & Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-1">
                      <h3 className="font-bold text-slate-900 mb-4 text-base">Top Booking Services</h3>
                      <div className="h-60 flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={charts?.topServices || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="bookings"
                            >
                              {(charts?.topServices || []).map((_entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
                      <h3 className="font-bold text-slate-900 mb-4 text-base">Recent Audit & System Activity</h3>
                      <div className="space-y-4">
                        {auditLogs.slice(0, 5).map((log) => (
                          <div key={log.id} className="flex gap-4 items-start border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <Activity className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                              <span className="text-xs text-slate-400">{log.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CUSTOMER MANAGEMENT */}
              {activeTab === 'customers' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Platform Customers</h3>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Phone</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-900">#{c.id}</td>
                          <td className="px-6 py-4 font-semibold">{c.name}</td>
                          <td className="px-6 py-4">{c.phone}</td>
                          <td className="px-6 py-4 text-slate-500">{c.email || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {c.isActive ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => setEditCustomer(c)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                            >
                              Edit Profile
                            </button>
                            <button
                              onClick={() => handleToggleCustomer(c.id, !c.isActive)}
                              className={`px-3 py-1 font-bold rounded-xl text-xs ${
                                c.isActive ? 'bg-rose-100 hover:bg-rose-200 text-rose-700' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                              }`}
                            >
                              {c.isActive ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. PROVIDER MANAGEMENT */}
              {activeTab === 'providers' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Service Providers</h3>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Business</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Avg Rating</th>
                        <th className="px-6 py-4">Total Jobs</th>
                        <th className="px-6 py-4">Commission</th>
                        <th className="px-6 py-4">KYC Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {providers.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-900">{p.name}</td>
                          <td className="px-6 py-4">{p.businessName}</td>
                          <td className="px-6 py-4 font-bold text-slate-500">{p.serviceCategory}</td>
                          <td className="px-6 py-4 font-bold text-amber-500">{p.ratingCache} ★</td>
                          <td className="px-6 py-4 font-semibold">{p.totalJobs}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{p.commissionPercentage ?? 10}%</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                              p.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => setEditProvider(p)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                            >
                              Settings
                            </button>
                            {p.status === 'PENDING_REVIEW' && (
                              <>
                                <button
                                  onClick={() => handleApproveProvider(p.id)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectProvider(p.id)}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {p.status === 'APPROVED' && (
                              <button
                                onClick={() => handleToggleProvider(p.id, 'SUSPENDED')}
                                className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl text-xs"
                              >
                                Suspend
                              </button>
                            )}
                            {p.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleToggleProvider(p.id, 'APPROVED')}
                                className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-xl text-xs"
                              >
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 4. KYC DOCUMENT VERIFICATION */}
              {activeTab === 'kyc' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-950 mb-4">Pending Provider Verifications</h3>
                    {providers.filter(p => p.status === 'PENDING_REVIEW').length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-6">No pending KYC verifications requests.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {providers.filter(p => p.status === 'PENDING_REVIEW').map(p => (
                          <div key={p.id} className="border border-slate-200 rounded-2xl p-6 space-y-4 bg-slate-50/50">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-base">{p.businessName}</h4>
                                <p className="text-xs text-slate-500">Submitted: Just now</p>
                              </div>
                              <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-full">Pending KYC</span>
                            </div>
                            
                            <div className="space-y-2 text-sm text-slate-600">
                              <p><span className="font-semibold text-slate-400">Owner Name:</span> {p.name}</p>
                              <p><span className="font-semibold text-slate-400">Phone/Email:</span> {p.phone} / {p.email}</p>
                              <p><span className="font-semibold text-slate-400">Office Address:</span> {p.address}</p>
                            </div>

                            <div className="border-t border-slate-200 pt-4 space-y-3">
                              <h5 className="font-bold text-slate-900 text-sm">KYC Attachments</h5>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <a href={p.citizenFileUrl || '#'} target="_blank" className="p-2 border border-slate-200 bg-white rounded-xl flex items-center gap-2 hover:bg-slate-100 font-medium">
                                  <FileText className="h-4 w-4 text-blue-500" />
                                  Citizenship Card
                                </a>
                                <a href={p.panFileUrl || '#'} target="_blank" className="p-2 border border-slate-200 bg-white rounded-xl flex items-center gap-2 hover:bg-slate-100 font-medium">
                                  <FileText className="h-4 w-4 text-indigo-500" />
                                  PAN Document
                                </a>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button onClick={() => handleApproveProvider(p.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Approve KYC</Button>
                              <button onClick={() => handleRejectProvider(p.id)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-sm border border-rose-200">Reject Profile</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. BOOKINGS PORTAL */}
              {activeTab === 'bookings' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Manage Platform Booking Orders</h3>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                        <th className="px-6 py-4">Booking ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Provider</th>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-900">#{b.id}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{b.user?.name}</p>
                            <span className="text-xs text-slate-400">{b.user?.phone}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{b.provider?.businessName || 'Auto Dispatch'}</p>
                            <span className="text-xs text-slate-400">{b.provider?.name || 'Searching...'}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold">{b.serviceListing?.name}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">Rs. {b.totalBill || b.amountNpr}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'CANCELLED_BY_ADMIN' || b.status === 'CANCELLED_BY_CUSTOMER' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {b.status !== 'COMPLETED' && !b.status.startsWith('CANCELLED') && (
                              <>
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl text-xs"
                                >
                                  Cancel Booking
                                </button>
                                <button
                                  onClick={() => handleRefundBooking(b.id)}
                                  className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold rounded-xl text-xs"
                                >
                                  Refund
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 6. SERVICE CATALOG */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-lg">Services Config</h3>
                    <Button onClick={() => setNewService(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4" />
                      Add Service Listing
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((s) => (
                      <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold uppercase">{s.category}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                              {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-base mb-2">{s.name}</h4>
                          <p className="text-slate-500 text-sm line-clamp-3 mb-4">{s.description}</p>
                        </div>
                        <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                          <span className="font-bold text-slate-900">Rs. {s.basePrice}</span>
                          <button
                            onClick={() => handleDeactivateService(s.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold text-xs"
                          >
                            Deactivate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. SCHEDULING SETTINGS */}
              {activeTab === 'scheduling' && (
                <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-950 text-base">Booking Slots & Scheduling Parameters</h3>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Scheduling updated'); }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Default Operating Hours</label>
                        <input 
                          type="text" 
                          value={scheduling.workingHours} 
                          onChange={(e) => setScheduling({ ...scheduling, workingHours: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Time Slot Duration (Minutes)</label>
                        <input 
                          type="number" 
                          value={scheduling.slotDuration} 
                          onChange={(e) => setScheduling({ ...scheduling, slotDuration: parseInt(e.target.value) })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Maximum Daily Bookings Limit</label>
                      <input 
                        type="number" 
                        value={scheduling.maxDailyBookings} 
                        onChange={(e) => setScheduling({ ...scheduling, maxDailyBookings: parseInt(e.target.value) })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Scheduling Config</Button>
                  </form>
                </div>
              )}

              {/* 8. PAYMENTS & PAYOUTS */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900">Provider Payout Requests</h3>
                    </div>
                    {payouts.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-6">No payout requests pending.</p>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                            <th className="px-6 py-4">Request ID</th>
                            <th className="px-6 py-4">Provider ID</th>
                            <th className="px-6 py-4">Amount Requested</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {payouts.map((p) => (
                            <tr key={p.id}>
                              <td className="px-6 py-4 font-bold text-slate-900">#{p.id}</td>
                              <td className="px-6 py-4 font-semibold">Provider #{p.providerId}</td>
                              <td className="px-6 py-4 font-bold text-slate-900">Rs. {p.amount}</td>
                              <td className="px-6 py-4">{p.createdAt}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  p.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                {p.status === 'PENDING' && (
                                  <>
                                    <button onClick={() => handleReleasePayout(p.id)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">Release</button>
                                    <button onClick={() => handleHoldPayout(p.id)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs">Hold</button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900">Transaction History Log</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                          <th className="px-6 py-4">Transaction ID</th>
                          <th className="px-6 py-4">Booking</th>
                          <th className="px-6 py-4">Gross Amount</th>
                          <th className="px-6 py-4">Commission</th>
                          <th className="px-6 py-4">Provider Share</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {transactions.map((t) => (
                          <tr key={t.id}>
                            <td className="px-6 py-4 font-mono text-xs">{t.transactionId}</td>
                            <td className="px-6 py-4 font-semibold">Booking #{t.bookingId}</td>
                            <td className="px-6 py-4 text-slate-900 font-bold">Rs. {t.amount}</td>
                            <td className="px-6 py-4 text-rose-600 font-semibold">Rs. {t.commission}</td>
                            <td className="px-6 py-4 text-emerald-600 font-semibold">Rs. {t.providerEarnings}</td>
                            <td className="px-6 py-4 font-bold">{t.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 9. COMPLAINTS BOX */}
              {activeTab === 'complaints' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Complaints List */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-950 text-base">Platform Complaints</h3>
                    {complaints.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-6">No complaints logged.</p>
                    ) : (
                      <div className="space-y-3">
                        {complaints.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => handleLoadComplaintMessages(c)}
                            className={`p-4 border rounded-2xl cursor-pointer transition ${
                              complaintThread?.id === c.id ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-rose-600 text-xs">#{c.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>{c.status}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm truncate">{c.subject}</h4>
                            <p className="text-xs text-slate-500 truncate mt-1">{c.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Complaint Details and Messages */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
                    {complaintThread ? (
                      <div className="space-y-6 flex flex-col h-full justify-between">
                        <div>
                          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-lg">{complaintThread.subject}</h3>
                              <p className="text-sm text-slate-500 mt-1">{complaintThread.description}</p>
                            </div>
                            {complaintThread.status === 'PENDING' && (
                              <Button onClick={() => handleResolveComplaint(complaintThread.id)} className="bg-emerald-600 hover:bg-emerald-700">Resolve Complaint</Button>
                            )}
                          </div>

                          <div className="mt-4 space-y-4 max-h-80 overflow-y-auto pr-2">
                            {complaintMessages.map(msg => (
                              <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-3 rounded-2xl max-w-sm text-sm ${
                                  msg.senderRole === 'ADMIN' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                                }`}>
                                  <p>{msg.content}</p>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1">{msg.senderRole} • Just now</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <form onSubmit={handleSendComplaintMessage} className="flex gap-2 border-t border-slate-100 pt-4 mt-6">
                          <input 
                            type="text" 
                            placeholder="Type a message to resolve the dispute..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                          />
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Send</Button>
                        </form>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        Select a complaint from the left panel to review logs.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 10. BROADCAST PANEL */}
              {activeTab === 'broadcast' && (
                <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-950 text-base">Send Instant System Notifications</h3>
                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Target Group</label>
                        <select 
                          value={broadcast.target} 
                          onChange={(e) => setBroadcast({ ...broadcast, target: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                        >
                          <option value="ALL_CUSTOMERS">All Registered Customers</option>
                          <option value="ALL_PROVIDERS">All Registered Providers</option>
                          <option value="SELECTED_USERS">Selected Phone Numbers</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Channel</label>
                        <select 
                          value={broadcast.type} 
                          onChange={(e) => setBroadcast({ ...broadcast, type: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                        >
                          <option value="PUSH">App Push Notification</option>
                          <option value="EMAIL">System E-Mail</option>
                          <option value="SMS">Telecom SMS</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Message Body</label>
                      <textarea 
                        rows={5}
                        placeholder="Write message details to broadcast..."
                        value={broadcast.content}
                        onChange={(e) => setBroadcast({ ...broadcast, content: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Dispatch Message</Button>
                  </form>
                </div>
              )}

              {/* 11. PLATFORM CONFIGURATION */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-950 text-base">Global Platform Configuration</h3>
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Platform Name</label>
                        <input 
                          type="text" 
                          value={settings.platformName} 
                          onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Default Commission %</label>
                        <input 
                          type="number" 
                          value={settings.commissionPercentage} 
                          onChange={(e) => setSettings({ ...settings, commissionPercentage: parseFloat(e.target.value) })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Customer Support Phone</label>
                        <input 
                          type="text" 
                          value={settings.supportNumber} 
                          onChange={(e) => setSettings({ ...settings, supportNumber: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Booking Radius (KM)</label>
                        <input 
                          type="number" 
                          value={settings.bookingRadius} 
                          onChange={(e) => setSettings({ ...settings, bookingRadius: parseFloat(e.target.value) })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Cancellation Policy Summary</label>
                      <textarea 
                        rows={4}
                        value={settings.cancellationPolicy} 
                        onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none text-sm" 
                      />
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Configuration</Button>
                  </form>
                </div>
              )}

              {/* 12. AUDIT LOGS */}
              {activeTab === 'audit' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Admin Audit Trails</h3>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Admin</th>
                        <th className="px-6 py-4">Action Description</th>
                        <th className="px-6 py-4">Entity</th>
                        <th className="px-6 py-4">Old Value</th>
                        <th className="px-6 py-4">New Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 text-xs text-slate-500">{log.timestamp}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{log.admin}</td>
                          <td className="px-6 py-4 font-semibold">{log.action}</td>
                          <td className="px-6 py-4 font-semibold text-slate-400">{log.entity}</td>
                          <td className="px-6 py-4 font-mono text-xs max-w-xs truncate">{log.oldValue}</td>
                          <td className="px-6 py-4 font-mono text-xs max-w-xs truncate">{log.newValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* EDIT CUSTOMER MODAL */}
      {editCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-slate-950 text-base">Edit Customer Profile</h3>
            <form onSubmit={handleUpdateCustomer} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editCustomer.name} 
                  onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Email</label>
                <input 
                  type="email" 
                  value={editCustomer.email} 
                  onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setEditCustomer(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl">Cancel</button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROVIDER MODAL */}
      {editProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-slate-950 text-base">Edit Provider Settings</h3>
            <form onSubmit={handleUpdateProvider} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Business Name</label>
                <input 
                  type="text" 
                  value={editProvider.businessName} 
                  disabled
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-400"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Base Address Area</label>
                <input 
                  type="text" 
                  value={editProvider.address} 
                  onChange={(e) => setEditProvider({ ...editProvider, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Custom Commission Rate (%)</label>
                <input 
                  type="number" 
                  value={editProvider.commissionPercentage ?? 10} 
                  onChange={(e) => setEditProvider({ ...editProvider, commissionPercentage: parseFloat(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setEditProvider(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl">Cancel</button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW SERVICE MODAL */}
      {newService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-slate-950 text-base">Add New Service</h3>
            <form onSubmit={handleCreateService} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Category</label>
                <select 
                  value={newServiceData.category}
                  onChange={(e) => setNewServiceData({ ...newServiceData, category: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                >
                  <option value="ELECTRICAL">ELECTRICAL</option>
                  <option value="PLUMBING">PLUMBING</option>
                  <option value="CLEANING">CLEANING</option>
                  <option value="AC">AC REPAIR</option>
                  <option value="PAINTING">PAINTING</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Service Title</label>
                <input 
                  type="text" 
                  value={newServiceData.name} 
                  onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Description</label>
                <textarea 
                  value={newServiceData.description} 
                  onChange={(e) => setNewServiceData({ ...newServiceData, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Base Price (Rs.)</label>
                <input 
                  type="number" 
                  value={newServiceData.basePrice} 
                  onChange={(e) => setNewServiceData({ ...newServiceData, basePrice: parseFloat(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setNewService(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl">Cancel</button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create Listing</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
