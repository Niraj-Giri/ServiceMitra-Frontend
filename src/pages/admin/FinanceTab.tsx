import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  DollarSign, CheckCircle2, Landmark, ArrowUpRight
} from 'lucide-react';

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

interface PayoutRequest {
  id: number;
  providerId: number;
  amount: number;
  bankDetails: string;
  status: string; // PENDING, RELEASED, HELD
  createdAt: string;
}

interface FinanceTabProps {
  onSelectPayout?: (id: number) => void;
  onSelectBooking?: (id: number) => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({ onSelectPayout, onSelectBooking }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Financial statistics calculated from ledgers
  const [stats, setStats] = useState({
    grossVolume: 0,
    netRevenue: 0,
    completedCount: 0,
    pendingPayouts: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resT, resP] = await Promise.all([
        apiClient.get('/admin/payments/transactions'),
        apiClient.get('/admin/payments/payouts')
      ]);

      const txs: Transaction[] = resT.data || [];
      const pays: PayoutRequest[] = resP.data || [];

      setTransactions(txs);
      setPayouts(pays);

      // Compute statistics
      const gross = txs.reduce((sum, t) => sum + t.amount, 0);
      const comm = txs.reduce((sum, t) => sum + t.commission, 0);
      const activePendingPays = pays
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({
        grossVolume: gross,
        netRevenue: comm,
        completedCount: txs.filter(t => t.status === 'RELEASED').length,
        pendingPayouts: activePendingPays
      });
    } catch (err) {
      console.error('Failed to load finance logs', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReleasePayout = async (id: number) => {
    if (!confirm(`Are you sure you want to release funds for Payout Request #${id}?`)) return;
    try {
      await apiClient.put(`/admin/payments/payouts/${id}/release`);
      alert('Payout released successfully');
      fetchData();
    } catch (err) {
      alert('Failed to release payout');
    }
  };

  const handleHoldPayout = async (id: number) => {
    if (!confirm(`Are you sure you want to place a hold on Payout Request #${id}?`)) return;
    try {
      await apiClient.put(`/admin/payments/payouts/${id}/hold`);
      alert('Payout held successfully');
      fetchData();
    } catch (err) {
      alert('Failed to hold payout');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading financial records...</div>;
  }

  // Filter refunded transactions
  const refundedTransactions = transactions.filter(t => t.status === 'REFUNDED');

  return (
    <div className="space-y-6 animate-fade-in text-xs text-slate-700 font-semibold">
      
      {/* Financial statistics summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Gross Transaction Volume</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowUpRight className="h-4.5 w-4.5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mt-2 text-slate-900">Rs. {stats.grossVolume}</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Platform Net Revenue</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mt-2 text-slate-900">Rs. {stats.netRevenue}</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Cleared Bookings Count</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mt-2 text-slate-900">{stats.completedCount} bookings</h3>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pending Payout Releases</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Landmark className="h-4.5 w-4.5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mt-2 text-slate-900">Rs. {stats.pendingPayouts}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payout requests management */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Provider Payout Requests</h3>
          <div className="max-h-96 overflow-y-auto space-y-3.5">
            {payouts.map((p) => (
              <div key={p.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs font-semibold">
                <div className="space-y-1">
                  <span 
                    onClick={() => onSelectPayout && onSelectPayout(p.id)}
                    className={`font-bold text-slate-800 block ${onSelectPayout ? 'cursor-pointer hover:text-blue-650 hover:underline' : ''}`}
                  >
                    Payout ID #{p.id} • Provider #{p.providerId}
                  </span>
                  <span className="text-slate-400 block font-mono text-[10px]">{p.bankDetails}</span>
                  <span className="text-[10px] text-slate-500 block">Requested: {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="text-right space-y-2">
                  <span className="font-bold text-slate-800 block">Rs. {p.amount}</span>
                  
                  {p.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReleasePayout(p.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] transition"
                      >
                        Release
                      </button>
                      <button
                        onClick={() => handleHoldPayout(p.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-1 px-2.5 rounded-lg text-[10px] transition"
                      >
                        Hold
                      </button>
                    </div>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border block text-center ${
                      p.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {p.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {payouts.length === 0 && (
              <div className="text-slate-400 italic text-center py-10">No payout requests recorded.</div>
            )}
          </div>
        </div>

        {/* Transactions list ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">General Payments Transactions Ledger</h3>
          <div className="max-h-96 overflow-y-auto space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center text-xs font-semibold">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 block">Tx ID: {t.transactionId}</span>
                  <span className="text-slate-400 block text-[10px]">
                    Booking{' '}
                    <span 
                      onClick={() => onSelectBooking && onSelectBooking(t.bookingId)}
                      className={`font-bold ${onSelectBooking ? 'cursor-pointer text-blue-600 hover:underline' : 'text-slate-650'}`}
                    >
                      #{t.bookingId}
                    </span>
                    {' '}• Cust #{t.customerId} → Prov #{t.providerId}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Settled: {new Date(t.createdAt).toLocaleString()}</span>
                </div>
                
                <div className="text-right">
                  <span className="font-bold text-slate-800 block">Rs. {t.amount}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Fee: Rs. {t.commission}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border inline-block mt-1 ${
                    t.status === 'REFUNDED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-slate-400 italic text-center py-10">No transactions settled yet.</div>
            )}
          </div>
        </div>

      </div>

      {/* Refunds History registry log */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Refunds History log</h3>
        <div className="max-h-60 overflow-y-auto space-y-2.5">
          {refundedTransactions.map((t) => (
            <div key={t.id} className="p-3 border border-rose-100 rounded-xl bg-rose-50/20 flex justify-between items-center text-xs font-semibold">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 block">Refund Trans ID: {t.transactionId}</span>
                <span 
                  onClick={() => onSelectBooking && onSelectBooking(t.bookingId)}
                  className={`text-[10px] text-rose-600 block ${onSelectBooking ? 'cursor-pointer hover:underline font-bold' : ''}`}
                >
                  Refund Issued for Booking #{t.bookingId}
                </span>
                <span className="text-[10px] text-slate-400 block">Settled: {new Date(t.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-right font-mono font-bold text-rose-600">
                -Rs. {t.amount}
              </div>
            </div>
          ))}
          {refundedTransactions.length === 0 && (
            <div className="text-slate-400 italic text-center py-6">No refunds processed.</div>
          )}
        </div>
      </div>

    </div>
  );
};
