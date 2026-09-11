import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import FarmHeaderBanner from '../components/FarmHeaderBanner';
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
  Filter,
  User
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

      {/* Farmer Profile Hero Banner (Unified Modern Component with 100% Clear Cover Photo) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <FarmHeaderBanner
          farmName={seller.farm_name}
          farmerName={seller.farmer_name}
          farmerPhone={seller.farmer_phone}
          coverImageUrl={seller.cover_image_url}
          logoImageUrl={seller.logo_image_url}
          ownerImageUrl={seller.owner_image_url || seller.farmer_avatar}
          division={seller.division}
          district={seller.district}
          upazila={seller.upazila}
          address={seller.address}
          bio={seller.bio}
          createdAt={seller.created_at}
          ratingAvg={stats.ratingAvg}
          totalRatings={stats.totalRatings}
          totalProducts={stats.totalProducts}
          isSellerView={false}
          sellerId={sellerId}
        />

        {/* Direct Farm Pickup & Trust Guarantees */}
        <div className="flex flex-wrap items-center gap-3 text-xs mb-8 -mt-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'bn' ? 'খামার থেকে সরাসরি সংগ্রহের সুবিধা (Pickup Available)' : 'Direct Farm Gate Pickup Available'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-2xs">
            <Award className="w-4 h-4 text-amber-600" />
            <span>{lang === 'bn' ? '১০০% ভেজালমুক্ত ও রাসায়নিকমুক্ত ফসল নিশ্চয়তা' : '100% Organic & Chemical Free Guarantee'}</span>
          </span>
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
