import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Package,
  Clock,
  Sprout,
  ShieldCheck,
  PlusCircle,
  Layers,
  Truck,
  Wallet,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Star,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

export default function SellerDashboard() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedSellerId, setSelectedSellerId] = useState(() => {
    // If logged-in user is seller, default to their profile; otherwise demo seller 1
    return user?.sellerProfile?.id || 1;
  });

  useEffect(() => {
    fetchDashboardData(selectedSellerId);
  }, [selectedSellerId]);

  const fetchDashboardData = async (sellerId) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/seller/dashboard?sellerId=${sellerId}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load seller dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const seller = data?.seller || {};
  const kpis = data?.kpis || {};
  const recentOrders = data?.recentOrders || [];
  const urgentAlerts = data?.urgentAlerts || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Banner: Farm Header & Profile Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('verifiedFarm')}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {seller.farm_name || 'এগ্রোমার্কেট খামার'}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-200/90 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {seller.upazila ? `${seller.upazila}, ` : ''}{seller.district || 'রাজশাহী'} ({seller.division || 'Rajshahi'})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <strong className="text-white">{kpis.ratingAvg || 4.9}</strong> ({kpis.totalRatings || 15} {lang === 'bn' ? 'রিভিউ' : 'reviews'})
              </span>
              <span>•</span>
              <span className="text-emerald-300">
                {seller.farmer_name} ({seller.farmer_phone})
              </span>
            </div>
          </div>

          {/* Right Farm Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/storefront/${seller.id || selectedSellerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all shadow-xs"
            >
              <ExternalLink className="w-4 h-4 text-emerald-300" />
              <span>{t('viewMyStorefront')}</span>
            </Link>

            <Link
              to="/seller/products/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs transition-all shadow-lg hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('addNewCropBtn')}</span>
            </Link>
          </div>
        </div>

        {/* Demo Seller Switcher (for testing convenience) */}
        <div className="mt-6 pt-4 border-t border-emerald-800/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-emerald-300 font-semibold flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            {lang === 'bn' ? 'পরীক্ষামূলক কৃষক পরিবর্তন:' : 'Demo Seller Switcher:'}
          </span>
          {[
            { id: 1, name: 'রাজশাহী আম হাব (রফিকুল)' },
            { id: 2, name: 'দিনাজপুর লিচু ও চাল (তারিকুল)' },
            { id: 3, name: 'বগুড়া সবজি ভান্ডার (কালাম)' }
          ].map((demo) => (
            <button
              key={demo.id}
              onClick={() => setSelectedSellerId(demo.id)}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                selectedSellerId === demo.id
                  ? 'bg-emerald-400 text-emerald-950 shadow-xs'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800/80'
              }`}
            >
              {demo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI METRICS OVERVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{t('sellerRevenue')}</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                ৳{kpis.totalEarnings?.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {lang === 'bn' ? 'সরাসরি কৃষক ব্যাংক/বিকাশ' : '100% Direct Payout'}
              </p>
            </div>

            {/* Total Orders */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{t('sellerTotalOrders')}</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {kpis.totalOrders || 0}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'bn' ? 'সফলভাবে নিবন্ধিত ক্রয়' : 'Processed customer orders'}
              </p>
            </div>

            {/* Pending Dispatch Orders */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{t('sellerPendingOrders')}</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-600">
                {kpis.pendingOrders || 0}
              </div>
              <p className="text-[11px] text-amber-700 font-bold">
                {lang === 'bn' ? 'প্যাকেজিং ও প্রেরণের অপেক্ষায়' : 'Awaiting fulfillment'}
              </p>
            </div>

            {/* Active Crops Listed */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{t('sellerActiveCrops')}</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {kpis.activeCrops || 0}
              </div>
              <p className="text-[11px] text-purple-700 font-semibold">
                {lang === 'bn' ? 'লাইভ ডিজিটাল বাজারে প্রদর্শিত' : 'Live on marketplace'}
              </p>
            </div>

            {/* Spoilage Prevented (Dynamic Decay Engine Value) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">{t('sellerSpoilageSaved')}</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {kpis.estimatedWasteSavedKg || 120} kg
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">
                {lang === 'bn' ? 'ডাইনামিক মূল্যহ্রাসে রক্ষিত' : 'Saved via price decay'}
              </p>
            </div>
          </div>

          {/* QUICK ACTION TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/seller/products/new"
              className="p-5 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">{t('addNewCropBtn')}</h4>
                  <p className="text-xs text-emerald-100 font-normal">
                    {lang === 'bn' ? 'নতুন ফসল তালিকাভুক্ত করুন' : 'List new harvest'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/seller/inventory"
              className="p-5 rounded-3xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 transition-all shadow-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">{t('manageInventoryBtn')}</h4>
                  <p className="text-xs text-slate-500 font-normal">
                    {lang === 'bn' ? 'স্টক ও মেয়াদ পর্যবেক্ষণ' : 'Manage crop stocks'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
            </Link>

            <Link
              to="/seller/orders"
              className="p-5 rounded-3xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 transition-all shadow-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">{t('manageOrdersBtn')}</h4>
                  <p className="text-xs text-slate-500 font-normal">
                    {lang === 'bn' ? 'অর্ডার প্রস্তুত ও ডেলিভারি' : 'Fulfill & Dispatch'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
            </Link>

            <Link
              to="/seller/profile"
              className="p-5 rounded-3xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 transition-all shadow-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">{t('sellerProfileTitle')}</h4>
                  <p className="text-xs text-slate-500 font-normal">
                    {lang === 'bn' ? 'বিকাশ/নগদ পেমেন্ট সেটিংস' : 'Payout & Farm Details'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-400" />
            </Link>
          </div>

          {/* MAIN DASHBOARD CONTENT (2 COLUMNS: RECENT ORDERS & URGENT ALERTS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Recent Orders Stream */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {t('recentOrdersTitle')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'bn' ? 'সর্বশেষ প্রাপ্ত ক্রেতার অর্ডারসমূহ' : 'Live order stream from buyers'}
                  </p>
                </div>

                <Link
                  to="/seller/orders"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
                >
                  <span>{lang === 'bn' ? 'সকল অর্ডার দেখুন' : 'View All Orders'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <Package className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                  <p>{t('noRecentOrders')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-slate-900 text-sm font-mono">
                            {ord.order_number}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.order_status === 'PROCESSING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : ord.order_status === 'READY_FOR_PICKUP'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : ord.order_status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {t(`orderStatus${ord.order_status.charAt(0) + ord.order_status.slice(1).toLowerCase()}`) || ord.order_status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">
                          {t('buyerCustomer')}: <strong className="text-slate-800">{ord.buyer_name}</strong> ({ord.buyer_phone})
                        </p>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            {ord.fulfillment_type === 'PICKUP' ? (lang === 'bn' ? 'খামার থেকে সংগ্রহ' : 'Direct Pickup') : (lang === 'bn' ? 'কুরিয়ার ডেলিভারি' : 'Courier Delivery')}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        <span className="text-xs text-slate-500 font-medium">
                          {ord.total_quantity} {lang === 'bn' ? 'কেজি / ইউনিট' : 'items'}
                        </span>
                        <span className="text-base font-black text-slate-900">
                          ৳{parseFloat(ord.seller_subtotal || 0).toLocaleString()}
                        </span>
                        <Link
                          to="/seller/orders"
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-1"
                        >
                          {lang === 'bn' ? 'স্ট্যাটাস পরিবর্তন ➔' : 'Update Status ➔'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Spoilage & Urgent Stock Alerts */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 pb-3 border-b border-slate-100">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="text-sm font-extrabold">
                      {t('urgentAlertsTitle')}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'bn' ? 'মজুদ হ্রাস অথবা মূল্য ছাড় সক্রিয়' : 'Low stock or aging shelf-life alerts'}
                    </p>
                  </div>
                </div>

                {urgentAlerts.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t('noUrgentAlerts')}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {urgentAlerts.map(alertCrop => (
                      <div
                        key={alertCrop.id}
                        className="p-3.5 rounded-2xl border border-amber-200/70 bg-amber-50/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                            {lang === 'bn' ? alertCrop.title_bn : alertCrop.title}
                          </h5>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                            {alertCrop.stock_quantity <= alertCrop.low_stock_threshold
                              ? (lang === 'bn' ? 'স্বল্প স্টক' : 'Low Stock')
                              : (lang === 'bn' ? 'মূল্য ছাড়' : 'Aging Deal')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>{lang === 'bn' ? 'মজুদ:' : 'Stock:'} <strong>{alertCrop.stock_quantity} {alertCrop.unit}</strong></span>
                          <span>{lang === 'bn' ? 'বর্তমান দাম:' : 'Price:'} <strong className="text-emerald-700">৳{alertCrop.current_dynamic_price_bdt}</strong></span>
                        </div>

                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <Link
                            to="/seller/inventory"
                            className="font-bold text-emerald-700 hover:text-emerald-800"
                          >
                            {lang === 'bn' ? 'স্টক রিফিল করুন ➔' : 'Refill Stock ➔'}
                          </Link>
                          <Link
                            to={`/seller/products/${alertCrop.id}/edit`}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Pricing Engine Tip Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'bn' ? 'পচন রোধে ডাইনামিক প্রাইসিং টিপ' : 'Farmer Smart Tip'}</span>
                </div>
                <p className="text-xs text-emerald-800/90 leading-relaxed font-medium">
                  {lang === 'bn'
                    ? 'ফসল তোলার পর সময় বাড়ার সাথে সাথে দাম স্বয়ংক্রিয়ভাবে কমে যাওয়ায় অপচয় রোধ হয় এবং দ্রুত ক্রেতা আকর্ষণ করা যায়। সর্বনিম্ন ফ্লোর প্রাইস নিশ্চিত করে আপনার মুনাফা সুরক্ষিত থাকবে।'
                    : 'The dynamic decay engine reduces prices as harvest hours pass to prevent produce waste. Setting a realistic floor price guarantees your production costs remain fully protected.'}
                </p>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
