import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import {
  ArrowLeft, User, Shield, ClipboardList, DollarSign, Star, AlertTriangle,
  Phone, Mail, MapPin, Calendar, Clock, ChevronLeft, ChevronRight,
  Briefcase, TrendingUp, Award, FileText, ExternalLink,
  CheckCircle2, XCircle, Loader2, Wallet, Zap
} from 'lucide-react';

interface ProviderDetailsPageProps {
  providerId: number;
  onBack: () => void;
  onSelectBooking?: (id: number) => void;
  onSelectComplaint?: (id: number) => void;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'kyc', label: 'KYC & Documents', icon: Shield },
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
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    STARTED: 'bg-blue-50 text-blue-700 border-blue-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    OPEN: 'bg-sky-50 text-sky-700 border-sky-200',
    QUOTING: 'bg-violet-50 text-violet-700 border-violet-200',
    ACCEPTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    RELEASED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
export const ProviderDetailsPage: React.FC<ProviderDetailsPageProps> = ({ providerId, onBack, onSelectBooking, onSelectComplaint }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [provider, setProvider] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Bookings tab
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsPage, setBookingsPage] = useState(0);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(0);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Earnings tab
  const [earnings, setEarnings] = useState<any[]>([]);
  const [earningsPage, setEarningsPage] = useState(0);
  const [earningsTotalPages, setEarningsTotalPages] = useState(0);
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [earningsLoading, setEarningsLoading] = useState(false);

  // Reviews tab
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Disputes tab
  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputesPage, setDisputesPage] = useState(0);
  const [disputesTotalPages, setDisputesTotalPages] = useState(0);
  const [disputesTotal, setDisputesTotal] = useState(0);
  const [disputesLoading, setDisputesLoading] = useState(false);

  /* ─── Load core data ────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [provRes, metRes] = await Promise.all([
          apiClient.get(`/admin/providers/${providerId}`),
          apiClient.get(`/admin/providers/${providerId}/metrics`),
        ]);
        setProvider(provRes.data?.data || provRes.data);
        setMetrics(metRes.data?.data || metRes.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, [providerId]);

  /* ─── Tab data loaders ──────────────────────────────── */
  const loadBookings = useCallback(async (p: number) => {
    setBookingsLoading(true);
    try {
      const res = await apiClient.get(`/admin/providers/${providerId}/bookings-paged`, { params: { page: p, size: 10 } });
      const d = res.data?.data || res.data;
      setBookings(d.content || []);
      setBookingsTotalPages(d.totalPages || 0);
      setBookingsTotal(d.totalElements || 0);
      setBookingsPage(p);
    } catch (err) { console.error(err); }
    setBookingsLoading(false);
  }, [providerId]);

  const loadEarnings = useCallback(async (p: number) => {
    setEarningsLoading(true);
    try {
      const res = await apiClient.get(`/admin/providers/${providerId}/earnings-paged`, { params: { page: p, size: 10 } });
      const d = res.data?.data || res.data;
      setEarnings(d.content || []);
      setEarningsTotalPages(d.totalPages || 0);
      setEarningsTotal(d.totalElements || 0);
      setEarningsPage(p);
    } catch (err) { console.error(err); }
    setEarningsLoading(false);
  }, [providerId]);

  const loadReviews = useCallback(async (p: number) => {
    setReviewsLoading(true);
    try {
      const res = await apiClient.get(`/admin/providers/${providerId}/reviews-paged`, { params: { page: p, size: 10 } });
      const d = res.data?.data || res.data;
      setReviews(d.content || []);
      setReviewsTotalPages(d.totalPages || 0);
      setReviewsTotal(d.totalElements || 0);
      setReviewsPage(p);
    } catch (err) { console.error(err); }
    setReviewsLoading(false);
  }, [providerId]);

  const loadDisputes = useCallback(async (p: number) => {
    setDisputesLoading(true);
    try {
      const res = await apiClient.get(`/admin/providers/${providerId}/complaints-paged`, { params: { page: p, size: 10 } });
      const d = res.data?.data || res.data;
      setDisputes(d.content || []);
      setDisputesTotalPages(d.totalPages || 0);
      setDisputesTotal(d.totalElements || 0);
      setDisputesPage(p);
    } catch (err) { console.error(err); }
    setDisputesLoading(false);
  }, [providerId]);

  useEffect(() => {
    if (activeTab === 'bookings') loadBookings(0);
    else if (activeTab === 'finance') loadEarnings(0);
    else if (activeTab === 'reviews') loadReviews(0);
    else if (activeTab === 'disputes') loadDisputes(0);
  }, [activeTab, loadBookings, loadEarnings, loadReviews, loadDisputes]);

  if (loading || !provider) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const m = metrics || {};

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="animate-fade-in">
      {/* ─── Header Bar ───────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {provider.profilePhotoUrl ? (
              <img src={provider.profilePhotoUrl} alt="" className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-md" />
            ) : (
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                {provider.name?.[0]?.toUpperCase() || 'P'}
              </div>
            )}
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">{provider.name || provider.businessName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-400">ID #{provider.id}</span>
                <span className="text-slate-300">·</span>
                <StatusBadge status={provider.status} />
                <span className="text-slate-300">·</span>
                <span className={`flex items-center gap-1 text-[10px] font-bold ${provider.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${provider.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  {provider.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
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
                active
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ──────────────────────────────────── */}
      <div className="space-y-6">

        {/* ══════ OVERVIEW TAB ══════ */}
        {activeTab === 'overview' && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCard label="Total Tasks" value={m.totalTasks ?? 0} icon={<ClipboardList className="h-4 w-4" />} color="blue" />
              <MetricCard label="Completed" value={m.completedTasks ?? 0} icon={<CheckCircle2 className="h-4 w-4" />} color="emerald" />
              <MetricCard label="Active" value={m.activeTasks ?? 0} icon={<Zap className="h-4 w-4" />} color="amber" />
              <MetricCard label="Cancelled" value={m.cancelledTasks ?? 0} icon={<XCircle className="h-4 w-4" />} color="rose" />
              <MetricCard label="Avg Rating" value={Number(m.averageRating || 0).toFixed(1)} icon={<Star className="h-4 w-4" />} color="amber" sub={`${m.totalComplaints ?? 0} complaints`} />
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Personal Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  {[
                    { label: 'Full Name', value: provider.name || provider.businessName, icon: <User className="h-3.5 w-3.5" /> },
                    { label: 'Phone', value: provider.phone, icon: <Phone className="h-3.5 w-3.5" /> },
                    { label: 'Email', value: provider.email || 'N/A', icon: <Mail className="h-3.5 w-3.5" /> },
                    { label: 'Gender', value: provider.gender || 'Not set' },
                    { label: 'Age', value: provider.age || 'N/A' },
                    { label: 'Date of Birth', value: provider.dateOfBirth || 'N/A', icon: <Calendar className="h-3.5 w-3.5" /> },
                    { label: 'Address', value: provider.address || 'N/A', icon: <MapPin className="h-3.5 w-3.5" /> },
                    { label: 'City', value: provider.city || 'N/A' },
                    { label: 'State', value: provider.state || 'N/A' },
                    { label: 'Pincode', value: provider.pincode || 'N/A' },
                    { label: 'Languages', value: provider.languages || 'N/A' },
                    { label: 'Emergency Contact', value: provider.emergencyContact || 'N/A' },
                    { label: 'Registered', value: provider.createdAt ? new Date(provider.createdAt).toLocaleDateString() : 'N/A', icon: <Calendar className="h-3.5 w-3.5" /> },
                    { label: 'Last Active', value: provider.lastActive ? new Date(provider.lastActive).toLocaleString() : 'N/A', icon: <Clock className="h-3.5 w-3.5" /> },
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

              {/* Quick Stats Card */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Performance</h3>
                  {[
                    { label: 'Acceptance Rate', value: `${Number(m.acceptanceRate || 0).toFixed(1)}%`, color: 'emerald' },
                    { label: 'Completion Rate', value: `${Number(m.completionRate || 0).toFixed(1)}%`, color: 'blue' },
                    { label: 'Cancellation Rate', value: `${Number(m.cancellationRate || 0).toFixed(1)}%`, color: 'rose' },
                    { label: 'Avg Response Time', value: `${m.responseTimeMin ?? 0} min`, color: 'amber' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                      <span className={`text-xs font-black text-${item.color}-600`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Work Schedule</h3>
                  <div className="text-xs space-y-2.5">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-600">Hours</span>
                      <span className="font-bold text-slate-800">{provider.workingHoursStart || '09:00'} – {provider.workingHoursEnd || '18:00'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600 block mb-1.5">Working Days</span>
                      <div className="flex flex-wrap gap-1">
                        {(provider.workingDays || 'MON,TUE,WED,THU,FRI,SAT').split(',').map((d: string) => (
                          <span key={d} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">{d.trim().substring(0, 3)}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-600">Category</span>
                      <span className="font-bold text-slate-800">{provider.serviceCategory || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-600">Experience</span>
                      <span className="font-bold text-slate-800">{provider.experienceYears || 0} years</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════ KYC & DOCUMENTS TAB ══════ */}
        {activeTab === 'kyc' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KYC Info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">KYC & Identity</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                {[
                  { label: 'PAN Number', value: provider.panNumber || 'Not provided' },
                  { label: 'Aadhaar Number', value: provider.aadhaarNumber || 'Not provided' },
                  { label: 'Driving License', value: provider.drivingLicense || 'Not provided' },
                  { label: 'Verification Status', value: provider.status === 'APPROVED' ? 'Verified' : 'Unverified' },
                  { label: 'Bank Details', value: provider.bankDetails || 'Not provided' },
                  { label: 'Skills', value: provider.skills || 'N/A' },
                  { label: 'Commission %', value: provider.commissionPercentage != null ? `${provider.commissionPercentage}%` : 'Default' },
                ].map((item, i) => (
                  <div key={i}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{item.label}</span>
                    <p className="font-semibold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Uploaded Documents</h3>
              <div className="space-y-3">
                {[
                  { label: 'PAN Card', url: provider.panFileUrl },
                  { label: 'Aadhaar / Citizenship', url: provider.citizenFileUrl },
                  { label: 'Profile Photo', url: provider.profilePhotoUrl },
                ].filter(d => d.url).map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><FileText className="h-4 w-4" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{doc.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{doc.url}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
                {/* Certificates */}
                {provider.certificatesUrls && provider.certificatesUrls.split(',').filter(Boolean).map((url: string, i: number) => (
                  <div key={`cert-${i}`} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-500"><Award className="h-4 w-4" /></div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Certificate #{i + 1}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{url.trim()}</p>
                      </div>
                    </div>
                    <a href={url.trim()} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
                {!provider.panFileUrl && !provider.citizenFileUrl && !provider.profilePhotoUrl && (
                  <p className="text-center text-slate-400 italic text-xs py-8">No documents uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════ BOOKINGS TAB ══════ */}
        {activeTab === 'bookings' && (
          <PaginatedTable
            headers={['ID', 'Customer', 'Service', 'Date', 'Amount', 'Status']}
            rows={bookings.map(b => [
              <span 
                onClick={() => onSelectBooking && onSelectBooking(b.id)}
                className={`font-mono font-bold text-slate-800 ${onSelectBooking ? 'cursor-pointer hover:underline hover:text-blue-600' : ''}`}
              >
                #{b.id}
              </span>,
              <span className="font-semibold text-slate-700">{b.customerName || b.userName || '—'}</span>,
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

        {/* ══════ FINANCE TAB ══════ */}
        {activeTab === 'finance' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              <MetricCard label="Online Earnings" value={`₹${Number(m.onlineEarnings || 0).toLocaleString()}`} icon={<TrendingUp className="h-4 w-4" />} color="emerald" />
              <MetricCard label="COD Earnings" value={`₹${Number(m.codEarnings || 0).toLocaleString()}`} icon={<DollarSign className="h-4 w-4" />} color="blue" />
              <MetricCard label="Available Balance" value={`₹${Number(m.walletBalance || 0).toLocaleString()}`} icon={<Wallet className="h-4 w-4" />} color="indigo" />
              <MetricCard label="Outstanding Commission" value={`₹${Number(m.outstandingCommission || 0).toLocaleString()}`} icon={<AlertTriangle className="h-4 w-4" />} color="rose" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-2">
              <MetricCard label="Lifetime Earnings" value={`₹${Number(m.lifetimeEarnings || 0).toLocaleString()}`} icon={<TrendingUp className="h-4 w-4" />} color="slate" />
              <MetricCard label="Total Commission Paid" value={`₹${Number(m.totalCommission || 0).toLocaleString()}`} icon={<DollarSign className="h-4 w-4" />} color="amber" />
              <MetricCard label="Commission %" value={`${m.commissionPercentage ?? 'Default'}%`} icon={<Briefcase className="h-4 w-4" />} color="violet" />
            </div>
            <PaginatedTable
              headers={['Date', 'Booking ID', 'Amount', 'Commission', 'Net Earnings', 'Status']}
              rows={earnings.map(e => [
                <span className="text-slate-500">{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}</span>,
                <span 
                  onClick={() => onSelectBooking && onSelectBooking(e.bookingId)}
                  className={`font-mono font-bold text-slate-800 ${onSelectBooking ? 'cursor-pointer hover:underline hover:text-blue-600' : ''}`}
                >
                  #{e.bookingId}
                </span>,
                <span className="font-mono text-slate-700">₹{Number(e.amount || 0).toLocaleString()}</span>,
                <span className="font-mono text-amber-600">₹{Number(e.commission || 0).toLocaleString()}</span>,
                <span className="font-mono font-bold text-emerald-600">₹{Number(e.providerEarnings || 0).toLocaleString()}</span>,
                <StatusBadge status={e.status} />,
              ])}
              page={earningsPage}
              totalPages={earningsTotalPages}
              totalElements={earningsTotal}
              onPageChange={loadEarnings}
              loading={earningsLoading}
            />
          </>
        )}

        {/* ══════ REVIEWS TAB ══════ */}
        {activeTab === 'reviews' && (
          <PaginatedTable
            headers={['Customer', 'Rating', 'Comment', 'Date', 'Status']}
            rows={reviews.map(r => [
              <span className="font-semibold text-slate-700">{r.customer?.name || '—'}</span>,
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

        {/* ══════ DISPUTES TAB ══════ */}
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
    </div>
  );
};
