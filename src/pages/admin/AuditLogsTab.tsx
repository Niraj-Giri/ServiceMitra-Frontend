import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Search, ChevronLeft, ChevronRight, 
  Download, User
} from 'lucide-react';
import { exportToCSV } from './csvUtils';

interface AuditLog {
  id: number;
  admin: string;
  action: string;
  entity: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  ipAddress: string;
}

export const AuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination (clientside since DB table is small in MVP)
  const [page, setPage] = useState(0);
  const size = 15;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/audit-logs');
      setLogs(response.data || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity.toLowerCase().includes(search.toLowerCase()) ||
    l.admin.toLowerCase().includes(search.toLowerCase()) ||
    l.ipAddress.includes(search)
  );

  const paginatedLogs = filteredLogs.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredLogs.length / size) || 1;

  const handleExport = () => {
    const csvData = filteredLogs.map(l => ({
      ID: l.id,
      Actor: l.admin,
      Action: l.action,
      Entity: l.entity,
      OldValue: l.oldValue || 'N/A',
      NewValue: l.newValue || 'N/A',
      Time: l.timestamp,
      IP: l.ipAddress
    }));
    exportToCSV(csvData, 'audit_logs');
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs text-slate-700 font-semibold">
      
      {/* Upper Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 min-w-[280px] items-center gap-3 relative">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit logs by action, actor, entity, IP..."
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

      {/* Main logs table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action Summary</th>
                <th className="px-6 py-4">Entity type</th>
                <th className="px-6 py-4">Old value</th>
                <th className="px-6 py-4">New value</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold">
              {paginatedLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/20">
                  <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                    <User className="h-3.5 w-3.5 text-slate-400" /> {l.admin}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-bold max-w-xs leading-relaxed">
                    {l.action}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{l.entity}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono font-medium max-w-xxs truncate">
                    {l.oldValue || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-mono font-bold max-w-xxs truncate">
                    {l.newValue || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono font-bold">
                    {l.ipAddress}
                  </td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs italic">
                    No security events logged matching search terms.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>Showing {paginatedLogs.length} of {filteredLogs.length} logs</span>
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

    </div>
  );
};
