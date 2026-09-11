import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { Search, Filter, RefreshCw, MapPin, SlidersHorizontal, Sprout } from 'lucide-react';

export default function Catalog() {
  const { t, lang } = useLanguage();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [division, setDivision] = useState(searchParams.get('division') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'freshness');

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  // Real-time catalog update when stock changes or new orders are placed
  useEffect(() => {
    if (!socket) return;
    const handleStockChange = () => {
      fetchProducts();
    };
    socket.on('produce_stock_updated', handleStockChange);
    return () => {
      socket.off('produce_stock_updated', handleStockChange);
    };
  }, [socket, searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchParams.get('search')) query.append('search', searchParams.get('search'));
      if (searchParams.get('category')) query.append('category', searchParams.get('category'));
      if (searchParams.get('division')) query.append('division', searchParams.get('division'));
      if (searchParams.get('sort')) query.append('sort', searchParams.get('sort'));

      const res = await axios.get(`/api/products?${query.toString()}`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error fetching catalog products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e) => {
    e?.preventDefault();
    const newParams = {};
    if (search) newParams.search = search;
    if (category) newParams.category = category;
    if (division) newParams.division = division;
    if (sort) newParams.sort = sort;
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{t('catalogTitle')}</span>
            <Sprout className="w-6 h-6 text-emerald-600 inline-block" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            {t('catalogSubtitle')}
          </p>
        </div>
        <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
          {t('totalProducts')}: {products.length} {lang === 'bn' ? 'টি' : ''}
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleApplyFilter} className="bg-white p-4 sm:p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchProduce')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              const p = Object.fromEntries(searchParams);
              if (e.target.value) p.category = e.target.value; else delete p.category;
              setSearchParams(p);
            }}
            className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="">{t('allCategories')}</option>
            <option value="fruits">{t('catFruits')}</option>
            <option value="rice-grains">{t('catRice')}</option>
            <option value="vegetables">{t('catVeg')}</option>
            <option value="spices">{t('catSpices')}</option>
            <option value="dairy-eggs">{t('catDairy')}</option>
          </select>

          {/* Division Filter */}
          <select
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              const p = Object.fromEntries(searchParams);
              if (e.target.value) p.division = e.target.value; else delete p.division;
              setSearchParams(p);
            }}
            className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="">{t('allDivisions')}</option>
            <option value="Rajshahi">{lang === 'bn' ? 'রাজশাহী বিভাগ' : 'Rajshahi Division'}</option>
            <option value="Rangpur">{lang === 'bn' ? 'রংপুর ও দিনাজপুর' : 'Rangpur & Dinajpur'}</option>
            <option value="Dhaka">{lang === 'bn' ? 'ঢাকা বিভাগ' : 'Dhaka Division'}</option>
            <option value="Chattogram">{lang === 'bn' ? 'চট্টগ্রাম বিভাগ' : 'Chattogram Division'}</option>
          </select>

          {/* Sort By */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              const p = Object.fromEntries(searchParams);
              if (e.target.value) p.sort = e.target.value; else delete p.sort;
              setSearchParams(p);
            }}
            className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700"
          >
            <option value="freshness">{t('freshnessSort')}</option>
            <option value="price_asc">{t('priceLowSort')}</option>
            <option value="price_desc">{t('priceHighSort')}</option>
            <option value="discount">{t('discountSort')}</option>
          </select>
        </div>
      </form>

      {/* Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-80 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(prod => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <Sprout className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">{t('noProductsFound')}</h3>
          <p className="text-xs text-slate-500">{t('noProductsSub')}</p>
        </div>
      )}
    </div>
  );
}
