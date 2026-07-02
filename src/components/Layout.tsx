import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createStompClient } from '../api/stomp';
import { MapPin, Bell, LogOut, CheckCircle, Wrench, Menu } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!user) return;
    
    // Simulate WebSocket for UI demonstration if backend is not running
    const mockInterval = setInterval(() => {
       setMessages(prev => [...prev, `Provider John Doe is 5 mins away (${new Date().toLocaleTimeString()})`].slice(-5));
    }, 15000);
    
    const client = createStompClient();
    try {
      client.onConnect = () => {
        console.log('STOMP Connected');
        clearInterval(mockInterval); // Clear mock if real connection works
        client.subscribe(`/topic/updates/${user.id}`, (msg) => {
          setMessages((prev) => [...prev, msg.body].slice(-5)); // keep last 5 messages
        });
      };
      client.activate();
    } catch(e) {
      console.log("Stomp connect failed, using mock data for UI demo");
    }

    return () => {
      clearInterval(mockInterval);
      try { client.deactivate(); } catch(e) {}
    };
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center justify-center border-b border-slate-700 bg-slate-800 shadow-md">
          <Wrench className="w-6 h-6 mr-2 text-blue-400" />
          <h1 className="text-xl font-bold tracking-wider">Service<span className="text-blue-400">Mitra</span></h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <MapPin className="w-5 h-5 mr-3" />
            <span className="font-medium">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'bookings' ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            <CheckCircle className="w-5 h-5 mr-3" />
            <span className="font-medium">Bookings</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-3 text-sm text-red-400 rounded-xl border border-red-900/50 hover:bg-red-950/30 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center text-slate-500">
            <Menu className="w-6 h-6 mr-4 cursor-pointer hover:text-slate-700" />
            <span className="font-semibold text-slate-700">Welcome back, {user?.fullName || 'User'}</span>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <Bell className="w-6 h-6 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" />
              {messages.length > 0 && (
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </div>
            <div className="ml-6 w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white cursor-pointer transform transition hover:scale-105">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 relative">
           {/* Decorative background elements */}
           <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50 to-transparent -z-10"></div>
           <div className="max-w-7xl mx-auto">
             {children}
             
             {/* Dynamic Updates Example */}
             {messages.length > 0 && (
               <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Live Tracking Updates
                 </h3>
                 <ul className="space-y-3">
                   {messages.map((m, i) => (
                     <li key={i} className="p-4 bg-slate-50 text-slate-600 rounded-xl text-sm border border-slate-100 flex items-start shadow-sm">
                       <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0 font-medium">{i+1}</span>
                       <span className="mt-1">{m}</span>
                     </li>
                   ))}
                 </ul>
               </div>
             )}
           </div>
        </div>
      </main>
    </div>
  );
};
