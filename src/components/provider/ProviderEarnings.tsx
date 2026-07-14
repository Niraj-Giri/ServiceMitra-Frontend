import React from 'react';
import { TrendingUp, Award, Briefcase, Filter } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import type { Booking } from '../../types';

type EarningsFilter = 'ALL' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH';

interface ProviderEarningsProps {
  completedJobs: Booking[];
  earningsFilter: EarningsFilter;
  onSetEarningsFilter: (filter: EarningsFilter) => void;
}

export const ProviderEarnings: React.FC<ProviderEarningsProps> = ({
  completedJobs,
  earningsFilter,
  onSetEarningsFilter,
}) => {
  // Filtered earnings list & metrics calculation
  const getFilteredBookings = () => {
    const now = new Date();
    return completedJobs.filter(b => {
      const jobDate = new Date(b.scheduledAt);
      if (earningsFilter === '7_DAYS') {
        const diffTime = Math.abs(now.getTime() - jobDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (earningsFilter === '30_DAYS') {
        const diffTime = Math.abs(now.getTime() - jobDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
      if (earningsFilter === 'THIS_MONTH') {
        return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
      }
      return true; // ALL
    });
  };

  const filteredBookings = getFilteredBookings();

  const filteredTotalEarnings = filteredBookings.reduce((sum, b) => {
    const amt = b.amountNpr || b.baseAmount || 0;
    return sum + (amt * 0.90);
  }, 0);

  const getHighestEarningInADay = () => {
    const dailyEarnings: Record<string, number> = {};
    filteredBookings.forEach(b => {
      const dateStr = new Date(b.scheduledAt).toISOString().split('T')[0];
      const amt = (b.amountNpr || b.baseAmount || 0) * 0.90;
      dailyEarnings[dateStr] = (dailyEarnings[dateStr] || 0) + amt;
    });
    const values = Object.values(dailyEarnings);
    return values.length > 0 ? Math.max(...values) : 0;
  };

  const highestEarningInADay = getHighestEarningInADay();

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySums = Array(12).fill(0);
    
    completedJobs.forEach(b => {
      const d = new Date(b.scheduledAt);
      const monthIdx = d.getMonth();
      const amt = (b.amountNpr || b.baseAmount || 0) * 0.90;
      monthlySums[monthIdx] += amt;
    });
    
    return months.map((month, idx) => ({
      name: month,
      amount: monthlySums[idx]
    })).filter(m => m.amount > 0 || new Date().getMonth() >= months.indexOf(m.name));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-4">Earnings & Stats</h3>
      
      {/* Earnings Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50/40 border border-blue-100 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Earnings</span>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            Rs. {filteredTotalEarnings.toFixed(2)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 block mt-1">90% of total revenue after fees</span>
        </div>

        <div className="bg-orange-50/40 border border-orange-100 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest in a Day</span>
            <Award className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            Rs. {highestEarningInADay.toFixed(2)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 block mt-1">Peak daily performance</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Jobs Fulfilled</span>
            <Briefcase className="h-5 w-5 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {filteredBookings.length}
          </div>
          <span className="text-[10px] font-bold text-slate-400 block mt-1">In selected period</span>
        </div>
      </div>

      {/* Filter Period Box */}
      <div className="flex justify-between items-center mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2 text-slate-700 font-extrabold text-sm">
          <Filter className="h-4 w-4 text-blue-600" /> Filter Period:
        </div>
        <select
          value={earningsFilter}
          onChange={e => onSetEarningsFilter(e.target.value as EarningsFilter)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All Time</option>
          <option value="7_DAYS">Last 7 Days</option>
          <option value="30_DAYS">Last 30 Days</option>
          <option value="THIS_MONTH">This Month</option>
        </select>
      </div>

      {/* Recharts Trend Area Chart */}
      <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl mb-8">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Monthly Earnings Trend</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getMonthlyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }} 
                formatter={(value) => [`Rs. ${Number(value).toFixed(2)}`, 'Earnings']}
              />
              <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Earning Transactions Table List */}
      <h4 className="text-sm font-extrabold text-slate-900 mb-4">Earnings History</h4>
      {filteredBookings.length === 0 ? (
        <div className="text-slate-400 text-xs italic py-6">No completed earnings found in this period.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Job ID</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Gross Bill</th>
                <th className="pb-3 font-semibold">Platform Fee (10%)</th>
                <th className="pb-3 font-semibold text-right">Net Earning</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => {
                const baseAmt = b.amountNpr || b.baseAmount || b.totalBill || 0;
                const fee = baseAmt * 0.10;
                const net = baseAmt * 0.90;
                return (
                  <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="py-3 font-bold text-slate-800">#{b.id} - {b.serviceName}</td>
                    <td className="py-3 text-slate-600 font-semibold">{b.user?.name || 'Customer'}</td>
                    <td className="py-3 text-slate-400 font-semibold">{new Date(b.scheduledAt).toLocaleDateString()}</td>
                    <td className="py-3 text-slate-500 font-bold">Rs. {baseAmt.toFixed(2)}</td>
                    <td className="py-3 text-red-500 font-semibold">Rs. {fee.toFixed(2)}</td>
                    <td className="py-3 font-bold text-emerald-600 text-right">Rs. {net.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
