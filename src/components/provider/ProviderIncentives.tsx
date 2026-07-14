import React from 'react';

interface IncentivesData {
  totalEarnedIncentives: number;
  pendingPayoutIncentives: number;
  incentives: any[];
}

interface ProviderIncentivesProps {
  incentivesData: IncentivesData;
  totalJobs: number;
}

export const ProviderIncentives: React.FC<ProviderIncentivesProps> = ({
  incentivesData,
  totalJobs,
}) => {
  const currentCycle = totalJobs % 5;
  const needed = 5 - currentCycle;
  const percent = (currentCycle / 5) * 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 border-b pb-4">Milestones & Cash Incentives</h3>

      {/* Incentives Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Earned Bonuses</span>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            Rs. {Number(incentivesData.totalEarnedIncentives).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Milestone awards & promotional bonuses</span>
        </div>

        <div className="bg-blue-50/40 border border-blue-100 p-5 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Pending Release Payout</span>
          <div className="text-2xl font-black text-blue-600 font-mono">
            Rs. {Number(incentivesData.pendingPayoutIncentives).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">To be released with the next payout batch</span>
        </div>
      </div>

      {/* Milestone Progress Bar */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm">Completed Jobs Milestone Tracker</h4>
          <p className="text-xs text-slate-500 mt-1">
            Earn Rs. 500.00 cash bonus for every 5 completed jobs!
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600">Milestone Progress: {currentCycle}/5 jobs</span>
            <span className="text-blue-600">{needed} more jobs to unlock Rs. 500 bonus!</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Incentives Ledger List */}
      <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
        <h4 className="font-extrabold text-slate-900 text-sm mb-4">Incentives Payout Ledger</h4>
        
        {!incentivesData.incentives || incentivesData.incentives.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs italic">
            No milestone bonuses or incentives recorded yet. Complete jobs to start earning!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Bonus Type</th>
                  <th className="pb-3 font-semibold">Earned Date</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {incentivesData.incentives.map((inc: any) => (
                  <tr key={inc.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="py-3 font-bold text-slate-800">
                      <div>{inc.description}</div>
                      {inc.bookingId && <div className="text-[10px] text-slate-400 font-normal">Linked to Booking #{inc.bookingId}</div>}
                    </td>
                    <td className="py-3 text-slate-500 font-semibold">{new Date(inc.createdAt).toLocaleString()}</td>
                    <td className="py-3 font-bold text-slate-800">Rs. {Number(inc.amount).toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase tracking-wider ${
                        inc.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.status === 'PAID' ? 'Released' : 'Pending Payout'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
