import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { 
  LayoutDashboard, Users, Wrench, ClipboardList, 
  Settings, Activity, DollarSign, AlertTriangle,
  Menu, X, LogOut, Bell, RefreshCw, Tag
} from 'lucide-react';

// Import subcomponents
import { DashboardTab } from './DashboardTab';
import { CustomerTab } from './CustomerTab';
import { ProviderTab } from './ProviderTab';
import { BookingTab } from './BookingTab';
import { ServiceTab } from './ServiceTab';
import { TicketsSection } from './TicketsSection';
import { FinanceTab } from './FinanceTab';
import { AuditLogsTab } from './AuditLogsTab';
import { SettingsTab } from './SettingsTab';
import { CouponTab } from './CouponTab';
import { ProviderDetailsPage } from './ProviderDetailsPage';
import { CustomerDetailsPage } from './CustomerDetailsPage';
import { BookingDetailsPage } from './BookingDetailsPage';
import { ComplaintDetailsPage } from './ComplaintDetailsPage';
import { PayoutDetailsPage } from './PayoutDetailsPage';

export const AdminDashboard: React.FC = () => {
  const [role, setRole] = useState<string>(() => {
    return localStorage.getItem('role') || 'SUPER_ADMIN';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState<number | null>(null);
  const [returnTo, setReturnTo] = useState<any>(null);

  // Common stats states loaded on start for dashboard view
  const [analytics, setAnalytics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const [resAnal, resChart, resAudit] = await Promise.all([
        apiClient.get('/admin/analytics/summary'),
        apiClient.get('/admin/analytics/charts'),
        apiClient.get('/admin/audit-logs')
      ]);
      setAnalytics(resAnal.data);
      setCharts(resChart.data);
      setAuditLogs(resAudit.data || []);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings Portal', icon: ClipboardList },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'providers', label: 'Service Providers', icon: Wrench },
    { id: 'services', label: 'Service Catalog', icon: Settings },
    { id: 'tickets', label: 'Disputes & Reviews', icon: AlertTriangle },
    { id: 'finance', label: 'Finance Ledger', icon: DollarSign },
    { id: 'coupons', label: 'Coupons & Promos', icon: Tag },
    { id: 'audit-logs', label: 'Security Audit Logs', icon: Activity },
    { id: 'settings', label: 'Global Configurations', icon: Settings }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (role === 'SUPER_ADMIN') return true;
    if (role === 'OPS_MANAGER') {
      return ['dashboard', 'bookings', 'customers', 'providers', 'services', 'tickets', 'finance', 'coupons'].includes(item.id);
    }
    if (role === 'SUPPORT_TEAM') {
      return ['dashboard', 'bookings', 'customers', 'providers', 'tickets'].includes(item.id);
    }
    if (role === 'FINANCE_TEAM') {
      return ['dashboard', 'bookings', 'finance', 'coupons'].includes(item.id);
    }
    if (role === 'KYC_TEAM') {
      return ['dashboard', 'providers'].includes(item.id);
    }
    if (role === 'MODERATOR') {
      return ['dashboard', 'tickets'].includes(item.id);
    }
    if (role === 'MARKETING') {
      return ['dashboard', 'coupons', 'settings'].includes(item.id);
    }
    if (role === 'VIEWER') {
      return ['dashboard', 'bookings', 'customers', 'providers', 'services', 'tickets', 'finance', 'coupons'].includes(item.id);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className={`bg-slate-900 text-slate-300 w-64 shrink-0 transition-all duration-300 flex flex-col justify-between border-r border-slate-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-64 w-0 overflow-hidden'}`}>
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/20">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                M
              </div>
              <span className="font-extrabold text-white text-sm tracking-wider uppercase">Mitra Admin</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-slate-850 rounded-lg text-slate-400"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
 
          {/* Navigation Links list */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-190px)]">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedProviderId(null);
                    setSelectedCustomerId(null);
                    setSelectedBookingId(null);
                    setSelectedComplaintId(null);
                    setSelectedPayoutId(null);
                    setReturnTo(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info logout & simulated role switcher */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/10 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-slate-850 rounded-full flex items-center justify-center font-bold text-slate-300">
                A
              </div>
              <div>
                <p className="text-slate-300 font-bold block">Admin Staff</p>
                <select 
                  value={role} 
                  onChange={(e) => {
                    localStorage.setItem('role', e.target.value);
                    setRole(e.target.value);
                  }}
                  className="bg-transparent text-[10px] text-slate-400 font-bold border-none outline-none p-0 cursor-pointer block"
                >
                  <option value="SUPER_ADMIN" className="bg-slate-900 text-slate-300">SUPER_ADMIN</option>
                  <option value="OPS_MANAGER" className="bg-slate-900 text-slate-300">OPS_MANAGER</option>
                  <option value="SUPPORT_TEAM" className="bg-slate-900 text-slate-300">SUPPORT_TEAM</option>
                  <option value="FINANCE_TEAM" className="bg-slate-900 text-slate-300">FINANCE_TEAM</option>
                  <option value="KYC_TEAM" className="bg-slate-900 text-slate-300">KYC_TEAM</option>
                  <option value="MODERATOR" className="bg-slate-900 text-slate-300">MODERATOR</option>
                  <option value="MARKETING" className="bg-slate-900 text-slate-300">MARKETING</option>
                  <option value="VIEWER" className="bg-slate-900 text-slate-300">VIEWER</option>
                </select>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Upper Header Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex justify-between items-center shrink-0 shadow-xs">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-black text-slate-900 text-lg uppercase tracking-wider">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-700 transition relative">
              <Bell className="h-5 w-5" />
              {analytics?.pendingProviderReviews > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-600 rounded-full animate-ping" />
              )}
            </button>
            <button 
              onClick={fetchDashboardStats}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-700 transition"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Tab workspace */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-64px)]">
          {statsLoading && activeTab === 'dashboard' ? (
            <div className="text-center py-20 text-slate-400 text-xs font-semibold">Loading system statistics...</div>
          ) : (
            <>
              {selectedBookingId && (
                <BookingDetailsPage
                  bookingId={selectedBookingId}
                  onBack={() => {
                    setSelectedBookingId(null);
                    if (returnTo) {
                      if (returnTo.tab === 'providers') setSelectedProviderId(returnTo.id);
                      else if (returnTo.tab === 'customers') setSelectedCustomerId(returnTo.id);
                      setReturnTo(null);
                    }
                  }}
                  onRefreshStats={fetchDashboardStats}
                />
              )}
              {selectedComplaintId && (
                <ComplaintDetailsPage
                  complaintId={selectedComplaintId}
                  onBack={() => {
                    setSelectedComplaintId(null);
                    if (returnTo) {
                      if (returnTo.tab === 'providers') setSelectedProviderId(returnTo.id);
                      else if (returnTo.tab === 'customers') setSelectedCustomerId(returnTo.id);
                      setReturnTo(null);
                    }
                  }}
                  onRefreshStats={fetchDashboardStats}
                />
              )}
              {selectedPayoutId && (
                <PayoutDetailsPage
                  payoutId={selectedPayoutId}
                  onBack={() => {
                    setSelectedPayoutId(null);
                    if (returnTo) {
                      if (returnTo.tab === 'providers') setSelectedProviderId(returnTo.id);
                      setReturnTo(null);
                    }
                  }}
                  onRefreshStats={fetchDashboardStats}
                />
              )}

              {!selectedBookingId && !selectedComplaintId && !selectedPayoutId && (
                <>
                  {activeTab === 'dashboard' && (
                    <DashboardTab 
                      analytics={analytics} 
                      charts={charts} 
                      auditLogs={auditLogs}
                      onNavigateTab={(tab) => setActiveTab(tab)}
                    />
                  )}
                  {activeTab === 'bookings' && (
                    <BookingTab onRefreshStats={fetchDashboardStats} onSelectBooking={(id: number) => setSelectedBookingId(id)} />
                  )}
                  {activeTab === 'customers' && !selectedCustomerId && (
                    <CustomerTab onRefreshStats={fetchDashboardStats} onSelectCustomer={(id: number) => setSelectedCustomerId(id)} />
                  )}
                  {activeTab === 'customers' && selectedCustomerId && (
                    <CustomerDetailsPage 
                      customerId={selectedCustomerId} 
                      onBack={() => setSelectedCustomerId(null)} 
                      onRefreshStats={fetchDashboardStats}
                      onSelectBooking={(id: number) => {
                        setReturnTo({ tab: 'customers', id: selectedCustomerId });
                        setSelectedCustomerId(null);
                        setSelectedBookingId(id);
                      }}
                      onSelectComplaint={(id: number) => {
                        setReturnTo({ tab: 'customers', id: selectedCustomerId });
                        setSelectedCustomerId(null);
                        setSelectedComplaintId(id);
                      }}
                    />
                  )}
                  {activeTab === 'providers' && !selectedProviderId && (
                    <ProviderTab onRefreshStats={fetchDashboardStats} onSelectProvider={(id: number) => setSelectedProviderId(id)} />
                  )}
                  {activeTab === 'providers' && selectedProviderId && (
                    <ProviderDetailsPage 
                      providerId={selectedProviderId} 
                      onBack={() => setSelectedProviderId(null)}
                      onSelectBooking={(id: number) => {
                        setReturnTo({ tab: 'providers', id: selectedProviderId });
                        setSelectedProviderId(null);
                        setSelectedBookingId(id);
                      }}
                      onSelectComplaint={(id: number) => {
                        setReturnTo({ tab: 'providers', id: selectedProviderId });
                        setSelectedProviderId(null);
                        setSelectedComplaintId(id);
                      }}
                    />
                  )}
                  {activeTab === 'services' && (
                    <ServiceTab />
                  )}
                  {activeTab === 'tickets' && (
                    <TicketsSection 
                      onSelectComplaint={(id: number) => setSelectedComplaintId(id)}
                      onSelectCustomer={(id: number) => setSelectedCustomerId(id)}
                      onSelectProvider={(id: number) => setSelectedProviderId(id)}
                    />
                  )}
                  {activeTab === 'finance' && (
                    <FinanceTab 
                      onSelectPayout={(id: number) => {
                        setReturnTo(null);
                        setSelectedPayoutId(id);
                      }}
                      onSelectBooking={(id: number) => {
                        setReturnTo(null);
                        setSelectedBookingId(id);
                      }}
                    />
                  )}
                  {activeTab === 'coupons' && (
                    <CouponTab />
                  )}
                  {activeTab === 'audit-logs' && (
                    <AuditLogsTab />
                  )}
                  {activeTab === 'settings' && (
                    <SettingsTab onRefreshStats={fetchDashboardStats} />
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

    </div>
  );
};
