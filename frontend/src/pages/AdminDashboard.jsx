import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Sprout,
  Package,
  Wallet,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  FileText,
  Truck,
  Sparkles,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isConnected, onlineUsersCount } = useSocket();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('VERIFICATION'); // 'VERIFICATION' | 'DECAY_RADAR' | 'ORDERS' | 'REGIONS'
  const [overview, setOverview] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [decayProducts, setDecayProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellerStatusFilter, setSellerStatusFilter] = useState('ALL');
  const [searchSeller, setSearchSeller] = useState('');

  // Action states for Farmer Verification
  const [actionInProgress, setActionInProgress] = useState(null);
  const [rejectionModalSeller, setRejectionModalSeller] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionSuccessNotice, setActionSuccessNotice] = useState(null);

  // Fetch admin dashboard data
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // 1. Overview KPIs
      const overviewRes = await fetch('http://localhost:5000/api/admin/overview', { headers });
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data);
      }

      // 2. Sellers list
      const sellersRes = await fetch('http://localhost:5000/api/admin/sellers', { headers });
      if (sellersRes.ok) {
        const data = await sellersRes.json();
        setSellers(data.sellers || []);
      }

      // 3. Price decay radar
      const decayRes = await fetch('http://localhost:5000/api/admin/price-decay-radar', { headers });
      if (decayRes.ok) {
        const data = await decayRes.json();
        setDecayProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAdminData();
  }, [user]);

  // Handle Verify / Reject Seller
  const handleUpdateStatus = async (sellerId, newStatus, notes = '') => {
    try {
      setActionInProgress(sellerId);
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/admin/sellers/${sellerId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, notes })
      });

      if (!res.ok) throw new Error('Failed to update status');

      // Update local state
      setSellers((prev) =>
        prev.map((s) =>
          s.id === sellerId ? { ...s, verification_status: newStatus, verification_notes: notes } : s
        )
      );

      // Refresh overview
      const overviewRes = await fetch('http://localhost:5000/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data);
      }

      setActionSuccessNotice(
        lang === 'bn'
          ? `খামার #${sellerId} এর স্ট্যাটাস সফলভাবে '${newStatus}' করা হয়েছে!`
          : `Farm #${sellerId} status updated to '${newStatus}' successfully!`
      );
      setTimeout(() => setActionSuccessNotice(null), 4000);
      setRejectionModalSeller(null);
      setRejectionNote('');
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Filter sellers
  const filteredSellers = sellers.filter((s) => {
    const matchesFilter =
      sellerStatusFilter === 'ALL' || s.verification_status === sellerStatusFilter;
    const matchesSearch =
      s.farm_name.toLowerCase().includes(searchSeller.toLowerCase()) ||
      (s.owner_name && s.owner_name.toLowerCase().includes(searchSeller.toLowerCase())) ||
      (s.owner_phone && s.owner_phone.includes(searchSeller)) ||
      (s.district && s.district.toLowerCase().includes(searchSeller.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // If not admin
  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="bg-amber-50 p-8 rounded-3xl border border-amber-200 text-amber-900 space-y-4 shadow-md">
          <ShieldAlert className="w-12 h-12 mx-auto text-amber-600" />
          <h2 className="text-xl font-black">
            {lang === 'bn' ? 'প্রবেশাধিকার সংরক্ষিত' : 'Restricted Admin Access'}
          </h2>
          <p className="text-xs text-amber-800 leading-relaxed">
            {lang === 'bn'
              ? 'এই ড্যাশবোর্ডটি শুধুমাত্র প্ল্যাটফর্ম অ্যাডমিনদের জন্য। অ্যাডমিন অ্যাকাউন্টে লগইন করতে নিচের বাটনে ক্লিক করুন।'
              : 'This governance hub is only accessible by platform administrators. Please sign in with an admin account (phone: 01700000000).'}
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all"
          >
            {lang === 'bn' ? 'অ্যাডমিন লগইন' : 'Admin Login'}
          </Link>
        </div>
      </div>
    );
  }

  const stats = overview?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Banner with Live Real-time Status */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/60 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'bn' ? 'প্ল্যাটফর্ম অডিট ও গভর্নেন্স' : 'Governance & Audit Core'}</span>
              </span>
              {isConnected && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-white/10 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-time Sync</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {lang === 'bn'
                ? 'এগ্রোমার্কেট সেন্ট্রাল কন্ট্রোল হাব'
                : 'AgroMarket Platform Governance Hub'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-2xl">
              {lang === 'bn'
                ? 'খামারিদের এনআইডি ও ট্রেড লাইসেন্স যাচাইকরণ, ফসল শেলফ-লাইফ ডাইনামিক প্রাইসিং ও প্ল্যাটফর্ম অর্ডার পর্যবেক্ষণ'
                : 'Farmer credentials verification, harvest price decay curves radar, and platform transaction audit'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchAdminData}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/15 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* 2. Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Farmers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'নিবন্ধিত খামারি' : 'Total Farmers'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalFarmers || 0}</div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span className="text-emerald-700 font-bold">{stats.verifiedFarmers || 0} যাচাইকৃত</span>
              <span>•</span>
              <span className="text-amber-600 font-bold">{stats.pendingFarmers || 0} অপেক্ষমাণ</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Buyers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'মোট ভোক্তা ও ক্রেতা' : 'Total Buyers'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.totalBuyers || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {lang === 'bn' ? 'সরাসরি খামার থেকে ক্রয়কারী' : 'Direct farm consumer base'}
            </p>
          </div>
        </div>

        {/* Metric 3: Orders & GMV */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'প্ল্যাটফর্ম লেনদেন (GMV)' : 'Gross Volume'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">৳{(stats.totalGmvBdt || 0).toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats.totalOrders || 0} {lang === 'bn' ? 'মোট সফল অর্ডার' : 'Total orders placed'}
            </p>
          </div>
        </div>

        {/* Metric 4: Crop Listings */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'সক্রিয় ফসল স্টক' : 'Active Produce'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.activeProducts || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {stats.lowStockProducts || 0} {lang === 'bn' ? 'আইটেম স্টক ফুরিয়ে আসছে' : 'low stock items'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-px">
          {[
            { id: 'VERIFICATION', nameBn: 'খামারি যাচাইকরণ অডিট', nameEn: 'Farmer Audit Queue', icon: UserCheck, count: stats.pendingFarmers },
            { id: 'DECAY_RADAR', nameBn: 'মূল্য হ্রাস ও ফ্রেশনেস রাডার', nameEn: 'Price Decay Radar', icon: TrendingDown, count: decayProducts.length },
            { id: 'ORDERS', nameBn: 'প্ল্যাটফর্ম লেনদেন ও অর্ডার', nameEn: 'Platform Orders', icon: Truck, count: stats.totalOrders },
            { id: 'REGIONS', nameBn: 'আঞ্চলিক খামার বণ্টন', nameEn: 'Regional Distribution', icon: MapPin }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 text-emerald-800 font-extrabold bg-emerald-50/50 rounded-t-2xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{lang === 'bn' ? tab.nameBn : tab.nameEn}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Content: Farmer Verification Queue */}
      {activeTab === 'VERIFICATION' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          {/* Controls Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSellerStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    sellerStatusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL'
                    ? lang === 'bn'
                      ? 'সকল খামারি'
                      : 'All Farmers'
                    : st === 'PENDING'
                    ? lang === 'bn'
                      ? 'অপেক্ষমাণ'
                      : 'Pending'
                    : st === 'VERIFIED'
                    ? lang === 'bn'
                      ? 'যাচাইকৃত'
                      : 'Verified'
                    : lang === 'bn'
                    ? 'স্থগিত'
                    : 'Rejected'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchSeller}
                onChange={(e) => setSearchSeller(e.target.value)}
                placeholder={lang === 'bn' ? 'খামারির নাম বা জেলা...' : 'Search farm or district...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">খামার ও মালিক (Farm)</th>
                  <th className="py-3 px-4">অঞ্চল ও ঠিকানা (Location)</th>
                  <th className="py-3 px-4">লাইসেন্স ও এনআইডি (Credentials)</th>
                  <th className="py-3 px-4">ফসল ও রেটিং (Stats)</th>
                  <th className="py-3 px-4">বর্তমান স্ট্যাটাস (Status)</th>
                  <th className="py-3 px-4 text-right">কার্যক্রম (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <Sprout className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <span>{lang === 'bn' ? 'কোনো খামারি পাওয়া যায়নি' : 'No farmers found for this filter'}</span>
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => {
                    const isPending = seller.verification_status === 'PENDING';
                    const isVerified = seller.verification_status === 'VERIFIED';
                    const isRejected = seller.verification_status === 'REJECTED';

                    return (
                      <tr key={seller.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 overflow-hidden shadow-2xs">
                              {seller.owner_image_url || seller.logo_image_url ? (
                                <img
                                  src={seller.owner_image_url || seller.logo_image_url}
                                  alt={seller.farm_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{seller.farm_name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-900 truncate">{seller.farm_name}</h4>
                              <p className="text-[11px] text-slate-500 truncate">
                                {seller.owner_name} • {seller.owner_phone}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-[11px]">
                            <span className="font-bold text-slate-800 block">
                              {seller.district}, {seller.division}
                            </span>
                            <span className="text-slate-500 truncate block max-w-xs">{seller.address || seller.upazila}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span>{seller.nid_trade_license || 'NID-9823471029'}</span>
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {seller.payout_method || 'BKASH'}: {seller.payout_number || 'N/A'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-[11px]">
                            <span className="font-bold text-emerald-800">{seller.total_crops || 0} টি ফসল</span>
                            <span className="block text-amber-600 font-semibold">★ {seller.rating_avg || 4.8}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{lang === 'bn' ? 'পর্যালোচনাধীন' : 'Pending Audit'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>{lang === 'bn' ? 'স্থগিত' : 'Rejected'}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/storefront/${seller.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title={lang === 'bn' ? 'খামার প্রোফাইল দেখুন' : 'View Storefront'}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            {!isVerified && (
                              <button
                                type="button"
                                disabled={actionInProgress === seller.id}
                                onClick={() => handleUpdateStatus(seller.id, 'VERIFIED')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
                              >
                                {lang === 'bn' ? 'অনুমোদন' : 'Approve'}
                              </button>
                            )}

                            {!isRejected && (
                              <button
                                type="button"
                                disabled={actionInProgress === seller.id}
                                onClick={() => setRejectionModalSeller(seller)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition-all cursor-pointer"
                              >
                                {lang === 'bn' ? 'স্থগিত' : 'Reject'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Tab Content: Dynamic Price Decay Radar */}
      {activeTab === 'DECAY_RADAR' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'bn' ? 'ফসলের মূল্য হ্রাস ও পচন রোধ রাডার' : 'Harvest Price Decay & Freshness Radar'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'bn'
                  ? 'তোলার পর সময় গড়ানোর সাথে সাথে কৃষকের ক্ষতি কমাতে স্বয়ংক্রিয় ডিসকাউন্ট মনিটরিং'
                  : 'Automated post-harvest price depreciation monitoring to eliminate unsold crop waste'}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              {decayProducts.length} {lang === 'bn' ? 'টি আইটেম ট্র্যাকিং' : 'items monitored'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ফসল ও খামার (Produce)</th>
                  <th className="py-3 px-4">তোলার সময় (Harvest Age)</th>
                  <th className="py-3 px-4">ফ্রেশনেস লেভেল (Freshness)</th>
                  <th className="py-3 px-4">মূল মূল্য (Base)</th>
                  <th className="py-3 px-4">বর্তমান স্বয়ংক্রিয় মূল্য (Current Price)</th>
                  <th className="py-3 px-4">সাশ্রয় (Discount)</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {decayProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>
                        <span>{lang === 'bn' ? (p.title_bn || p.title) : p.title}</span>
                        <span className="block text-[11px] font-normal text-slate-500">
                          {p.farm_name} • {p.district}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{p.hours_since_harvest} ঘণ্টা পূর্বে</span>
                      <span className="block text-[10px] text-slate-400">শেলফ লাইফ বাকি: {p.days_left} দিন</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-28 space-y-1">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.freshness_percent > 70
                                ? 'bg-emerald-500'
                                : p.freshness_percent > 40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(10, p.freshness_percent)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 block text-right">
                          {p.freshness_percent}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500 line-through">
                      ৳{p.base_price_bdt}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-800 text-sm">
                      ৳{p.current_dynamic_price}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.discount_percent > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                          -{p.discount_percent}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">0% (টাটকা)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/products/${p.id}`}
                        target="_blank"
                        className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] underline"
                      >
                        {lang === 'bn' ? 'ফসল দেখুন' : 'View'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab Content: Recent Platform Orders */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <span>{lang === 'bn' ? 'সাম্প্রতিক প্ল্যাটফর্ম অর্ডার ও ডেলিভারি' : 'Recent Platform Orders & GMV'}</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {overview?.recentOrders?.length || 0} {lang === 'bn' ? 'টি অর্ডার প্রদর্শিত' : 'orders shown'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">অর্ডার নম্বর (Order #)</th>
                  <th className="py-3 px-4">ক্রেতা (Customer)</th>
                  <th className="py-3 px-4">মোট বিল (Total BDT)</th>
                  <th className="py-3 px-4">পেমেন্ট মেথড (Payment)</th>
                  <th className="py-3 px-4">স্ট্যাটাস (Fulfillment)</th>
                  <th className="py-3 px-4">তারিখ (Date)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(overview?.recentOrders || []).map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-800">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{ord.buyer_name}</span>
                      <span className="text-[10px] text-slate-400">{ord.buyer_phone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      ৳{parseFloat(ord.total_amount_bdt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold text-[10px] text-slate-700">
                        {ord.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.order_status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.order_status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {ord.order_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab Content: Regional Distribution */}
      {activeTab === 'REGIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>{lang === 'bn' ? 'বিভাগভিত্তিক খামার ও কৃষি অঞ্চল বণ্টন' : 'Regional Farm Distribution'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(overview?.divisionDistribution || []).map((divItem) => (
              <div
                key={divItem.division}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900">{divItem.division} বিভাগ</h4>
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {divItem.farm_count}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {divItem.farm_count} {lang === 'bn' ? 'টি সক্রিয় নিবন্ধিত খামার' : 'active verified farms registered'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Note Modal */}
      {rejectionModalSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{lang === 'bn' ? 'খামারি যাচাইকরণ স্থগিতের কারণ' : 'Verification Rejection Notice'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setRejectionModalSeller(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {lang === 'bn'
                ? `খামার "${rejectionModalSeller.farm_name}" এর প্রোফাইল স্থগিত করার কারণ লিখুন। এটি খামারির ড্যাশবোর্ডে নোটিফিকেশন হিসেবে যাবে:`
                : `Enter specific feedback for ${rejectionModalSeller.farm_name}. This will be delivered to their dashboard:`}
            </p>

            <textarea
              rows={3}
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'যেমন: ট্রেড লাইসেন্স বা এনআইডি ছবির কপি স্পষ্ট নয়। অনুগ্রহ করে পুনরায় সঠিক তথ্য দিন।'
                  : 'E.g., Trade license image is illegible. Please re-upload clear credentials.'
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalSeller(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateStatus(
                    rejectionModalSeller.id,
                    'REJECTED',
                    rejectionNote || 'তথ্য অসম্পূর্ণ থাকায় সাময়িকভাবে স্থগিত করা হয়েছে।'
                  )
                }
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                {lang === 'bn' ? 'স্থগিত নিশ্চিত করুন' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
