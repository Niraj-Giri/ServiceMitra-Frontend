import React, { useState } from 'react';
import { ComplaintTab } from './ComplaintTab';
import { ReviewsTab } from './ReviewsTab';
import { AlertTriangle, Star } from 'lucide-react';

interface TicketsSectionProps {
  onSelectComplaint?: (id: number) => void;
  onSelectCustomer?: (id: number) => void;
  onSelectProvider?: (id: number) => void;
}

export const TicketsSection: React.FC<TicketsSectionProps> = ({
  onSelectComplaint,
  onSelectCustomer,
  onSelectProvider
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'complaints' | 'reviews'>('complaints');

  return (
    <div className="space-y-6">
      {/* Premium Inner Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-xs max-w-md">
        <button
          onClick={() => setActiveSubTab('complaints')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'complaints'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Disputes & Complaints
        </button>
        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'reviews'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Star className="h-4 w-4" />
          Reviews Moderation
        </button>
      </div>

      {/* Tab Contents */}
      <div className="animate-fade-in">
        {activeSubTab === 'complaints' ? (
          <ComplaintTab
            onSelectComplaint={onSelectComplaint}
            onSelectCustomer={onSelectCustomer}
            onSelectProvider={onSelectProvider}
          />
        ) : (
          <ReviewsTab
            onSelectCustomer={onSelectCustomer}
            onSelectProvider={onSelectProvider}
          />
        )}
      </div>
    </div>
  );
};
