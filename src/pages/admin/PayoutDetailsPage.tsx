import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  ArrowLeft, Landmark, Loader2, ShieldCheck, ShieldAlert
} from 'lucide-react';

interface PayoutDetailsPageProps {
  payoutId: number;
  onBack: () => void;
  onRefreshStats?: () => void;
}

export const PayoutDetailsPage: React.FC<PayoutDetailsPageProps> = ({ payoutId, onBack, onRefreshStats }) => {
  const [payout, setPayout] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const payRes = await apiClient.get(`/admin/payments/payouts/${payoutId}`);
      const p = payRes.data?.data || payRes.data;
      setPayout(p);

      if (p.providerId) {
        const provRes = await apiClient.get(`/admin/providers/${p.providerId}`);
        setProvider(provRes.data?.data || provRes.data);
      }
    } catch (err) {
      console.error('Failed to load payout details', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [payoutId]);

  const handleReleasePayout = async () => {
    if (!confirm(`Are you sure you want to release funds for Payout Request #${payoutId}?`)) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/payments/payouts/${payoutId}/release`);
      alert('Payout released successfully');
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch {
      alert('Failed to release payout');
    }
    setActionLoading(false);
  };

  const handleHoldPayout = async () => {
    if (!confirm(`Are you sure you want to place a hold on Payout Request #${payoutId}?`)) return;
    setActionLoading(true);
    try {
      await apiClient.put(`/admin/payments/payouts/${payoutId}/hold`);
      alert('Payout placed on hold successfully');
      loadAllData();
      if (onRefreshStats) onRefreshStats();
    } catch {
      alert('Failed to hold payout');
    }
    setActionLoading(false);
  };

  if (loading || !payout) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 text-xs text-slate-700 font-semibold">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Payout Request #{payout.id}</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Requested: {new Date(payout.createdAt).toLocaleString()}</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
          payout.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          payout.status === 'HELD' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
        }`}>
          {payout.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core payout card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4 md:col-span-2">
          <div className="flex justify-between items-baseline border-b pb-3 mb-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Requested Transfer Amount</span>
            <span className="font-mono text-2xl font-black text-slate-900">₹{Number(payout.amount).toLocaleString()}</span>
          </div>

          {provider ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-slate-400 font-bold block mb-1">Provider ID</span>
                <span className="font-bold text-slate-800">#{provider.id}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Business Name</span>
                <span className="font-bold text-slate-800">{provider.businessName || provider.name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Email / Contact</span>
                <span className="text-slate-700">{provider.email || 'N/A'} · {provider.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Provider Rating</span>
                <span className="text-amber-500 font-bold">{provider.ratingCache} ★ ({provider.totalJobs} jobs)</span>
              </div>
              <div className="sm:col-span-2 bg-slate-50 border border-slate-150 p-3.5 rounded-xl">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5"><Landmark className="h-3.5 w-3.5 inline mr-1" />Bank Account Information</span>
                <p className="font-mono font-bold text-slate-850 break-all leading-normal">{provider.bankDetails || 'No bank information recorded.'}</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 italic">No provider details found for provider ID #{payout.providerId}</p>
          )}
        </div>

        {/* Action Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-center gap-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Payout Actions</h3>
          {payout.status === 'PENDING' ? (
            <>
              <button
                onClick={handleReleasePayout}
                disabled={actionLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="h-4.5 w-4.5" /> Release Funds
              </button>
              <button
                onClick={handleHoldPayout}
                disabled={actionLoading}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="h-4.5 w-4.5" /> Place on Hold
              </button>
            </>
          ) : (
            <div className="text-center py-4 bg-slate-50 border rounded-xl font-bold text-slate-500">
              This payout has already been processed: <span className="uppercase text-slate-800">{payout.status}</span>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
