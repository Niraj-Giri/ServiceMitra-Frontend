import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Search, ChevronLeft, ChevronRight, 
  Download, Trash2, ShieldAlert, Eye, X, PlusCircle
} from 'lucide-react';
import { exportToCSV } from './csvUtils';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  rewardPoints?: number;
  couponsDisabled?: boolean;
  rewardsDisabled?: boolean;
  bookingsLimited?: boolean;
}

interface CustomerTabProps {
  onRefreshStats: () => void;
  onSelectCustomer?: (id: number) => void;
}

export const CustomerTab: React.FC<CustomerTabProps> = ({ onRefreshStats, onSelectCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  // Selected details modal state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  // Points adjustment form
  const [pointsAmt, setPointsAmt] = useState('');
  const [pointsDesc, setPointsDesc] = useState('Manual adjustment by Admin');

  // Confirmation dialogs
  const [confirmConfig, setConfirmConfig] = useState<{
    id: number;
    action: 'suspend' | 'activate' | 'delete';
    message: string;
  } | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/customers', {
        params: {
          search,
          page,
          size,
          sortBy: 'id',
          sortDir: 'DESC'
        }
      });
      const data = response.data;
      // Filter by status on client-side if it's ALL vs ACTIVE vs SUSPENDED
      const content = data.content || [];
      const filtered = content.filter((c: Customer) => {
        if (statusFilter === 'ACTIVE') return c.isActive;
        if (statusFilter === 'SUSPENDED') return !c.isActive;
        return true;
      });
      setCustomers(filtered);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load customers', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, page]);

  const loadCustomerDetails = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setDetailLoading(true);
    try {
      const [resB, resL, resR, resC] = await Promise.all([
        apiClient.get(`/admin/customers/${cust.id}/bookings`),
        apiClient.get(`/admin/customers/${cust.id}/loyalty`),
        apiClient.get(`/admin/customers/${cust.id}/reviews`),
        apiClient.get(`/admin/customers/${cust.id}/complaints`)
      ]);
      setBookings(resB.data);
      setPointsHistory(resL.data.history || []);
      setPointsBalance(resL.data.pointsBalance || 0);
      setReviews(resR.data);
      setComplaints(resC.data);
    } catch (err) {
      console.error('Failed to load details', err);
    }
    setDetailLoading(false);
  };

  const handleTogglePermission = async (field: 'couponsDisabled' | 'rewardsDisabled' | 'bookingsLimited', currentVal: boolean) => {
    if (!selectedCustomer) return;
    const reason = prompt('Enter change reason for auditing logs:');
    if (reason === null || reason.trim() === '') {
      alert('Action cancelled: Audit log reason is required.');
      return;
    }
    try {
      const payload = {
        [field]: !currentVal,
        reason
      };
      const res = await apiClient.put(`/admin/customers/${selectedCustomer.id}/permissions`, payload);
      const updatedUser = res.data.data || res.data;
      setSelectedCustomer({
        ...selectedCustomer,
        couponsDisabled: updatedUser.couponsDisabled,
        rewardsDisabled: updatedUser.rewardsDisabled,
        bookingsLimited: updatedUser.bookingsLimited
      });
      fetchCustomers();
    } catch (err) {
      alert('Failed to update customer trust permissions');
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !pointsAmt.trim()) return;
    try {
      await apiClient.post(`/admin/customers/${selectedCustomer.id}/loyalty`, {
        points: parseInt(pointsAmt),
        actionType: 'COMPENSATION',
        description: pointsDesc
      });
      setPointsAmt('');
      setPointsDesc('Manual adjustment by Admin');
      // Reload details
      loadCustomerDetails(selectedCustomer);
      fetchCustomers();
      onRefreshStats();
    } catch (err) {
      alert('Failed to adjust reward points');
    }
  };

  const executeAction = async () => {
    if (!confirmConfig) return;
    const { id, action } = confirmConfig;
    try {
      if (action === 'suspend') {
        await apiClient.put(`/admin/customers/${id}/suspend`);
      } else if (action === 'activate') {
        await apiClient.put(`/admin/customers/${id}/activate`);
      } else if (action === 'delete') {
        await apiClient.delete(`/admin/customers/${id}`);
      }
      setConfirmConfig(null);
      fetchCustomers();
      onRefreshStats();
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer(null);
      }
    } catch (err) {
      alert(`Action failed.`);
    }
  };

  const handleExport = () => {
    const csvData = customers.map(c => ({
      ID: c.id,
      Name: c.name,
      Phone: c.phone,
      Email: c.email || 'N/A',
      Status: c.isActive ? 'Active' : 'Suspended'
    }));
    exportToCSV(csvData, 'customers_list');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 min-w-[280px] items-center gap-3 relative">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden text-xs font-semibold bg-slate-50">
            {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 transition-all ${statusFilter === f ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Export button */}
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Customers List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
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
                <tr key={c.id} className="hover:bg-slate-50/20 group">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">#{c.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{c.name}</td>
                  <td className="px-6 py-4 text-slate-600">{c.phone}</td>
                  <td className="px-6 py-4 text-slate-500">{c.email || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      c.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {c.isActive ? 'ACTIVE' : 'SUSPENDED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 shrink-0">
                    <button
                      onClick={() => onSelectCustomer ? onSelectCustomer(c.id) : loadCustomerDetails(c)}
                      className="px-2.5 py-1 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Profile
                    </button>
                    <button
                      onClick={() => setConfirmConfig({
                        id: c.id,
                        action: c.isActive ? 'suspend' : 'activate',
                        message: `Are you sure you want to ${c.isActive ? 'suspend' : 'reactivate'} the account of ${c.name}?`
                      })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        c.isActive 
                          ? 'text-rose-600 hover:bg-rose-50' 
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {c.isActive ? 'Suspend' : 'Reactivate'}
                    </button>
                    <button
                      onClick={() => setConfirmConfig({
                        id: c.id,
                        action: 'delete',
                        message: `Are you sure you want to soft delete the account of ${c.name}? This anonymizes their registry and prevents future logging.`
                      })}
                      className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 text-xs italic">
                    No customers found matching the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>Showing {customers.length} of {totalElements} customers</span>
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

      {/* CUSTOMER DETAILS MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] relative animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Customer Profile #{selectedCustomer.id} • Registered {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-slate-700 text-xs">
              {detailLoading ? (
                <div className="text-center py-20 text-slate-400">Loading profile data...</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Side: General Profile & Point Adjuster */}
                  <div className="space-y-6 lg:col-span-1">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Contact Details</span>
                      <p><span className="font-bold text-slate-500">Phone:</span> {selectedCustomer.phone}</p>
                      <p><span className="font-bold text-slate-500">Email:</span> {selectedCustomer.email || 'N/A'}</p>
                      <p><span className="font-bold text-slate-500">Status:</span> <span className={selectedCustomer.isActive ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{selectedCustomer.isActive ? 'Active' : 'Suspended'}</span></p>
                    </div>

                    {/* Customer Operations Trust Controls */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Trust & Coupon Controls</span>
                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!selectedCustomer.couponsDisabled} 
                            onChange={() => handleTogglePermission('couponsDisabled', !!selectedCustomer.couponsDisabled)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span>Disable Coupons</span>
                        </label>
                        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!selectedCustomer.rewardsDisabled} 
                            onChange={() => handleTogglePermission('rewardsDisabled', !!selectedCustomer.rewardsDisabled)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span>Lock Reward Points</span>
                        </label>
                        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!selectedCustomer.bookingsLimited} 
                            onChange={() => handleTogglePermission('bookingsLimited', !!selectedCustomer.bookingsLimited)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span>Limit Active Bookings</span>
                        </label>
                      </div>
                    </div>

                    {/* Reward point Adjuster */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5">Reward Points Ledger</span>
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-slate-500">Current Balance:</span>
                        <span className="font-mono text-base font-bold text-blue-600">{pointsBalance} pts</span>
                      </div>

                      <form onSubmit={handleAdjustPoints} className="space-y-3 pt-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <input
                              type="number"
                              placeholder="pts"
                              required
                              value={pointsAmt}
                              onChange={e => setPointsAmt(e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-center font-bold"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Reason code/memo"
                              required
                              value={pointsDesc}
                              onChange={e => setPointsDesc(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl transition flex items-center justify-center gap-1 text-[11px]"
                        >
                          <PlusCircle className="h-4.5 w-4.5" /> Adjust Balance
                        </button>
                      </form>

                      {/* Points history timeline list */}
                      <div className="max-h-36 overflow-y-auto space-y-2 pt-2 border-t border-slate-100">
                        {pointsHistory.map((h, idx) => (
                          <div key={idx} className="flex justify-between text-[10px] pb-1 border-b border-slate-100 last:border-0">
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

                  {/* Right Side: Bookings, Reviews, Complaints */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Bookings Portal */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-3">Booking History</span>
                      <div className="max-h-48 overflow-y-auto space-y-2.5">
                        {bookings.map((b) => (
                          <div key={b.id} className="p-3 border border-slate-100 rounded-xl bg-white flex justify-between items-start text-xs font-semibold">
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
                          <p className="text-slate-400 italic text-center py-6">No bookings ordered yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Reviews given list */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-3">Feedback & Reviews Given</span>
                      <div className="max-h-40 overflow-y-auto space-y-2.5">
                        {reviews.map((r) => (
                          <div key={r.id} className="p-3 border border-slate-100 rounded-xl bg-white text-xs font-semibold">
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-amber-500 font-extrabold">{r.rating} ★</span>
                              <span className="text-[10px] text-slate-400 font-medium">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-600 font-medium text-[11px] leading-relaxed">{r.comment || 'No comment provided.'}</p>
                          </div>
                        ))}
                        {reviews.length === 0 && (
                          <p className="text-slate-400 italic text-center py-4">No reviews submitted.</p>
                        )}
                      </div>
                    </div>

                    {/* Complaints filed list */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b pb-1.5 mb-3">Complaints Logs</span>
                      <div className="max-h-40 overflow-y-auto space-y-2.5">
                        {complaints.map((c) => (
                          <div key={c.id} className="p-3 border border-slate-100 rounded-xl bg-white text-xs font-semibold flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800">#{c.id} - {c.subject}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{c.description}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-rose-600">{c.status}</span>
                          </div>
                        ))}
                        {complaints.length === 0 && (
                          <p className="text-slate-400 italic text-center py-4">No complaints logged.</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center animate-scale-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">Destructive Confirmation</h3>
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
                className="flex-1 font-bold py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs transition"
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
