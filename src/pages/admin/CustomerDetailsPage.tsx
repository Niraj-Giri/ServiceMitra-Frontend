import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import {
  ArrowLeft, User, ClipboardList, DollarSign, Star, AlertTriangle,
  Phone, Mail, Calendar, ChevronLeft, ChevronRight,
  TrendingUp, Award, Gift,
  CheckCircle2, XCircle, Loader2, Wallet, Zap, PlusCircle, ShieldAlert
} from 'lucide-react';

interface CustomerDetailsPageProps {
  customerId: number;
  onBack: () => void;
  onRefreshStats: () => void;
  onSelectBooking?: (id: number) => void;
  onSelectComplaint?: (id: number) => void;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'bookings', label: 'Bookings', icon: ClipboardList },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
];

/* ─── Metric card ───────────────────────────────────── */
const MetricCard: React.FC<{ label: string; value: string | number; icon?: React.ReactNode; color?: string; sub?: string }> = ({ label, value, icon, color = 'blue', sub }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</span>
      {icon && <div className={`p-1.5 rounded-lg bg-${color}-50 text-${color}-500 group-hover:scale-110 transition-transform`}>{icon}</div>}
    </div>
    <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
    {sub && <p className="text-[10px] text-slate-400 mt-1 font-semibold">{sub}</p>}
  </div>
);

/* ─── Status badge ──────────────────────────────────── */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toUpperCase();
  const colors: Record<string, string> = {
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    STARTED: 'bg-blue-50 text-blue-700 border-blue-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    OPEN: 'bg-sky-50 text-sky-700 border-sky-200',
    QUOTING: 'bg-violet-50 text-violet-700 border-violet-200',
    ACCEPTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    RELEASED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REFUNDED: 'bg-rose-50 text-rose-700 border-rose-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${colors[s] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
      {s}
    </span>
  );
};

