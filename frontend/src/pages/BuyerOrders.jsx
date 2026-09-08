import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Clock,
  Truck,
  Building2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Star,
  ArrowRight,
  ShieldCheck,
  Calendar,
  X,
  Check
} from 'lucide-react';

export default function BuyerOrders() {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  // Reorder loading state
  const [reorderingId, setReorderingId] = useState(null);

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

  // 1-Click Reorder Action
  const handleReorder = async (orderId) => {
    try {
      setReorderingId(orderId);
      const token = localStorage.getItem('agromarket_token');
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/reorder`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) throw new Error('Could not reorder');
      const data = await res.json();

      // Add each item to cart with latest active price
      data.items.forEach((item) => {
        addToCart(item, item.quantity, item.selectedUnit || item.unit);
      });

      // Navigate to checkout
      navigate('/checkout');
    } catch (err) {
      alert(lang === 'bn' ? 'পুনরায় অর্ডার করতে সমস্যা হয়েছে।' : 'Failed to reorder items.');
    } finally {
      setReorderingId(null);
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

  // Filter orders by active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') {
      return ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED'].includes(order.order_status);
    }
    if (activeTab === 'DELIVERED') return order.order_status === 'DELIVERED';
    if (activeTab === 'CANCELLED') return order.order_status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PROCESSING':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
            {t('orderStatusProcessing')}
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            {t('orderStatusDispatched')}
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t('orderStatusDelivered')}
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
          {t('activeOrdersTab')}
        </button>
        <button
          onClick={() => setActiveTab('DELIVERED')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === 'DELIVERED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
          }`}
        >
          {t('completedOrdersTab')}
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
                    {getStatusBadge(order.order_status)}
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

                {/* 1-Click Reorder Button */}
                <button
                  type="button"
                  onClick={() => handleReorder(order.id)}
                  disabled={reorderingId === order.id}
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${reorderingId === order.id ? 'animate-spin' : ''}`} />
                  <span>{reorderingId === order.id ? t('processing') : t('reorderBtn')}</span>
                </button>
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
                      order.order_status === 'DELIVERED' ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{lang === 'bn' ? '৩. ডেলিভারি সম্পন্ন' : '3. Delivered'}</span>
                  </div>
                </div>
              </div>

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

                      {/* Review Trigger Button (if delivered) */}
                      {order.order_status === 'DELIVERED' && (
                        <button
                          type="button"
                          onClick={() => openReviewModal(item, order.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 flex items-center gap-1 transition-all"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{t('rateProductBtn')}</span>
                        </button>
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
                    ৳{parseFloat(order.total_amount_bdt).toLocaleString()}
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
    </div>
  );
}
