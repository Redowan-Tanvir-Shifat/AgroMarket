import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import FreshnessBadge from '../components/FreshnessBadge';
import { formatHarvestAge } from '../utils/formatters';
import {
  Bookmark,
  ShoppingCart,
  Trash2,
  ShieldCheck,
  MapPin,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingDown
} from 'lucide-react';

export default function Wishlist() {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedItemIds, setAddedItemIds] = useState({});

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('agromarket_token');
      const res = await fetch('http://localhost:5000/api/wishlists', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to load wishlist');
      const data = await res.json();
      setWishlist(data.wishlist || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const token = localStorage.getItem('agromarket_token');
      await fetch(`http://localhost:5000/api/wishlists/${productId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      setWishlist((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1, product.unit || 'kg');
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
            <Bookmark className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {t('wishlistTitle')}
          </h1>
        </div>
        <p className="text-slate-500 text-sm">{t('wishlistSubtitle')}</p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">{t('processing')}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && wishlist.length === 0 && (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-emerald-100 shadow-sm space-y-5">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
            <Bookmark className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">{t('wishlistEmpty')}</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {lang === 'bn'
              ? 'পছন্দের তাজা ফসল সেভ করে রাখুন এবং রিয়েল-টাইম মূল্য হ্রাসের চমৎকার সুযোগ গ্রহণ করুন।'
              : 'Save fresh seasonal crops to monitor real-time age discounts and buy at peak prices.'}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all text-sm"
          >
            <span>{t('startShoppingBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Wishlist Produce Grid */}
      {!loading && wishlist.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => {
            const currentPrice = parseFloat(item.current_dynamic_price_bdt || item.base_price_bdt);
            const basePrice = parseFloat(item.base_price_bdt);
            const hasDiscount = currentPrice < basePrice;
            const savings = hasDiscount ? (basePrice - currentPrice) : 0;
            const harvestAgeFormatted = formatHarvestAge(item.age_in_days, lang);
            const displayTitle = lang === 'bn' && item.title_bn ? item.title_bn : item.title;

            return (
              <div
                key={item.wishlist_id || item.id}
                className="bg-white rounded-3xl overflow-hidden border border-emerald-100 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Section */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-rose-500 hover:text-rose-700 rounded-full shadow-md backdrop-blur-md transition-all"
                    title={t('removeItem')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* District Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 border border-white/50 shadow-sm flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item.farm_district || item.farm_division}</span>
                  </div>

                  {/* Freshness Badge */}
                  <div className="absolute bottom-3 right-3">
                    <FreshnessBadge
                      ageInDays={parseFloat(item.age_in_days)}
                      maxShelfLifeDays={item.max_shelf_life_days}
                      basePrice={basePrice}
                      currentPrice={currentPrice}
                    />
                  </div>

                  {/* Harvest Age Tag */}
                  <div className="absolute bottom-3 left-3 bg-emerald-950/80 backdrop-blur-md text-emerald-200 text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-emerald-500/30">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    <span>{harvestAgeFormatted} {lang === 'bn' ? 'আগে' : 'ago'}</span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Farm Name */}
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-emerald-800 truncate">{item.farm_name}</span>
                    </div>

                    {/* Title */}
                    <Link to={`/products/${item.id}`} className="block hover:text-emerald-700 transition-colors">
                      <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
                        {displayTitle}
                      </h3>
                    </Link>
                  </div>

                  {/* Price Breakdown */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-emerald-700">
                          ৳{currentPrice.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          / {t(item.unit) || item.unit}
                        </span>
                      </div>

                      {hasDiscount && (
                        <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          ৳{savings.toFixed(0)} {lang === 'bn' ? 'সাশ্রয়' : 'Off'}
                        </span>
                      )}
                    </div>

                    {/* Actions: Move to Cart */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className={`w-full mt-3 py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                        addedItemIds[item.id]
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white'
                      }`}
                    >
                      {addedItemIds[item.id] ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>{t('addedToCart')}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>{t('moveToCartBtn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
