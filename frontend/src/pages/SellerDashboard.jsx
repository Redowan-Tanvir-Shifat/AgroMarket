import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import FarmHeaderBanner from '../components/FarmHeaderBanner';
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
  ChevronRight,
  BarChart3,
  Award,
  Users,
  ShoppingBag,
  ArrowUpRight,
  Calendar
} from 'lucide-react';

export default function SellerDashboard() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const sellerIdParam = searchParams.get('sellerId');
  const [selectedSellerId, setSelectedSellerId] = useState(() => {
    if (sellerIdParam) {
      const parsed = parseInt(sellerIdParam);
      if (!isNaN(parsed)) return parsed;
    }
    // If logged-in user is seller, default to their profile; otherwise demo seller 1
    return user?.sellerProfile?.id || 1;
  });

  useEffect(() => {
    if (sellerIdParam) {
      const parsed = parseInt(sellerIdParam);
      if (!isNaN(parsed) && parsed !== selectedSellerId) {
        setSelectedSellerId(parsed);
      }
    }
  }, [sellerIdParam]);

  const [trendMode, setTrendMode] = useState('daily');
  const [chartMounted, setChartMounted] = useState(false);

  useEffect(() => {
    setChartMounted(false);
    const timer = setTimeout(() => setChartMounted(true), 50);
    return () => clearTimeout(timer);
  }, [trendMode, selectedSellerId, data]);

  useEffect(() => {
    fetchDashboardData(selectedSellerId);
  }, [selectedSellerId]);

  // Live real-time dashboard sync on incoming orders, fulfillment updates, or notifications
  useEffect(() => {
    if (!socket) return;
    if (selectedSellerId) {
      socket.emit('join_seller', selectedSellerId);
    }
    const handleLiveDashboardUpdate = () => {
      fetchDashboardData(selectedSellerId);
    };

    socket.on('new_order_alert', handleLiveDashboardUpdate);
    socket.on('order_status_updated', handleLiveDashboardUpdate);
    socket.on('new_notification', handleLiveDashboardUpdate);

    return () => {
      socket.off('new_order_alert', handleLiveDashboardUpdate);
      socket.off('order_status_updated', handleLiveDashboardUpdate);
      socket.off('new_notification', handleLiveDashboardUpdate);
    };
  }, [socket, selectedSellerId]);

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
  const insights = data?.insights || {};
  const recentOrders = data?.recentOrders || [];
  const urgentAlerts = data?.urgentAlerts || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Unified Farm Header Banner (Identical across Storefront, Profile & Dashboard) */}
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
        showBio={false}
        createdAt={seller.created_at}
        ratingAvg={kpis.ratingAvg || seller.rating_avg}
        totalRatings={kpis.totalRatings || seller.total_ratings}
        totalProducts={kpis.totalCrops}
        isSellerView={true}
        sellerId={seller.id || selectedSellerId}
        showAddCropButton={true}
        payoutMethod={seller.payout_method}
        payoutNumber={seller.payout_number}
      />

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
              to={`/seller/profile?sellerId=${selectedSellerId}`}
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

          {/* ========================================================= */}
          {/* SELLER BUSINESS INSIGHTS & PERFORMANCE ANALYTICS SECTION   */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-100 pb-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('sellerInsightsTag')}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <span>{t('sellerInsightsTitle')}</span>
                  <span className="text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-200 hidden sm:inline-block">
                    {lang === 'bn' ? 'লাইভ ডাটা' : 'Live Data'}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                  {t('sellerInsightsSubtitle')}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl shrink-0 self-start sm:self-center font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'bn' ? 'চলতি কৃষি মৌসুম ২০২৬' : 'Agri Season 2026'}</span>
              </div>
            </div>

            {/* 4 Insight Stat Metrics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              {/* Metric 1: Average Order Value */}
              <div className="p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>{t('avgOrderValueLabel')}</span>
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ৳{(insights.avgOrderValue || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  {lang === 'bn' ? 'প্রতি ক্রয়ে গড় বিক্রয় আয়' : 'Average basket size'}
                </p>
              </div>

              {/* Metric 2: Unique & Repeat Buyers */}
              <div className="p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>{t('repeatCustomerRateLabel')}</span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                  <span>{insights.repeatRate || 0}%</span>
                  <span className="text-xs text-slate-500 font-normal">
                    ({insights.uniqueBuyers || 0} {lang === 'bn' ? 'জন ক্রেতা' : 'buyers'})
                  </span>
                </div>
                <p className="text-[11px] text-blue-700 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  {lang === 'bn' ? 'পুনরাবৃত্ত গ্রাহক আস্থা' : 'Repeat customer loyalty'}
                </p>
              </div>

              {/* Metric 3: Delivery Channel Preference */}
              <div className="p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>{lang === 'bn' ? 'হোম ডেলিভারি শেয়ার' : 'Home Delivery Share'}</span>
                  <Truck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                  <span>{insights.fulfillment?.deliveryPercent || 0}%</span>
                  <span className="text-xs text-slate-500 font-normal">
                    ({insights.fulfillment?.deliveryCount || 0} {lang === 'bn' ? 'অর্ডার' : 'orders'})
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 font-semibold">
                  {insights.fulfillment?.pickupPercent || 0}% {lang === 'bn' ? 'খামার গেট থেকে সংগ্রহ' : 'Direct Gate Pickup'}
                </p>
              </div>

              {/* Metric 4: Spoilage Saved via Aging Engine */}
              <div className="p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs space-y-1.5 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>{lang === 'bn' ? 'পচন রোধে উদ্ধারকৃত আয়' : 'Spoilage Recovered BDT'}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  ৳{(insights.spoilageSavedBdt || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  {lang === 'bn' ? 'ডাইনামিক মূল্যছাড়ে বিক্রিত' : 'Saved from post-harvest waste'}
                </p>
              </div>
            </div>

            {/* 2-Column Main Insights Grid: Chart (Monthly Trend) & Leaderboard (Top Crops) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch">
              
              {/* Column 1: Revenue Trajectory Visualizer (7 cols) */}
              <div className="lg:col-span-7 bg-slate-50/60 border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-6 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>{trendMode === 'daily' ? (lang === 'bn' ? 'দৈনিক বিক্রয় ও রাজস্ব গতিপথ' : 'Daily Sales Trajectory') : t('revenueTrendTitle')}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {trendMode === 'daily'
                        ? (lang === 'bn' ? 'গত ৭ দিনের প্রকৃত বিক্রয় ও রাজস্ব' : 'Real sales & revenue over the past 7 days')
                        : (lang === 'bn' ? 'বিগত ৬ মাসের প্রকৃত বিক্রয় ও রাজস্ব' : 'Real sales & revenue over past 6 months')}
                    </p>
                  </div>

                  {/* Toggle Daily vs Monthly */}
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setTrendMode('daily')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        trendMode === 'daily'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'bn' ? 'দৈনিক (৭ দিন)' : 'Daily (7D)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendMode('monthly')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        trendMode === 'monthly'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'bn' ? 'মাসিক (৬ মাস)' : 'Monthly (6M)'}
                    </button>
                  </div>
                </div>

                {/* Styled Interactive Bar Plot with X & Y Axes */}
                <div className="pt-2">
                  {(() => {
                    const activeList = trendMode === 'daily' ? (insights.dailyTrends || []) : (insights.monthlyTrends || []);
                    const rawMax = Math.max(...activeList.map(x => x.revenue || 0), 0);
                    
                    // Nice Y-axis ceiling
                    const getNiceMax = (val) => {
                      if (!val || val <= 0) return 500;
                      if (val <= 100) return 100;
                      if (val <= 500) return Math.ceil(val / 50) * 50;
                      if (val <= 1000) return Math.ceil(val / 100) * 100;
                      if (val <= 5000) return Math.ceil(val / 500) * 500;
                      if (val <= 15000) return Math.ceil(val / 1000) * 1000;
                      return Math.ceil(val / 5000) * 5000;
                    };
                    const yMax = getNiceMax(rawMax);
                    const yMid = Math.round(yMax / 2);

                    return (
                      <div className="space-y-3">
                        {/* Y-Axis Label Header */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                          <span className="flex items-center gap-1 text-slate-700 font-bold">
                            <span>↑</span>
                            <span>{lang === 'bn' ? 'বিক্রয় ও আয় (টাকা ৳)' : 'Sales & Revenue (৳ BDT)'}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {lang === 'bn' ? 'স্কেল: শূন্য থেকে সর্বোচ্চ আয়' : 'Scale: 0 to Peak Earnings'}
                          </span>
                        </div>

                        {/* Chart Grid Container (Y-Axis + Plot Area) */}
                        <div className="flex items-stretch gap-2 sm:gap-3">
                          
                          {/* Y-Axis Scale Labels */}
                          <div className="w-12 sm:w-16 flex flex-col justify-between items-end text-[10px] sm:text-[11px] font-bold text-slate-400 pb-8 select-none shrink-0">
                            <span className="text-slate-700">৳{yMax.toLocaleString()}</span>
                            <span>৳{yMid.toLocaleString()}</span>
                            <span className="text-slate-400">৳0</span>
                          </div>

                          {/* Main Plot Area (Relative container with grid lines) */}
                          <div className="flex-1 flex flex-col">
                            <div className="relative h-48 sm:h-56 w-full border-b-2 border-slate-300">
                              
                              {/* Horizontal Grid Lines */}
                              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                                <div className="w-full border-t border-dashed border-slate-200" />
                                <div className="w-full border-t border-dashed border-slate-200" />
                                <div className="w-full" />
                              </div>

                              {/* Bars Flex Container */}
                              <div className="absolute inset-0 flex items-end justify-between gap-1.5 sm:gap-3 px-1 sm:px-2 z-10">
                                {activeList.map((m, idx) => {
                                  const rev = m.revenue || 0;
                                  const isZero = rev === 0;
                                  const heightPercent = isZero ? 0 : Math.min(100, Math.max(10, Math.round((rev / yMax) * 100)));
                                  
                                  return (
                                    <div
                                      key={idx}
                                      className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                                    >
                                      {/* Tooltip on hover */}
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-xl text-center pointer-events-none mb-1 whitespace-nowrap z-30 absolute bottom-full">
                                        <div className="flex items-center justify-center gap-1">
                                          <span className="block text-emerald-400 font-black">৳{rev.toLocaleString()}</span>
                                          {m.isCurrent && (
                                            <span className="text-[9px] bg-emerald-500 text-slate-900 font-black px-1.5 py-0.2 rounded-full">
                                              {lang === 'bn' ? 'আজ' : 'Today'}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-slate-300 font-normal block">
                                          {m.orders || 0} {lang === 'bn' ? 'টি অর্ডার' : 'orders'}
                                        </span>
                                      </div>

                                      {/* Consistent Header Zone Above Bar */}
                                      <div className="h-5 flex items-center justify-center mb-1 w-full pointer-events-none">
                                        {!isZero ? (
                                          <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-800 truncate max-w-full">
                                            ৳{rev >= 1000 ? `${(rev/1000).toFixed(1)}k` : rev}
                                          </span>
                                        ) : m.isCurrent ? (
                                          <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-tighter">
                                            {lang === 'bn' ? 'আজ' : 'Live'}
                                          </span>
                                        ) : null}
                                      </div>

                                      {/* Unified Vertical Bar Track Slot & Animated Bar */}
                                      <div className={`w-full max-w-[32px] sm:max-w-[44px] flex-1 flex flex-col justify-end items-center rounded-t-xl p-0.5 overflow-hidden transition-all ${
                                        m.isCurrent
                                          ? 'bg-emerald-50/80 border border-emerald-300/80 shadow-xs'
                                          : 'bg-slate-100/60'
                                      }`}>
                                        <div
                                          style={{
                                            height: chartMounted ? (isZero ? '4px' : `${heightPercent}%`) : '4px'
                                          }}
                                          className={`w-full rounded-t-lg transition-[height] duration-700 ease-out shadow-xs ${
                                            isZero
                                              ? m.isCurrent
                                                ? 'bg-emerald-400/80 animate-pulse'
                                                : 'bg-slate-300/80'
                                              : 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 hover:from-emerald-700 hover:to-emerald-500'
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                            </div>

                            {/* X-Axis Day/Date Labels below Base Line */}
                            <div className="flex items-start justify-between gap-1.5 sm:gap-3 px-1 sm:px-2 pt-2">
                              {activeList.map((m, idx) => (
                                <div key={idx} className="flex-1 text-center flex flex-col items-center">
                                  <span className={`block text-[10px] sm:text-[11px] font-bold truncate w-full ${
                                    m.isCurrent
                                      ? 'text-emerald-700 font-black'
                                      : (m.revenue || 0) === 0
                                      ? 'text-slate-400 font-medium'
                                      : 'text-slate-700'
                                  }`}>
                                    {lang === 'bn' ? (m.labelBn || m.month) : (m.label || m.month)}
                                  </span>
                                  {m.isCurrent && trendMode === 'daily' && (
                                    <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 border border-emerald-300/80 px-1.5 py-0.2 rounded-full mt-0.5 leading-tight">
                                      {lang === 'bn' ? 'আজ' : 'Today'}
                                    </span>
                                  )}
                                  {m.isCurrent && trendMode === 'monthly' && (
                                    <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 border border-emerald-300/80 px-1.5 py-0.2 rounded-full mt-0.5 leading-tight">
                                      {lang === 'bn' ? 'চলতি' : 'Current'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>


                          </div>
                        </div>

                        {/* Chart Bottom Legend / Subtitle */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1 font-medium border-t border-slate-100">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <span>→</span>
                            <span>
                              {trendMode === 'daily'
                                ? (lang === 'bn' ? 'X-অক্ষ: গত ৭ দিনের তারিখ' : 'X-Axis: Past 7 Days')
                                : (lang === 'bn' ? 'X-অক্ষ: মৌসুমের বিগত ৬ মাস' : 'X-Axis: Past 6 Months')}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            {trendMode === 'daily'
                              ? (lang === 'bn' ? '১০ সেপ্টেম্বর (আজকের লাইভ বিক্রয়)' : 'Today 10 Sep (Live)')
                              : (lang === 'bn' ? 'সেপ্টেম্বর ২০২৬ (চলতি মাস)' : 'Sep 2026 (Current Month)')}
                          </span>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Column 2: Top Performing Crops Leaderboard (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50/60 border border-slate-200/80 rounded-3xl p-6 sm:p-7 space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>{t('topSellingCropsTitle')}</span>
                      {(insights.topProducts?.length || 0) > 0 && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {insights.topProducts.length}
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {lang === 'bn' ? 'রাজস্ব অনুযায়ী' : 'By Revenue'}
                    </span>
                  </div>

                  {/* Leaderboard List (Scrollable for 5 to 30+ items) */}
                  <div className="max-h-[300px] sm:max-h-[340px] overflow-y-auto pr-1.5 space-y-3.5 pt-3 focus:outline-none">
                    {(insights.topProducts && insights.topProducts.length > 0) ? (
                      insights.topProducts.map((crop, idx) => (
                        <div key={crop.productId || idx} className="space-y-1.5 pt-1 first:pt-0">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                                  : idx === 1
                                  ? 'bg-slate-200 text-slate-800'
                                  : idx === 2
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-800 truncate" title={crop.title}>
                                {crop.title}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-black text-emerald-700">৳{crop.revenue.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-500 block">
                                {crop.quantitySold} {crop.unit}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar showing Revenue Share */}
                          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.max(8, crop.revenueShare)}%` }}
                              className={`h-full rounded-full ${
                                idx === 0
                                  ? 'bg-emerald-600'
                                  : idx === 1
                                  ? 'bg-teal-500'
                                  : idx === 2
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-400'
                              }`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        <Package className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                        <p>{lang === 'bn' ? 'এখনো কোনো ফসল বিক্রি হয়নি' : 'No sales recorded yet'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {(insights.topProducts?.length || 0) > 4
                      ? (lang === 'bn' ? 'সকল ফসল দেখতে স্ক্রোল করুন' : 'Scroll to view all items')
                      : (lang === 'bn' ? 'শীর্ষ ফসল মোট বিক্রয়ের অধিকাংশ ভূমিকা রাখে' : 'Top produce accounts for core revenue')}
                  </span>
                  <Link to="/seller/inventory" className="text-emerald-700 hover:text-emerald-800 font-bold">
                    {lang === 'bn' ? 'ইনভেন্টরি ➔' : 'Inventory ➔'}
                  </Link>
                </div>
              </div>

            </div>

            {/* Bottom Dual Sub-Cards: Fulfillment Channel Split & Dynamic Pricing Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {/* Sub-Card A: Delivery Channels */}
              <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>{t('fulfillmentChannelsTitle')}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {lang === 'bn'
                      ? `${insights.fulfillment?.deliveryPercent || 0}% হোম কুরিয়ার ডেলিভারি বনাম ${insights.fulfillment?.pickupPercent || 0}% সরাসরি খামার গেট সংগ্রহ`
                      : `${insights.fulfillment?.deliveryPercent || 0}% Courier Delivery vs ${insights.fulfillment?.pickupPercent || 0}% Farm Gate Direct Pickup`}
                  </p>
                </div>
                
                {/* Visual Dual-Color Channel Bar */}
                <div className="w-full sm:w-44 space-y-1 shrink-0">
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${insights.fulfillment?.deliveryPercent || 50}%` }}
                      className="bg-emerald-500 h-full"
                      title="Courier Delivery"
                    />
                    <div
                      style={{ width: `${insights.fulfillment?.pickupPercent || 50}%` }}
                      className="bg-purple-500 h-full"
                      title="Farm Gate Pickup"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-emerald-700 font-bold">{t('homeCourierLabel')}</span>
                    <span className="text-purple-700 font-bold">{t('farmGatePickupLabel')}</span>
                  </div>
                </div>
              </div>

              {/* Sub-Card B: Dynamic Aging Pricing ROI */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span>{t('agingSavingsTitle')}</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    {lang === 'bn'
                      ? `স্বয়ংক্রিয় মূল্যহ্রাসে মোট ৳${(insights.spoilageSavedBdt || 0).toLocaleString()} মূল্যের ফসল অপচয় রোধ করে বিক্রি করা হয়েছে।`
                      : `Recovered ৳${(insights.spoilageSavedBdt || 0).toLocaleString()} revenue by accelerating sales before harvest expiration.`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                    100% {lang === 'bn' ? 'ফ্লোর প্রটেকশন' : 'Floor Protected'}
                  </span>
                </div>
              </div>
            </div>

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
                            ord.order_status === 'DELIVERED' && ord.payment_method === 'COD' && ord.payment_status === 'PENDING'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : ord.order_status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : ord.order_status === 'PROCESSING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : ord.order_status === 'READY_FOR_PICKUP'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {ord.order_status === 'DELIVERED' && ord.payment_method === 'COD' && ord.payment_status === 'PENDING'
                              ? (lang === 'bn' ? 'ডেলিভারি (পেমেন্ট বকেয়া)' : 'Delivered (Unpaid)')
                              : (t(`orderStatus${ord.order_status.charAt(0) + ord.order_status.slice(1).toLowerCase()}`) || ord.order_status)}
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
