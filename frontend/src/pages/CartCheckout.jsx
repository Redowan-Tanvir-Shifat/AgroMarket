import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Truck,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  X,
  Sparkles,
  Check
} from 'lucide-react';

export default function CartCheckout() {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  // Fulfillment: 'DELIVERY' or 'PICKUP'
  const [fulfillmentType, setFulfillmentType] = useState('DELIVERY');

  // Payment Method: 'BKASH', 'NAGAD', 'ROCKET', 'COD'
  const [paymentMethod, setPaymentMethod] = useState('BKASH');

  // Customer Delivery Info
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    division: user?.division || 'Dhaka',
    district: user?.district || 'Dhaka',
    upazila: user?.upazila || '',
    address: user?.address || ''
  });

  // MFS Simulation Modal State (bKash / Nagad / Rocket)
  const [showMfsModal, setShowMfsModal] = useState(false);
  const [mfsStep, setMfsStep] = useState(1); // 1: Number, 2: OTP, 3: PIN
  const [mfsNumber, setMfsNumber] = useState(user?.phone || '01711223344');
  const [mfsOtp, setMfsOtp] = useState('123456');
  const [mfsPin, setMfsPin] = useState('');
  const [mfsProcessing, setMfsProcessing] = useState(false);

  // Overall Order Processing & Success State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  // Calculations
  const deliveryFee = fulfillmentType === 'DELIVERY' ? 100 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Trigger checkout initiation
  const handleInitiateOrder = (e) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!formData.fullName?.trim() || !formData.phone?.trim()) {
      setCheckoutError(
        lang === 'bn'
          ? 'অনুগ্রহ করে প্রাপকের নাম এবং মোবাইল নম্বর প্রদান করুন।'
          : 'Please provide recipient name and contact phone number.'
      );
      return;
    }

    if (fulfillmentType === 'DELIVERY' && !formData.address?.trim()) {
      setCheckoutError(
        lang === 'bn'
          ? 'হোম ডেলিভারির জন্য অনুগ্রহ করে বিস্তারিত ঠিকানা পূরণ করুন।'
          : 'Please provide a detailed delivery address for home courier delivery.'
      );
      return;
    }

    // If MFS payment (bKash, Nagad, Rocket), trigger interactive modal simulation
    if (paymentMethod === 'BKASH' || paymentMethod === 'NAGAD' || paymentMethod === 'ROCKET') {
      setMfsStep(1);
      setShowMfsModal(true);
    } else {
      // Direct COD order
      finalizeOrder('COD');
    }
  };

  // Finalize order API call
  const finalizeOrder = async (method) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('agromarket_token');

      const deliveryAddrText = fulfillmentType === 'PICKUP'
        ? (formData.address?.trim() ? `${formData.address}, ` : '') + (lang === 'bn' ? 'খামার গেট থেকে সরাসরি সংগ্রহ' : 'Farm Gate Direct Collection') + `. মোবাইল: ${formData.phone}`
        : `${formData.address}, ${formData.upazila ? formData.upazila + ', ' : ''}${formData.district}, ${formData.division}. মোবাইল: ${formData.phone}`;

      const payload = {
        items: cart,
        fulfillmentType,
        paymentMethod: method,
        deliveryAddress: deliveryAddrText,
        totalAmount: grandTotal
      };

      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order placement failed');

      // Success
      setOrderSuccess(data.order);
      clearCart();
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setIsSubmitting(false);
      setShowMfsModal(false);
    }
  };

  // Handle MFS simulation steps
  const handleMfsNextStep = () => {
    if (mfsStep === 1) {
      setMfsStep(2);
    } else if (mfsStep === 2) {
      setMfsStep(3);
    } else if (mfsStep === 3) {
      setMfsProcessing(true);
      setTimeout(() => {
        setMfsProcessing(false);
        finalizeOrder(paymentMethod);
      }, 1500);
    }
  };

  // 1. Success Screen View
  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-xl space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {orderSuccess.paymentMethod === 'COD' ? 'ক্যাশ অন ডেলিভারি' : 'ডিজিটাল পেমেন্ট সফল'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {t('orderSuccessTitle')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{t('orderSuccessSub')}:</p>
            <div className="inline-block px-5 py-2 mt-2 bg-slate-900 text-emerald-400 font-mono font-bold text-lg rounded-xl tracking-wider shadow-inner">
              {orderSuccess.orderNumber}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-200 text-xs sm:text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('fulfillmentType')}:</span>
              <strong className="text-slate-800">
                {orderSuccess.fulfillmentType === 'DELIVERY' ? t('homeDelivery') : t('farmPickup')}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('paymentMethodTitle')}:</span>
              <strong className="text-emerald-700 font-bold">{orderSuccess.paymentMethod}</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-base">
              <span className="text-slate-900">{t('grandTotalLabel')}:</span>
              <span className="text-emerald-800">৳{orderSuccess.totalAmount}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === 'bn'
              ? 'কৃষককে আপনার অর্ডার সম্পর্কে অবহিত করা হয়েছে। শীঘ্রই তাজা ফসল প্যাকেজিং করে প্রেরণ করা হবে।'
              : 'The farmer has been notified of your fresh harvest order. Packing & dispatch is underway.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/account/orders"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all text-sm"
            >
              {t('viewOrdersBtn')}
            </Link>
            <Link
              to="/products"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all text-sm"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty Cart View
  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 sm:p-16 border border-emerald-100 shadow-sm space-y-5">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">{t('cartEmpty')}</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">{t('cartEmptySub')}</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    );
  }

  // 3. Main Checkout Flow
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
        <ShoppingCart className="w-8 h-8 text-emerald-600" />
        <span>{t('cartTitle')}</span>
      </h1>

      {checkoutError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between">
          <span>{checkoutError}</span>
          <button onClick={() => setCheckoutError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Section: Cart Items & Delivery Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Itemized Cart List */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 pb-4 border-b border-slate-100 flex items-center justify-between">
              <span>{lang === 'bn' ? 'কার্টের তাজা ফসল' : 'Produce in Your Cart'} ({cart.length})</span>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
              </button>
            </h2>

            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={`${item.id}-${item.selectedUnit}`} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                      alt={item.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <Link to={`/products/${item.id}`} className="font-bold text-sm text-slate-900 hover:text-emerald-700 truncate block">
                        {lang === 'bn' && item.title_bn ? item.title_bn : item.title}
                      </Link>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {item.farm_name} ({item.farm_district})
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-emerald-800">
                          ৳{item.unitPrice} / {t(item.selectedUnit) || item.selectedUnit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Line Total */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.selectedUnit, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.selectedUnit, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-black text-slate-900 w-16 text-right">
                      ৳{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id, item.selectedUnit)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fulfillment Option (Delivery vs Farm Pickup) */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <span>{t('fulfillmentType')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home Delivery */}
              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                  fulfillmentType === 'DELIVERY'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-emerald-200 bg-white'
                }`}
              >
                {fulfillmentType === 'DELIVERY' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute top-4 right-4" />
                )}
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">{t('homeDelivery')}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('homeDeliveryDesc')}</p>
                <span className="inline-block mt-3 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-md">
                  + ৳১০০ {lang === 'bn' ? 'কুরিয়ার চার্জ' : 'Courier Fee'}
                </span>
              </button>

              {/* Farm Direct Pickup */}
              <button
                type="button"
                onClick={() => setFulfillmentType('PICKUP')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                  fulfillmentType === 'PICKUP'
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-emerald-200 bg-white'
                }`}
              >
                {fulfillmentType === 'PICKUP' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute top-4 right-4" />
                )}
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">{t('farmPickup')}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('farmPickupDesc')}</p>
                <span className="inline-block mt-3 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
                  ৳০ {lang === 'bn' ? 'সম্পূর্ণ ফ্রি' : 'Free 0 Fee'}
                </span>
              </button>
            </div>
          </div>

          {/* Delivery Address & Contact Form */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>{t('deliveryAddressTitle')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('fullNameLabel')}</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="যেমন: মো: রফিক উদ্দিন"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('phoneLabel')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="01711xxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('divisionLabel')}</label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-medium"
                >
                  <option value="Dhaka">Dhaka (ঢাকা)</option>
                  <option value="Rajshahi">Rajshahi (রাজশাহী)</option>
                  <option value="Chattogram">Chattogram (চট্টগ্রাম)</option>
                  <option value="Rangpur">Rangpur (রংপুর)</option>
                  <option value="Khulna">Khulna (খুলনা)</option>
                  <option value="Sylhet">Sylhet (সিলেট)</option>
                  <option value="Barishal">Barishal (বরিশাল)</option>
                  <option value="Mymensingh">Mymensingh (ময়মনসিংহ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('districtLabel')}</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  placeholder="যেমন: বগুড়া / দিনাজপুর / রাজশাহী / ঢাকা"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('addressDetailsLabel')}</label>
                <textarea
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="বাসা নং, রোড নং, এলাকা অথবা গ্রাম/ইউনিয়ন..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Payment Method & Order Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Payment Method Selector */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              <span>{t('paymentMethodTitle')}</span>
            </h2>

            <div className="space-y-3">
              {/* bKash */}
              <div
                onClick={() => setPaymentMethod('BKASH')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'BKASH'
                    ? 'border-[#D12053] bg-pink-50/50 ring-2 ring-[#D12053]/20 shadow-xs'
                    : 'border-slate-200 hover:border-pink-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pm-bkash"
                    name="paymentMethod"
                    value="BKASH"
                    checked={paymentMethod === 'BKASH'}
                    onChange={() => setPaymentMethod('BKASH')}
                    className="text-[#D12053] focus:ring-[#D12053]"
                  />
                  <div>
                    <label htmlFor="pm-bkash" className="font-extrabold text-sm text-slate-900 block cursor-pointer">{t('bkashPay')}</label>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'bn' ? 'বিকাশ পেমেন্ট গেটওয়ে (সিমুলেশন)' : 'bKash Payment Gateway (Simulation)'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-[#D12053] bg-pink-100 px-2 py-0.5 rounded">bKash</span>
              </div>

              {/* Nagad */}
              <div
                onClick={() => setPaymentMethod('NAGAD')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'NAGAD'
                    ? 'border-[#F7931E] bg-orange-50/50 ring-2 ring-[#F7931E]/20 shadow-xs'
                    : 'border-slate-200 hover:border-orange-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pm-nagad"
                    name="paymentMethod"
                    value="NAGAD"
                    checked={paymentMethod === 'NAGAD'}
                    onChange={() => setPaymentMethod('NAGAD')}
                    className="text-[#F7931E] focus:ring-[#F7931E]"
                  />
                  <div>
                    <label htmlFor="pm-nagad" className="font-extrabold text-sm text-slate-900 block cursor-pointer">{t('nagadPay')}</label>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'bn' ? 'নগদ অ্যাকাউন্ট পেমেন্ট' : 'Nagad Mobile Account'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-[#F7931E] bg-orange-100 px-2 py-0.5 rounded">Nagad</span>
              </div>

              {/* Rocket */}
              <div
                onClick={() => setPaymentMethod('ROCKET')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'ROCKET'
                    ? 'border-[#8C3494] bg-purple-50/50 ring-2 ring-[#8C3494]/20 shadow-xs'
                    : 'border-slate-200 hover:border-purple-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pm-rocket"
                    name="paymentMethod"
                    value="ROCKET"
                    checked={paymentMethod === 'ROCKET'}
                    onChange={() => setPaymentMethod('ROCKET')}
                    className="text-[#8C3494] focus:ring-[#8C3494]"
                  />
                  <div>
                    <label htmlFor="pm-rocket" className="font-extrabold text-sm text-slate-900 block cursor-pointer">{t('rocketPay')}</label>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'bn' ? 'ডাচ-বাংলা রকেট মোবাইল ব্যাংকিং' : 'DBBL Rocket Mobile Banking'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-[#8C3494] bg-purple-100 px-2 py-0.5 rounded">Rocket</span>
              </div>

              {/* Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-emerald-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="pm-cod"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <label htmlFor="pm-cod" className="font-extrabold text-sm text-slate-900 block cursor-pointer">{t('codPay')}</label>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'bn' ? 'পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন' : 'Pay in cash upon receiving produce'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">COD</span>
              </div>

              {/* COD Explanatory Note */}
              {paymentMethod === 'COD' && (
                <div className="p-3.5 rounded-2xl bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    {lang === 'bn'
                      ? 'ক্যাশ অন ডেলিভারি সক্রিয়: অর্ডার সম্পন্ন করার পর কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই। ফসল হাতে পেয়ে মূল্য পরিশোধ করুন।'
                      : 'Cash on Delivery Active: No advance payment required. Pay in cash upon inspection and receipt of your fresh produce.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Confirm Button */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
              {lang === 'bn' ? 'অর্ডার সারসংক্ষেপ' : 'Order Summary'}
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{t('subtotalLabel')}</span>
                <span className="font-bold text-slate-800">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('deliveryFeeLabel')}</span>
                <span className="font-bold text-slate-800">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-700">{lang === 'bn' ? 'ফ্রি (৳০)' : 'Free (৳0)'}</span>
                  ) : (
                    `৳${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold text-xs">
                <span>{lang === 'bn' ? 'সিন্ডিকেট বা ফড়িয়া কমিশন' : 'Middlemen Syndicate Fee'}</span>
                <span>{lang === 'bn' ? '৳০ (সরাসরি কৃষকের দাম)' : '৳0 (Direct Farm Price)'}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-black text-slate-900 text-base">{t('grandTotalLabel')}</span>
                <span className="font-black text-2xl text-emerald-800">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Error banner above button */}
            {checkoutError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{checkoutError}</span>
                </div>
                <button type="button" onClick={() => setCheckoutError(null)}>
                  <X className="w-3.5 h-3.5 text-rose-500" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleInitiateOrder}
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 hover:translate-y-[-1px]"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? t('orderProcessing') : t('placeOrderBtn')}</span>
            </button>

            <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {lang === 'bn' ? 'নিরাপদ ও নির্ভরযোগ্য কৃষি পেমেন্ট প্রসেসিং' : 'Safe & Encrypted Payment Processing'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* bKash / Nagad / Rocket Interactive Payment Modal Simulation */}
      {showMfsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div
              className={`p-6 text-white text-center relative ${
                paymentMethod === 'BKASH'
                  ? 'bg-[#D12053]'
                  : paymentMethod === 'NAGAD'
                  ? 'bg-[#F7931E]'
                  : 'bg-[#8C3494]'
              }`}
            >
              <button
                onClick={() => setShowMfsModal(false)}
                className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-full bg-black/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2 font-black text-xl">
                {paymentMethod === 'BKASH' ? 'bK' : paymentMethod === 'NAGAD' ? 'নগদ' : 'Rk'}
              </div>
              <h3 className="text-lg font-black">
                {paymentMethod} {lang === 'bn' ? 'পেমেন্ট গেটওয়ে' : 'Payment Gateway'}
              </h3>
              <p className="text-xs text-white/90">AgroMarket Bangladesh Merchant ID: 01700-AGRO</p>
              
              <div className="mt-3 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-xl inline-block text-xs font-bold">
                {lang === 'bn' ? 'মোট প্রদেয়:' : 'Total Amount:'} ৳{grandTotal.toLocaleString()}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {mfsStep === 1 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    {lang === 'bn'
                      ? `আপনার ${paymentMethod} মোবাইল অ্যাকাউন্ট নম্বর দিন:`
                      : `Enter your ${paymentMethod} mobile wallet number:`}
                  </label>
                  <input
                    type="tel"
                    value={mfsNumber}
                    onChange={(e) => setMfsNumber(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-base font-bold text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 text-center">
                    {lang === 'bn'
                      ? 'পরবর্তী ধাপে একটি ভেরিফিকেশন কোড (OTP) পাঠানো হবে'
                      : 'A simulation OTP verification code will be prompted next'}
                  </p>
                </div>
              )}

              {mfsStep === 2 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 text-center">
                    {lang === 'bn'
                      ? `${mfsNumber} নম্বরে প্রেরিত ৬ ডিজিটের OTP কোডটি লিখুন:`
                      : `Enter the 6-digit OTP code sent to ${mfsNumber}:`}
                  </label>
                  <input
                    type="text"
                    value={mfsOtp}
                    onChange={(e) => setMfsOtp(e.target.value)}
                    maxLength={6}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-xl font-black text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-emerald-700 text-center font-semibold">
                    {lang === 'bn' ? 'সিমুলেশন কোড:' : 'Simulation Code:'} <strong>123456</strong>
                  </p>
                </div>
              )}

              {mfsStep === 3 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 text-center">
                    {lang === 'bn'
                      ? `আপনার ${paymentMethod} একাউন্টের গোপন পিন (PIN) দিন:`
                      : `Enter your ${paymentMethod} secret PIN:`}
                  </label>
                  <input
                    type="password"
                    maxLength={5}
                    value={mfsPin}
                    onChange={(e) => setMfsPin(e.target.value)}
                    placeholder="•••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-2xl font-black text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 text-center">
                    {lang === 'bn'
                      ? 'সিমুলেশন পিন: যেকোনো ৫ ডিজিটের পিন লিখুন (যেমন: 12345)'
                      : 'Simulation PIN: Enter any 5-digit PIN (e.g. 12345)'}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleMfsNextStep}
                disabled={mfsProcessing}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm text-white shadow-md transition-all ${
                  paymentMethod === 'BKASH'
                    ? 'bg-[#D12053] hover:bg-[#b01642]'
                    : paymentMethod === 'NAGAD'
                    ? 'bg-[#F7931E] hover:bg-[#d87c12]'
                    : 'bg-[#8C3494] hover:bg-[#722878]'
                }`}
              >
                {mfsProcessing
                  ? (lang === 'bn' ? 'পেমেন্ট প্রসেসিং হচ্ছে...' : 'Processing Payment...')
                  : mfsStep === 3
                  ? (lang === 'bn' ? 'পেমেন্ট নিশ্চিত করুন (Confirm Payment)' : 'Confirm Payment')
                  : (lang === 'bn' ? 'পরবর্তী ধাপ (Next)' : 'Next Step')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
