import React from 'react';
import { 
  Users, Wrench, ShieldCheck, ClipboardList, 
  DollarSign, AlertTriangle, Activity, Clock, Settings
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell 
} from 'recharts';

interface DashboardTabProps {
  analytics: any;
  charts: any;
  auditLogs: any[];
  onNavigateTab: (tab: string) => void;
}

const COLORS = ['#3b82f6', '#4f46e5', '#f59e0b', '#10b981', '#ec4899'];

export const DashboardTab: React.FC<DashboardTabProps> = ({ 
  analytics, 
  charts, 
  auditLogs,
  onNavigateTab
}) => {
  const opsCards = [
    { label: 'Pending KYC Verifications', val: analytics?.pendingProviderReviews ?? 0, icon: Wrench, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100', clickTab: 'providers' },
    { label: 'Pending Complaints', val: analytics?.pendingComplaints ?? 0, icon: AlertTriangle, color: 'bg-rose-50 text-rose-600', border: 'border-rose-100', clickTab: 'complaints' },
    { label: 'Pending Refund Requests', val: analytics?.pendingRefundRequests ?? 0, icon: DollarSign, color: 'bg-yellow-50 text-yellow-600', border: 'border-yellow-100', clickTab: 'finance' },
    { label: 'Pending Payout Requests', val: analytics?.pendingPayoutRequests ?? 0, icon: DollarSign, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100', clickTab: 'finance' },
    { label: 'Bookings Without Provider', val: analytics?.bookingsWithoutProvider ?? 0, icon: ClipboardList, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100', clickTab: 'bookings' },
    { label: 'Emergency Bookings', val: analytics?.emergencyBookings ?? 0, icon: AlertTriangle, color: 'bg-red-50 text-red-600', border: 'border-red-100', clickTab: 'bookings' },
    { label: 'High Priority Complaints', val: analytics?.highPriorityComplaints ?? 0, icon: AlertTriangle, color: 'bg-red-50 text-red-600', border: 'border-red-100', clickTab: 'complaints' },
    { label: 'Suspended Providers Awaiting Review', val: analytics?.suspendedProvidersAwaitingReview ?? 0, icon: Wrench, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100', clickTab: 'providers' },
    { label: 'Providers with High Complaints', val: analytics?.providersWithHighComplaintRate ?? 0, icon: AlertTriangle, color: 'bg-rose-50 text-rose-600', border: 'border-rose-100', clickTab: 'providers' },
    { label: 'Customers with Fraud Risk', val: analytics?.customersWithFraudRisk ?? 0, icon: Users, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100', clickTab: 'customers' },
    { label: 'Failed Payments', val: analytics?.failedPayments ?? 0, icon: DollarSign, color: 'bg-red-50 text-red-600', border: 'border-red-100', clickTab: 'finance' },
    { label: 'Expired KYC', val: analytics?.expiredKYC ?? 0, icon: ShieldCheck, color: 'bg-gray-50 text-gray-600', border: 'border-gray-100', clickTab: 'providers' },
    { label: 'Services Awaiting Approval', val: analytics?.servicesAwaitingApproval ?? 0, icon: Settings, color: 'bg-teal-50 text-teal-600', border: 'border-teal-100', clickTab: 'services' },
    { label: 'Low Supply Categories', val: analytics?.lowSupplyAreas ?? 0, icon: Wrench, color: 'bg-sky-50 text-sky-600', border: 'border-sky-100', clickTab: 'services' }
  ];

  const statsCards = [
    { label: 'Today\'s Bookings', val: analytics?.todayBookings ?? 0, icon: Clock, color: 'bg-slate-50 text-slate-600', border: 'border-slate-100' },
    { label: 'Active Bookings', val: analytics?.activeBookings ?? 0, icon: ClipboardList, color: 'bg-slate-50 text-slate-600', border: 'border-slate-100' },
    { label: 'Completed Bookings', val: analytics?.completedBookings ?? 0, icon: ClipboardList, color: 'bg-slate-50 text-slate-600', border: 'border-slate-100' },
    { label: 'Today\'s Platform Comm.', val: `Rs. ${analytics?.todayRevenue ?? 0}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
    { label: 'Monthly Platform Comm.', val: `Rs. ${analytics?.totalRevenue ?? 0}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Actionable Operations Alert Center */}
      <div>
        <h3 className="font-extrabold text-slate-900 mb-4 text-xs uppercase tracking-wider">Operations Control Center (Action Queues)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {opsCards.map((card, idx) => {
            const Icon = card.icon;
            const hasAlert = card.val > 0;
            return (
              <div 
                key={idx} 
                onClick={() => card.clickTab && onNavigateTab(card.clickTab)}
                className={`bg-white rounded-xl p-4 border ${hasAlert ? `${card.border} ring-2 ring-offset-0 ring-${card.color.split(' ')[1]}` : 'border-slate-200 opacity-60'} shadow-xs flex flex-col justify-between h-28 transition cursor-pointer hover:border-blue-500 hover:shadow-sm`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-tight leading-tight">{card.label}</span>
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className={`text-xl font-bold mt-2 ${hasAlert ? 'text-slate-900' : 'text-slate-500'}`}>{card.val}</h3>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div>
        <h3 className="font-extrabold text-slate-900 mb-4 text-xs uppercase tracking-wider">General Platform Performance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {statsCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-32"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{card.label}</span>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mt-2 text-slate-900">{card.val}</h3>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2">Pending Approvals</h4>
            <p className="text-slate-500 text-xs">There are {analytics?.pendingProviderReviews ?? 0} service providers waiting for identity and document verification.</p>
          </div>
          <button 
            onClick={() => onNavigateTab('providers')}
            className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition"
          >
            Review KYC Applications
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2">Disputes Inbox</h4>
            <p className="text-slate-500 text-xs">There are {analytics?.pendingComplaints ?? 0} open disputes that require intervention or mediation.</p>
          </div>
          <button 
            onClick={() => onNavigateTab('complaints')}
            className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition"
          >
            Manage Support Tickets
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-2">Service Catalog</h4>
            <p className="text-slate-500 text-xs">Update your service listings, pricing model parameters, or category structure.</p>
          </div>
          <button 
            onClick={() => onNavigateTab('services')}
            className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition"
          >
            Modify Service Offerings
          </button>
        </div>
      </div>

      {/* Dynamic Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-extrabold text-slate-900 mb-4 text-xs uppercase tracking-wider">Bookings Dispatch Rate (Last 6 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.bookingsPerDay || []}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="font-extrabold text-slate-900 mb-4 text-xs uppercase tracking-wider">Monthly Platform Revenue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.revenuePerMonth || []}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pie Chart, Supply Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs lg:col-span-1">
          <h3 className="font-extrabold text-slate-900 mb-4 text-xs uppercase tracking-wider">Top Dispatch Categories</h3>
          <div className="h-60 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.topServices || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
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
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs">
            {(charts?.topServices || []).map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span>{entry.name} ({entry.bookings})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs lg:col-span-1">
          <h3 className="font-extrabold text-slate-900 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
            Supply Health Monitor
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Online Providers Ratio</span>
                <span className="text-slate-900">{analytics?.onlineProviders ?? 0} / {analytics?.totalProviders ?? 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${analytics?.totalProviders > 0 ? (analytics.onlineProviders / analytics.totalProviders) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Supply Scarcity</span>
                <span className="text-slate-900">{analytics?.lowSupplyAreas ?? 0} categories</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-rose-500 h-2 rounded-full" 
                  style={{ width: `${(analytics?.lowSupplyAreas ?? 0) * 20}%` }}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Category Capacity</h4>
              <div className="space-y-1.5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">AC / Heating</span>
                  <span className={analytics?.lowSupplyAreas > 0 ? "text-rose-500" : "text-emerald-600"}>
                    {analytics?.lowSupplyAreas > 0 ? "Low Supply" : "Healthy"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cleaning</span>
                  <span className="text-emerald-600">Healthy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Electrical</span>
                  <span className="text-emerald-600">Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs lg:col-span-2">
          <h3 className="font-extrabold text-slate-900 mb-4 text-xs uppercase tracking-wider">System Security & Activities Log</h3>
          <div className="space-y-4">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex gap-4 items-start border-b border-slate-100 pb-3.5 last:border-0 last:pb-0">
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-bold text-slate-800 truncate">{log.action}</p>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Performed on: <span className="font-bold text-slate-700">{log.entity}</span> • Admin IP: {log.ipAddress}
                  </p>
                  {log.reason && (
                    <p className="text-[10px] text-blue-600 italic mt-0.5">Reason: {log.reason}</p>
                  )}
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs italic">No system activities logged.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
