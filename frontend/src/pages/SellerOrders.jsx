import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatModal from '../components/ChatModal';
import {
  Truck,
  Package,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  MessageSquare,
  MapPin,
  User,
  Calendar,
  CreditCard,
  Printer,
  Search,
  RefreshCw,
  X,
  ChevronRight,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  ArrowLeft,
  Filter,
  Layers,
  Trash2,
  Sprout
} from 'lucide-react';

export default function SellerOrders() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('ALL'); // ALL, DELIVERY, PICKUP
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [selectedSellerId, setSelectedSellerId] = useState(() => {
    return user?.sellerProfile?.id || 1;
  });

  // Modal States
  const [printModalOrder, setPrintModalOrder] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [deleteModalOrder, setDeleteModalOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [activeChatBuyer, setActiveChatBuyer] = useState(null);

  // Helper to resolve seller/farm details for invoice
  const getSellerInfo = (id) => {
    if (user?.sellerProfile?.farm_name) {
      return {
        farmName: user.sellerProfile.farm_name,
        farmerName: user.full_name || 'নিবন্ধিত খামারি',
        phone: user.phone || '+880 1700-000000',
        district: user.district || 'ঢাকা',
        division: user.division || 'ঢাকা বিভাগ',
        address: user.address || 'বাংলাদেশ'
      };
    }
    switch (id) {
      case 2:
        return {
          farmName: lang === 'bn' ? 'দিনাজপুর লিচু ও চাল হাব' : 'Dinajpur Lychee & Rice Hub',
          farmerName: lang === 'bn' ? 'মোঃ তারিকুল ইসলাম' : 'Md. Tarikul Islam',
          phone: '+880 1712-345678',
          district: lang === 'bn' ? 'দিনাজপুর' : 'Dinajpur',
          division: lang === 'bn' ? 'রংপুর বিভাগ' : 'Rangpur Division',
          address: lang === 'bn' ? 'সদর, দিনাজপুর' : 'Sadar, Dinajpur'
        };
      case 3:
        return {
          farmName: lang === 'bn' ? 'বগুড়া সবজি ভান্ডার' : 'Bogura Vegetable Hub',
          farmerName: lang === 'bn' ? 'আবুল কালাম আজাদ' : 'Abul Kalam Azad',
          phone: '+880 1713-456789',
          district: lang === 'bn' ? 'বগুড়া' : 'Bogura',
          division: lang === 'bn' ? 'রাজশাহী বিভাগ' : 'Rajshahi Division',
          address: lang === 'bn' ? 'মহাস্থানগড়, বগুড়া' : 'Mahasthangarh, Bogura'
        };
      default:
        return {
          farmName: lang === 'bn' ? 'রাজশাহী আম হাব' : 'Rajshahi Mango Hub',
          farmerName: lang === 'bn' ? 'মোঃ রফিকুল ইসলাম' : 'Md. Rafiqul Islam',
          phone: '+880 1711-234567',
          district: lang === 'bn' ? 'রাজশাহী' : 'Rajshahi',
          division: lang === 'bn' ? 'রাজশাহী বিভাগ' : 'Rajshahi Division',
          address: lang === 'bn' ? 'বাঘা, রাজশাহী' : 'Bagha, Rajshahi'
        };
    }
  };

  useEffect(() => {
    fetchOrders(selectedSellerId);
  }, [selectedSellerId]);

  // Real-time automatic orders table update when a new order arrives
  useEffect(() => {
    if (!socket) return;
    if (selectedSellerId) {
      socket.emit('join_seller', selectedSellerId);
    }
    const handleOrderEvent = () => {
      fetchOrders(selectedSellerId);
    };
    socket.on('new_order_alert', handleOrderEvent);
    socket.on('new_notification', handleOrderEvent);
    return () => {
      socket.off('new_order_alert', handleOrderEvent);
      socket.off('new_notification', handleOrderEvent);
    };
  }, [socket, selectedSellerId]);

  const fetchOrders = async (sellerId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const res = await axios.get(`/api/seller/orders?sellerId=${sellerId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch seller orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update Order Status Handler
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const res = await axios.patch(`/api/seller/orders/${orderId}/status?sellerId=${selectedSellerId}`, {
        status: newStatus
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // Update local state immediately: keep payment_status as is!
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? {
                ...o,
                order_status: newStatus
              }
            : o
        )
      );

      setActionNotice({
        type: 'success',
        message:
          res.data.message ||
          (lang === 'bn'
            ? 'অর্ডারের স্ট্যাটাস সফলভাবে আপডেট হয়েছে!'
            : 'Order status successfully updated!')
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Error updating order status:', err);
      setActionNotice({
        type: 'error',
        message:
          err.response?.data?.message ||
          (lang === 'bn' ? 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।' : 'Failed to update order status.')
      });
      setTimeout(() => setActionNotice(null), 3500);
    } finally {
      setUpdatingOrderId(null);
      setCancelModalOrder(null);
    }
  };

  // Confirm COD Cash Payment (turns payment_status to PAID)
  const handleConfirmPayment = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      const res = await axios.patch(`/api/orders/${orderId}/confirm-payment`);

      // Update local state immediately to PAID!
      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? {
                ...o,
                payment_status: 'PAID',
                order_status: 'DELIVERED'
              }
            : o
        )
      );

      setActionNotice({
        type: 'success',
        message:
          lang === 'bn'
            ? 'ক্যাশ পেমেন্ট সফলভাবে গ্রহণ ও সম্পন্ন হয়েছে!'
            : 'Cash payment confirmed and marked as PAID!'
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Error confirming payment:', err);
      setActionNotice({
        type: 'error',
        message:
          err.response?.data?.message ||
          (lang === 'bn' ? 'পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে।' : 'Failed to confirm payment.')
      });
      setTimeout(() => setActionNotice(null), 3500);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Copy tracking number
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Soft Delete Order
  const handleDeleteOrder = async (orderId) => {
    try {
      setDeletingOrderId(orderId);
      const token = localStorage.getItem('agromarket_token');
      await axios.delete(`/api/seller/orders/${orderId}?sellerId=${selectedSellerId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // Remove from view immediately
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setDeleteModalOrder(null);
      setActionNotice({
        type: 'success',
        message: lang === 'bn' ? 'অর্ডারটি সফলভাবে তালিকা থেকে মুছে ফেলা হয়েছে।' : 'Order removed from active queue successfully.'
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Error soft deleting seller order:', err);
      setActionNotice({
        type: 'error',
        message: err.response?.data?.message || (lang === 'bn' ? 'অর্ডার মুছতে সমস্যা হয়েছে।' : 'Failed to delete order.')
      });
      setTimeout(() => setActionNotice(null), 3500);
    } finally {
      setDeletingOrderId(null);
    }
  };

  // Print / Download Invoice Handler
  const handlePrintInvoice = () => {
    if (!printModalOrder) return;
    const originalTitle = document.title;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    // Default download name: AgroMarket-Invoice-Date and time
    document.title = `AgroMarket-Invoice-${datePart}_${timePart}`;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };

    window.addEventListener('afterprint', restoreTitle);

    window.print();

    // Fallback timer in case afterprint doesn't fire
    setTimeout(() => {
      document.title = originalTitle;
    }, 2000);
  };

  // Calculations for summary metrics
  const totalOrdersCount = orders.length;
  const pendingCount = orders.filter(o => o.order_status === 'PENDING').length;
  const processingCount = orders.filter(o => o.order_status === 'PROCESSING').length;
  const inTransitOrPickupCount = orders.filter(o => o.order_status === 'SHIPPED' || o.order_status === 'READY_FOR_PICKUP').length;
  const deliveredOrders = orders.filter(o => o.order_status === 'DELIVERED');
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.sellerSubtotal || 0), 0);

  // Filter orders based on Tab, Fulfillment Filter, and Search
  const filteredOrders = orders.filter(order => {
    // 1. Search filter
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer_phone?.includes(searchQuery);

    if (!matchesSearch) return false;

    // 2. Fulfillment type filter
    if (fulfillmentFilter !== 'ALL' && order.fulfillment_type !== fulfillmentFilter) {
      return false;
    }

    // 3. Tab filter
    if (activeTab === 'PENDING') return order.order_status === 'PENDING';
    if (activeTab === 'PROCESSING') return order.order_status === 'PROCESSING';
    if (activeTab === 'DISPATCHED_OR_READY') {
      return order.order_status === 'SHIPPED' || order.order_status === 'READY_FOR_PICKUP';
    }
    if (activeTab === 'DELIVERED') return order.order_status === 'DELIVERED';
    if (activeTab === 'CANCELLED') return order.order_status === 'CANCELLED';

    return true;
  });

  // Helper for status badge styling and text
  const getStatusBadge = (order) => {
    // If COD order is delivered but buyer hasn't completed payment yet -> RED!
    if (order.order_status === 'DELIVERED' && order.payment_method === 'COD' && order.payment_status === 'PENDING') {
      return {
        bg: 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs',
        dot: 'bg-rose-500 animate-pulse',
        label: lang === 'bn' ? 'ডেলিভারি সম্পন্ন (পেমেন্ট বকেয়া)' : 'Delivered (Payment Pending)'
      };
    }

    switch (order.order_status) {
      case 'PENDING':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: lang === 'bn' ? 'নতুন অর্ডার (Pending)' : 'New Order'
        };
      case 'PROCESSING':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          dot: 'bg-blue-500',
          label: lang === 'bn' ? 'প্যাকেজিং হচ্ছে (Packaging)' : 'Packaging at Farm'
        };
      case 'SHIPPED':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          dot: 'bg-purple-500',
          label: lang === 'bn' ? 'কুরিয়ারে হস্তান্তর সম্পন্ন' : 'Dispatched to Courier'
        };
      case 'READY_FOR_PICKUP':
        return {
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
          dot: 'bg-teal-500',
          label: lang === 'bn' ? 'খামারে সংগ্রহের জন্য প্রস্তুত' : 'Ready at Farm Gate'
        };
      case 'DELIVERED':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs',
          dot: 'bg-emerald-500',
          label: order.payment_status === 'PAID'
            ? (lang === 'bn' ? 'ডেলিভারি সম্পন্ন ও পরিশোধিত' : 'Delivered & Paid')
            : (lang === 'bn' ? 'ডেলিভারি সম্পন্ন' : 'Delivered & Completed')
        };
      case 'CANCELLED':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          dot: 'bg-rose-500',
          label: lang === 'bn' ? 'অর্ডার বাতিল' : 'Cancelled'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          dot: 'bg-slate-400',
          label: order.order_status
        };
    }
  };

  // Helper for Stepper stages
  const getStepperStages = (order) => {
    const isPickup = order.fulfillment_type === 'PICKUP';
    if (isPickup) {
      return [
        { id: 'PENDING', labelEn: 'Placed', labelBn: 'অর্ডার গৃহীত' },
        { id: 'PROCESSING', labelEn: 'Packaging', labelBn: 'প্যাকেজিং' },
        { id: 'READY_FOR_PICKUP', labelEn: 'Ready at Farm', labelBn: 'সংগ্রহ প্রস্তুত' },
        { id: 'DELIVERED', labelEn: 'Handed Over', labelBn: 'হস্তান্তর সম্পন্ন' }
      ];
    }
    return [
      { id: 'PENDING', labelEn: 'Placed', labelBn: 'অর্ডার গৃহীত' },
      { id: 'PROCESSING', labelEn: 'Packaging', labelBn: 'প্যাকেজিং' },
      { id: 'SHIPPED', labelEn: 'On Way', labelBn: 'কুরিয়ারে হস্তান্তর' },
      { id: 'DELIVERED', labelEn: 'Delivered', labelBn: 'ডেলিভারি সম্পন্ন' }
    ];
  };

  const getStageIndex = (order) => {
    const isPickup = order.fulfillment_type === 'PICKUP';
    if (order.order_status === 'CANCELLED') return -1;
    if (order.order_status === 'PENDING') return 0;
    if (order.order_status === 'PROCESSING') return 1;
    if (isPickup && order.order_status === 'READY_FOR_PICKUP') return 2;
    if (!isPickup && order.order_status === 'SHIPPED') return 2;
    if (order.order_status === 'DELIVERED') return 3;
    return 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">

      {/* Top Floating Notification Toast */}
      {actionNotice && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom-3 border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700 backdrop-blur-md'
              : 'bg-rose-900/95 text-rose-100 border-rose-700 backdrop-blur-md'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
          <button onClick={() => setActionNotice(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'bn' ? 'অর্ডার বাস্তবায়ন ও ডেলিভারি হাব' : 'Order Fulfillment Hub'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t('sellerOrdersTitle')}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {t('sellerOrdersSubtitle')}
          </p>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'bn' ? 'মোট অর্ডার' : 'Total Orders'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalOrdersCount}</p>
          <p className="text-[11px] text-slate-400 font-medium">
            {lang === 'bn' ? 'এই খামারের মোট অর্ডার' : 'Total orders recorded'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              {lang === 'bn' ? 'নতুন ও প্যাকেজিং' : 'Pending & Packing'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{pendingCount + processingCount}</p>
          <p className="text-[11px] text-amber-600 font-bold">
            {lang === 'bn' ? 'জরুরি দৃষ্টি আকর্ষণ প্রয়োজন' : 'Immediate dispatch action needed'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {lang === 'bn' ? 'ট্রানজিট / সংগ্রহ প্রস্তুত' : 'In Transit / Ready'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{inTransitOrPickupCount}</p>
          <p className="text-[11px] text-slate-400 font-medium">
            {lang === 'bn' ? 'কুরিয়ারে বা গেটে সংগ্রহ অপেক্ষারত' : 'On route or farm gate awaiting'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              {lang === 'bn' ? 'সম্পন্ন ডেলিভারি আয়' : 'Delivered Revenue'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">৳{deliveredRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-medium">
            {lang === 'bn' ? `${deliveredOrders.length}টি অর্ডারের চূড়ান্ত আয়` : `Earned from ${deliveredOrders.length} orders`}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Order Status Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: t('tabAllSellerOrders'), count: orders.length },
            { id: 'PENDING', label: t('tabPendingOrders'), count: pendingCount },
            { id: 'PROCESSING', label: t('tabProcessingOrders'), count: processingCount },
            { id: 'DISPATCHED_OR_READY', label: t('tabDispatchedOrders'), count: inTransitOrPickupCount },
            { id: 'DELIVERED', label: t('tabDeliveredOrders'), count: deliveredOrders.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Fulfillment Filter Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs text-xs font-bold">
            <button
              onClick={() => setFulfillmentFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                fulfillmentFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'সকল মাধ্যম' : 'All Types'}
            </button>
            <button
              onClick={() => setFulfillmentFilter('DELIVERY')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                fulfillmentFilter === 'DELIVERY'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'হোম ডেলিভারি' : 'Delivery'}</span>
            </button>
            <button
              onClick={() => setFulfillmentFilter('PICKUP')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                fulfillmentFilter === 'PICKUP'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'খামার পিকআপ' : 'Pickup'}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'অর্ডার #, গ্রাহক বা ফোন...' : 'Search order # or buyer...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders List Content */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500">
            {lang === 'bn' ? 'অর্ডার তালিকা লোড হচ্ছে...' : 'Loading order queue...'}
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-xs p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {lang === 'bn' ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No Orders Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {lang === 'bn'
              ? 'এই ফিল্টারে বর্তমান কোনো অর্ডার পাওয়া যায়নি। অন্যান্য ট্যাব বা সার্চ ফিল্টার চেক করুন।'
              : 'There are no customer orders matching your selected filter or search query.'}
          </p>
          {(searchQuery || activeTab !== 'ALL' || fulfillmentFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('ALL');
                setFulfillmentFilter('ALL');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <span>{lang === 'bn' ? 'সব ফিল্টার রিসেট করুন' : 'Reset All Filters'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order);
            const stepperStages = getStepperStages(order);
            const activeStageIdx = getStageIndex(order);
            const isUpdating = updatingOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Order Top Banner */}
                <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Order ID & Copy */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-wide">
                        #{order.order_number}
                      </span>
                      <button
                        onClick={() => handleCopyCode(order.order_number)}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                        title={lang === 'bn' ? 'কোড কপি করুন' : 'Copy Tracking Number'}
                      >
                        {copiedCode === order.order_number ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Order Date */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(order.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>

                    {/* Fulfillment Type Badge */}
                    {order.fulfillment_type === 'DELIVERY' ? (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 border border-blue-300 text-blue-800 shadow-2xs">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span>{lang === 'bn' ? 'কুরিয়ার হোম ডেলিভারি' : 'Home Delivery'}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-purple-50 border border-purple-300 text-purple-800 shadow-2xs">
                        <Store className="w-3.5 h-3.5 text-purple-600" />
                        <span>{lang === 'bn' ? 'খামার থেকে সরাসরি সংগ্রহ' : 'Farm Direct Pickup'}</span>
                      </div>
                    )}
                  </div>

                  {/* Badges and Print Challan */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Payment Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      order.payment_status === 'PAID'
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-2xs'
                        : (order.order_status === 'DELIVERED'
                            ? 'bg-rose-50 border border-rose-300 text-rose-800 shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700')
                    }`}>
                      <CreditCard className={`w-3.5 h-3.5 ${
                        order.payment_status === 'PAID'
                          ? 'text-emerald-600'
                          : (order.order_status === 'DELIVERED' ? 'text-rose-600' : 'text-slate-500')
                      }`} />
                      <span className="uppercase font-bold">{order.payment_method}</span>
                      <span className="text-slate-300">|</span>
                      <span className={
                        order.payment_status === 'PAID'
                          ? 'text-emerald-700 font-black'
                          : (order.order_status === 'DELIVERED' ? 'text-rose-700 font-black' : 'text-amber-600 font-extrabold')
                      }>
                        {order.payment_status === 'PAID' ? (lang === 'bn' ? 'পরিশোধিত' : 'Paid') : (lang === 'bn' ? 'বকেয়া' : 'Pending')}
                      </span>
                    </div>

                    {/* Status Chip */}
                    <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold border ${badge.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </div>

                    {/* Invoice Button */}
                    <button
                      onClick={() => setPrintModalOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs shadow-emerald-600/20"
                      title={lang === 'bn' ? 'ইনভয়েস প্রিন্ট করুন' : 'Print Invoice'}
                    >
                      <Printer className="w-3.5 h-3.5 text-white" />
                      <span>{lang === 'bn' ? 'ইনভয়েস' : 'Invoice'}</span>
                    </button>

                    {/* Delete Order (Soft Delete) */}
                    <button
                      onClick={() => setDeleteModalOrder(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 font-bold text-xs transition-colors shadow-2xs"
                      title={t('deleteOrderBtn')}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>{t('deleteOrderBtn')}</span>
                    </button>
                  </div>
                </div>

                {/* Card Body: Customer Coordinates & Line Items */}
                <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Left Column (5 Cols): Customer Coordinates */}
                  <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-emerald-600" />
                        <span>{t('orderCustomerInfo')}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {order.buyer_phone && (
                          <a
                            href={`tel:${order.buyer_phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                            title={lang === 'bn' ? 'গ্রাহককে কল দিন' : 'Call Buyer'}
                          >
                            <Phone className="w-3 h-3 text-emerald-700" />
                            <span>{lang === 'bn' ? 'কল দিন' : 'Call Buyer'}</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveChatBuyer({
                            buyerId: order.buyer_id || order.buyer_user_id,
                            buyerName: order.buyer_name,
                            buyerAvatar: order.buyer_avatar,
                            farmLogo: user?.sellerProfile?.logo_image_url,
                            productId: order.items?.[0]?.product_id,
                            productTitle: lang === 'bn' ? order.items?.[0]?.title_bn : order.items?.[0]?.title,
                            productImage: order.items?.[0]?.image_url,
                            productPrice: order.items?.[0]?.unit_price_at_purchase_bdt,
                            productUnit: order.items?.[0]?.unit
                          })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                          title={lang === 'bn' ? 'গ্রাহককে মেসেজ পাঠান' : 'Message Buyer'}
                        >
                          <MessageSquare className="w-3 h-3 text-purple-700" />
                          <span>{lang === 'bn' ? 'মেসেজ' : 'Message'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">{lang === 'bn' ? 'গ্রাহকের নাম:' : 'Customer Name:'}</span>
                        <span className="text-slate-900 font-bold text-sm">{order.buyer_name}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">{lang === 'bn' ? 'যোগাযোগ নম্বর:' : 'Phone Number:'}</span>
                        <span className="text-slate-800 font-semibold">{order.buyer_phone || 'N/A'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">
                          {order.fulfillment_type === 'DELIVERY'
                            ? (lang === 'bn' ? 'ডেলিভারি ঠিকানা:' : 'Delivery Address:')
                            : (lang === 'bn' ? 'পিকআপের স্থান:' : 'Pickup Location:')}
                        </span>
                        <p className="text-slate-700 font-medium leading-relaxed mt-0.5 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{order.delivery_address || (lang === 'bn' ? 'খামারের মূল ফটক থেকে সরাসরি সংগ্রহ' : 'Direct collection from farm gate')}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (7 Cols): Produce Line Items for this Seller */}
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-emerald-600" />
                          <span>{t('orderedItemsList')}</span>
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {order.items?.length} {lang === 'bn' ? 'টি আইটেম' : 'items'}
                        </span>
                      </div>

                      {/* Items Cards */}
                      <div className="space-y-2.5">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-2xs gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120'}
                                alt={item.title}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                              />
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                  {lang === 'bn' && item.title_bn ? item.title_bn : item.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  ৳{parseFloat(item.unit_price_at_purchase_bdt).toFixed(2)} / {item.unit}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-extrabold mb-0.5">
                                {item.quantity} {item.unit}
                              </span>
                              <p className="text-xs font-black text-emerald-700">
                                ৳{parseFloat(item.subtotal_bdt).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Seller Order Subtotal highlight */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">
                        {lang === 'bn' ? 'এই খামারের মোট পাওনা (Seller Subtotal):' : 'Farmer Subtotal:'}
                      </span>
                      <span className="text-base font-black text-emerald-700">
                        ৳{parseFloat(order.sellerSubtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual Fulfillment Stepper */}
                {order.order_status !== 'CANCELLED' && (
                  <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                    <div className="relative">
                      {/* Step Connecting Line Container (spans exactly from center of circle 1 to center of circle 4) */}
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, (activeStageIdx / (stepperStages.length - 1)) * 100))}%`
                          }}
                        />
                      </div>

                      {/* Stepper Nodes */}
                      <div className="flex items-center justify-between relative z-10">
                        {stepperStages.map((stage, idx) => {
                          const isDelivered = order.order_status === 'DELIVERED';
                          const isDone = isDelivered ? idx <= activeStageIdx : idx < activeStageIdx;
                          const isCurrent = !isDelivered && idx === activeStageIdx;

                          return (
                            <div key={stage.id} className="flex flex-col items-center space-y-1">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                                  isDone
                                    ? 'bg-emerald-600 text-white'
                                    : isCurrent
                                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                    : 'bg-white border-2 border-slate-200 text-slate-400'
                                }`}
                              >
                                {isDone ? (
                                  <Check className="w-4 h-4 text-white stroke-[2.5]" />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>
                              <span
                                className={`text-[11px] font-bold text-center ${
                                  isDone
                                    ? 'text-slate-800'
                                    : isCurrent
                                    ? 'text-emerald-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {lang === 'bn' ? stage.labelBn : stage.labelEn}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Interactive Action Controls */}
                <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      {lang === 'bn'
                        ? 'খামার থেকে তাজা ফসল প্রস্তুত করে কুরিয়ারে হস্তান্তর নিশ্চিত করুন'
                        : 'Progress the order state to keep the customer updated in real-time'}
                    </span>
                  </div>

                  {/* Stage Progress Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {order.order_status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => setCancelModalOrder(order)}
                          disabled={isUpdating}
                          className="px-3.5 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors"
                        >
                          {lang === 'bn' ? 'অর্ডার বাতিল করুন' : 'Reject Order'}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20 transition-all disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Package className="w-3.5 h-3.5" />
                          )}
                          <span>{t('markProcessingBtn')}</span>
                        </button>
                      </>
                    )}

                    {order.order_status === 'PROCESSING' && (
                      <>
                        {order.fulfillment_type === 'DELIVERY' ? (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm shadow-purple-600/20 transition-all disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Truck className="w-3.5 h-3.5" />
                            )}
                            <span>{t('markDispatchedBtn')}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm shadow-teal-600/20 transition-all disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Store className="w-3.5 h-3.5" />
                            )}
                            <span>{t('markReadyPickupBtn')}</span>
                          </button>
                        )}
                      </>
                    )}

                    {(order.order_status === 'SHIPPED' || order.order_status === 'READY_FOR_PICKUP') && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{t('markDeliveredBtn')}</span>
                      </button>
                    )}

                    {order.order_status === 'DELIVERED' && (
                      order.payment_method === 'COD' && order.payment_status === 'PENDING' ? (
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 shadow-2xs">
                            <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
                            <span>{lang === 'bn' ? 'পণ্য পৌঁছেছে — পেমেন্ট বকেয়া' : 'Goods Delivered — Payment Pending'}</span>
                          </div>
                          <button
                            onClick={() => handleConfirmPayment(order.id)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>{lang === 'bn' ? 'পেমেন্ট সম্পন্ন করুন' : 'Complete Payment'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{lang === 'bn' ? 'সম্পূর্ণ ও পরিশোধিত' : 'Delivered & Paid'}</span>
                        </div>
                      )
                    )}

                    {order.order_status === 'CANCELLED' && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>{lang === 'bn' ? 'অর্ডারটি বাতিল করা হয়েছে' : 'Order was cancelled'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable 1-Page Official Invoice Modal */}
      {printModalOrder && typeof document !== 'undefined' && createPortal((() => {
        const activeSeller = getSellerInfo(selectedSellerId);
        const deliveryCharge = printModalOrder.fulfillment_type === 'DELIVERY' ? 60 : 0;
        const grandTotal = parseFloat(printModalOrder.sellerSubtotal || 0) + deliveryCharge;

        return (
          <div
            id="printable-invoice-modal"
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in print:static print:p-0 print:bg-white print:overflow-visible print:inset-auto"
          >
            <div
              id="printable-invoice"
              className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-3.5 shadow-2xl border border-slate-200 my-4 text-slate-900 print:my-0 print:shadow-none print:border-none print:p-3 print:max-w-full"
            >
              {/* Modal Header Controls (Hidden on Print) */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'bn' ? 'অফিসিয়াল ইনভয়েস ও রসিদ' : 'Official Delivery Invoice'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shadow-emerald-600/20 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>{lang === 'bn' ? 'ইনভয়েস প্রিন্ট / ডাউনলোড করুন' : 'Print / Download PDF'}</span>
                  </button>
                  <button
                    onClick={() => setPrintModalOrder(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Invoice Document Body */}
              <div className="space-y-3.5">

                {/* Header: Exact Navbar Logo & Branding + Invoice Metadata */}
                <div className="flex justify-between items-start border-b-2 border-emerald-950 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xl font-black tracking-tight text-emerald-950 leading-none">
                          Agro<span className="text-emerald-600">Market</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-300">
                          {lang === 'bn' ? 'অফিসিয়াল' : 'Official'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                        এগ্রোমার্কেট (বাংলাদেশ)
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium block">
                        {lang === 'bn' ? 'কৃষক ও ভোক্তার সরাসরি ডিজিটাল বাজার' : 'Direct Farmer-to-Consumer Market'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-800 text-white text-xs font-mono font-black tracking-wide">
                      INVOICE #{printModalOrder.order_number}
                    </span>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      {lang === 'bn' ? 'তারিখ:' : 'Date:'} {new Date(printModalOrder.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold">
                      <span className="text-slate-500">{lang === 'bn' ? 'ডেলিভারি মোড:' : 'Mode:'}</span>
                      <span className={printModalOrder.fulfillment_type === 'DELIVERY' ? 'text-blue-700 font-extrabold' : 'text-purple-700 font-extrabold'}>
                        {printModalOrder.fulfillment_type === 'DELIVERY'
                          ? (lang === 'bn' ? 'কুরিয়ার হোম ডেলিভারি' : 'Home Courier Delivery')
                          : (lang === 'bn' ? 'খামার গেট সংগ্রহ' : 'Direct Farm Pickup')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buyer & Seller Information Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-3">
                  {/* Origin Seller Farm Box */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-0.5">
                    <p className="font-extrabold text-emerald-800 uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-emerald-600" />
                      <span>{lang === 'bn' ? 'প্রেরক / উৎপাদক খামার (Seller Farm):' : 'Origin Farmer / Seller:'}</span>
                    </p>
                    <p className="font-black text-slate-900 text-xs">{activeSeller.farmName}</p>
                    <p className="text-slate-700 font-semibold text-[11px]">{activeSeller.farmerName}</p>
                    <p className="text-slate-600 font-medium text-[11px]">{activeSeller.phone}</p>
                    <p className="text-slate-500 text-[10px]">{activeSeller.address}, {activeSeller.district}, {activeSeller.division}</p>
                    <div className="inline-flex items-center gap-1 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                      <span>AgroMarket Verified Partner</span>
                    </div>
                  </div>

                  {/* Recipient Buyer Box */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-0.5">
                    <p className="font-extrabold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-600" />
                      <span>{lang === 'bn' ? 'প্রাপক / ক্রেতা (Recipient Buyer):' : 'Recipient Buyer:'}</span>
                    </p>
                    <p className="font-black text-slate-900 text-xs">{printModalOrder.buyer_name}</p>
                    <p className="text-slate-700 font-semibold text-[11px]">{printModalOrder.buyer_phone}</p>
                    {printModalOrder.buyer_email && (
                      <p className="text-slate-500 text-[10px]">{printModalOrder.buyer_email}</p>
                    )}
                    <p className="text-slate-600 font-medium text-[10px] leading-tight">
                      <span className="font-bold">{lang === 'bn' ? 'ঠিকানা: ' : 'Address: '}</span>
                      {printModalOrder.delivery_address || (lang === 'bn' ? 'খামার গেট থেকে সংগ্রহ' : 'Direct Gate Pickup')}
                    </p>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-300 text-slate-700 font-extrabold uppercase text-[9px]">
                        <th className="py-1 px-1.5">{lang === 'bn' ? 'নং' : '#'}</th>
                        <th className="py-1 px-1.5">{lang === 'bn' ? 'ফসল ও বিবরণ' : 'Produce & Details'}</th>
                        <th className="py-1 px-1.5 text-center">{lang === 'bn' ? 'পরিমাণ' : 'Quantity'}</th>
                        <th className="py-1 px-1.5 text-right">{lang === 'bn' ? 'একক মূল্য' : 'Unit Price'}</th>
                        <th className="py-1 px-1.5 text-right">{lang === 'bn' ? 'মোট টাকা' : 'Line Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {printModalOrder.items?.map((it, idx) => (
                        <tr key={idx} className="text-slate-800 text-xs">
                          <td className="py-1.5 px-1.5 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                          <td className="py-1.5 px-1.5 font-bold text-slate-900">
                            <span>{lang === 'bn' && it.title_bn ? it.title_bn : it.title}</span>
                            <span className="block text-[9px] font-normal text-slate-500">AgroMarket Fresh Crop</span>
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-extrabold text-[11px]">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="py-1.5 px-1.5 text-right font-mono text-[11px]">
                            ৳{parseFloat(it.unit_price_at_purchase_bdt).toFixed(2)}
                          </td>
                          <td className="py-1.5 px-1.5 text-right font-mono font-black text-emerald-800 text-[11px]">
                            ৳{parseFloat(it.subtotal_bdt).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary & Payment Details */}
                <div className="flex justify-between items-start pt-2 border-t-2 border-slate-900 text-xs">
                  <div className="space-y-1 max-w-xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment:'}</span>
                      <span className="uppercase font-mono font-black">{printModalOrder.payment_method}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          printModalOrder.payment_status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {printModalOrder.payment_status === 'PAID'
                          ? (lang === 'bn' ? 'পরিশোধিত (PAID)' : 'PAID')
                          : (lang === 'bn' ? 'ক্যাশ অন ডেলিভারি (বকেয়া)' : 'Cash on Delivery (DUE)')}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 italic leading-tight">
                      {lang === 'bn' ? '* তাজা কৃষি পণ্য — শীতল ও শুষ্ক স্থানে সংরক্ষণ করুন।' : '* Fresh perishable produce — keep in a cool, dry place.'}
                    </p>
                  </div>

                  <div className="text-right space-y-0.5 min-w-44">
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>{lang === 'bn' ? 'পণ্যের মোট মূল্য:' : 'Items Subtotal:'}</span>
                      <span className="font-mono font-semibold">৳{parseFloat(printModalOrder.sellerSubtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>{lang === 'bn' ? 'ডেলিভারি ফি:' : 'Delivery Fee:'}</span>
                      <span className="font-mono font-semibold">
                        {printModalOrder.fulfillment_type === 'DELIVERY' ? '৳60.00' : (lang === 'bn' ? '৳0.00 (ফ্রি)' : '৳0.00 (Free)')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-emerald-700 font-medium">
                      <span>{lang === 'bn' ? 'সিন্ডিকেট ফি:' : 'Syndicate Fee:'}</span>
                      <span className="font-mono font-bold">৳0.00 (0%)</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-slate-900 border-t border-slate-300 pt-1 mt-0.5">
                      <span>{lang === 'bn' ? 'সর্বমোট প্রদেয়:' : 'Grand Total:'}</span>
                      <span className="text-emerald-700 font-mono text-sm font-black">
                        ৳{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signatures & Accreditation */}
                <div className="pt-3 flex justify-between items-end text-[9px] font-semibold text-slate-500 border-t border-slate-200">
                  <div className="text-center space-y-0.5">
                    <div className="w-32 border-b border-slate-400 mb-1" />
                    <p className="font-bold text-slate-700">{lang === 'bn' ? 'খামারি / বিক্রেতার স্বাক্ষর' : "Farmer's Signature"}</p>
                    <p className="text-[8px] text-slate-400">AgroMarket Verified Dispatch</p>
                  </div>
                  <div className="text-center text-[8px] text-slate-400 max-w-44 space-y-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mx-auto" />
                    <p className="font-bold text-slate-600">AgroMarket Digital Invoice</p>
                    <p>{lang === 'bn' ? 'স্বয়ংক্রিয় কম্পিউটারাইজড রসিদ' : 'Automated Certified Invoice'}</p>
                  </div>
                  <div className="text-center space-y-0.5">
                    <div className="w-32 border-b border-slate-400 mb-1" />
                    <p className="font-bold text-slate-700">{lang === 'bn' ? 'ক্রেতা / গ্রহীতার স্বাক্ষর' : "Recipient's Signature"}</p>
                    <p className="text-[8px] text-slate-400">Received Fresh Condition</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* Cancel Confirmation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                {lang === 'bn' ? 'অর্ডার বাতিল নিশ্চিতকরণ' : 'Cancel Customer Order'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? `আপনি কি নিশ্চিত #${cancelModalOrder.order_number} অর্ডারটি বাতিল করতে চান? গ্রাহককে অবহিত করা হবে।`
                  : `Are you sure you want to cancel order #${cancelModalOrder.order_number}? The customer will be notified.`}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                {lang === 'bn' ? 'না, ফেরত যান' : 'Keep Order'}
              </button>
              <button
                onClick={() => handleUpdateStatus(cancelModalOrder.id, 'CANCELLED')}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-600/20 transition-all"
              >
                {lang === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                {t('deleteOrderModalTitle')}
              </h3>
              <p className="font-mono text-sm font-black text-emerald-800 bg-emerald-50 py-1 px-3 rounded-lg inline-block border border-emerald-200">
                #{deleteModalOrder.order_number}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('sellerDeleteOrderModalDesc')}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOrder(null)}
                disabled={deletingOrderId === deleteModalOrder.id}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                {t('deleteOrderModalCancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOrder(deleteModalOrder.id)}
                disabled={deletingOrderId === deleteModalOrder.id}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
              >
                {deletingOrderId === deleteModalOrder.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('deleteOrderModalConfirm')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Live Chat Modal with Buyer */}
      {activeChatBuyer && (
        <ChatModal
          isOpen={Boolean(activeChatBuyer)}
          onClose={() => setActiveChatBuyer(null)}
          sellerId={user?.sellerProfile?.id}
          buyerId={activeChatBuyer.buyerId}
          buyerName={activeChatBuyer.buyerName}
          buyerAvatar={activeChatBuyer.buyerAvatar}
          farmLogo={activeChatBuyer.farmLogo || user?.sellerProfile?.logo_image_url}
          productId={activeChatBuyer.productId}
          productTitle={activeChatBuyer.productTitle}
          productImage={activeChatBuyer.productImage}
          productPrice={activeChatBuyer.productPrice}
          productUnit={activeChatBuyer.productUnit}
        />
      )}

    </div>
  );
}
