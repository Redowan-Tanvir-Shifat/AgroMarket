import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { formatHarvestAge } from '../utils/formatters';
import {
  Sprout,
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  Boxes,
  AlertTriangle,
  TrendingDown,
  Clock,
  CheckCircle2,
  RefreshCw,
  X,
  Layers,
  ArrowUpDown,
  Filter
} from 'lucide-react';

export default function SellerInventory() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedSellerId, setSelectedSellerId] = useState(() => {
    return user?.sellerProfile?.id || 1;
  });

  // Modal States
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockAddAmount, setStockAddAmount] = useState(20);
  const [stockMode, setStockMode] = useState('add'); // 'add' or 'set'
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  useEffect(() => {
    fetchInventory(selectedSellerId);
  }, [selectedSellerId]);

  const fetchInventory = async (sellerId) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/seller/products?sellerId=${sellerId}`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load seller inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick Stock Update Submission
  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!stockModalProduct) return;

    try {
      setIsUpdatingStock(true);
      const res = await axios.patch(
        `/api/seller/products/${stockModalProduct.id}/stock?sellerId=${selectedSellerId}`,
        {
          quantity: parseInt(stockAddAmount),
          mode: stockMode
        }
      );

      // Optimistic update local state
      setProducts(prev =>
        prev.map(p =>
          p.id === stockModalProduct.id
            ? { ...p, stock_quantity: res.data.newStock }
            : p
        )
      );

      setActionNotice({
        type: 'success',
        message: lang === 'bn' ? 'স্টক সফলভাবে আপডেট হয়েছে!' : 'Stock successfully updated!'
      });
      setStockModalProduct(null);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Error updating stock:', err);
      setActionNotice({
        type: 'error',
        message: lang === 'bn' ? 'স্টক আপডেট ব্যর্থ হয়েছে।' : 'Failed to update stock.'
      });
    } finally {
      setIsUpdatingStock(false);
    }
  };

  // Archive / Delete Crop Submission
  const handleDeleteCrop = async () => {
    if (!deleteConfirmProduct) return;

    try {
      setIsDeleting(true);
      await axios.delete(`/api/seller/products/${deleteConfirmProduct.id}?sellerId=${selectedSellerId}`);

      // Remove from list or mark expired
      setProducts(prev => prev.filter(p => p.id !== deleteConfirmProduct.id));

      setActionNotice({
        type: 'success',
        message: lang === 'bn' ? 'ফসল তালিকা থেকে সরানো হয়েছে।' : 'Crop archived from active listings.'
      });
      setDeleteConfirmProduct(null);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      console.error('Error archiving crop:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter products based on search query & active filter tab
  const filteredProducts = products.filter(p => {
    const titleMatch =
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title_bn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category_name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category_name_bn?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!titleMatch) return false;

    if (activeTab === 'ACTIVE') {
      return p.computed_status === 'ACTIVE' || p.status === 'ACTIVE';
    }
    if (activeTab === 'LOW_STOCK') {
      return p.stock_quantity <= p.low_stock_threshold;
    }
    if (activeTab === 'DECAY_DEALS') {
      return parseFloat(p.current_dynamic_price_bdt) < parseFloat(p.base_price_bdt);
    }
    if (activeTab === 'EXPIRED') {
      return p.computed_status === 'EXPIRED' || p.status === 'EXPIRED';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">

      {/* Top Notification Toast */}
      {actionNotice && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 ${
          actionNotice.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-rose-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'bn' ? 'খামার ইনভেন্টরি হাব' : 'Farm Inventory Hub'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t('inventoryTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            {t('inventorySubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-lg hover:scale-[1.02]"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>{t('addNewCropBtn')}</span>
          </Link>
        </div>
      </div>

      {/* Demo Seller Switcher */}
      <div className="p-3.5 bg-slate-100/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-semibold">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'bn' ? 'খামার পরিবর্তন (Demo Switcher):' : 'Active Farm View:'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 1, name: 'রাজশাহী আম হাব (রফিকুল)' },
            { id: 2, name: 'দিনাজপুর লিচু ও চাল (তারিকুল)' },
            { id: 3, name: 'বগুড়া সবজি ভান্ডার (কালাম)' }
          ].map((demo) => (
            <button
              key={demo.id}
              onClick={() => setSelectedSellerId(demo.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedSellerId === demo.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {demo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: t('tabAllCrops'), count: products.length },
            {
              id: 'ACTIVE',
              label: t('tabActiveCrops'),
              count: products.filter(p => p.computed_status === 'ACTIVE' || p.status === 'ACTIVE').length
            },
            {
              id: 'LOW_STOCK',
              label: t('tabLowStock'),
              count: products.filter(p => p.stock_quantity <= p.low_stock_threshold).length
            },
            {
              id: 'DECAY_DEALS',
              label: t('tabHighDecay'),
              count: products.filter(p => parseFloat(p.current_dynamic_price_bdt) < parseFloat(p.base_price_bdt)).length
            },
            {
              id: 'EXPIRED',
              label: t('tabExpired'),
              count: products.filter(p => p.computed_status === 'EXPIRED' || p.status === 'EXPIRED').length
            }
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
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchCropPlaceholder')}
            className="w-full pl-9.5 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-xs"
          />
        </div>
      </div>

      {/* INVENTORY DATA TABLE */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-20 bg-slate-200 rounded-3xl"></div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
          <h3 className="font-extrabold text-slate-800 text-base">
            {lang === 'bn' ? 'কোনো ফসল পাওয়া যায়নি' : 'No crops found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {lang === 'bn'
              ? 'আপনার অনুসন্ধানের সাথে মিল রেখে কোনো ফসল খুঁজে পাওয়া যায়নি। অন্য ফিল্টার নির্বাচন করুন।'
              : 'No produce matches your current filter or search criteria.'}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveTab('ALL'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            {lang === 'bn' ? 'সব ফিল্টার মুছুন' : 'Clear Filters'}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">{t('cropColumn')}</th>
                  <th className="py-4 px-4">{t('priceColumn')}</th>
                  <th className="py-4 px-4">{t('stockColumn')}</th>
                  <th className="py-4 px-4">{t('harvestAgeColumn')}</th>
                  <th className="py-4 px-4 text-center">{t('orderStatus')}</th>
                  <th className="py-4 px-6 text-right">{t('actionsColumn')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredProducts.map((crop) => {
                  const basePrice = parseFloat(crop.base_price_bdt);
                  const dynamicPrice = parseFloat(crop.current_dynamic_price_bdt || crop.base_price_bdt);
                  const hasDiscount = dynamicPrice < basePrice;
                  const discountBdt = Math.round(basePrice - dynamicPrice);
                  const isLowStock = crop.stock_quantity <= crop.low_stock_threshold;
                  const isExpired = crop.computed_status === 'EXPIRED' || crop.status === 'EXPIRED';

                  return (
                    <tr key={crop.id} className="hover:bg-emerald-50/30 transition-colors">
                      
                      {/* Produce Thumbnail & Title */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={crop.image_url || 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=150'}
                            alt={crop.title}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                          />
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm hover:text-emerald-700 transition-colors">
                              <Link to={`/products/${crop.id}`}>
                                {lang === 'bn' ? crop.title_bn : crop.title}
                              </Link>
                            </h4>
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600">
                                {lang === 'bn' ? (crop.category_name_bn || 'ফসল') : (crop.category_name_en || 'Produce')}
                              </span>
                              <span>•</span>
                              <span>ID: #{crop.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pricing & Decay Discount */}
                      <td className="py-4 px-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900">
                              ৳{dynamicPrice}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              / {t(crop.unit) || crop.unit}
                            </span>
                          </div>

                          {hasDiscount ? (
                            <div className="flex items-center gap-1 pt-0.5">
                              <span className="text-[11px] text-slate-400 line-through">
                                ৳{basePrice}
                              </span>
                              <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 font-extrabold text-[10px] flex items-center gap-0.5">
                                <TrendingDown className="w-2.5 h-2.5" />
                                -৳{discountBdt}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold">
                              {lang === 'bn' ? 'পূর্ণ মূল্য (Full Price)' : 'Full Base Price'}
                            </span>
                          )}

                          <span className="block text-[10px] text-slate-400 pt-0.5">
                            {lang === 'bn' ? 'ফ্লোর প্রাইস:' : 'Floor:'} ৳{crop.min_floor_price_bdt}
                          </span>
                        </div>
                      </td>

                      {/* Stock Level & Threshold */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-extrabold text-sm ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                              {crop.stock_quantity} {t(crop.unit) || crop.unit}
                            </span>
                            {isLowStock && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                {lang === 'bn' ? 'স্বল্প স্টক' : 'Low Stock'}
                              </span>
                            )}
                          </div>

                          {/* Progress Meter */}
                          <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                crop.stock_quantity === 0
                                  ? 'bg-rose-500'
                                  : isLowStock
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(8, (crop.stock_quantity / 150) * 100))}%` }}
                            ></div>
                          </div>

                          <span className="text-[10px] text-slate-400 block">
                            {lang === 'bn' ? 'সতর্কতা সীমা:' : 'Threshold:'} {crop.low_stock_threshold} {crop.unit}
                          </span>
                        </div>
                      </td>

                      {/* Harvest Age & Shelf Life */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatHarvestAge(crop.age_in_days || 1, lang)}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            {lang === 'bn' ? 'সর্বোচ্চ স্থায়িত্ব:' : 'Shelf Life:'} {crop.max_shelf_life_days} {lang === 'bn' ? 'দিন' : 'days'}
                          </span>
                        </div>
                      </td>

                      {/* Computed Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          isExpired
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isExpired
                            ? (lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'EXPIRED')
                            : isLowStock
                            ? (lang === 'bn' ? 'স্বল্প স্টক' : 'LOW STOCK')
                            : (lang === 'bn' ? 'সক্রিয়' : 'ACTIVE')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setStockModalProduct(crop);
                              setStockAddAmount(25);
                              setStockMode('add');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all flex items-center gap-1"
                            title="Restock Crop"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t('quickStockUpdate')}</span>
                          </button>

                          <Link
                            to={`/seller/products/${crop.id}/edit`}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Edit Crop"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setDeleteConfirmProduct(crop)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Archive Crop"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative border border-slate-200">
            <button
              onClick={() => setStockModalProduct(null)}
              className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <Boxes className="w-3.5 h-3.5" />
                <span>{t('addStockModalTitle')}</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {lang === 'bn' ? stockModalProduct.title_bn : stockModalProduct.title}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'বর্তমান মজুদ:' : 'Current Stock:'}{' '}
                <strong className="text-emerald-700 font-extrabold">{stockModalProduct.stock_quantity} {stockModalProduct.unit}</strong>
              </p>
            </div>

            <form onSubmit={handleStockUpdate} className="space-y-4">
              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setStockMode('add')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    stockMode === 'add'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'bn' ? '+ মজুদ যোগ করুন' : '+ Add to Stock'}
                </button>
                <button
                  type="button"
                  onClick={() => setStockMode('set')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    stockMode === 'set'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'bn' ? 'নির্দিষ্ট পরিমাণ নির্ধারণ' : 'Set Absolute Stock'}
                </button>
              </div>

              {/* Quick Preset Buttons (if mode is add) */}
              {stockMode === 'add' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500">
                    {lang === 'bn' ? 'দ্রুত পরিমাণ নির্বাচন করুন:' : 'Quick Select Presets:'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setStockAddAmount(amt)}
                        className={`py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                          stockAddAmount === amt
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  {stockMode === 'add'
                    ? (lang === 'bn' ? 'যোগ করার পরিমাণ:' : 'Amount to Add:')
                    : (lang === 'bn' ? 'নতুন মোট মজুদ পরিমাণ:' : 'New Total Stock Quantity:')}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setStockAddAmount(prev => Math.max(0, (parseInt(prev) || 0) - 5))}
                      className="px-3.5 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-bold transition-colors select-none text-base"
                      title="Decrease"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={stockAddAmount}
                      onChange={(e) => setStockAddAmount(e.target.value)}
                      className="w-full py-3 text-center text-base font-black bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setStockAddAmount(prev => (parseInt(prev) || 0) + 5)}
                      className="px-3.5 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-bold transition-colors select-none text-base"
                      title="Increase"
                    >
                      +
                    </button>
                  </div>
                  <div className="px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-700 uppercase tracking-wider shrink-0 select-none shadow-xs">
                    {t(stockModalProduct.unit) || stockModalProduct.unit}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {stockMode === 'add'
                    ? (lang === 'bn'
                        ? `আপডেটের পর মোট মজুদ হবে: ${parseInt(stockModalProduct.stock_quantity) + (parseInt(stockAddAmount) || 0)} ${stockModalProduct.unit}`
                        : `Stock after update will be: ${parseInt(stockModalProduct.stock_quantity) + (parseInt(stockAddAmount) || 0)} ${stockModalProduct.unit}`)
                    : (lang === 'bn'
                        ? `নতুন নির্ধারিত মজুদ হবে: ${stockAddAmount || 0} ${stockModalProduct.unit}`
                        : `New stock level will be: ${stockAddAmount || 0} ${stockModalProduct.unit}`)}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStock}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {isUpdatingStock ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : t('saveStockBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARCHIVE / DELETE CONFIRMATION MODAL */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 relative border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                {t('confirmDeleteCrop')}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? deleteConfirmProduct.title_bn : deleteConfirmProduct.title} ({deleteConfirmProduct.unit})
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'bn'
                ? 'এই ফসলটি মার্কেটপ্লেস ক্যাটালগ থেকে প্রত্যাহার করা হবে এবং ক্রেতারা আর এটি কিনতে পারবেন না।'
                : 'This crop listing will be archived from the public marketplace catalog.'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteCrop}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isDeleting ? (lang === 'bn' ? 'প্রক্রিয়াধীন...' : 'Archiving...') : t('deleteCropBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
