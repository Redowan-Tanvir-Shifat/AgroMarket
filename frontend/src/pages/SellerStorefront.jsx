import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import {
  ShieldCheck,
  MapPin,
  Star,
  Calendar,
  Phone,
  Package,
  Sprout,
  ArrowLeft,
  AlertTriangle,
  Award,
  CheckCircle2,
  Filter
} from 'lucide-react';

export default function SellerStorefront() {
  const { sellerId } = useParams();
  const { t, lang } = useLanguage();

  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchStorefront();
  }, [sellerId]);

  const fetchStorefront = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/seller/storefront/${sellerId}`);
      if (!res.ok) throw new Error('খামারের তথ্য পাওয়া যায়নি (Failed to load farm profile)');
      const data = await res.json();
      setSellerData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-semibold">{t('processing')}</p>
      </div>
    );
  }

  if (error || !sellerData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-rose-50 text-rose-700 p-8 rounded-3xl border border-rose-200">
          <AlertTriangle className="w-12 h-12 mx-auto text-rose-500 mb-3" />
          <h2 className="text-2xl font-bold mb-2">খামারের প্রোফাইল পাওয়া যায়নি</h2>
          <p className="text-slate-600 mb-6">{error || 'Seller storefront not found'}</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToCatalog')}
          </Link>
        </div>
      </div>
    );
  }

  const { seller, products, stats } = sellerData;

  // Filter products by category if selected
  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter(
          (p) =>
            p.category_name_en === selectedCategory ||
            p.category_slug === selectedCategory.toLowerCase()
        );

  const categories = ['ALL', ...Object.keys(stats.categories || {})];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link to="/" className="hover:text-emerald-700 transition-colors">
            {t('navHome')}
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-emerald-700 transition-colors">
            {t('navCatalog')}
          </Link>
          <span>/</span>
          <span className="text-emerald-950 font-bold truncate">{seller.farm_name}</span>
        </nav>
      </div>

      {/* Farmer Profile Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 rounded-3xl overflow-hidden shadow-xl text-white p-6 sm:p-10 border border-emerald-700">
          
          {/* Background Decorative Graphic */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 -bottom-16 w-60 h-60 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              
              {/* Farm Avatar / Icon */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white text-emerald-800 flex items-center justify-center font-black text-3xl sm:text-4xl shadow-lg shadow-black/20 border-4 border-emerald-500/30 shrink-0">
                <Sprout className="w-12 h-12 text-emerald-600" />
              </div>

              {/* Farm Details */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{seller.farm_name}</h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 backdrop-blur-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    {t('verifiedFarmer')}
                  </span>
                </div>

                <p className="text-sm text-emerald-200 font-medium">
                  {lang === 'bn' ? 'খামারি:' : 'Farmer Owner:'} <strong>{seller.farmer_name}</strong>
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100/90 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-300" />
                    <span>
                      {seller.upazila ? `${seller.upazila}, ` : ''}{seller.district}, {seller.division}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-300" />
                    <span>
                      {lang === 'bn' ? 'নিবন্ধিত:' : 'Member Since:'}{' '}
                      {new Date(seller.created_at || '2024-01-01').getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center gap-4 shrink-0">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-2xl">
                  <Star className="w-6 h-6 fill-amber-400" />
                  <span>{stats.ratingAvg.toFixed(1)}</span>
                </div>
                <span className="text-[11px] text-emerald-200 block mt-0.5">
                  {stats.totalRatings} {t('customerReviews')}
                </span>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-center">
                <span className="block font-black text-2xl text-white">{stats.totalProducts}</span>
                <span className="text-[11px] text-emerald-200 block mt-0.5">
                  {t('totalCropsListed')}
                </span>
              </div>
            </div>
          </div>

          {/* Farm Bio & Highlights */}
          {seller.bio && (
            <div className="relative z-10 mt-6 pt-5 border-t border-emerald-700/60 text-xs sm:text-sm text-emerald-100 leading-relaxed max-w-3xl">
              <p>{seller.bio}</p>
            </div>
          )}

          {/* Direct Farm Pickup Guarantee Badge */}
          <div className="relative z-10 mt-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-800/80 text-emerald-200 border border-emerald-600/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              {lang === 'bn' ? 'খামার থেকে সরাসরি সংগ্রহের সুবিধা (Pickup Available)' : 'Direct Farm Pickup Available'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-800/80 text-emerald-200 border border-emerald-600/50">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              {lang === 'bn' ? '১০০% ভেজালমুক্ত ফসল নিশ্চয়তা' : '100% Organic & Chemical Free Guarantee'}
            </span>
          </div>
        </div>
      </div>

      {/* Produce Catalog from this Farm */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-600" />
              <span>{t('allProduceFromFarm')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {filteredProducts.length} {lang === 'bn' ? 'টি তাজা ফসল বিক্রির জন্য উপলব্ধ' : 'crops ready for direct dispatch'}
            </p>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? (lang === 'bn' ? 'সকল ফসল' : 'All Crops') : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Sprout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-slate-800 mb-1">{t('noProductsFound')}</h3>
            <p className="text-xs text-slate-500">{t('noProductsSub')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
