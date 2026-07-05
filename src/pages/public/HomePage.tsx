import React, { useEffect, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Service } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ArrowRight, Clock3, PlugZap, Search, ShieldCheck, Sparkles, Star, Wrench } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await apiClient.get('/services');
        setServices(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const categories = Array.from(new Set(services.map(s => s.category)));
  
  if (user?.role === 'PROVIDER') {
    return <Navigate to="/provider/dashboard" replace />;
  }
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  // Customers can stay on the home page to book services

  // Filter for search
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredServices = services.slice(0, 4);

  const categoryIcon = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes('electric')) return <PlugZap className="h-7 w-7" />;
    if (normalized.includes('clean')) return <Sparkles className="h-7 w-7" />;
    return <Wrench className="h-7 w-7" />;
  };

  return (
    <div className="space-y-14 pb-16">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(59,130,246,0.42),transparent_28rem),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,64,175,0.78))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Verified professionals, transparent pricing
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Expert home services, booked in minutes
        </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50/82">
              Find trusted mechanics, electricians, cleaners, and repair professionals near you in Nepal.
            </p>
        
            <div className="mt-8 max-w-2xl">
              <div className="relative rounded-2xl bg-white p-2 shadow-2xl shadow-blue-950/30">
                <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AC repair, plumber, cleaning..."
                  className="focus-ring w-full rounded-xl border-0 bg-slate-50 py-4 pl-12 pr-28 text-base font-medium text-slate-900 placeholder:text-slate-400"
                />
                <button 
                  type="button"
                  onClick={() => filteredServices[0] && navigate(`/services/${filteredServices[0].id}`)}
                  className="absolute bottom-2 right-2 top-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
              {searchQuery && (
                <div className="glass-panel mt-3 overflow-hidden rounded-2xl text-left">
                  <div className="border-b border-slate-200 px-5 py-3 text-sm font-bold text-slate-900">Search results</div>
                  {filteredServices.length === 0 ? (
                    <p className="px-5 py-5 text-sm text-slate-500">No services found. Try a broader search.</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto p-2">
                      {filteredServices.map(svc => (
                        <Link key={svc.id} to={`/services/${svc.id}`} className="flex items-center justify-between rounded-xl p-3 transition hover:bg-blue-50">
                          <div>
                            <div className="font-bold text-slate-900">{svc.name}</div>
                            <div className="text-sm text-slate-500">{svc.category} • Rs. {svc.basePrice}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-blue-600" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3 text-left">
              {[
                ['4.8/5', 'Average rating'],
                ['24/7', 'Booking support'],
                ['100%', 'Verified pros'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-extrabold text-white">{value}</div>
                  <div className="mt-1 text-xs font-medium text-blue-50/75">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div className="glass-panel w-full max-w-md rounded-2xl p-5">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Today nearby</p>
                    <h2 className="text-xl font-extrabold text-slate-950">Popular services</h2>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">Live</div>
                </div>
                <div className="space-y-3">
                  {(featuredServices.length ? featuredServices : services.slice(0, 3)).map(service => (
                    <Link key={service.id} to={`/services/${service.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        {categoryIcon(service.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-slate-900">{service.name}</div>
                        <div className="text-sm text-slate-500">Starts at Rs. {service.basePrice}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  ))}
                  {loading && <div className="py-8 text-center text-sm text-slate-500">Loading services...</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Explore</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-950">Browse Categories</h2>
          </div>
          <Link to="/services" className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full glass-panel rounded-2xl py-10 text-center text-slate-500">Loading categories...</div>
          ) : (
            categories.map(category => (
              <button 
                key={category} 
                onClick={() => navigate(`/services?category=${encodeURIComponent(category)}`)}
                className="service-card group rounded-2xl p-6 text-left"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                  {categoryIcon(category)}
                </div>
                <h3 className="font-extrabold text-slate-900">{category}</h3>
                <p className="mt-2 text-sm text-slate-500">{services.filter(s => s.category === category).length} services available</p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Recommended</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-950">Featured Services</h2>
          </div>
          <div className="hidden items-center gap-2 text-sm font-semibold text-slate-500 sm:flex">
            <Clock3 className="h-4 w-4 text-blue-600" />
            Book now, schedule later
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredServices.map(service => (
            <Link 
              key={service.id} 
              to={`/services/${service.id}`}
              className="service-card group block rounded-2xl p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  {categoryIcon(service.category)}
                </div>
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-current" /> 4.8
                </div>
              </div>
              <div className="text-sm text-blue-600 font-bold mb-2">{service.category}</div>
              <h3 className="text-lg font-extrabold text-slate-950 mb-2 group-hover:text-blue-600 transition">{service.name}</h3>
              <p className="text-slate-500 text-sm mb-5 line-clamp-2">{service.description}</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="font-extrabold text-slate-950">
                  {service.priceType === 'STARTING_AT' ? 'From ' : ''}
                  Rs. {service.basePrice}
                </div>
                <ArrowRight className="h-4 w-4 text-blue-600 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
