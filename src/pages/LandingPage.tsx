import React, { useState } from 'react';
import { Star, ArrowRight, Clock, MapPin, Briefcase, Shield, Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OtpModal } from '../components/OtpModal';
import { ProviderPortal } from './ProviderPortal';
import { apiClient } from '../api/client';

// ===== STAFF LOGIN MODAL =====
const StaffLoginModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'provider' | 'admin'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProviderRegister, setShowProviderRegister] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setLoading(false);
  };

  const handleProviderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/provider-login', { email, password });
      // Store provider data and navigate
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('provider', JSON.stringify(response.data.provider));
      onClose();
      navigate('/provider');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/admin-login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.user));
      onClose();
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  // Show Provider Registration Modal
  if (showProviderRegister) {
    return (
      <ProviderPortal
        isOpen={true}
        onClose={() => setShowProviderRegister(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">

        {/* Close button */}
        <button onClick={() => { onClose(); setMode('choose'); resetForm(); }} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* ===== CHOOSE ROLE ===== */}
        {mode === 'choose' && (
          <div>
            <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">Staff Login</h2>
            <p className="text-slate-500 mb-8 text-center">Choose your role to continue</p>

            <div className="space-y-4">
              <button
                onClick={() => { setMode('provider'); resetForm(); }}
                className="w-full group flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-100 hover:border-blue-300 rounded-2xl transition-all hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-slate-800">Service Provider</h3>
                  <p className="text-sm text-slate-500">Manage jobs & earnings</p>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => { setMode('admin'); resetForm(); }}
                className="w-full group flex items-center gap-4 p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-2 border-emerald-100 hover:border-emerald-300 rounded-2xl transition-all hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-slate-800">Admin</h3>
                  <p className="text-sm text-slate-500">Manage platform & approvals</p>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* ===== PROVIDER LOGIN ===== */}
        {mode === 'provider' && (
          <div>
            <button onClick={() => { setMode('choose'); resetForm(); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Provider Login</h2>
            <p className="text-slate-500 mb-6">Login with your registered email and password</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleProviderLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors font-medium text-slate-800"
                    placeholder="provider@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-colors font-medium text-slate-800"
                    placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mt-2">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Not registered yet?{' '}
              <button onClick={() => setShowProviderRegister(true)} className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors">
                Register your business
              </button>
            </p>
          </div>
        )}

        {/* ===== ADMIN LOGIN ===== */}
        {mode === 'admin' && (
          <div>
            <button onClick={() => { setMode('choose'); resetForm(); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Admin Login</h2>
            <p className="text-slate-500 mb-6">Login with your admin credentials</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-colors font-medium text-slate-800"
                    placeholder="admin@servicemitra.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-colors font-medium text-slate-800"
                    placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 mt-2">
                {loading ? 'Logging in...' : 'Login as Admin'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Admin accounts are created by the system administrator.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};


// ===== LANDING PAGE =====
export const LandingPage = () => {
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const user = localStorage.getItem('user');
    const provider = localStorage.getItem('provider');
    const admin = localStorage.getItem('admin');
    const token = localStorage.getItem('token');

    if (token) {
      if (admin) {
        navigate('/admin');
      } else if (provider) {
        navigate('/provider');
      } else if (user) {
        navigate('/customer');
      }
    }
  }, [navigate]);

  const handleCustomerSuccess = () => {
    setShowUserLogin(false);
    navigate('/customer');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 fixed w-full z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.jpeg" alt="Service Mitra Logo" className="h-12 w-auto object-contain rounded-lg" />
            <span className="text-2xl font-black tracking-tight text-slate-800">
              Service<span className="text-blue-600">Mitra</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
            <a href="#about-us" className="hover:text-blue-600 transition-colors">About Us</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={() => setShowStaffLogin(true)} className="flex items-center gap-2 text-slate-600 font-semibold hover:text-slate-800 transition-colors px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50">
               <Briefcase className="w-4 h-4" /> Staff Login
             </button>
             <button onClick={() => setShowUserLogin(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 flex items-center">
               Login <ArrowRight className="w-4 h-4 ml-2" />
             </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-400/10 blur-3xl rounded-full -z-10"></div>
         <div className="max-w-7xl mx-auto text-center mt-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-8 border border-blue-100">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              On-Demand Expert Services
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Need an expert? <br/> We've got your back.
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Service Mitra connects you with trusted, verified professionals near you in real-time. Whether it's a vehicle breakdown, AC repair, or plumbing issue, help is just a tap away.
            </p>

            <button onClick={() => setShowUserLogin(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/30 transition-all transform hover:-translate-y-1 flex items-center mx-auto text-lg">
               Get Started Now <ArrowRight className="w-5 h-5 ml-3" />
            </button>
         </div>
      </section>

      {/* Stats / Trust */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
           <div>
             <h4 className="text-4xl font-black text-slate-800 mb-1">15k+</h4>
             <p className="text-slate-500 font-medium">Happy Customers</p>
           </div>
           <div>
             <h4 className="text-4xl font-black text-slate-800 mb-1">500+</h4>
             <p className="text-slate-500 font-medium">Verified Providers</p>
           </div>
           <div>
             <h4 className="text-4xl font-black text-slate-800 mb-1">&lt; 15m</h4>
             <p className="text-slate-500 font-medium">Average ETA</p>
           </div>
           <div>
             <h4 className="text-4xl font-black text-slate-800 mb-1">4.8/5</h4>
             <p className="text-slate-500 font-medium">Average Rating</p>
           </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-24 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Professional Services at Your Doorstep</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Whatever you need, we have a verified expert ready to help.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🚗', name: 'Auto Repair', desc: 'Breakdowns, flat tires, battery jumpstarts, and towing' },
              { icon: '❄️', name: 'AC Service', desc: 'Installation, gas refilling, repair, and regular maintenance' },
              { icon: '⚡', name: 'Electrician', desc: 'Wiring, appliance repair, power issues, and installations' },
              { icon: '🚰', name: 'Plumbing', desc: 'Leaks, pipe bursts, bathroom fittings, and drain cleaning' }
            ].map((s, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 transition-transform">{s.icon}</div>
                <h3 className="font-bold text-slate-800 text-xl mb-3">{s.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 relative">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How Service Mitra Works</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">Three simple steps to get your problems solved safely and quickly.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative group hover:shadow-xl transition-all">
                 <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <MapPin className="w-8 h-8 text-blue-600" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-3">1. Share Location</h3>
                 <p className="text-slate-500 leading-relaxed">Provide your precise location so our system can instantly find the nearest available professionals.</p>
               </div>
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative group hover:shadow-xl transition-all">
                 <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-8 h-8 text-purple-600" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-3">2. Choose Service</h3>
                 <p className="text-slate-500 leading-relaxed">Filter by category—Auto Mechanic, AC Technician, Electrician, etc. We match you with the right expert.</p>
               </div>
               <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative group hover:shadow-xl transition-all">
                 <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Clock className="w-8 h-8 text-green-600" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-3">3. Track Arrival</h3>
                 <p className="text-slate-500 leading-relaxed">See your provider moving on the map in real-time. Pay securely only after the job is complete.</p>
               </div>
            </div>
         </div>
      </section>

      {/* About Us */}
      <section id="about-us" className="py-24 px-6 bg-blue-50">
         <div className="max-w-5xl mx-auto text-slate-700">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Service Mitra Concept</h2>
              <p className="text-xl text-blue-600 font-bold">Connecting You With Trusted Professionals</p>
            </div>
            
            <div className="space-y-8 text-lg leading-relaxed">
              <p className="text-center max-w-3xl mx-auto text-slate-600">
                Service Mitra is a smart digital platform designed to connect people with verified service providers anytime, anywhere. Our goal is to make repairs and maintenance simple, reliable, and accessible through technology.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 pt-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <p className="mb-4">
                    Whether it's an emergency car breakdown, routine home servicing, or urgent electrical maintenance, users can quickly find nearby providers, request assistance, book services, track job progress, and make secure online payments—all from a single platform.
                  </p>
                  <p>
                    For service providers, Service Mitra provides an opportunity to expand their business, receive service requests in real time, manage bookings, build their reputation through customer reviews, and increase their income.
                  </p>
                </div>
                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-100 border-l-4 border-l-blue-600">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2"><Star className="w-6 h-6 text-blue-600" /> Our Mission</h3>
                    <p className="text-slate-600 text-base">To transform the service industry by creating a trusted, transparent, and technology-driven ecosystem that benefits both customers and professionals.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-purple-100 border-l-4 border-l-purple-600">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2"><Star className="w-6 h-6 text-purple-600" /> Our Vision</h3>
                    <p className="text-slate-600 text-base">To become Nepal's most trusted digital service platform, delivering fast, affordable, and professional assistance across the country.</p>
                  </div>
                </div>
              </div>

              <div className="pt-12">
                <h3 className="text-3xl font-black text-slate-900 mb-8 text-center">Core Features</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    "Find nearby verified providers",
                    "Multiple service categories",
                    "Online service booking",
                    "Real-time booking and job tracking",
                    "Secure digital payments",
                    "Customer ratings and reviews",
                    "Provider profiles and service history",
                    "Instant communication",
                    "Admin dashboard for platform management"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                      <span className="font-semibold text-slate-700 text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-white p-12 rounded-[3rem] mt-16 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-blue-900/20"></div>
                <div className="relative z-10 max-w-3xl mx-auto">
                  <h3 className="text-3xl font-black mb-6 text-blue-400">Our Promise</h3>
                  <p className="text-xl text-slate-300 leading-relaxed font-medium">"At Service Mitra, we believe everyone deserves quick access to trusted professional support. We are committed to delivering convenience, reliability, and peace of mind through innovative technology and exceptional service."</p>
                </div>
              </div>
            </div>
          </div>
      </section>

      {/* Provider CTA */}
      <section className="py-24 px-6 bg-blue-600 text-white relative overflow-hidden my-12">
         <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
         <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Are you a professional?</h2>
              <p className="text-blue-100 text-xl mb-10 leading-relaxed font-medium">Join thousands of mechanics, electricians, and plumbers growing their business with ServiceMitra. Get leads directly to your phone.</p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-4 text-lg font-medium"><CheckCircle2 className="w-6 h-6 text-blue-300" /> Zero marketing costs</li>
                <li className="flex items-center gap-4 text-lg font-medium"><CheckCircle2 className="w-6 h-6 text-blue-300" /> Flexible working hours</li>
                <li className="flex items-center gap-4 text-lg font-medium"><CheckCircle2 className="w-6 h-6 text-blue-300" /> Guaranteed secure payments</li>
              </ul>
              <button onClick={() => setShowStaffLogin(true)} className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-50 transition-colors shadow-2xl shadow-blue-900/50">
                Register Your Business
              </button>
            </div>
            <div className="w-full md:w-5/12">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center">
                      <Briefcase className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">New Job Request!</p>
                      <p className="text-emerald-400 font-medium text-sm">2.5 km away</p>
                    </div>
                  </div>
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold">Just now</span>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="h-5 bg-slate-800 rounded-lg w-3/4"></div>
                  <div className="h-5 bg-slate-800 rounded-lg w-1/2"></div>
                </div>
                <div className="flex gap-4">
                   <div className="flex-1 py-4 text-center rounded-xl font-bold bg-slate-800 text-slate-400">Reject</div>
                   <div className="flex-1 py-4 text-center rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-600/30">Accept Job</div>
                </div>
              </div>
            </div>
         </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-slate-900 text-white rounded-t-[3rem] mt-24">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by people everywhere.</h2>
                <p className="text-slate-400 text-lg">Don't just take our word for it. Here's what our community has to say.</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Priya T.", review: "My car broke down on a deserted highway at night. Service Mitra found an auto mechanic who arrived in 20 minutes. A total lifesaver!", stars: 5 },
                { name: "Rohan K.", review: "Transparent pricing and verified technicians make all the difference. I used them for AC repair and it was super smooth.", stars: 5 },
                { name: "Amit S.", review: "The live tracking feature is amazing. I knew exactly when the professional would arrive. Highly recommend to everyone.", stars: 4 }
              ].map((t, i) => (
                 <div key={i} className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                    <div className="flex gap-1 mb-4">
                      {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-5 h-5 fill-yellow-500 text-yellow-500" />)}
                    </div>
                    <p className="text-lg text-slate-300 leading-relaxed mb-6">"{t.review}"</p>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-bold text-xl">{t.name.charAt(0)}</div>
                       <div>
                         <h4 className="font-bold">{t.name}</h4>
                         <p className="text-sm text-slate-400">Verified Customer</p>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
         </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-500">Everything you need to know about ServiceMitra.</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: 'Are your service providers verified?', a: 'Yes, absolutely. Every service provider goes through a strict verification process where we check their citizenship/ID, PAN card, and past experience before they are allowed on the platform.' },
              { q: 'How is the service charge determined?', a: 'Pricing is fully transparent. The provider assesses the problem and sets a service charge through their app. You will see the exact bill breakdown, including our small 5% platform fee, before you pay.' },
              { q: 'What happens if a provider doesn\'t show up?', a: 'Since you can track providers in real-time, you always know their ETA. If an issue arises, you can instantly book another nearby provider or contact our 24/7 support.' },
              { q: 'How do I pay for the service?', a: 'You pay securely through the platform once the job is marked as completed by both you and the provider. We handle the split so the provider gets paid seamlessly.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-800 text-lg">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                </button>
                <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-slate-600 leading-relaxed font-medium pt-2 border-t border-slate-100">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
           <div className="flex items-center gap-2 mb-4 md:mb-0 grayscale opacity-70">
             <Briefcase className="w-5 h-5" />
             <span className="text-xl font-bold tracking-tight text-white">ServiceMitra</span>
           </div>
           <div className="flex gap-6 text-sm">
             <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
             <a href="#" className="hover:text-white transition-colors">Contact Support</a>
           </div>
        </div>
      </footer>

      {/* ===== MODALS ===== */}
      <OtpModal 
        isOpen={showUserLogin} 
        onClose={() => setShowUserLogin(false)} 
        onSuccess={handleCustomerSuccess} 
      />

      <StaffLoginModal
        isOpen={showStaffLogin}
        onClose={() => setShowStaffLogin(false)}
      />

    </div>
  );
};
