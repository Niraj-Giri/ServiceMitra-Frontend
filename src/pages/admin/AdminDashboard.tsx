import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { BadgeCheck, BriefcaseBusiness, CircleDollarSign, RefreshCw, UsersRound } from 'lucide-react';

interface PendingProvider {
  id: number;
  businessName: string;
  phone: string;
  email: string;
  serviceCategory: string;
  address: string;
  profilePhotoUrl: string;
  citizenFileUrl: string;
  status: string;
}

interface AnalyticsSummary {
  totalProviders: number;
  approvedProviders: number;
  pendingProviderReviews: number;
  totalCustomers: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
}

export const AdminDashboard: React.FC = () => {
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPendingProviders = async () => {
    try {
      const response = await apiClient.get('/admin/providers/pending');
      setPendingProviders(response.data);
    } catch (err) {
      console.error('Failed to fetch pending providers', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.get('/admin/analytics/summary');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics summary', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchPendingProviders(), fetchAnalytics()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (providerId: number, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? prompt('Enter reason for rejection:') : null;
    if (action === 'reject' && reason === null) return; // user cancelled prompt

    try {
      await apiClient.put(`/admin/providers/${providerId}/${action}`, {
        reason: reason || 'Rejected by administrator'
      });
      loadData();
    } catch (err) {
      console.error(`Failed to ${action} provider`, err);
      alert(`Failed to ${action} provider. Check console for details.`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="glass-panel flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Admin</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Control Panel</h1>
          <p className="text-slate-500 mt-2">Manage providers, approvals, platform activity, and payouts.</p>
        </div>
        <Button onClick={loadData} variant="secondary" className="gap-2 text-sm">
          <RefreshCw className="h-4 w-4" />
          Refresh Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="service-card rounded-2xl p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <UsersRound className="h-6 w-6" />
          </div>
          <div className="text-sm text-slate-500 font-semibold mb-1">Total Users</div>
          <div className="text-3xl font-extrabold text-slate-950">{analytics?.totalCustomers ?? 0}</div>
        </div>
        <div className="service-card rounded-2xl p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <div className="text-sm text-slate-500 font-semibold mb-1">Total Providers</div>
          <div className="text-3xl font-extrabold text-slate-950">{analytics?.totalProviders ?? 0}</div>
        </div>
        <div className="service-card rounded-2xl p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <div className="text-sm text-slate-500 font-semibold mb-1">Pending/Active Bookings</div>
          <div className="text-3xl font-extrabold text-slate-950">
            {(analytics?.pendingBookings ?? 0) + (analytics?.totalBookings ?? 0) - (analytics?.completedBookings ?? 0)}
          </div>
        </div>
        <div className="service-card rounded-2xl p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CircleDollarSign className="h-6 w-6" />
          </div>
          <div className="text-sm text-slate-500 font-semibold mb-1">Total Revenue (Fees)</div>
          <div className="text-3xl font-extrabold text-blue-600">Rs. {analytics?.totalRevenue ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-extrabold text-slate-950">Pending KYC Approvals</h2>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
              {pendingProviders.length} Pending
            </span>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading pending requests...</div>
          ) : pendingProviders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-10 text-center text-sm text-slate-500">
              No pending KYC requests.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProviders.map(provider => (
                <div key={provider.id} className="service-card rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-extrabold text-slate-950">{provider.businessName}</h3>
                      <p className="text-sm text-slate-500 font-medium">{provider.serviceCategory}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">
                      PENDING_REVIEW
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-1 mb-4">
                    <p><span className="font-semibold text-slate-400">Phone:</span> {provider.phone}</p>
                    <p><span className="font-semibold text-slate-400">Email:</span> {provider.email}</p>
                    <p><span className="font-semibold text-slate-400">Address:</span> {provider.address}</p>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    {provider.profilePhotoUrl && (
                      <a 
                        href={provider.profilePhotoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                      >
                        View Profile Photo
                      </a>
                    )}
                    {provider.citizenFileUrl && (
                      <a 
                        href={provider.citizenFileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                      >
                        View Citizenship Document
                      </a>
                    )}
                  </div>
                  
                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    <Button 
                      onClick={() => handleAction(provider.id, 'approve')} 
                      className="flex-1 py-1.5 text-sm"
                    >
                      Approve
                    </Button>
                    <button 
                      onClick={() => handleAction(provider.id, 'reject')} 
                      className="focus-ring flex-1 rounded-xl bg-red-50 py-1.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="glass-panel h-fit rounded-2xl p-6">
          <h2 className="text-xl font-extrabold text-slate-950 mb-4">Pending Payouts</h2>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-10 text-center text-sm text-slate-500">
            No pending payout requests.
          </div>
        </div>
      </div>
    </div>
  );
};
