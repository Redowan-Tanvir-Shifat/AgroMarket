import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import {
  Sprout, Search, Clock, ShieldCheck, MapPin, Zap, ArrowRight,
  TrendingDown, Sparkles, Award, CheckCircle2, ChevronRight, Truck
} from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');

  useEffect(() => {
    fetchHomeSummary();
  }, []);

  const fetchHomeSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products/home-summary');
      setSummaryData(res.data);
    } catch (err) {
      console.error('Failed to fetch home summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const featuredProducts = summaryData?.featured || [];
  const agingDeals = summaryData?.agingDeals || [];
  const categories = summaryData?.categories || [];

  // Filter products by selected division tab if clicked
  const displayedProducts = selectedDivision === 'ALL'
    ? featuredProducts
    : featuredProducts.filter(p => p.farm_division === selectedDivision);

  return (
    <div className="space-y-16 pb-20">

      {/* HERO SECTION */}
      <section className="relative hero-gradient text-white rounded-3xl overflow-hidden shadow-2xl mx-4 sm:mx-6 lg:mx-8 mt-4">
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Text & Search Content */}
          <div className="lg:col-span-7 space-y-6">

            {/* Top Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-800/80 border border-emerald-400/30 text-emerald-200 text-xs font-bold shadow-lg backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>{t('heroTag')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              মাঠের তাজা ফসল, <br />
              <span className="text-emerald-300 underline decoration-emerald-400/50 underline-offset-8">
                সরাসরি আপনার দরজায় 🌾
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl font-normal leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* Search Box */}
            <div className="pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery) window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                }}
                className="bg-white p-2 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 max-w-xl border border-emerald-200"
              >
                <div className="flex items-center gap-3 px-4 py-2 flex-1 w-full text-slate-800">
                  <Search className="w-5 h-5 text-emerald-600 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full text-sm font-medium focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl sm:rounded-2xl transition-all shadow-md hover:scale-[1.02] flex items-center justify-center gap-2 shrink-0"
                >
                  <span>{t('searchBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Quick Search Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-semibold text-emerald-200">
              <span className="opacity-80">জনপ্রিয় ফসল:</span>
              {['রাজশাহীর আম', 'দিনাজপুরের লিচু', 'মিনিকেট চাল', 'বগুড়ার আলু', 'কাঁচা মরিচ'].map(chip => (
                <button
                  key={chip}
                  onClick={() => window.location.href = `/products?search=${encodeURIComponent(chip)}`}
                  className="px-3 py-1 bg-emerald-800/60 hover:bg-white hover:text-emerald-950 rounded-full border border-emerald-500/30 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Right Hero Feature Badge */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/30 flex items-center justify-center text-white font-bold text-2xl border border-emerald-400/40">
                  🚜
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">বাংলাদেশ কৃষি নেটওয়ার্ক</h3>
                  <p className="text-xs text-emerald-200">৬৪ জেলায় সরাসরি কৃষক প্ল্যাটফর্ম</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="bg-emerald-950/40 p-4 rounded-2xl border border-white/10 text-center">
                  <div className="text-2xl font-black text-emerald-300">১২০+</div>
                  <div className="text-[11px] text-emerald-200 font-medium">নিবন্ধিত খামারি</div>
                </div>
                <div className="bg-emerald-950/40 p-4 rounded-2xl border border-white/10 text-center">
                  <div className="text-2xl font-black text-emerald-300">০%</div>
                  <div className="text-[11px] text-emerald-200 font-medium">সিন্ডিকেট ফি</div>
                </div>
                <div className="bg-emerald-950/40 p-4 rounded-2xl border border-white/10 text-center">
                  <div className="text-2xl font-black text-emerald-300">২৫-৩৫%</div>
                  <div className="text-[11px] text-emerald-200 font-medium">ক্রেতার সাশ্রয়</div>
                </div>
                <div className="bg-emerald-950/40 p-4 rounded-2xl border border-white/10 text-center">
                  <div className="text-2xl font-black text-emerald-300">২৪-৪৮h</div>
                  <div className="text-[11px] text-emerald-200 font-medium">তাজা ডেলিভারি</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANGLADESH SEASONS & CATEGORIES BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full mb-2">
              <Sprout className="w-4 h-4" />
              <span>বাংলাদেশের সেরা মৌসুমী ফসল</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('seasonTitle')}
            </h2>
          </div>
          <Link to="/products" className="text-emerald-700 hover:text-emerald-800 font-bold text-sm flex items-center gap-1 group">
            <span>{t('viewAll')}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Categories Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { id: 1, name: 'আম ও ফলমূল', icon: '🥭', desc: 'রাজশাহীর আম ও লিচু', slug: 'fruits' },
            { id: 2, name: 'চাল ও খাদ্যশস্য', icon: '🌾', desc: 'মিনিকেট ও নাজিরশাইল', slug: 'rice-grains' },
            { id: 3, name: 'শাকসবজি', icon: '🥦', desc: 'বগুড়ার আলু ও কাঁচামরিচ', slug: 'vegetables' },
            { id: 4, name: 'পেঁয়াজ ও মসলা', icon: '🧅', desc: 'পাবনার দেশি পেঁয়াজ', slug: 'spices' },
            { id: 5, name: 'দুগ্ধ ও ডিম', icon: '🥛', desc: 'খাঁটি গরুর দুধ ও ডিম', slug: 'dairy-eggs' },
          ].map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group bg-white p-5 rounded-3xl border border-emerald-100 hover:border-emerald-400 shadow-xs hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center justify-between"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-3xl flex items-center justify-center group-hover:scale-110 transition-transform mb-3 border border-emerald-100">
                {cat.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {cat.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* DYNAMIC PRODUCE AGING ENGINE ("WOW FACTOR") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-amber-500/10 via-emerald-50/50 to-white p-8 sm:p-10 rounded-3xl border border-amber-200/60 shadow-lg relative overflow-hidden">

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 border-b border-amber-200/50 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-xs">
                <Zap className="w-4 h-4 fill-white" />
                <span>বিশেষ ফিচার: রিয়েল-টাইম মূল্য হ্রাস (Price Aging Engine)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 pt-2">
                {t('agingTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                {t('agingSubtitle')}
              </p>
            </div>

            <div className="bg-white px-5 py-3 rounded-2xl border border-amber-300 shadow-xs text-center shrink-0">
              <div className="text-xs text-amber-800 font-bold">পচনজনিত ক্ষতি রোধে সাশ্রয়</div>
              <div className="text-xl font-black text-amber-600 flex items-center gap-1 justify-center">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                <span>১০% - ৫০% পর্যন্ত ছাড়</span>
              </div>
            </div>
          </div>

          {/* Aging Produce Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agingDeals.length > 0 ? (
              agingDeals.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))
            ) : (
              featuredProducts.slice(0, 4).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* DIVISIONS & ORIGIN DIRECT FARM CATALOG */}
      <section id="divisions" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            বাংলাদেশ কৃষি মানচিত্র
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t('divisionsTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            নির্দিষ্ট কৃষি অঞ্চল নির্বাচন করে সরাসরি ঐ এলাকার নিবন্ধিত কৃষকদের তাজা পণ্য ব্রাউজ করুন
          </p>
        </div>

        {/* Division Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'ALL', name: 'সকল অঞ্চল (All BD)' },
            { id: 'Rajshahi', name: '📍 রাজশাহী (আম ও ধান)' },
            { id: 'Rangpur', name: '📍 দিনাজপুর ও রংপুর (লিচু ও চাল)' },
            { id: 'Bogura', name: '📍 বগুড়া (সবজি ভান্ডার)' },
            { id: 'Dhaka', name: '📍 ঢাকা বিভাগ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDivision(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${selectedDivision === tab.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-slate-200 rounded-3xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* WHY CHOOSE AGROMARKET DIRECT FARMING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-emerald-950 text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-900/80 px-3.5 py-1.5 rounded-full border border-emerald-700">
              কৃষকের অধিকার • ক্রেতার স্বস্তি
            </span>
            <h2 className="text-2xl sm:text-4xl font-black leading-snug">
              কেন এগ্রোমার্কেটে সরাসরি কেনাকাটা করবেন?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
              ঐতিহ্যবাহী আড়তদার সিন্ডিকেটে কৃষকরা মাত্র ৪০-৫০% মূল্য পায়। এগ্রোমার্কেট সরাসরি ডিজিটাল সংযোগ তৈরি করে কৃষকের জন্য ১০০% ন্যায্য মূল্য এবং ক্রেতার জন্য ২৫-৩৫% সাশ্রয়ী দাম নিশ্চিত করে।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">জিরো ফড়িয়া কমিশন</h4>
                  <p className="text-xs text-emerald-300">কোনো মধ্যস্বত্বভোগী লভ্যাংশ নেই</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-white">বিকাশ/নগদ পেমেন্ট</h4>
                  <p className="text-xs text-emerald-300">সহজ ও সুরক্ষিত ডিজিটাল পেমেন্ট</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold rounded-2xl text-sm transition-all shadow-lg hover:scale-[1.02]"
              >
                কৃষক হিসেবে যুক্ত হন 🚜
              </Link>
              <Link
                to="/products"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-sm border border-white/20 transition-all"
              >
                পণ্য কেনাকাটা শুরু করুন 🛒
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-emerald-900/60 border border-emerald-800 p-6 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">কৃষক টেস্টিক্রিয়েশন</div>
              <blockquote className="text-xs sm:text-sm text-emerald-100 italic">
                "আগে রাজশাহীর আড়তে আম নিয়ে গেলে সিন্ডিকেট কম দাম দিত। এখন এগ্রোমার্কেটে সরাসরি ঢাকার ক্রেতাদের কাছে সঠিক দামে আম বিক্রি করছি।"
              </blockquote>
              <div className="text-xs font-bold text-white pt-2 border-t border-emerald-800/80">
                — মো: রফিকুল ইসলাম, পুঠিয়া, রাজশাহী 🥭
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
