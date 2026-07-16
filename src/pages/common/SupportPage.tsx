import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';
import { CustomerDisputes } from '../../components/customer/CustomerDisputes';
import { ProviderDisputes } from '../../components/provider/ProviderDisputes';
import { AlertCircle, Loader2 } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeComplaint, setActiveComplaint] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const response = await apiClient.get('/complaints');
      setComplaints(response.data || response || []);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSelectComplaint = (complaint: any) => {
    setActiveComplaint(complaint);
  };

  const handleRespond = async (id: number, text: string) => {
    try {
      await apiClient.put(`/complaints/${id}/respond`, { responseText: text });
      alert('Response submitted successfully. The dispute status is now Under Review.');
      fetchComplaints();
      const updated = await apiClient.get(`/complaints/${id}`);
      setActiveComplaint(updated.data?.data || updated.data || updated);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit response');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">Support & Dispute Center</h1>
          <p className="text-slate-500 text-xs mt-1">Manage, file, and track support tickets or active complaints raised on bookings.</p>
        </div>
      </div>

      {user?.role === 'CUSTOMER' && (
        <CustomerDisputes 
          complaints={complaints}
          activeComplaint={activeComplaint}
          onSelectComplaint={handleSelectComplaint}
          onRespond={handleRespond}
        />
      )}

      {user?.role === 'PROVIDER' && (
        <ProviderDisputes 
          complaints={complaints}
          activeComplaint={activeComplaint}
          onSelectComplaint={handleSelectComplaint}
          onRespond={handleRespond}
        />
      )}

      {user?.role !== 'CUSTOMER' && user?.role !== 'PROVIDER' && (
        <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl flex items-center gap-2 text-amber-800 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-600" /> Support center is only accessible by customers and providers.
        </div>
      )}
    </div>
  );
};
