import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Clock,
  Truck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Star,
  ArrowRight,
  ShieldCheck,
  Calendar,
  X,
  Check,
  CreditCard,
  RefreshCw,
  PackageCheck,
  Trash2,
  Printer,
  Sprout,
  User
} from 'lucide-react';

export default function BuyerOrders() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  // Payment & Delete loading state
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState(null);
  const [deleteModalOrder, setDeleteModalOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  // Invoice Modal State
  const [printModalOrder, setPrintModalOrder] = useState(null);

  // Helper to resolve seller / farm details for buyer invoice
  const getOrderSellerInfo = (order) => {
    const firstItem = order?.items?.[0];
    return {
      farmName: firstItem?.farm_name || (lang === 'bn' ? 'রাজশাহী আম হাব' : 'Rajshahi Mango Hub'),
      farmerName: firstItem?.farmer_name || (lang === 'bn' ? 'মোঃ রফিকুল ইসলাম' : 'Md. Rafiqul Islam'),
      phone: firstItem?.farmer_phone || '+880 1711-234567',
      district: firstItem?.farm_district || (lang === 'bn' ? 'রাজশাহী' : 'Rajshahi'),
      division: firstItem?.farm_division || (lang === 'bn' ? 'রাজশাহী বিভাগ' : 'Rajshahi Division'),
      address: firstItem?.farm_upazila ? `${firstItem.farm_upazila}, ${firstItem.farm_district}` : (lang === 'bn' ? 'বাঘা, রাজশাহী' : 'Bagha, Rajshahi')
    };
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

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('agromarket_token');
      const res = await fetch('http://localhost:5000/api/orders/my-orders', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Soft Delete Order
  const handleDeleteOrder = async (orderId) => {
    try {
      setDeletingOrderId(orderId);
      const token = localStorage.getItem('agromarket_token');
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to delete order');

      // Remove from view immediately
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setDeleteModalOrder(null);
      setPaymentNotice({
        type: 'success',
        message: lang === 'bn' ? 'অর্ডারটি সফলভাবে তালিকা থেকে মুছে ফেলা হয়েছে।' : 'Order removed from active view successfully.'
      });
      setTimeout(() => setPaymentNotice(null), 3500);
    } catch (err) {
      console.error('Error soft deleting buyer order:', err);
      setPaymentNotice({
        type: 'error',
        message: lang === 'bn' ? 'অর্ডার মুছতে সমস্যা হয়েছে।' : 'Failed to delete order.'
      });
      setTimeout(() => setPaymentNotice(null), 3500);
    } finally {
      setDeletingOrderId(null);
    }
  };

  // Open Review Modal
  const openReviewModal = (product, orderId) => {
    setReviewProduct({ ...product, orderId });
    setReviewRating(5);
    setReviewComment('');
    setReviewSuccessMsg(null);
    setReviewModalOpen(true);
  };

  // Submit Review Form
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewProduct) return;

    try {
      setSubmittingReview(true);
      const token = localStorage.getItem('agromarket_token');
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          productId: reviewProduct.product_id || reviewProduct.id,
          orderId: reviewProduct.orderId,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        setReviewSuccessMsg(lang === 'bn' ? 'রিভিউ ও রেটিং সফলভাবে জমা হয়েছে!' : 'Review submitted successfully!');
        setTimeout(() => {
          setReviewModalOpen(false);
          setReviewSuccessMsg(null);
        }, 1800);
      }
    } catch (err) {
      alert('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Buyer confirms COD cash payment upon physical delivery
  const handleConfirmPayment = async (orderId) => {
    try {
      setConfirmingOrderId(orderId);
      const token = localStorage.getItem('agromarket_token');
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/confirm-payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) throw new Error('Could not confirm payment');

      // Update state locally
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, payment_status: 'PAID', order_status: 'DELIVERED' }
            : o
        )
      );

      setPaymentNotice({
        type: 'success',
        message:
          lang === 'bn'
            ? 'ক্যাশ পেমেন্ট সফলভাবে সম্পন্ন হয়েছে এবং ডেলিভারি নিশ্চিত হয়েছে! ধন্যবাদ।'
            : 'Cash payment completed and delivery confirmed! Thank you.'
      });
      setTimeout(() => setPaymentNotice(null), 4000);
    } catch (err) {
      console.error('Error confirming payment:', err);
      setPaymentNotice({
        type: 'error',
        message:
          lang === 'bn'
            ? 'পেমেন্ট নিশ্চিত করতে সমস্যা হয়েছে।'
            : 'Failed to confirm payment.'
      });
      setTimeout(() => setPaymentNotice(null), 4000);
    } finally {
      setConfirmingOrderId(null);
    }
  };

  // Filter orders by active tab
  const filteredOrders = orders.filter((order) => {
    const isCodPending = order.payment_method === 'COD' && order.payment_status === 'PENDING';
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') {
      // If COD payment is pending, keep it in ACTIVE tab even if seller marked DELIVERED
      return ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED'].includes(order.order_status) || (order.order_status === 'DELIVERED' && isCodPending);
    }
    if (activeTab === 'DELIVERED') {
      // Show in DELIVERED tab when order reaches DELIVERED status
      return order.order_status === 'DELIVERED';
    }
    if (activeTab === 'CANCELLED') return order.order_status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (order) => {
    // Special badge for COD orders that arrived/delivered but cash payment is pending from buyer
    if (order.payment_method === 'COD' && order.payment_status === 'PENDING') {
      if (order.order_status === 'DELIVERED') {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            {lang === 'bn' ? 'পণ্য পৌঁছেছে (পেমেন্ট বাকি)' : 'Delivered (Payment Due)'}
          </span>
        );
      }
    }

    switch (order.order_status) {
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            {t('orderStatusProcessing')}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {lang === 'bn' ? 'অর্ডার প্রক্রিয়াধীন' : 'Order Placed (Pending)'}
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            {t('orderStatusReadyPickup')}
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
            <Truck className="w-3.5 h-3.5 text-sky-600" />
            {t('orderStatusDispatched')}
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {order.payment_status === 'PAID'
              ? (lang === 'bn' ? 'ডেলিভারি সম্পন্ন ও পরিশোধিত' : 'Delivered & Paid')
              : (lang === 'bn' ? 'ডেলিভারি সম্পন্ন' : 'Delivered')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            {t('orderStatusCancelled')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Toast Notice */}
      {paymentNotice && (
        <div
          className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 ${
            paymentNotice.type === 'success'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'bg-rose-100 text-rose-900 border border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {paymentNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-700" />
            )}
            <span>{paymentNotice.message}</span>
          </div>
          <button
            onClick={() => setPaymentNotice(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
          <Package className="w-8 h-8 text-emerald-600" />
          <span>{t('myOrdersTitle')}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t('myOrdersSubtitle')}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'ALL'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
          }`}
        >
          {t('allOrdersTab')} ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
          }`}
        >
          {t('activeOrdersTab')} ({orders.filter(o => ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED'].includes(o.order_status) || (o.order_status === 'DELIVERED' && o.payment_method === 'COD' && o.payment_status === 'PENDING')).length})
        </button>
        <button
          onClick={() => setActiveTab('DELIVERED')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'DELIVERED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
          }`}
        >
          {t('completedOrdersTab')} ({orders.filter(o => o.order_status === 'DELIVERED').length})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">{t('processing')}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOrders.length === 0 && (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-emerald-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {lang === 'bn' ? 'কোনো অর্ডার খুঁজে পাওয়া যায়নি' : 'No Orders Found'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {lang === 'bn'
              ? 'আপনার এই ক্যাটাগরিতে কোনো কৃষি পণ্যের অর্ডার নেই। বাজারের ক্যাটালগ ঘুরে দেখুন।'
              : 'You do not have any active produce orders in this view. Explore the marketplace!'}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all text-sm"
          >
            <span>{t('startShoppingBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Order Cards List */}
      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Top Header */}
              <div className="p-6 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-base text-slate-900">
                      {order.order_number}
                    </span>
                    {getStatusBadge(order)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(order.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-800">
                      {order.payment_method} ({order.payment_status === 'PAID' ? (lang === 'bn' ? 'পরিশোধিত' : 'Paid') : (lang === 'bn' ? 'বাকি' : 'Due')})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Invoice Button */}
                  <button
                    type="button"
                    onClick={() => setPrintModalOrder(order)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs shadow-emerald-600/20 cursor-pointer"
                    title={lang === 'bn' ? 'ইনভয়েস' : 'Invoice'}
                  >
                    <Printer className="w-3.5 h-3.5 text-white" />
                    <span>{lang === 'bn' ? 'ইনভয়েস' : 'Invoice'}</span>
                  </button>

                  {/* Soft Delete Order Button */}
                  <button
                    type="button"
                    onClick={() => setDeleteModalOrder(order)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-bold text-xs border border-rose-200 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title={t('deleteOrderBtn')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('deleteOrderBtn')}</span>
                  </button>
                </div>
              </div>

              {/* Progress Stepper Timeline */}
              <div className="px-6 py-4 bg-emerald-50/20 border-b border-slate-100">
                <div className="grid grid-cols-3 text-center text-xs font-bold text-slate-600 gap-2">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{lang === 'bn' ? '১. অর্ডার নিশ্চিত' : '1. Order Confirmed'}</span>
                  </div>
                  <div
                    className={`flex items-center justify-center gap-1.5 ${
                      ['READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED'].includes(order.order_status)
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>{lang === 'bn' ? '২. খামার থেকে প্রেরণ' : '2. Dispatched from Farm'}</span>
                  </div>
                  <div
                    className={`flex items-center justify-center gap-1.5 ${
                      order.order_status === 'DELIVERED'
                        ? (order.payment_method === 'COD' && order.payment_status === 'PENDING' ? 'text-amber-700' : 'text-emerald-700')
                        : 'text-slate-400'
                    }`}
                  >
                    {order.order_status === 'DELIVERED' && order.payment_method === 'COD' && order.payment_status === 'PENDING' ? (
                      <Clock className="w-4 h-4 shrink-0 text-amber-600 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      {order.order_status === 'DELIVERED' && order.payment_method === 'COD' && order.payment_status === 'PENDING'
                        ? (lang === 'bn' ? '৩. পণ্য পৌঁছেছে (পেমেন্ট বাকি)' : '3. Delivered (Payment Due)')
                        : (lang === 'bn' ? '৩. ডেলিভারি সম্পন্ন' : '3. Delivered')}
                    </span>
                  </div>
                </div>
              </div>

              {/* COD Payment Confirmation Action Banner */}
              {order.payment_method === 'COD' && order.payment_status === 'PENDING' && (
                <div className={`p-4 sm:p-6 border-b transition-all ${
                  order.order_status === 'DELIVERED'
                    ? 'bg-amber-50/90 border-amber-200'
                    : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-3 rounded-2xl shrink-0 ${
                        order.order_status === 'DELIVERED'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-sm sm:text-base text-slate-900">
                            {order.order_status === 'DELIVERED'
                              ? (lang === 'bn' ? 'পণ্য ডেলিভারি সম্পন্ন — ক্যাশ পেমেন্ট সম্পন্ন করুন' : 'Produce Delivered — Please Complete Payment')
                              : (lang === 'bn' ? 'ক্যাশ অন ডেলিভারি (পেমেন্ট বাকি)' : 'Cash on Delivery (Pending)')}
                          </h4>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
                            {lang === 'bn' ? 'বকেয়া: ৳' : 'Due: ৳'}{parseFloat(order.total_amount_bdt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl">
                          {order.order_status === 'DELIVERED'
                            ? (lang === 'bn'
                                ? 'কৃষক বা ডেলিভারি প্রতিনিধি পণ্য আপনার হাতে সফলভাবে হস্তান্তর করেছেন। আপনি নগদ ৳' + parseFloat(order.total_amount_bdt).toLocaleString() + ' টাকা পরিশোধ করে থাকলে নিচের "পেমেন্ট সম্পন্ন করুন" বাটনে ক্লিক করে ডেলিভারি কনফার্ম করুন।'
                                : 'The produce has been physically delivered to you. Once you have handed over ৳' + parseFloat(order.total_amount_bdt).toLocaleString() + ' in cash to the courier/farmer, click the button to finalize delivery.')
                            : (lang === 'bn'
                                ? 'পণ্য আপনার ঠিকানায় পৌঁছানোর পর নগদ মূল্য পরিশোধ করবেন। ডেলিভারি সম্পন্ন হলে এখানে পেমেন্ট নিশ্চিতকরণ বোতাম সক্রিয় হবে।'
                                : 'Pay cash once produce reaches your address. The payment completion button will activate once delivered.')}
                        </p>
                      </div>
                    </div>

                    {order.order_status === 'DELIVERED' && (
                      <button
                        type="button"
                        onClick={() => handleConfirmPayment(order.id)}
                        disabled={confirmingOrderId === order.id}
                        className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
                      >
                        {confirmingOrderId === order.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Confirming...'}</span>
                          </>
                        ) : (
                          <>
                            <PackageCheck className="w-5 h-5 stroke-[2.5]" />
                            <span>
                              {lang === 'bn'
                                ? `পেমেন্ট সম্পন্ন করুন (৳${parseFloat(order.total_amount_bdt).toLocaleString()})`
                                : `Complete Payment (৳${parseFloat(order.total_amount_bdt).toLocaleString()})`}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="p-6 divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80'}
                        alt={item.title}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/products/${item.product_id}`}
                          className="font-bold text-sm text-slate-900 hover:text-emerald-700 block truncate"
                        >
                          {lang === 'bn' && item.title_bn ? item.title_bn : item.title}
                        </Link>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {item.farm_name} ({item.farm_district})
                        </span>
                        <span className="text-xs text-slate-600 mt-0.5 block">
                          {item.quantity} {t(item.unit) || item.unit} × ৳{item.unit_price_at_purchase_bdt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-black text-slate-900">
                        ৳{parseFloat(item.subtotal_bdt).toLocaleString()}
                      </span>

                      {/* Review Trigger Button (if delivered and paid) */}
                      {order.order_status === 'DELIVERED' && order.payment_status === 'PAID' && (
                        <button
                          type="button"
                          onClick={() => openReviewModal(item, order.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 flex items-center gap-1 transition-all"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{t('rateProductBtn')}</span>
                        </button>
                      )}

                      {order.order_status === 'DELIVERED' && order.payment_status === 'PENDING' && (
                        <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                          {lang === 'bn' ? 'পেমেন্ট সম্পন্ন হলে রিভিউ দিতে পারবেন' : 'Review unlocks after payment'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer: Delivery Destination & Total */}
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-slate-600 max-w-lg">
                  {order.fulfillment_type === 'PICKUP' ? (
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="truncate">
                    <strong>{order.fulfillment_type === 'PICKUP' ? t('farmPickup') : t('homeDelivery')}:</strong>{' '}
                    {order.delivery_address}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">{t('grandTotalLabel')}</span>
                  <span className="text-xl font-black text-emerald-900">
                    ৳{parseFloat(order.total_amount_bdt || order.total_bdt || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal Dialog */}
      {reviewModalOpen && reviewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>{t('writeReview')}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5 truncate">
              {reviewProduct.title} ({reviewProduct.farm_name})
            </p>

            {reviewSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>{reviewSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('ratingLabel')}</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {lang === 'bn' ? 'আপনার মন্তব্য' : 'Review Feedback'}
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  placeholder={t('commentPlaceholder')}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {submittingReview ? t('processing') : t('submitReviewBtn')}
              </button>
            </form>
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
                {t('buyerDeleteOrderModalDesc')}
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
      {/* Printable 1-Page Official Invoice Modal */}
      {printModalOrder && typeof document !== 'undefined' && createPortal((() => {
        const activeSeller = getOrderSellerInfo(printModalOrder);
        const deliveryCharge = printModalOrder.fulfillment_type === 'DELIVERY' ? parseFloat(printModalOrder.delivery_fee_bdt || 60) : 0;
        const subtotal = parseFloat(printModalOrder.subtotal_bdt || 0);
        const grandTotal = parseFloat(printModalOrder.total_bdt || (subtotal + deliveryCharge));

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
                    <p className="font-black text-slate-900 text-xs">{printModalOrder.buyer_name || user?.full_name || 'AgroMarket Customer'}</p>
                    <p className="text-slate-700 font-semibold text-[11px]">{printModalOrder.buyer_phone || user?.phone || '+880 1700-000000'}</p>
                    {(printModalOrder.buyer_email || user?.email) && (
                      <p className="text-slate-500 text-[10px]">{printModalOrder.buyer_email || user?.email}</p>
                    )}
                    <p className="text-slate-600 font-medium text-[10px] leading-tight">
                      <span className="font-bold">{lang === 'bn' ? 'ঠিকানা: ' : 'Address: '}</span>
                      {printModalOrder.delivery_address || user?.address || (lang === 'bn' ? 'খামার গেট থেকে সংগ্রহ' : 'Direct Gate Pickup')}
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
                      <span className="font-mono font-semibold">৳{subtotal.toFixed(2)}</span>
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
    </div>
  );
}
