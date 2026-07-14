import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Search, Eye, EyeOff, Trash2, ShieldAlert,
  ChevronLeft, ChevronRight, Download, Star
} from 'lucide-react';
import { exportToCSV } from './csvUtils';

interface Review {
  id: number;
  rating: number;
  comment: string;
  isHidden: boolean;
  createdAt: string;
  customer: {
    id: number;
    name: string;
  };
  provider: {
    id: number;
    businessName: string;
  };
}

export const ReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  // Confirmation dialogs
  const [confirmConfig, setConfirmConfig] = useState<{
    id: number;
    action: () => Promise<void>;
    message: string;
  } | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/reviews', {
        params: {
          search,
          page,
          size
        }
      });
      const data = response.data;
      setReviews(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [search, page]);

  const handleToggleHide = async (r: Review) => {
    try {
      await apiClient.put(`/admin/reviews/${r.id}/hide`);
      fetchReviews();
    } catch (err) {
      alert('Failed to toggle review visibility');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmConfig({
      id,
      message: `Are you sure you want to PERMANENTLY delete review #${id}? This removes it from the database and recalculates provider metrics.`,
      action: async () => {
        try {
          await apiClient.delete(`/admin/reviews/${id}`);
          fetchReviews();
        } catch (err) {
          alert('Failed to delete review');
        }
      }
    });
  };

  const handleExport = () => {
    const csvData = reviews.map(r => ({
      ID: r.id,
      Customer: r.customer?.name,
      Provider: r.provider?.businessName,
      Rating: r.rating,
      Comment: r.comment,
      Visibility: r.isHidden ? 'Hidden' : 'Visible'
    }));
    exportToCSV(csvData, 'reviews_moderation_log');
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs text-slate-700 font-semibold">
      
      {/* Upper Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 min-w-[280px] items-center gap-3 relative">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews by comment, customer, provider..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Reviews Moderation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Provider Recipient</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Review Comment</th>
                <th className="px-6 py-4">Visibility</th>
                <th className="px-6 py-4 text-right">Moderator Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold">
              {reviews.map((r) => (
                <tr key={r.id} className={`hover:bg-slate-50/20 ${r.isHidden ? 'opacity-60 bg-slate-50/50' : ''}`}>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">#{r.id}</td>
                  <td className="px-6 py-4 text-slate-800">{r.customer?.name}</td>
                  <td className="px-6 py-4 text-slate-800">{r.provider?.businessName}</td>
                  <td className="px-6 py-4 font-bold text-amber-500">
                    <span className="flex items-center gap-0.5">{r.rating} <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" /></span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-sm truncate font-medium text-[11px] leading-relaxed">{r.comment || <span className="text-slate-350 italic">No comment</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      r.isHidden 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {r.isHidden ? 'HIDDEN' : 'VISIBLE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 shrink-0">
                    <button
                      onClick={() => handleToggleHide(r)}
                      className="px-2.5 py-1 hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                    >
                      {r.isHidden ? (
                        <><Eye className="h-3.5 w-3.5 text-emerald-600" /> Whitelist</>
                      ) : (
                        <><EyeOff className="h-3.5 w-3.5 text-rose-600" /> Hide Abusive</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Spam
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs italic">
                    No reviews logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>Showing {reviews.length} of {totalElements} reviews</span>
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

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center animate-scale-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">Delete Confirmation</h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">{confirmConfig.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmConfig(null)}
                className="flex-1 font-bold py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await confirmConfig.action();
                  setConfirmConfig(null);
                }}
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
