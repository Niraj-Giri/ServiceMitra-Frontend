import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Search, ChevronLeft, ChevronRight, 
  Download, ShieldAlert, Eye, X, 
  DollarSign, FileText, AlertCircle
} from 'lucide-react';
import { exportToCSV } from './csvUtils';

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
  completionRate?: number;
  cancellationRate?: number;
  responseTimeMin?: number;
}

interface ProviderTabProps {
  onRefreshStats: () => void;
  onSelectProvider?: (id: number) => void;
}

export const ProviderTab: React.FC<ProviderTabProps> = ({ onRefreshStats, onSelectProvider }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  // selected provider details modal state
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [strikes, setStrikes] = useState<any[]>([]);
  const [selectedDetailTab, setSelectedDetailTab] = useState<string>('info');

  // wallet adjustments states
  const [walletAdjustAmt, setWalletAdjustAmt] = useState('');
  const [walletAdjustType, setWalletAdjustType] = useState('CREDIT');
  const [walletAdjustDesc, setWalletAdjustDesc] = useState('');

  // strike form states
  const [strikeReason, setStrikeReason] = useState('');
  const [strikeNotes, setStrikeNotes] = useState('');

  // form states inside modal
  const [commissionVal, setCommissionVal] = useState('');
  const [addressVal, setAddressVal] = useState('');
  const [incentiveAmt, setIncentiveAmt] = useState('');
  const [incentiveReason, setIncentiveReason] = useState('SPECIAL_CAMPAIGN');
  const [incentiveDesc, setIncentiveDesc] = useState('Performance Bonus');

  // Confirmation dialogs
  const [confirmConfig, setConfirmConfig] = useState<{
    id: number;
    action: 'approve' | 'reject' | 'suspend' | 'activate';
    message: string;
  } | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/providers', {
        params: {
          status: statusFilter === 'ALL' ? '' : statusFilter,
          search,
          page,
          size,
          sortBy: 'id',
          sortDir: 'DESC'
        }
      });
      const data = response.data;
      setProviders(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load providers', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProviders();
  }, [search, statusFilter, page]);

  const loadProviderDetails = async (prov: Provider) => {
    setSelectedProvider(prov);
    setCommissionVal(String(prov.commissionPercentage ?? 10));
    setAddressVal(prov.address);
    setDetailLoading(true);
    try {
      const [resB, resE, resI, resC, resW, resS] = await Promise.all([
        apiClient.get(`/admin/providers/${prov.id}/bookings`),
        apiClient.get(`/admin/providers/${prov.id}/earnings`),
        apiClient.get(`/admin/providers/${prov.id}/incentives`),
        apiClient.get(`/admin/providers/${prov.id}/complaints`),
        apiClient.get(`/admin/providers/${prov.id}/wallet`),
        apiClient.get(`/admin/providers/${prov.id}/strikes`)
      ]);
      setBookings(resB.data);
      setEarnings(resE.data);
      setIncentives(resI.data);
      setComplaints(resC.data);
      setWallet(resW.data);
      setStrikes(resS.data || []);
    } catch (err) {
      console.error('Failed to load details', err);
    }
    setDetailLoading(false);
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    const reason = prompt('Enter change reason for auditing logs:');
    if (reason === null || reason.trim() === '') {
      alert('Action cancelled: Audit log reason is required.');
      return;
    }
    try {
      await apiClient.put(`/admin/providers/${selectedProvider.id}/commission`, {
        commissionPercentage: parseFloat(commissionVal),
        reason
      });
      alert('Commission rate updated successfully');
      loadProviderDetails({ ...selectedProvider, commissionPercentage: parseFloat(commissionVal) });
      fetchProviders();
      onRefreshStats();
    } catch (err) {
      alert('Failed to update commission');
    }
  };

  const handleUpdateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    const reason = prompt('Enter change reason for auditing logs:');
    if (reason === null || reason.trim() === '') {
      alert('Action cancelled: Audit log reason is required.');
      return;
    }
    try {
      await apiClient.put(`/admin/providers/${selectedProvider.id}/assign-area`, {
        address: addressVal,
        reason
      });
      alert('Service area assigned successfully');
      loadProviderDetails({ ...selectedProvider, address: addressVal });
      fetchProviders();
    } catch (err) {
      alert('Failed to assign area');
    }
  };

  const handleAwardBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !incentiveAmt.trim()) return;
    try {
      await apiClient.post(`/admin/providers/${selectedProvider.id}/incentives`, {
        amount: parseFloat(incentiveAmt),
        reason: incentiveReason,
        description: incentiveDesc
      });
      setIncentiveAmt('');
      setIncentiveReason('SPECIAL_CAMPAIGN');
      setIncentiveDesc('Performance Bonus');
      alert('Bonus incentive awarded successfully');
      loadProviderDetails(selectedProvider);
    } catch (err) {
      alert('Failed to award bonus');
    }
  };

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !walletAdjustAmt.trim()) return;
    const reason = prompt('Enter change reason for auditing logs:');
    if (reason === null || reason.trim() === '') {
      alert('Action cancelled: Audit log reason is required.');
      return;
    }
    try {
      const amt = parseFloat(walletAdjustAmt) * (walletAdjustType === 'DEBIT' ? -1 : 1);
      const res = await apiClient.post(`/admin/providers/${selectedProvider.id}/wallet/adjust`, {
        amount: amt,
        type: walletAdjustType,
        description: walletAdjustDesc || 'Manual adjustment',
        reason
      });
      setWallet(res.data);
      setWalletAdjustAmt('');
      setWalletAdjustDesc('');
      alert('Wallet balance adjusted successfully');
      // reload earnings list
      const resE = await apiClient.get(`/admin/providers/${selectedProvider.id}/earnings`);
      setEarnings(resE.data);
    } catch (err) {
      alert('Failed to adjust wallet');
    }
  };

  const handleAddStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !strikeReason.trim()) return;
    try {
      const res = await apiClient.post(`/admin/providers/${selectedProvider.id}/strikes`, {
        reason: strikeReason,
        notes: strikeNotes
      });
      setStrikes([res.data, ...strikes]);
      setStrikeReason('');
      setStrikeNotes('');
      alert('Warning strike issued successfully');
      loadProviderDetails(selectedProvider);
      fetchProviders();
      onRefreshStats();
    } catch (err) {
      alert('Failed to issue strike');
    }
  };

  const handleUpdateProviderStatus = async (status: string) => {
    if (!selectedProvider) return;
    const reason = prompt('Enter reason for provider status update:');
    if (reason === null || reason.trim() === '') {
      alert('Action cancelled: Reason is required.');
      return;
    }
    try {
      await apiClient.put(`/admin/providers/${selectedProvider.id}/status`, {
        status,
        reason
      });
      alert('Provider status updated successfully');
      loadProviderDetails({ ...selectedProvider, status });
      fetchProviders();
      onRefreshStats();
    } catch (err) {
      alert('Failed to update provider status');
    }
  };

  const executeAction = async () => {
    if (!confirmConfig) return;
    const { id, action } = confirmConfig;
    try {
      if (action === 'approve') {
        const reason = prompt('Enter approval reason details:') || 'KYC Documents approved';
        await apiClient.put(`/admin/providers/${id}/status`, { status: 'VERIFIED', reason });
      } else if (action === 'reject') {
        const reason = prompt('Enter rejection reason details:');
        if (reason === null) return;
        await apiClient.put(`/admin/providers/${id}/status`, { status: 'REJECTED', reason });
      } else if (action === 'suspend') {
        const reason = prompt('Enter suspension reason details:');
        if (reason === null) return;
        await apiClient.put(`/admin/providers/${id}/status`, { status: 'SUSPENDED', reason });
      } else if (action === 'activate') {
        const reason = prompt('Enter re-activation reason details:') || 'Account whitelisted by Admin';
        await apiClient.put(`/admin/providers/${id}/status`, { status: 'VERIFIED', reason });
      }
      setConfirmConfig(null);
      fetchProviders();
      onRefreshStats();
      if (selectedProvider && selectedProvider.id === id) {
        setSelectedProvider(null);
      }
    } catch (err) {
      alert('Action failed.');
    }
  };

  const handleExport = () => {
    const csvData = providers.map(p => ({
      ID: p.id,
      Name: p.name,
      BusinessName: p.businessName,
      Category: p.serviceCategory,
      Phone: p.phone,
      Status: p.status,
      Rating: p.ratingCache
    }));
    exportToCSV(csvData, 'providers_list');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 min-w-[280px] items-center gap-3 relative">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, business, category, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs font-semibold bg-slate-50">
            {['ALL', 'PENDING_REVIEW', 'APPROVED', 'SUSPENDED', 'REJECTED'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 transition-all ${statusFilter === f ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* KYC / Applications Pending Banner */}
      {statusFilter === 'ALL' && providers.some(p => p.status === 'PENDING_REVIEW') && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex justify-between items-center gap-4 text-xs font-semibold text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
            <span>Identity applications are pending! There are providers waiting for KYC approvals.</span>
          </div>
          <button 
            onClick={() => setStatusFilter('PENDING_REVIEW')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-bold shrink-0 transition"
          >
            Filter Pending Reviews
          </button>
        </div>
      )}

      {/* Main Providers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-4">Provider Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Avg Rating</th>
                <th className="px-6 py-4">Total Jobs</th>
                <th className="px-6 py-4">Comm. Rate</th>
                <th className="px-6 py-4">KYC Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {providers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/20">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{p.businessName}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.name} • {p.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{p.serviceCategory}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-amber-500">{(p.ratingCache ?? 5.0).toFixed(1)} ★</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{p.totalJobs} jobs</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{p.commissionPercentage ?? 10}%</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      p.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      p.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                      p.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 shrink-0">
                    <button
                      onClick={() => onSelectProvider ? onSelectProvider(p.id) : loadProviderDetails(p)}
                      className="px-2.5 py-1 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Profile
                    </button>
                    {p.status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => setConfirmConfig({
                            id: p.id,
                            action: 'approve',
                            message: `Approve the provider registry of ${p.businessName} and make them eligible to receive booking dispatches?`
                          })}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setConfirmConfig({
                            id: p.id,
                            action: 'reject',
                            message: `Reject the registration request of ${p.businessName}?`
                          })}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === 'APPROVED' && (
                      <button
                        onClick={() => setConfirmConfig({
                          id: p.id,
                          action: 'suspend',
                          message: `Suspend the account of provider ${p.businessName}? This prevents them from accessing jobs.`
                        })}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition"
                      >
                        Suspend
                      </button>
                    )}
                    {p.status === 'SUSPENDED' && (
                      <button
                        onClick={() => setConfirmConfig({
                          id: p.id,
                          action: 'activate',
                          message: `Re-activate and whitelist the account of provider ${p.businessName}?`
                        })}
                        className="px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold transition"
                      >
                        Re-activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {providers.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs italic">
                    No providers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>Showing {providers.length} of {totalElements} providers</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PROVIDER DETAILS MODAL */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] relative animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-slate-900 text-lg">{selectedProvider.businessName}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedProvider.status === 'APPROVED' || selectedProvider.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' :
                    selectedProvider.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700 animate-pulse' :
                    selectedProvider.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'
                  }`}>{selectedProvider.status}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Provider ID #{selectedProvider.id} • Category: {selectedProvider.serviceCategory} • Experience: {selectedProvider.experienceYears} Years</p>
              </div>
              <button 
                onClick={() => setSelectedProvider(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Detail Navigation Tabs */}
            <div className="flex border-b border-slate-100 text-xs font-bold text-slate-400 mt-2 bg-slate-50/50 p-1 rounded-lg">
              {[
                { id: 'info', label: 'Profile Details' },
                { id: 'kyc', label: 'KYC & Documents' },
                { id: 'wallet', label: 'Wallet & Ledger' },
                { id: 'strikes', label: 'Rule Strikes' },
                { id: 'bookings', label: 'Bookings' },
                { id: 'complaints', label: 'Disputes' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedDetailTab(t.id)}
                  className={`flex-1 py-2 text-center rounded-md transition ${selectedDetailTab === t.id ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-700'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-slate-700 text-xs">
              {detailLoading ? (
                <div className="text-center py-20 text-slate-400">Loading details...</div>
              ) : (
                <>
                  {/* TAB 1: PROFILE DETAILS & HEALTH METRICS */}
                  {selectedDetailTab === 'info' && (
                    <div className="space-y-6">
                      {/* Operational Performance Health Indicators */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase">Completion Rate</span>
                          <p className="text-xl font-bold mt-1 text-slate-800">{selectedProvider.completionRate ?? 100}%</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase">Cancellation Rate</span>
                          <p className="text-xl font-bold mt-1 text-slate-800">{selectedProvider.cancellationRate ?? 0}%</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase">Acceptance Rate</span>
                          <p className="text-xl font-bold mt-1 text-slate-800">{selectedProvider.acceptanceRate ?? 100}%</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase">Response Time</span>
                          <p className="text-xl font-bold mt-1 text-slate-800">{selectedProvider.responseTimeMin ?? 15} min</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Owner Contact Info</span>
                          <p><span className="font-bold text-slate-500">Contact Person:</span> {selectedProvider.name}</p>
                          <p><span className="font-bold text-slate-500">Phone:</span> {selectedProvider.phone}</p>
                          <p><span className="font-bold text-slate-500">Email:</span> {selectedProvider.email || 'N/A'}</p>
                          <p><span className="font-bold text-slate-500">Skills:</span> {selectedProvider.skills || 'N/A'}</p>
                          <p><span className="font-bold text-slate-500">Bank Details:</span> {selectedProvider.bankDetails || 'N/A'}</p>
                        </div>

                        {/* Commission & Area configurations */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Platform Rules Config</span>
                          
                          <form onSubmit={handleUpdateCommission} className="space-y-2">
                            <label className="block text-slate-500 font-semibold">Base Commission Rate (%)</label>
                            <div className="flex gap-2">
                              <input 
                                type="number"
                                required
                                value={commissionVal}
                                onChange={e => setCommissionVal(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-center font-bold"
                              />
                              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg">Save</button>
                            </div>
                          </form>

                          <form onSubmit={handleUpdateArea} className="space-y-2">
                            <label className="block text-slate-500 font-semibold">Service Coverage Address</label>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                required
                                value={addressVal}
                                onChange={e => setAddressVal(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg"
                              />
                              <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg">Save</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: KYC & DOCUMENTS VERIFICATION */}
                  {selectedDetailTab === 'kyc' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">KYC Documents</span>
                        <div className="space-y-3">
                          {selectedProvider.citizenFileUrl ? (
                            <a href={selectedProvider.citizenFileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 font-bold transition">
                              <span className="flex items-center gap-1.5"><FileText className="h-4.5 w-4.5 text-blue-600" /> Citizenship Card</span>
                              <Eye className="h-4 w-4 text-slate-400" />
                            </a>
                          ) : <div className="text-slate-400 italic">No Citizenship card uploaded</div>}

                          {selectedProvider.panFileUrl ? (
                            <a href={selectedProvider.panFileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 font-bold transition">
                              <span className="flex items-center gap-1.5"><FileText className="h-4.5 w-4.5 text-indigo-600" /> PAN Document</span>
                              <Eye className="h-4 w-4 text-slate-400" />
                            </a>
                          ) : <div className="text-slate-400 italic">No PAN document uploaded</div>}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Account Status & KYC Actions</span>
                        <div className="space-y-4">
                          <p className="text-slate-500">Perform verified whitelisting, request re-upload of citizenship cards, or suspend account access rules.</p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <button 
                              onClick={() => handleUpdateProviderStatus('VERIFIED')} 
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition"
                            >
                              Verify & Whitelist
                            </button>
                            <button 
                              onClick={() => handleUpdateProviderStatus('NEED_REUPLOAD')} 
                              className="px-4 py-2 bg-amber-50 hover:bg-amber-600 text-white rounded-xl font-bold transition"
                            >
                              Request Doc Reupload
                            </button>
                            <button 
                              onClick={() => handleUpdateProviderStatus('REJECTED')} 
                              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold transition"
                            >
                              Reject Registry
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FINANCIAL LEDGER & WALLET */}
                  {selectedDetailTab === 'wallet' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase">Wallet Ledger Balance</span>
                            <p className="text-2xl font-black text-slate-900 mt-1">Rs. {wallet?.balance ?? 0.0}</p>
                          </div>
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold font-mono">
                            {wallet?.currency ?? 'NPR'}
                          </span>
                        </div>

                        {/* Adjust balance form */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Debit/Credit Manual Adjustment</span>
                          <form onSubmit={handleAdjustWallet} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-500 font-semibold mb-1">Adjustment Type</label>
                                <select 
                                  value={walletAdjustType} 
                                  onChange={e => setWalletAdjustType(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-bold"
                                >
                                  <option value="CREDIT">Credit (Add balance)</option>
                                  <option value="DEBIT">Debit (Subtract balance)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-slate-500 font-semibold mb-1">Amount (Rs.)</label>
                                <input 
                                  type="number" 
                                  required 
                                  min={0.01} 
                                  step={0.01}
                                  placeholder="0.00"
                                  value={walletAdjustAmt}
                                  onChange={e => setWalletAdjustAmt(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-bold"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-1">Audit description</label>
                              <input 
                                type="text" 
                                required 
                                placeholder="Notes for provider..."
                                value={walletAdjustDesc}
                                onChange={e => setWalletAdjustDesc(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl"
                              />
                            </div>
                            <button 
                              type="submit" 
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition"
                            >
                              Post Manual Adjustment
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Earnings/Transactions list */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-3">Earnings & Payments Ledger</span>
                        <div className="max-h-[300px] overflow-y-auto space-y-2.5">
                          {earnings.map((e, idx) => (
                            <div key={idx} className="p-3 border border-slate-150 rounded-xl bg-white text-xs font-semibold flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800">Transaction ID: {e.transactionId}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Booking #{e.bookingId} • Gross: Rs. {e.amount}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-emerald-600 block">Rs. {e.providerEarnings}</span>
                                <span className="text-[10px] text-rose-500 block">Fee: Rs. {e.commission}</span>
                              </div>
                            </div>
                          ))}
                          {earnings.length === 0 && (
                            <p className="text-slate-400 italic text-center py-4">No earnings ledger entries found.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: RULE STRIKES & SANCTIONS */}
                  {selectedDetailTab === 'strikes' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Rule Strikes Log</span>
                        <div className="max-h-[300px] overflow-y-auto space-y-3">
                          {strikes.map((s, idx) => (
                            <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-black">STRIKE #{s.strikeNumber}</span>
                                <span className="text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="font-bold text-slate-800 text-xs mt-1">{s.reason}</p>
                              {s.internalNotes && <p className="text-[10px] text-slate-500">Internal notes: {s.internalNotes}</p>}
                              <p className="text-[10px] text-slate-400 mt-1">Issued by: {s.createdBy}</p>
                            </div>
                          ))}
                          {strikes.length === 0 && (
                            <p className="text-slate-400 italic text-center py-6">No rule violation strikes active for this provider.</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Issue Warning Strike</span>
                        <form onSubmit={handleAddStrike} className="space-y-3">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Violation Reason</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. No-show without customer consent"
                              value={strikeReason}
                              onChange={e => setStrikeReason(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Internal Notes</label>
                            <textarea 
                              placeholder="Describe context details..."
                              value={strikeNotes}
                              onChange={e => setStrikeNotes(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl h-20"
                            />
                          </div>
                          <button 
                            type="submit" 
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl transition inline-flex items-center gap-1.5"
                          >
                            <ShieldAlert className="h-4 w-4" /> Issue Rule Strike
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: ASSIGNED BOOKINGS & INCENTIVES */}
                  {selectedDetailTab === 'bookings' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-3">Bookings Assigned</span>
                        <div className="max-h-[300px] overflow-y-auto space-y-2.5">
                          {bookings.map((b) => (
                            <div key={b.id} className="p-3 border border-slate-150 rounded-xl bg-white flex justify-between items-start text-xs font-semibold">
                              <div>
                                <span className="font-bold text-slate-800">Booking #{b.id} - {b.serviceName}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Time: {new Date(b.scheduledAt).toLocaleString()}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold block text-slate-800">Rs. {b.totalBill}</span>
                                <span className="text-[10px] text-slate-500 uppercase block mt-0.5">{b.status}</span>
                              </div>
                            </div>
                          ))}
                          {bookings.length === 0 && (
                            <p className="text-slate-400 italic text-center py-6">No bookings assigned yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Cash incentives */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Award Performance Incentive</span>
                        <form onSubmit={handleAwardBonus} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-500 font-semibold mb-1">Amount (Rs.)</label>
                              <input
                                type="number"
                                required
                                min={1}
                                placeholder="e.g. 500"
                                value={incentiveAmt}
                                onChange={e => setIncentiveAmt(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-semibold mb-1">Reason Code</label>
                              <select
                                value={incentiveReason}
                                onChange={e => setIncentiveReason(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl font-bold"
                              >
                                <option value="SPECIAL_CAMPAIGN">Special Campaign</option>
                                <option value="GOOD_BEHAVIOR_BONUS">Good Behavior Bonus</option>
                                <option value="COMPENSATION">Compensation</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Detailed Description</label>
                            <input
                              type="text"
                              required
                              placeholder="Reason details for logs..."
                              value={incentiveDesc}
                              onChange={e => setIncentiveDesc(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl"
                            />
                          </div>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition inline-flex items-center gap-1.5"
                          >
                            <DollarSign className="h-4 w-4" /> Issue Cash Bonus
                          </button>
                        </form>

                        {/* Incentives history */}
                        <div className="max-h-36 overflow-y-auto space-y-2 pt-2 border-t border-slate-200 mt-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Award History</h4>
                          {incentives.map((i, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] pb-1 border-b border-slate-100 last:border-0">
                              <div>
                                <span className="font-bold text-slate-700 block">{i.reason} • {i.description}</span>
                                <span className="text-slate-400 block">{new Date(i.createdAt).toLocaleDateString()}</span>
                              </div>
                              <span className="font-mono font-bold text-emerald-600 shrink-0">Rs. {i.amount} ({i.status})</span>
                            </div>
                          ))}
                          {incentives.length === 0 && (
                            <p className="text-slate-400 italic text-center py-2 text-[10px]">No incentives awarded yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: DISPUTES & COMPLAINTS */}
                  {selectedDetailTab === 'complaints' && (
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-3">Complaints Filed Against Provider</span>
                      <div className="max-h-[300px] overflow-y-auto space-y-2.5">
                        {complaints.map((c) => (
                          <div key={c.id} className="p-3 border border-slate-150 rounded-xl bg-white text-xs font-semibold flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800">Dispute #{c.id} - {c.subject}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{c.description}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-rose-600">{c.status}</span>
                          </div>
                        ))}
                        {complaints.length === 0 && (
                          <p className="text-slate-400 italic text-center py-4">No complaints filed.</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center animate-scale-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">Are you sure?</h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">{confirmConfig.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmConfig(null)}
                className="flex-1 font-bold py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="flex-1 font-bold py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