/* ─── Paginated table wrapper ───────────────────────── */
const PaginatedTable: React.FC<{
  headers: string[];
  rows: React.ReactNode[][];
  page: number; totalPages: number; totalElements: number;
  onPageChange: (p: number) => void;
  loading?: boolean;
}> = ({ headers, rows, page, totalPages, totalElements, onPageChange, loading }) => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
            {headers.map((h, i) => <th key={i} className="px-5 py-3.5">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-xs">
          {loading ? (
            <tr><td colSpan={headers.length} className="text-center py-16 text-slate-400 font-semibold"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="text-center py-16 text-slate-400 italic font-medium">No records found.</td></tr>
          ) : rows.map((cells, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              {cells.map((c, j) => <td key={j} className="px-5 py-3.5">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {totalPages > 1 && (
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold bg-slate-50/30">
        <span>Page {page + 1} of {totalPages} · {totalElements} total</span>
        <div className="flex items-center gap-1.5">
          <button disabled={page === 0} onClick={() => onPageChange(page - 1)} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    )}
  </div>
);


/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export const CustomerDetailsPage: React.FC<CustomerDetailsPageProps> = ({ customerId, onBack, onRefreshStats, onSelectBooking, onSelectComplaint }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [customer, setCustomer] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Reward points
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsAmt, setPointsAmt] = useState('');
  const [pointsDesc, setPointsDesc] = useState('Manual adjustment by Admin');

  // Bookings
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsPage, setBookingsPage] = useState(0);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(0);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Disputes
  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputesPage, setDisputesPage] = useState(0);
  const [disputesTotalPages, setDisputesTotalPages] = useState(0);
  const [disputesTotal, setDisputesTotal] = useState(0);
  const [disputesLoading, setDisputesLoading] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(0);
  const [txTotal, setTxTotal] = useState(0);
  const [txLoading, setTxLoading] = useState(false);

  // Confirm dialog
  const [confirmConfig, setConfirmConfig] = useState<{ action: string; message: string } | null>(null);

  /* ─── Load core data ────────────────────────────────── */
  const loadCoreData = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, metRes, loyRes] = await Promise.all([
        apiClient.get(`/admin/customers/${customerId}`),
        apiClient.get(`/admin/customers/${customerId}/metrics`),
        apiClient.get(`/admin/customers/${customerId}/loyalty`),
      ]);
      setCustomer(custRes.data?.data || custRes.data);
      setMetrics(metRes.data?.data || metRes.data);
      const loyData = loyRes.data?.data || loyRes.data;
      setPointsHistory(loyData.history || []);
      setPointsBalance(loyData.pointsBalance || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { loadCoreData(); }, [loadCoreData]);

  /* ─── Tab data loaders ──────────────────────────────── */
  const loadBookings = useCallback(async (p: number) => {
    setBookingsLoading(true);
    try {
      const res = await apiClient.get(`/admin/customers/${customerId}/bookings-paged`, { params: { page: p, size: 10 } });
      const d = res.data?.data || res.data;
      setBookings(d.content || []);
      setBookingsTotalPages(d.totalPages || 0);
      setBookingsTotal(d.totalElements || 0);
      setBookingsPage(p);
    } catch (err) { console.error(err); }
    setBookingsLoading(false);
  }, [customerId]);

  const loadReviews = useCallback(async (p: number) => {
    setReviewsLoading(true);
    try {
      const res = await apiClient.get(`/admin/customers/${customerId}/reviews-paged`, { params: { page: p, size: 10 } });
      const d = res.data?.data || res.data;
      setReviews(d.content || []);
      setReviewsTotalPages(d.totalPages || 0);
      setReviewsTotal(d.totalElements || 0);
      setReviewsPage(p);
    } catch (err) { console.error(err); }
    setReviewsLoading(false);
  }, [customerId]);

  const loadDisputes = useCallback(async (p: number) => {
    setDisputesLoading(true);
    try {
      const res = await apiClient.get(`/admin/customers/${customerId}/complaints-paged`, { params: { page: p, size: 10 } });
      const d = res.data?.data || res.data;
      setDisputes(d.content || []);
      setDisputesTotalPages(d.totalPages || 0);
      setDisputesTotal(d.totalElements || 0);
      setDisputesPage(p);
    } catch (err) { console.error(err); }
    setDisputesLoading(false);
  }, [customerId]);

  const loadTransactions = useCallback(async (p: number) => {
    setTxLoading(true);
    try {
      const res = await apiClient.get(`/admin/customers/${customerId}/transactions-paged`, { params: { page: p, size: 10 } });
      const d = res.data?.data || res.data;
      setTransactions(d.content || []);
      setTxTotalPages(d.totalPages || 0);
      setTxTotal(d.totalElements || 0);
      setTxPage(p);
    } catch (err) { console.error(err); }
    setTxLoading(false);
  }, [customerId]);

  useEffect(() => {
    if (activeTab === 'bookings') loadBookings(0);
    else if (activeTab === 'reviews') loadReviews(0);
    else if (activeTab === 'disputes') loadDisputes(0);
    else if (activeTab === 'finance') loadTransactions(0);
  }, [activeTab, loadBookings, loadReviews, loadDisputes, loadTransactions]);

  /* ─── Actions ───────────────────────────────────────── */
  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointsAmt.trim()) return;
    try {
      await apiClient.post(`/admin/customers/${customerId}/loyalty`, {
        points: parseInt(pointsAmt),
        actionType: 'COMPENSATION',
        description: pointsDesc,
      });
      setPointsAmt('');
      setPointsDesc('Manual adjustment by Admin');
      loadCoreData();
      onRefreshStats();
    } catch { alert('Failed to adjust points'); }
  };

  const handleTogglePermission = async (field: string, currentVal: boolean) => {
    const reason = prompt('Enter reason for audit:');
    if (!reason?.trim()) { alert('Cancelled: reason is required.'); return; }
    try {
      const res = await apiClient.put(`/admin/customers/${customerId}/permissions`, { [field]: !currentVal, reason });
      const u = res.data?.data || res.data;
      setCustomer((prev: any) => ({
        ...prev,
        couponsDisabled: u.couponsDisabled,
        rewardsDisabled: u.rewardsDisabled,
        bookingsLimited: u.bookingsLimited,
      }));
    } catch { alert('Failed to update.'); }
  };

  const executeAction = async () => {
    if (!confirmConfig) return;
    try {
      if (confirmConfig.action === 'suspend') await apiClient.put(`/admin/customers/${customerId}/suspend`);
      else if (confirmConfig.action === 'activate') await apiClient.put(`/admin/customers/${customerId}/activate`);
      setConfirmConfig(null);
      loadCoreData();
      onRefreshStats();
    } catch { alert('Action failed.'); }
  };

  if (loading || !customer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const m = metrics || {};

  return (
    <div className="animate-fade-in">
      {/* ─── Header Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {customer.profilePhoto ? (
              <img src={customer.profilePhoto} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-md" />
            ) : (
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                {customer.name?.[0]?.toUpperCase() || 'C'}
              </div>
            )}
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">{customer.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-400">ID #{customer.id}</span>
                <span className="text-slate-300">·</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${customer.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {customer.isActive ? 'ACTIVE' : 'SUSPENDED'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirmConfig({
              action: customer.isActive ? 'suspend' : 'activate',
              message: `Are you sure you want to ${customer.isActive ? 'suspend' : 'reactivate'} ${customer.name}?`,
            })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${customer.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
          >
            {customer.isActive ? 'Suspend' : 'Reactivate'}
          </button>
        </div>
      </div>

      {/* ─── Tab Navigation ───────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-xs overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {/* ══════ OVERVIEW ══════ */}
        {activeTab === 'overview' && (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCard label="Total Bookings" value={m.totalBookings ?? 0} icon={<ClipboardList className="h-4 w-4" />} color="blue" />
              <MetricCard label="Completed" value={m.completedBookings ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} color="emerald" />
              <MetricCard label="Active" value={m.activeBookings ?? 0} icon={<Zap className="h-4 w-4" />} color="amber" />
              <MetricCard label="Cancelled" value={m.cancelledBookings ?? 0} icon={<XCircle className="h-4 w-4" />} color="rose" />
              <MetricCard label="Reward Points" value={pointsBalance} icon={<Gift className="h-4 w-4" />} color="violet" sub={`${m.totalComplaints ?? 0} complaints`} />
            </div>

            {/* Personal + Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Personal Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  {[
                    { label: 'Name', value: customer.name, icon: <User className="h-3.5 w-3.5" /> },
                    { label: 'Phone', value: customer.phone, icon: <Phone className="h-3.5 w-3.5" /> },
                    { label: 'Email', value: customer.email || 'N/A', icon: <Mail className="h-3.5 w-3.5" /> },
                    { label: 'Gender', value: customer.gender || 'Not set' },
                    { label: 'Date of Birth', value: customer.dateOfBirth || 'N/A', icon: <Calendar className="h-3.5 w-3.5" /> },
                    { label: 'Registered', value: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A', icon: <Calendar className="h-3.5 w-3.5" /> },
                    { label: 'Last Login', value: customer.lastLogin ? new Date(customer.lastLogin).toLocaleString() : 'N/A' },
                    { label: 'Lifetime Spend', value: `₹${Number(m.lifetimeSpend || 0).toLocaleString()}`, icon: <TrendingUp className="h-3.5 w-3.5" /> },
                    { label: 'Avg Spend', value: `₹${Number(m.averageSpend || 0).toLocaleString()}` },
                    { label: 'Refund Amount', value: `₹${Number(m.refundAmount || 0).toLocaleString()}` },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
                        {item.icon}
                        <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {/* Trust Controls */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Trust Controls</h3>
                  <div className="space-y-2.5 text-xs">
                    {[
                      { label: 'Disable Coupons', field: 'couponsDisabled', val: customer.couponsDisabled },
                      { label: 'Lock Reward Points', field: 'rewardsDisabled', val: customer.rewardsDisabled },
                      { label: 'Limit Active Bookings', field: 'bookingsLimited', val: customer.bookingsLimited },
                    ].map((ctrl, i) => (
                      <label key={i} className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!ctrl.val}
                          onChange={() => handleTogglePermission(ctrl.field, !!ctrl.val)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span>{ctrl.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Points Adjuster */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Reward Points</h3>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-600">Balance</span>
                    <span className="font-mono text-base font-black text-blue-600">{pointsBalance} pts</span>
                  </div>
                  <form onSubmit={handleAdjustPoints} className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="pts" required value={pointsAmt} onChange={e => setPointsAmt(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-center font-bold text-xs" />
                      <input type="text" placeholder="Reason" required value={pointsDesc} onChange={e => setPointsDesc(e.target.value)}
                        className="col-span-2 w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition flex items-center justify-center gap-1 text-[11px]">
                      <PlusCircle className="h-4 w-4" /> Adjust Balance
                    </button>
                  </form>
                  <div className="max-h-36 overflow-y-auto space-y-2 pt-2 border-t border-slate-100">
                    {pointsHistory.map((h: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[10px] pb-1 border-b border-slate-50 last:border-0">
                        <div>
                          <span className="font-bold block text-slate-700">{h.actionType}</span>
                          <span className="text-slate-400 block">{h.description}</span>
                        </div>
                        <span className={`font-mono font-bold shrink-0 ${h.points > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                          {h.points > 0 ? `+${h.points}` : h.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════ BOOKINGS ══════ */}
        {activeTab === 'bookings' && (
          <PaginatedTable
            headers={['ID', 'Service', 'Date', 'Amount', 'Status']}
            rows={bookings.map(b => [
              <span 
                onClick={() => onSelectBooking && onSelectBooking(b.id)}
                className={`font-mono font-bold text-slate-800 ${onSelectBooking ? 'cursor-pointer hover:underline hover:text-blue-600' : ''}`}
              >
                #{b.id}
              </span>,
              <span className="font-medium text-slate-600">{b.serviceName || '—'}</span>,
              <span className="text-slate-500">{b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString() : '—'}</span>,
              <span className="font-mono font-bold text-slate-800">₹{b.totalBill || b.agreedPrice || 0}</span>,
              <StatusBadge status={b.status} />,
            ])}
            page={bookingsPage}
            totalPages={bookingsTotalPages}
            totalElements={bookingsTotal}
            onPageChange={loadBookings}
            loading={bookingsLoading}
          />
        )}

        {/* ══════ FINANCE ══════ */}
        {activeTab === 'finance' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Lifetime Spend" value={`₹${Number(m.lifetimeSpend || 0).toLocaleString()}`} icon={<TrendingUp className="h-4 w-4" />} color="emerald" />
              <MetricCard label="Avg Spend" value={`₹${Number(m.averageSpend || 0).toLocaleString()}`} icon={<DollarSign className="h-4 w-4" />} color="blue" />
              <MetricCard label="Refunds" value={`₹${Number(m.refundAmount || 0).toLocaleString()}`} icon={<Wallet className="h-4 w-4" />} color="rose" />
              <MetricCard label="Reward Points" value={pointsBalance} icon={<Award className="h-4 w-4" />} color="violet" />
            </div>
            <PaginatedTable
              headers={['Date', 'Booking ID', 'Amount', 'Status', 'Refund Type']}
              rows={transactions.map(t => [
                <span className="text-slate-500">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</span>,
                <span 
                  onClick={() => onSelectBooking && onSelectBooking(t.bookingId)}
                  className={`font-mono font-bold text-slate-800 ${onSelectBooking ? 'cursor-pointer hover:underline hover:text-blue-600' : ''}`}
                >
                  #{t.bookingId}
                </span>,
                <span className="font-mono text-slate-700">₹{Number(t.amount || 0).toLocaleString()}</span>,
                <StatusBadge status={t.status} />,
                <span className="text-slate-500">{t.refundType || '—'}</span>,
              ])}
              page={txPage}
              totalPages={txTotalPages}
              totalElements={txTotal}
              onPageChange={loadTransactions}
              loading={txLoading}
            />
          </>
        )}

        {/* ══════ REVIEWS ══════ */}
        {activeTab === 'reviews' && (
          <PaginatedTable
            headers={['Provider', 'Rating', 'Comment', 'Date', 'Status']}
            rows={reviews.map(r => [
              <span className="font-semibold text-slate-700">{r.provider?.businessName || r.provider?.name || '—'}</span>,
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="font-black text-slate-800">{r.rating}</span>
              </div>,
              <span className="text-slate-600 max-w-[300px] truncate block">{r.comment || 'No comment'}</span>,
              <span className="text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</span>,
              <span className={`text-[10px] font-bold ${r.isHidden ? 'text-rose-500' : r.isReported ? 'text-amber-500' : 'text-emerald-500'}`}>
                {r.isHidden ? 'Hidden' : r.isReported ? 'Reported' : 'Visible'}
              </span>,
            ])}
            page={reviewsPage}
            totalPages={reviewsTotalPages}
            totalElements={reviewsTotal}
            onPageChange={loadReviews}
            loading={reviewsLoading}
          />
        )}

        {/* ══════ DISPUTES ══════ */}
        {activeTab === 'disputes' && (
          <PaginatedTable
            headers={['ID', 'Booking', 'Subject', 'Category', 'Priority', 'Status', 'Created']}
            rows={disputes.map(d => [
              <span 
                onClick={() => onSelectComplaint && onSelectComplaint(d.id)}
                className={`font-mono font-bold text-slate-800 ${onSelectComplaint ? 'cursor-pointer hover:underline hover:text-blue-600' : ''}`}
              >
                #{d.id}
              </span>,
              <span 
                onClick={() => onSelectBooking && onSelectBooking(d.bookingId)}
                className={`font-mono text-slate-600 ${onSelectBooking ? 'cursor-pointer hover:underline hover:text-blue-600 font-bold' : ''}`}
              >
                #{d.bookingId}
              </span>,
              <span className="font-semibold text-slate-700 max-w-[200px] truncate block">{d.subject}</span>,
              <span className="text-slate-600">{d.category}</span>,
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                d.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                d.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>{d.priority}</span>,
              <StatusBadge status={d.status} />,
              <span className="text-slate-500">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</span>,
            ])}
            page={disputesPage}
            totalPages={disputesTotalPages}
            totalElements={disputesTotal}
            onPageChange={loadDisputes}
            loading={disputesLoading}
          />
        )}
      </div>

      {/* Confirm Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center animate-scale-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">Confirm Action</h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">{confirmConfig.message}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmConfig(null)} className="flex-1 font-bold py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs transition">Cancel</button>
              <button onClick={executeAction} className="flex-1 font-bold py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs transition">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
