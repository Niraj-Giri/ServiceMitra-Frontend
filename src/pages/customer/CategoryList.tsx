import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Service } from '../../types';
import { Search, Wrench, Star } from 'lucide-react';

const getServicePlaceholderImage = (category: string) => {
  switch (category.toUpperCase()) {
    case 'ELECTRICAL':
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80';
    case 'PLUMBING':
      return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&auto=format&fit=crop&q=80';
    case 'CLEANING':
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80';
    default:
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80';
  }
};

export const CategoryList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const queryCategory = searchParams.get('category');

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
  const activeCategories = selectedCategory ? [selectedCategory] : categories;

  useEffect(() => {
    if (queryCategory && categories.length > 0) {
      const matched = categories.find(c => c.toLowerCase() === queryCategory.toLowerCase());
      if (matched) {
        setSelectedCategory(matched);
      }
    } else if (!queryCategory) {
      setSelectedCategory(null);
    }
  }, [queryCategory, services]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="glass-panel rounded-2xl py-16 text-center text-slate-500">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="glass-panel overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Services</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Find the right professional</h1>
            <p className="mt-3 max-w-2xl text-slate-600">Browse available service categories and post your task — providers will compete to give you the best price.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            <Search className="h-4 w-4" />
            {services.length} services
          </div>
        </div>
      </div>
      
      {/* Category Selection Filter Pills */}
      <div className="flex flex-wrap gap-2.5 pb-2 border-b border-slate-100/80">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setSearchParams({});
          }}
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-200 border ${
            selectedCategory === null
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          All Categories
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setSearchParams({ category: cat });
            }}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-200 border ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {activeCategories.map(category => (
          <section key={category} className="glass-panel rounded-2xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{category}</h2>
                  <p className="text-sm text-slate-500">{services.filter(s => s.category === category).length} options available</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.filter(s => s.category === category).map(service => (
                <Link 
                  key={service.id} 
                  to={`/services/${service.id}`}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition duration-300 flex flex-col group hover:-translate-y-0.5"
                >
                  {/* Service Image */}
                  <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative mb-4">
                    <img 
                      src={getServicePlaceholderImage(service.category)} 
                      alt={service.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition text-base line-clamp-1 pr-2">
                    {service.name}
                  </h3>
                  
                  {/* Brand & Rating Row */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-600 font-bold text-xs truncate">Service Mitra</span>
                      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white">
                        ✓
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-slate-700 font-bold text-xs">
                        {(4.5 + (service.id % 6) * 0.1).toFixed(1)}
                      </span>
                      <span className="text-slate-400 text-[10px] font-semibold">
                        ({10 + (service.id % 20) * 3})
                      </span>
                    </div>
                  </div>

                  {/* Post Task CTA */}
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    Get Free Quotes →
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
