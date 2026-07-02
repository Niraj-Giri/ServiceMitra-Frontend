import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Users, Briefcase, IndianRupee, LogOut, History, CheckCircle, RefreshCcw, CreditCard, XCircle, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';

export const AdminPortal = () => {
  const [admin, setAdmin] = useState<any>(() => {
    const saved = localStorage.getItem('admin');
    return saved ? JSON.parse(saved) : null;
  });
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'providers' | 'bookings' | 'revenue' | 'payouts'>('approvals');
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);

  useEffect(() => {
    if (admin) {
      if (activeTab === 'approvals') fetchPendingProviders();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'providers') fetchProviders();
      if (activeTab === 'bookings') fetchBookings();
      if (activeTab === 'revenue') fetchRevenue();
      if (activeTab === 'payouts') fetchWithdrawals();
    }
  }, [admin, activeTab]);

  const fetchWithdrawals = async () => {
    try {
      const response = await apiClient.get('/withdrawals/all');
      setWithdrawals(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPendingProviders = async () => {
    try {
      const response = await apiClient.get('/admin/pending-providers');
      setPendingProviders(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/admin/all-users');
      setUsers(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await apiClient.get('/admin/all-providers');
      setProviders(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/admin/all-bookings');
      setBookings(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRevenue = async () => {
    try {
      const response = await apiClient.get('/admin/revenue');
      const provRes = await apiClient.get('/admin/all-providers');
      const provs = provRes.data;
      
      const providerRev = response.data.providerRevenue || [];
      const categoryMap: Record<string, any> = {};
      
      providerRev.forEach((pr: any) => {
        const prov = provs.find((p: any) => p.id === pr.providerId);
        const cat = prov?.serviceCategory || 'Other';
        const formattedCat = cat.replace('_', ' ');
        if (!categoryMap[formattedCat]) {
          categoryMap[formattedCat] = { category: formattedCat, totalEarnings: 0, commission: 0 };
        }
        categoryMap[formattedCat].totalEarnings += pr.totalEarnings;
        categoryMap[formattedCat].commission += pr.commission;
      });
      
      const categoryRevenue = Object.values(categoryMap);
      setRevenue({ ...response.data, categoryRevenue });
    } catch (e) {
      console.error(e);
    }
  };

  const approveProvider = async (id: number) => {
    try {
      await apiClient.post(`/admin/approve-provider/${id}`);
      fetchPendingProviders();
    } catch (e) {
      console.error(e);
    }
  };

  const rejectProvider = async (id: number) => {
    try {
      await apiClient.post(`/admin/reject-provider/${id}`);
      fetchPendingProviders();
    } catch (e) {
      console.error(e);
    }
  };

  const processWithdrawal = async (id: number, status: string) => {
    try {
      await apiClient.put(`/withdrawals/${id}/process`, { status });
      fetchWithdrawals();
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    navigate('/');
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <p className="text-white">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* SIDEBAR */}
      <div className="w-72 bg-slate-900 text-white flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
            <span className="text-3xl font-black tracking-tight">Mitra<span className="text-emerald-400">Admin</span></span>
          </div>
          <p className="text-slate-400 text-sm font-bold tracking-widest pl-13">PORTAL</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <button onClick={() => setActiveTab('approvals')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-colors ${activeTab === 'approvals' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <CheckCircle className="w-5 h-5" /> Pending Approvals
            {pendingProviders.length > 0 && <span className="ml-auto bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full">{pendingProviders.length}</span>}
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-colors ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Users className="w-5 h-5" /> All Users
          </button>
          <button onClick={() => setActiveTab('providers')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-colors ${activeTab === 'providers' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Briefcase className="w-5 h-5" /> All Providers
          </button>
          <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-colors ${activeTab === 'bookings' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <History className="w-5 h-5" /> All Bookings
          </button>
          <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-colors ${activeTab === 'revenue' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <IndianRupee className="w-5 h-5" /> Revenue Stats
          </button>
          <button onClick={() => setActiveTab('payouts')} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-colors ${activeTab === 'payouts' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <CreditCard className="w-5 h-5" /> Provider Payouts
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6 bg-slate-800 p-4 rounded-2xl">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-white shadow-inner">A</div>
            <div>
              <p className="font-bold text-sm text-white">Admin User</p>
              <p className="text-xs text-slate-400">{admin.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-10 overflow-y-auto h-screen bg-slate-50">
        <header className="flex justify-between items-center mb-10">
           <h1 className="text-3xl font-black text-slate-800 capitalize tracking-tight flex items-center gap-3">
             {activeTab.replace('-', ' ')}
           </h1>
           <button onClick={() => {
             if (activeTab === 'approvals') fetchPendingProviders();
             if (activeTab === 'users') fetchUsers();
             if (activeTab === 'providers') fetchProviders();
             if (activeTab === 'bookings') fetchBookings();
             if (activeTab === 'revenue') fetchRevenue();
             if (activeTab === 'payouts') fetchWithdrawals();
           }} className="bg-white hover:bg-slate-100 text-slate-600 p-3 rounded-xl border border-slate-200 shadow-sm transition-colors">
             <RefreshCcw className="w-5 h-5" />
           </button>
        </header>

        {activeTab === 'approvals' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200">
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Business Details</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Contact</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Location</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Documents</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {pendingProviders.map(m => (
                   <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                     <td className="p-5">
                       <p className="font-bold text-slate-800 text-lg">{m.businessName}</p>
                       <p className="text-slate-500 text-sm">Owner: {m.fullName}</p>
                       <span className="inline-block mt-1 text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                         {m.category?.replace('_', ' ')}
                       </span>
                     </td>
                     <td className="p-5 text-sm text-slate-600">
                       <p>{m.phone}</p>
                       <p>{m.email}</p>
                     </td>
                     <td className="p-5 text-sm text-slate-600 max-w-xs truncate" title={m.address}>
                       {m.address}
                     </td>
                     <td className="p-5">
                       <div className="flex gap-2">
                         <a href={m.panFileUrl} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100">PAN</a>
                         <a href={m.citizenFileUrl} target="_blank" rel="noreferrer" className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100">ID</a>
                       </div>
                     </td>
                     <td className="p-5 text-right">
                       <div className="flex gap-2 justify-end">
                         <button onClick={() => approveProvider(m.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all flex items-center">
                           <CheckCircle2 className="w-5 h-5 mr-1" /> Approve
                         </button>
                         <button onClick={() => rejectProvider(m.id)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center">
                           <XCircle className="w-5 h-5 mr-1" /> Reject
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
                 {pendingProviders.length === 0 && (
                   <tr><td colSpan={5} className="p-16 text-center text-slate-400">
                     <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                     <p className="text-lg font-bold">No pending approvals.</p>
                   </td></tr>
                 )}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200">
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Date</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Provider ID</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Amount</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Status</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {withdrawals.map(w => (
                   <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                     <td className="p-5 text-sm text-slate-500">{new Date(w.requestedAt).toLocaleDateString()}</td>
                     <td className="p-5 font-bold text-slate-800">#{w.providerId}</td>
                     <td className="p-5 font-bold text-slate-800 text-lg">₹{w.amount.toFixed(2)}</td>
                     <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${w.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : w.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {w.status}
                        </span>
                     </td>
                     <td className="p-5 text-right">
                       {w.status === 'PENDING' && (
                         <div className="flex gap-2 justify-end">
                           <button onClick={() => processWithdrawal(w.id, 'PROCESSED')} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg font-bold transition-all text-sm">
                             Mark Paid
                           </button>
                           <button onClick={() => processWithdrawal(w.id, 'REJECTED')} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-lg font-bold transition-all text-sm">
                             Reject
                           </button>
                         </div>
                       )}
                     </td>
                   </tr>
                 ))}
                 {withdrawals.length === 0 && (
                   <tr><td colSpan={5} className="p-16 text-center text-slate-400">
                     <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                     <p className="text-lg font-bold">No payout requests.</p>
                   </td></tr>
                 )}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200">
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">ID</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Name</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Email</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Phone</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Role</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {users.map(u => (
                   <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                     <td className="p-5 text-slate-500 font-medium">#{u.id}</td>
                     <td className="p-5 font-bold text-slate-800">{u.fullName}</td>
                     <td className="p-5 text-slate-600">{u.email}</td>
                     <td className="p-5 text-slate-600">{u.phone}</td>
                     <td className="p-5">
                       <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold">{u.role}</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'providers' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200">
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Provider</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Category</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Status</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Rating</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Total Jobs</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider text-right">Revenue</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {providers.map(m => (
                   <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                     <td className="p-5">
                       <p className="font-bold text-slate-800">{m.business}</p>
                       <p className="text-slate-500 text-sm">{m.name} • {m.email}</p>
                     </td>
                     <td className="p-5">
                       <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
                         {m.category?.replace('_', ' ')}
                       </span>
                     </td>
                     <td className="p-5">
                       <span className={`px-3 py-1 rounded-lg text-xs font-bold ${m.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {m.status}
                       </span>
                     </td>
                     <td className="p-5 font-bold text-slate-700">{m.rating.toFixed(1)}</td>
                     <td className="p-5 font-bold text-slate-700">{m.totalJobs}</td>
                     <td className="p-5 font-bold text-slate-800 text-right text-lg">₹{m.revenue.toFixed(2)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200">
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">ID & Date</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Problem</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider">Status</th>
                   <th className="p-5 font-bold text-slate-600 uppercase text-sm tracking-wider text-right">Total Bill</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {bookings.map(b => (
                   <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                     <td className="p-5 text-sm">
                       <p className="font-bold text-slate-800">#{b.id}</p>
                       <p className="text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</p>
                     </td>
                     <td className="p-5 font-bold text-slate-800">{b.problemDescription}</td>
                     <td className="p-5">
                       <span className={`px-3 py-1 rounded-lg text-xs font-bold ${b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : b.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                         {b.status}
                       </span>
                     </td>
                     <td className="p-5 font-black text-slate-800 text-right text-lg">
                       {b.totalBill ? `₹${b.totalBill.toFixed(2)}` : '-'}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        )}

        {activeTab === 'revenue' && revenue && (
          <div className="space-y-8 animate-in fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-8 rounded-3xl text-white shadow-lg shadow-emerald-500/20">
                <p className="text-emerald-100 font-bold mb-2 text-lg">Total Revenue</p>
                <h2 className="text-5xl font-black flex items-center"><IndianRupee className="w-10 h-10 mr-1" /> {revenue.totalRevenue.toFixed(2)}</h2>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-slate-500 font-bold mb-2 text-lg">Platform Commission</p>
                <h2 className="text-4xl font-black text-slate-800 flex items-center"><IndianRupee className="w-8 h-8 mr-1 text-emerald-500" /> {revenue.platformCommission.toFixed(2)}</h2>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-slate-500 font-bold mb-2 text-lg">Completed Jobs</p>
                <h2 className="text-4xl font-black text-slate-800">{revenue.completedBookings} <span className="text-lg text-slate-400 font-medium">/ {revenue.totalBookings} total</span></h2>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <h2 className="text-2xl font-black text-slate-800">Revenue by Category</h2>
              <button 
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + "Category,Earnings,Commission\n"
                    + revenue.categoryRevenue.map((r:any) => `${r.category},${r.totalEarnings},${r.commission}`).join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "category_revenue.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl transition-colors"
              >
                Export CSV
              </button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 h-[400px]">
              <ResponsiveContainer w-full h-full>
                <BarChart data={revenue.categoryRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend />
                  <Bar dataKey="totalEarnings" name="Total Earnings (₹)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="commission" name="Commission (₹)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
