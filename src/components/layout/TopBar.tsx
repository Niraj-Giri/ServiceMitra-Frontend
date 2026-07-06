import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, ChevronDown, UserRound, Menu, X } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20">
            SM
          </span>
          <span>Service<span className="text-blue-600">Mitra</span></span>
        </Link>
        
        <nav className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-6">
            {(!isAuthenticated || user?.role === 'CUSTOMER') && (
              <>
                <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
                  Home
                </Link>
                <Link to="/services" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
                  Services
                </Link>
              </>
            )}
            {!isAuthenticated && (
              <Link to="/?login=partner" className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100">
                <BriefcaseBusiness className="h-4 w-4" />
                Become a Professional
              </Link>
            )}
          </div>

          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="focus-ring flex items-center gap-2 rounded-full bg-slate-100/80 px-2 py-1 transition hover:bg-slate-200/80"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl shadow-slate-900/12">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user.phone}</p>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    My Profile
                  </Link>
                  
                  {user.role === 'CUSTOMER' && (
                    <Link 
                      to="/customer/dashboard" 
                      className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      My Bookings
                    </Link>
                  )}
                  {user.role === 'PROVIDER' && (
                    <Link 
                      to="/provider/dashboard" 
                      className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Provider Dashboard
                    </Link>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link 
                      to="/admin/dashboard" 
                      className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <div className="border-t border-slate-100 mt-2 pt-1">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/?login=customer" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              Login
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex md:hidden items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3 shadow-md animate-in slide-in-from-top-4 duration-200">
          {(!isAuthenticated || user?.role === 'CUSTOMER') && (
            <>
              <Link 
                to="/" 
                className="block text-sm font-bold text-slate-700 hover:text-blue-600 py-1 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/services" 
                className="block text-sm font-bold text-slate-700 hover:text-blue-600 py-1 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </Link>
            </>
          )}
          {!isAuthenticated && (
            <Link 
              to="/?login=partner" 
              className="flex w-full items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Become a Professional
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
