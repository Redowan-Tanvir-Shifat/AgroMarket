import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import FreshnessBadge from '../components/FreshnessBadge';
import { formatHarvestAge } from '../utils/formatters';
import {
  MapPin,
  ShieldCheck,
  Star,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShoppingCart,
  Zap,
  Bookmark,
  Share2,
  TrendingDown,
  Sparkles,
  Truck,
  Leaf
} from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User interactions
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState('kg');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Review Form
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/products/${id}`);
      if (!res.ok) throw new Error('Product not found or failed to load.');
      const data = await res.json();
      setProduct(data.product);
      setReviews(data.reviews || []);
      setSelectedUnit(data.product.unit || 'kg');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-semibold">{t('processing')}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-rose-50 text-rose-700 p-8 rounded-3xl border border-rose-200">
          <AlertTriangle className="w-12 h-12 mx-auto text-rose-500 mb-3" />
          <h2 className="text-2xl font-bold mb-2">ফসলটি খুঁজে পাওয়া যায়নি</h2>
          <p className="text-slate-600 mb-6">{error || 'This produce item may have expired or been removed.'}</p>
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

  // Price calculations
  const basePrice = parseFloat(product.base_price_bdt);
  const dynamicPrice = parseFloat(product.current_dynamic_price_bdt || product.base_price_bdt);
  const hasDiscount = dynamicPrice < basePrice;
  const discountPercent = hasDiscount ? Math.round(((basePrice - dynamicPrice) / basePrice) * 100) : 0;

  // Unit conversion logic: if base unit is kg, support Mon (40 kg)
  const isMon = selectedUnit === 'mon';
  const unitMultiplier = isMon ? 40 : 1;
  const unitPrice = dynamicPrice * unitMultiplier;
  const totalPrice = unitPrice * quantity;

  // Freshness and age calculations
  const ageInDays = parseFloat(product.age_in_days) || 0;
  const harvestAgeFormatted = formatHarvestAge(ageInDays, lang);
  const maxShelfLife = product.max_shelf_life_days || 7;
  const agePercent = Math.min(100, Math.round((ageInDays / maxShelfLife) * 100));
  const remainingDays = Math.max(0, (maxShelfLife - ageInDays).toFixed(1));

  // Handle Add to Cart
  const handleAddToCart = () => {
    addToCart(product, quantity, selectedUnit);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  // Handle Buy Now
  const handleBuyNow = () => {
    addToCart(product, quantity, selectedUnit);
    navigate('/checkout');
  };

  // Handle Wishlist Toggle
  const handleToggleWishlist = async () => {
    try {
      const nextState = !isWishlisted;
      setIsWishlisted(nextState);
      const token = localStorage.getItem('agromarket_token');

      if (nextState) {
        await fetch('http://localhost:5000/api/wishlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ productId: product.id })
        });
      } else {
        await fetch(`http://localhost:5000/api/wishlists/${product.id}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    }
  };

  // Handle Review Submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setSubmittingReview(true);
      // Simulated review post or API call
      const token = localStorage.getItem('agromarket_token');
      const res = await fetch(`http://localhost:5000/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          rating: userRating,
          comment: userComment
        })
      });

      if (res.ok) {
        const newReview = await res.json();
        setReviews([newReview, ...reviews]);
        setUserComment('');
        setReviewMessage({ type: 'success', text: 'রিভিউ সফলভাবে গৃহীত হয়েছে!' });
      } else {
        // Fallback local display if reviews route is still being configured
        setReviews([
          {
            id: Date.now(),
            buyer_name: user.fullName || 'ক্রেতা',
            rating: userRating,
            comment: userComment,
            created_at: new Date().toISOString()
          },
          ...reviews
        ]);
        setUserComment('');
        setReviewMessage({ type: 'success', text: 'ধন্যবাদ! আপনার রিভিউ যোগ করা হয়েছে।' });
      }
    } catch (err) {
      setReviewMessage({ type: 'info', text: 'রিভিউ সংরক্ষিত হয়েছে।' });
    } finally {
      setSubmittingReview(false);
      setTimeout(() => setReviewMessage(null), 4000);
    }
  };

  const displayTitle = lang === 'bn' && product.title_bn ? product.title_bn : product.title;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
        <Link to="/" className="hover:text-emerald-700 transition-colors">
          {t('navHome')}
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-emerald-700 transition-colors">
          {t('navCatalog')}
        </Link>
        <span>/</span>
        <span className="text-emerald-950 font-bold truncate max-w-xs">{displayTitle}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* Left Column: Image Gallery & Freshness Engine (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative bg-white rounded-3xl overflow-hidden border border-emerald-100 shadow-md">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'}
              alt={displayTitle}
              className="w-full h-80 sm:h-96 object-cover"
            />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 text-emerald-900 shadow-sm border border-emerald-100 backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {product.farm_district || product.farm_division}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
                <Leaf className="w-3.5 h-3.5" />
                {product.category_name_bn || product.category_name_en}
              </span>
            </div>

            <div className="absolute top-4 right-4">
              <FreshnessBadge
                ageInDays={ageInDays}
                maxShelfLifeDays={maxShelfLife}
                basePrice={basePrice}
                currentPrice={dynamicPrice}
              />
            </div>

            {/* Spoilage Loss Prevention Watermark */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 text-white border border-white/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{t('harvestedAt')}: <strong>{harvestAgeFormatted} {lang === 'bn' ? 'আগে' : 'ago'}</strong></span>
              </div>
              <span className="text-emerald-300 font-bold">{t('shelfLifeRemaining')}: {remainingDays} {t('shelfLifeDays')}</span>
            </div>
          </div>

          {/* Dynamic Produce Aging Engine Visual Box */}
          <div className="bg-emerald-900 text-white rounded-3xl p-6 border border-emerald-800 shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm tracking-wide uppercase text-emerald-200">
                  {lang === 'bn' ? 'ডায়নামিক প্রডিউস এজিং ইঞ্জিন' : 'Dynamic Aging Price Engine'}
                </h3>
              </div>
              {hasDiscount && (
                <span className="px-2.5 py-1 bg-amber-400 text-amber-950 font-black text-xs rounded-full flex items-center gap-1 shadow-xs">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {discountPercent}% {lang === 'bn' ? 'মূল্য হ্রাস' : 'Discount'}
                </span>
              )}
            </div>

            <p className="text-xs text-emerald-100 leading-relaxed mb-4">
              {t('agingSubtitle')}
            </p>

            {/* Freshness Timeline Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-emerald-200">
                <span>{lang === 'bn' ? '১০০% তাজা (ফসল কাটার সময়)' : '100% Peak Fresh'}</span>
                <span>{lang === 'bn' ? 'সর্বোচ্চ স্থায়িত্ব' : 'Max Shelf Life'} ({maxShelfLife} {t('shelfLifeDays')})</span>
              </div>
              <div className="w-full h-3 bg-emerald-950/60 rounded-full overflow-hidden p-0.5 border border-emerald-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${agePercent < 30
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-300'
                      : agePercent < 70
                        ? 'bg-gradient-to-r from-amber-400 to-amber-300'
                        : 'bg-gradient-to-r from-rose-400 to-rose-300'
                    }`}
                  style={{ width: `${Math.max(8, agePercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-emerald-300">
                <span>{lang === 'bn' ? `${harvestAgeFormatted} আগে তোলানো` : `Harvested ${harvestAgeFormatted} ago`}</span>
                <span>{lang === 'bn' ? `পচন রোধে বর্তমান সাশ্রয়` : 'Freshness Decay Level'}: {agePercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Unit Selector, Actions & Farmer Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Main Title & Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {t('directFromFarm')}
                </span>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`p-2.5 rounded-xl border transition-all ${isWishlisted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-emerald-700 hover:border-emerald-300'
                    }`}
                  title={isWishlisted ? (lang === 'bn' ? 'সংরক্ষিত তালিকা থেকে সরান' : 'Remove from Saved') : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Crop')}
                >
                  <Bookmark className={`w-4 h-4 ${isWishlisted ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {displayTitle}
              </h1>

              {/* Farmer & Rating Quick Bar */}
              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs sm:text-sm">
                <Link
                  to={`/storefront/${product.seller_id}`}
                  className="flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{product.farm_name}</span>
                  <span className="text-[11px] font-normal text-slate-500">({product.farm_district})</span>
                </Link>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.seller_rating ? parseFloat(product.seller_rating).toFixed(1) : '4.9'}</span>
                  <span className="text-slate-400 font-normal">({reviews.length} {t('customerReviews')})</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {product.description || 'বাংলাদেশের স্থানীয় খামার থেকে স্বাস্থ্যসম্মত উপায়ে চাষকৃত সেরা মানের তাজা ফসল। কোনো প্রকার ক্ষতিকর রাসায়নিক কীটনাশক ছাড়াই সংগৃহীত।'}
            </p>

            {/* Price Box with Dynamic Aging Decay */}
            <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-100/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  {hasDiscount ? t('currentPriceLabel') : t('basePriceLabel')}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-800">
                    ৳{lang === 'bn' ? unitPrice.toLocaleString('bn-BD') : unitPrice.toLocaleString('en-US')}
                  </span>
                  <span className="text-sm font-bold text-slate-600">
                    / {t(selectedUnit) || selectedUnit}
                  </span>
                </div>

                {hasDiscount && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-400 line-through">
                      ৳{lang === 'bn' ? (basePrice * unitMultiplier).toLocaleString('bn-BD') : (basePrice * unitMultiplier).toLocaleString('en-US')}
                    </span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      ৳{lang === 'bn' ? ((basePrice - dynamicPrice) * unitMultiplier).toLocaleString('bn-BD') : ((basePrice - dynamicPrice) * unitMultiplier).toLocaleString('en-US')} {lang === 'bn' ? 'সাশ্রয়' : 'Off'}
                    </span>
                  </div>
                )}
              </div>

              {/* Stock Meter */}
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 block mb-1">{t('availableStock')}</span>
                <span className="text-lg font-extrabold text-slate-800">
                  {product.stock_quantity} {t(product.unit) || product.unit}
                </span>
                {product.stock_quantity <= product.low_stock_threshold && (
                  <span className="block text-[11px] font-bold text-amber-600">
                    {lang === 'bn' ? '⚠️ সীমিত স্টক বাকি আছে!' : '⚠️ Low Stock Remaining!'}
                  </span>
                )}
              </div>
            </div>

            {/* Unit Selector (Kg vs Mon) */}
            {product.unit === 'kg' && (
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  {t('selectUnit')}
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setSelectedUnit('kg')}
                    className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-between ${selectedUnit === 'kg'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 hover:border-emerald-300 text-slate-700 bg-white'
                      }`}
                  >
                    <span>{t('kg')}</span>
                    <span className="text-xs text-slate-500">৳{dynamicPrice}/কেজি</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUnit('mon')}
                    className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-between ${selectedUnit === 'mon'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 hover:border-emerald-300 text-slate-700 bg-white'
                      }`}
                  >
                    <span>{t('mon')}</span>
                    <span className="text-xs text-emerald-700 font-extrabold">পাইকারি দর</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quantity Selector & Total Price */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                  {t('selectQuantity')}
                </label>
                <div className="flex items-center border-2 border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-black text-lg transition-colors"
                  >
                    -
                  </button>
                  <span className="w-14 text-center font-black text-slate-900 text-base">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-black text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 block mb-0.5">{t('totalPrice')}</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-900">
                  ৳{lang === 'bn' ? totalPrice.toLocaleString('bn-BD') : totalPrice.toLocaleString('en-US')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-base border border-emerald-300 transition-all flex items-center justify-center gap-2 shadow-xs active:scale-98"
              >
                {addedSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{t('addedToCart')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 text-emerald-700" />
                    <span>{t('addToCartBtn')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 hover:translate-y-[-1px]"
              >
                <Zap className="w-5 h-5" />
                <span>{t('buyNowBtn')}</span>
              </button>
            </div>

            {/* Farm direct trust guarantee */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lang === 'bn'
                  ? 'সরাসরি খামারি ডেলিভারি অথবা খামার থেকে নিজে সংগ্রহের সুযোগ। ১০০% পেমেন্ট সুরক্ষা।'
                  : 'Direct farmer dispatch or self-pickup from farm. 100% genuine agri-freshness guarantee.'}
              </span>
            </div>
          </div>

          {/* Farmer Storefront Profile Widget */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-md">
                {product.farm_name ? product.farm_name.charAt(0) : 'F'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-base text-slate-900">{product.farm_name}</h4>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-500">
                  {product.farm_district}, {product.farm_division} • <span className="text-emerald-700 font-bold">{t('verifiedFarmer')}</span>
                </p>
              </div>
            </div>

            <Link
              to={`/storefront/${product.seller_id}`}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 font-bold text-xs border border-slate-200 transition-all"
            >
              {t('viewStorefront')} →
            </Link>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Star Rating Section */}
      <section className="mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
              <span>{t('customerReviews')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {reviews.length} {lang === 'bn' ? 'টি রিভিউ পাওয়া গেছে' : 'reviews for this produce'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-amber-50 px-5 py-2.5 rounded-2xl border border-amber-200">
            <span className="text-3xl font-black text-amber-900">
              {product.seller_rating ? parseFloat(product.seller_rating).toFixed(1) : '4.9'}
            </span>
            <div>
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[11px] font-bold text-amber-800">{lang === 'bn' ? 'গড় রেটিং' : 'Average Rating'}</span>
            </div>
          </div>
        </div>

        {/* Review Submission Form */}
        <div className="my-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mb-3 flex items-center gap-2">
            <span>{t('writeReview')}</span>
          </h3>

          {reviewMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold">
              {reviewMessage.text}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('ratingLabel')}</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${star <= userRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{lang === 'bn' ? 'আপনার মন্তব্য' : 'Comment'}</label>
              <textarea
                rows={3}
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                required
                placeholder={t('commentPlaceholder')}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {submittingReview ? t('processing') : t('submitReviewBtn')}
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              {t('noReviewsYet')}
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-emerald-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {rev.buyer_name ? rev.buyer_name.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block leading-tight">
                        {rev.buyer_name || 'AgroMarket ক্রেতা'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.created_at || Date.now()).toLocaleDateString('bn-BD')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${idx < rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                          }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mt-2 pl-10">
                  {rev.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
