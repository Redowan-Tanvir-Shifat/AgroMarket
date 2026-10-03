import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { getApiUrl } from '../config/api';
import {
  Bike,
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Navigation,
  DollarSign,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Power,
  Award,
  Check,
  User,
  Building2,
  Calendar
} from 'lucide-react';

export default function RiderDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyStats, setHistoryStats] = useState({ totalDeliveries: 0, totalCodCollected: 0 });
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [actionLoading, setActionLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  // Helper to reliably get JWT token
  const getAuthToken = () => localStorage.getItem('agromarket_token') || localStorage.getItem('token');

  // Fetch rider profile and active orders
  const fetchRiderData = useCallback(async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(getApiUrl(`/api/rider/profile?riderId=${user?.riderProfile?.id || ''}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error('Failed to load rider details');
      const data = await res.json();
      if (data.success) {
        setProfile(data.rider);
        setActiveOrders(data.activeOrders || []);
      }
    } catch (err) {
      console.error('Rider fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Fetch delivery history
  const fetchHistory = useCallback(async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(getApiUrl(`/api/rider/history?riderId=${user?.riderProfile?.id || ''}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHistoryOrders(data.orders || []);
          setHistoryStats(data.stats || { totalDeliveries: 0, totalCodCollected: 0 });
        }
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchRiderData();
    fetchHistory();
  }, [fetchRiderData, fetchHistory]);

  // Listen to live socket events for rider
  useEffect(() => {
    if (!socket) return;

    // Join rider room if rider profile exists
    if (profile?.id) {
      socket.emit('join_rider', profile.id);
    }

    const handleNewRequest = (data) => {
      setSuccessNotice(
        lang === 'bn'
          ? `নতুন ডেলিভারি অনুরোধ এসেছে! অর্ডার #${data.orderNumber}`
          : `New delivery assignment! Order #${data.orderNumber}`
      );
      fetchRiderData();
    };

    const handleBuyerPaymentConfirmed = (data) => {
      setSuccessNotice(
        lang === 'bn'
          ? `গ্রাহক অর্ডার #${data.orderNumber} এর পেমেন্ট কনফার্ম করেছেন!`
          : `Buyer confirmed cash payment for Order #${data.orderNumber}!`
      );
      fetchRiderData();
    };

    const handleHandshakeComplete = (data) => {
      setSuccessNotice(
        lang === 'bn'
          ? `অর্ডার #${data.orderNumber} ডেলিভারি ও পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!`
          : `Order #${data.orderNumber} successfully completed & paid!`
      );
      fetchRiderData();
      fetchHistory();
    };

    socket.on('new_delivery_request', handleNewRequest);
    socket.on('buyer_payment_confirmed', handleBuyerPaymentConfirmed);
    socket.on('payment_handshake_complete', handleHandshakeComplete);

    return () => {
      socket.off('new_delivery_request', handleNewRequest);
      socket.off('buyer_payment_confirmed', handleBuyerPaymentConfirmed);
      socket.off('payment_handshake_complete', handleHandshakeComplete);
    };
  }, [socket, profile?.id, lang, fetchRiderData, fetchHistory]);

  // 1. Toggle Online / Offline status
  const handleToggleStatus = async () => {
    if (!profile) return;
    try {
      setActionLoading(true);
      const newStatus = profile.status === 'OFFLINE' ? 'IDLE' : 'OFFLINE';
      const token = getAuthToken();
      const res = await fetch(getApiUrl('/api/rider/status'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ riderId: profile.id, status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile((prev) => ({ ...prev, status: newStatus }));
        setSuccessNotice(data.message);
      } else {
        throw new Error(data.message || 'Status toggle failed');
      }
    } catch (err) {
      setErrorNotice(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Accept Ride
  const handleAcceptRide = async (orderId) => {
    try {
      setActionLoading(true);
      const token = getAuthToken();
      const res = await fetch(getApiUrl('/api/rider/accept'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId, riderId: profile?.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessNotice(data.message);
        fetchRiderData();
      } else {
        throw new Error(data.message || 'Failed to accept ride');
      }
    } catch (err) {
      setErrorNotice(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Confirm Rider Cash Payment (COD Live Handshake)
  const handleConfirmRiderCash = async (orderId) => {
    try {
      setActionLoading(true);
      const token = getAuthToken();
      const res = await fetch(getApiUrl('/api/rider/confirm-rider-payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId, riderId: profile?.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessNotice(data.message);
        fetchRiderData();
        if (data.bothConfirmed) {
          fetchHistory();
        }
      } else {
        throw new Error(data.message || 'Failed to confirm payment');
      }
    } catch (err) {
      setErrorNotice(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Complete Prepaid Delivery
  const handleCompletePrepaid = async (orderId) => {
    try {
      setActionLoading(true);
      const token = getAuthToken();
      const res = await fetch(getApiUrl('/api/rider/complete-delivery'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId, riderId: profile?.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessNotice(data.message);
        fetchRiderData();
        fetchHistory();
      } else {
        throw new Error(data.message || 'Failed to complete delivery');
      }
    } catch (err) {
      setErrorNotice(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-bold text-slate-600">
          {lang === 'bn' ? 'রাইডার পোর্টাল লোড হচ্ছে...' : 'Loading Rider Portal...'}
        </p>
      </div>
    );
  }

  const isOnline = profile?.status !== 'OFFLINE';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 animate-in fade-in duration-300">
      {/* Toast Notices */}
      {successNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-extrabold text-sm ml-2">
            ✕
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-rose-700 hover:text-rose-900 font-extrabold text-sm ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
              <Bike className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900">
                  {profile?.full_name || user?.fullName || 'রাইডার'}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {lang === 'bn' ? 'অফিসিয়াল এগ্রো-রাইডার' : 'Official Agro Rider'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>📱 {profile?.phone || user?.phone}</span>
                <span>•</span>
                <span>📍 {profile?.district || 'Dhaka'}, {profile?.division || 'Dhaka'}</span>
                <span>•</span>
                <span className="font-bold text-slate-700">
                  {profile?.vehicle_type === 'MOTORCYCLE' ? '🏍️ মোটরসাইকেল' : profile?.vehicle_type === 'BICYCLE' ? '🚲 বাইসাইকেল' : '🚚 ভ্যান'}
                  {profile?.vehicle_number ? ` (${profile.vehicle_number})` : ''}
                </span>
              </p>
            </div>
          </div>

          {/* Right Action: Online Toggle & Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`px-5 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2.5 shadow-md transition-all cursor-pointer ${
                isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-slate-300/30'
              }`}
            >
              <Power className={`w-4 h-4 ${isOnline ? 'text-emerald-100 animate-pulse' : 'text-slate-400'}`} />
              <span>{isOnline ? (lang === 'bn' ? '🟢 প্রস্তুত ও অনলাইন' : '🟢 Online & Ready') : (lang === 'bn' ? '🔴 অফলাইন' : '🔴 Offline')}</span>
            </button>

            <button
              onClick={() => {
                setRefreshing(true);
                fetchRiderData();
                fetchHistory();
              }}
              disabled={refreshing}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {lang === 'bn' ? 'মোট সফল ডেলিভারি' : 'Total Deliveries'}
            </span>
            <span className="text-2xl font-black text-emerald-800">
              {profile?.total_deliveries || historyStats.totalDeliveries || 0} টি
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {lang === 'bn' ? 'রাইডার রেটিং' : 'Rider Rating'}
            </span>
            <span className="text-2xl font-black text-amber-800">
              ⭐ {profile?.rating_avg || '4.95'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {lang === 'bn' ? 'চলমান ডেলিভারি' : 'Active Mission'}
            </span>
            <span className="text-2xl font-black text-purple-800">
              {activeOrders.length} টি
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {lang === 'bn' ? 'মোট সিওডি ক্যাশ সংগ্রহ' : 'COD Cash Collected'}
            </span>
            <span className="text-2xl font-black text-sky-800">
              ৳{(historyStats.totalCodCollected || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'active'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{lang === 'bn' ? 'চলমান ডেলিভারি মিশন' : 'Active Deliveries'} ({activeOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{lang === 'bn' ? 'ডেলিভারি ইতিহাস ও হিসাব' : 'Delivery History'} ({historyOrders.length})</span>
        </button>
      </div>

      {/* Tab 1: Active Orders */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bike className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800">
                {lang === 'bn' ? 'বর্তমানে কোনো সক্রিয় ডেলিভারি নেই' : 'No Active Delivery Missions'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {isOnline
                  ? (lang === 'bn' ? 'আপনি অনলাইনে প্রস্তুত আছেন। খামার থেকে প্যাকেজিং সম্পন্ন হলে নতুন অর্ডারের নোটিফিকেশন আসবে।' : 'You are online and ready! Assignments from nearby farms will appear here automatically.')
                  : (lang === 'bn' ? 'আপনি বর্তমানে অফলাইনে আছেন। নতুন কাজ পেতে উপরে "প্রস্তুত ও অনলাইন" বাটনে চাপ দিন।' : 'You are currently offline. Switch status to online above to receive ride requests.')}
              </p>
            </div>
          ) : (
            activeOrders.map((order) => {
              const isAssignedPending = order.order_status === 'RIDER_ASSIGNED';
              const isAccepted = order.order_status === 'DELIVERED_TO_RIDER';
              const isCod = order.payment_method === 'COD';
              const buyerPaid = order.buyer_paid_confirmed === 1;
              const riderPaid = order.rider_paid_confirmed === 1;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-emerald-200 shadow-lg overflow-hidden animate-in fade-in"
                >
                  {/* Mission Top Header */}
                  <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-800">
                          {isAssignedPending
                            ? (lang === 'bn' ? 'নতুন অনুরোধ — গ্রহণ করুন' : 'New Request — Accept')
                            : (lang === 'bn' ? 'চলমান ডেলিভারি মিশন' : 'Active Delivery Mission')}
                        </span>
                        <h2 className="text-lg font-black font-mono">#{order.order_number}</h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {lang === 'bn' ? 'অর্ডারের সময়:' : 'Order Time:'} {new Date(order.created_at).toLocaleString('bn-BD')}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">{lang === 'bn' ? 'মোট মূল্য ও মাধ্যম:' : 'Total & Method:'}</span>
                      <div className="flex items-baseline gap-2 justify-end">
                        <span className="text-xl font-black text-emerald-400">৳{Number(order.total_amount_bdt).toLocaleString()}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-slate-800 text-slate-300">
                          {order.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Route Steps Visualizer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Step 1: Farm Pickup */}
                      <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 relative">
                        <span className="absolute -top-3 left-4 bg-amber-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                          {lang === 'bn' ? 'ধাপ ১: খামার থেকে সংগ্রহ' : 'Step 1: Farm Pickup'}
                        </span>
                        <div className="flex items-start gap-3 mt-1">
                          <Building2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-extrabold text-sm text-slate-900">
                              {order.farm?.name || 'এগ্রোমার্কেট খামার'}
                            </h4>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {order.farm?.farmerName ? `কৃষক: ${order.farm.farmerName}, ` : ''}
                              {order.farm?.upazila ? `${order.farm.upazila}, ` : ''}
                              {order.farm?.district}, {order.farm?.division}
                            </p>
                            {order.farm?.farmerPhone && (
                              <div className="mt-3">
                                <a
                                  href={`tel:${order.farm.farmerPhone}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{lang === 'bn' ? 'কৃষককে কল দিন' : 'Call Farmer'} ({order.farm.farmerPhone})</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Buyer Delivery Destination */}
                      <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 relative">
                        <span className="absolute -top-3 left-4 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                          {lang === 'bn' ? 'ধাপ ২: গ্রাহকের ঠিকানায় ডেলিভারি' : 'Step 2: Customer Delivery'}
                        </span>
                        <div className="flex items-start gap-3 mt-1">
                          <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-extrabold text-sm text-slate-900">
                              {order.buyer_name}
                            </h4>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {order.delivery_address}
                            </p>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              <a
                                href={`tel:${order.buyer_phone}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{lang === 'bn' ? 'গ্রাহককে কল দিন' : 'Call Customer'} ({order.buyer_phone})</span>
                              </a>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                              >
                                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === 'bn' ? 'ম্যাপে রুট দেখুন' : 'Google Maps'}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                      <span className="text-xs font-black text-slate-700 block mb-2">
                        {lang === 'bn' ? 'প্যাকেজের ফসলসমূহ:' : 'Produce in this Delivery:'}
                      </span>
                      <div className="space-y-2">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200 last:border-b-0">
                            <div className="flex items-center gap-2">
                              {item.image_url && (
                                <img src={item.image_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                              )}
                              <span className="font-bold text-slate-800">
                                {lang === 'bn' ? (item.title_bn || item.title) : item.title}
                              </span>
                            </div>
                            <span className="font-bold text-slate-700">
                              {item.quantity} {item.unit || 'কেজি'} • ৳{Number(item.subtotal_bdt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ACTION PANEL */}
                    {isAssignedPending ? (
                      /* Rider has not accepted yet: Show Accept Ride button */
                      <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 text-amber-800 font-extrabold text-sm">
                          <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                          <span>{lang === 'bn' ? 'খামার এই ডেলিভারিটির জন্য আপনাকে নির্ধারণ করেছে' : 'Farm selected you for this delivery'}</span>
                        </div>
                        <p className="text-xs text-slate-600 max-w-md mx-auto">
                          {lang === 'bn'
                            ? 'রাইড গ্রহণ করতে নিচের বাটনে চাপ দিন। গ্রহণের পর খামারের স্ট্যাটাস স্বয়ংক্রিয়ভাবে "ডেলিভারি রাইডারের নিকট হস্তান্তরকৃত" হয়ে যাবে।'
                            : 'Click below to accept this ride. Upon accepting, status will be updated to "Delivered to Rider".'}
                        </p>
                        <button
                          onClick={() => handleAcceptRide(order.id)}
                          disabled={actionLoading}
                          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 mx-auto active:scale-98 cursor-pointer"
                        >
                          <Check className="w-5 h-5 stroke-[3]" />
                          <span>{lang === 'bn' ? 'রাইড গ্রহণ করুন (Accept Ride)' : 'Accept Ride Assignment'}</span>
                        </button>
                      </div>
                    ) : (
                      /* Rider Accepted: Delivery in Progress & COD Handshake */
                      <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-emerald-400" />
                            <h3 className="font-extrabold text-sm text-white">
                              {lang === 'bn' ? 'ধাপ ৩: চূড়ান্ত ডেলিভারি ও পেমেন্ট হ্যান্ডশেক' : 'Step 3: Final Delivery & Payment Handshake'}
                            </h3>
                          </div>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-emerald-400 border border-emerald-900">
                            {isCod ? (lang === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery') : (lang === 'bn' ? 'ডিজিটাল পরিশোধিত' : 'Prepaid')}
                          </span>
                        </div>

                        {isCod ? (
                          /* COD LIVE DUAL HANDSHAKE */
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">{lang === 'bn' ? 'গ্রাহক থেকে নগদ আদায়যোগ্য:' : 'Cash to Collect from Customer:'}</span>
                                <span className="text-lg font-black text-emerald-400">৳{Number(order.total_amount_bdt).toLocaleString()}</span>
                              </div>

                              {/* Live Handshake Status Indicator */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                  buyerPaid ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' : 'bg-slate-900/60 border-slate-700 text-slate-400'
                                }`}>
                                  {buyerPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
                                  <span>{buyerPaid ? (lang === 'bn' ? 'গ্রাহক পেমেন্ট দিয়েছেন ✓' : 'Customer Paid ✓') : (lang === 'bn' ? 'গ্রাহকের কনফার্মেশনের অপেক্ষা' : 'Waiting for Customer')}</span>
                                </div>

                                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                  riderPaid ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' : 'bg-slate-900/60 border-slate-700 text-slate-400'
                                }`}>
                                  {riderPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
                                  <span>{riderPaid ? (lang === 'bn' ? 'আপনি ক্যাশ গ্রহণ করেছেন ✓' : 'Cash Received by You ✓') : (lang === 'bn' ? 'আপনার কনফার্মেশনের অপেক্ষা' : 'Waiting for Your Confirmation')}</span>
                                </div>
                              </div>
                            </div>

                            {!riderPaid ? (
                              <button
                                onClick={() => handleConfirmRiderCash(order.id)}
                                disabled={actionLoading}
                                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                              >
                                <DollarSign className="w-5 h-5 stroke-[2.5]" />
                                <span>
                                  {lang === 'bn'
                                    ? `গ্রাহকের কাছ থেকে ৳${Number(order.total_amount_bdt).toLocaleString()} ক্যাশ বুঝে পেয়েছি`
                                    : `Confirm Cash ৳${Number(order.total_amount_bdt).toLocaleString()} Received from Customer`}
                                </span>
                              </button>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-600 text-emerald-300 text-xs font-bold text-center">
                                {lang === 'bn'
                                  ? '✓ আপনি ক্যাশ গ্রহণ নিশ্চিত করেছেন। গ্রাহক অ্যাপে কনফার্ম করলেই স্বয়ংক্রিয়ভাবে ডেলিভারি সম্পন্ন হবে।'
                                  : '✓ You confirmed receiving cash. Awaiting customer confirmation to complete delivery.'}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Prepaid Order Direct Finish */
                          <div>
                            <p className="text-xs text-slate-300 mb-3">
                              {lang === 'bn'
                                ? 'গ্রাহক ইতিমধ্যে ডিজিটাল পেমেন্ট সম্পন্ন করেছেন। পণ্য গ্রাহকের হাতে হস্তান্তর করে ডেলিভারি মার্ক করুন।'
                                : 'Customer has already paid digitally. Hand over package to customer and mark as delivered.'}
                            </p>
                            <button
                              onClick={() => handleCompletePrepaid(order.id)}
                              disabled={actionLoading}
                              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              <span>{lang === 'bn' ? 'পণ্য ডেলিভারি সম্পন্ন হয়েছে (Mark as Delivered)' : 'Complete Delivery'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Delivery History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-extrabold text-base text-slate-900">
              {lang === 'bn' ? 'সম্পন্ন হওয়া ডেলিভারির তালিকা' : 'Completed Deliveries'}
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {lang === 'bn' ? `মোট ${historyOrders.length} টি সম্পন্ন` : `${historyOrders.length} Completed`}
            </span>
          </div>

          {historyOrders.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              {lang === 'bn' ? 'এখনো কোনো সম্পন্ন ডেলিভারির রেকর্ড নেই।' : 'No completed deliveries recorded yet.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyOrders.map((ord) => (
                <div key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">#{ord.order_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {lang === 'bn' ? 'ডেলিভারি সম্পন্ন' : 'Delivered'}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">
                      {lang === 'bn' ? 'গ্রাহক:' : 'Customer:'} {ord.buyer_name} ({ord.buyer_phone}) • {ord.delivery_address}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-800">
                      ৳{Number(ord.total_amount_bdt).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {ord.payment_method} ({ord.payment_status})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
