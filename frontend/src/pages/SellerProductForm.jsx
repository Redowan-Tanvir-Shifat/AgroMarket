import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Clock,
  Sparkles,
  Apple,
  Wheat,
  Carrot,
  Flame,
  Milk,
  Zap,
  Image as ImageIcon,
  Save,
  MapPin,
  ShieldCheck,
  DollarSign,
  Layers
} from 'lucide-react';

const PRESET_IMAGES = [
  {
    name: 'আম (Himsagar Mango)',
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'
  },
  {
    name: 'মিনিকেট চাল (Miniket Rice)',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'
  },
  {
    name: 'দিনাজপুরের লিচু (China-3 Lychee)',
    url: 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=600'
  },
  {
    name: 'বগুড়ার লাল আলু (Granola Potato)',
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600'
  },
  {
    name: 'পাবনার দেশি পেঁয়াজ (Native Onion)',
    url: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600'
  },
  {
    name: 'তাজা কাঁচা মরিচ (Green Chili)',
    url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600'
  },
  {
    name: 'খাঁটি গরুর দুধ (Pure Cow Milk)',
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600'
  }
];

const CATEGORIES = [
  { id: 1, name_en: 'Fruits', name_bn: 'আম ও ফলমূল', icon: Apple },
  { id: 2, name_en: 'Vegetables', name_bn: 'শাকসবজি', icon: Carrot },
  { id: 3, name_en: 'Rice & Grains', name_bn: 'চাল ও খাদ্যশস্য', icon: Wheat },
  { id: 4, name_en: 'Spices', name_bn: 'পেঁয়াজ ও মসলা', icon: Flame },
  { id: 5, name_en: 'Dairy & Eggs', name_bn: 'দুগ্ধ ও ডিম', icon: Milk },
];

export default function SellerProductForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    title_bn: '',
    category_id: 1,
    description: '',
    base_price_bdt: 120,
    min_floor_price_bdt: 80,
    stock_quantity: 100,
    low_stock_threshold: 15,
    harvest_date: new Date().toISOString().slice(0, 16),
    max_shelf_life_days: 7,
    unit: 'kg',
    image_url: PRESET_IMAGES[0].url
  });

  // Dynamic Aging Simulation slider in preview (hours elapsed)
  const [simulatedElapsedHours, setSimulatedElapsedHours] = useState(12);

  useEffect(() => {
    if (isEditing) {
      fetchCropForEdit();
    }
  }, [id]);

  const fetchCropForEdit = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/seller/products/${id}`);
      const crop = res.data.product;
      if (crop) {
        setFormData({
          title: crop.title || '',
          title_bn: crop.title_bn || '',
          category_id: crop.category_id || 1,
          description: crop.description || '',
          base_price_bdt: parseFloat(crop.base_price_bdt) || 0,
          min_floor_price_bdt: parseFloat(crop.min_floor_price_bdt) || 0,
          stock_quantity: parseInt(crop.stock_quantity) || 0,
          low_stock_threshold: parseInt(crop.low_stock_threshold) || 10,
          harvest_date: crop.harvest_date ? new Date(crop.harvest_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          max_shelf_life_days: parseInt(crop.max_shelf_life_days) || 7,
          unit: crop.unit || 'kg',
          image_url: crop.image_url || PRESET_IMAGES[0].url
        });
      }
    } catch (err) {
      console.error('Failed to load crop for edit:', err);
      setErrorNotice(lang === 'bn' ? 'ফসল তথ্য লোড করা যায়নি।' : 'Failed to load crop details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-suggest floor price as 65% of base price if floor is untouched or invalid
      if (field === 'base_price_bdt') {
        const base = parseFloat(value) || 0;
        if (prev.min_floor_price_bdt >= base || prev.min_floor_price_bdt === 0) {
          updated.min_floor_price_bdt = Math.round(base * 0.65);
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.base_price_bdt || !formData.stock_quantity) {
      setErrorNotice(lang === 'bn' ? 'অনুগ্রহ করে সকল আবশ্যক তথ্য প্রদান করুন।' : 'Please fill all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorNotice(null);

      if (isEditing) {
        await axios.put(`/api/seller/products/${id}`, formData);
      } else {
        await axios.post('/api/seller/products', formData);
      }

      navigate('/seller/inventory');
    } catch (err) {
      console.error('Error saving crop:', err);
      setErrorNotice(err.response?.data?.message || (lang === 'bn' ? 'ফসল সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save crop listing.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Real-time Dynamic Pricing Decay Simulation for Live Preview
  const basePriceNum = parseFloat(formData.base_price_bdt) || 0;
  const floorPriceNum = parseFloat(formData.min_floor_price_bdt) || 0;
  const maxHours = (parseInt(formData.max_shelf_life_days) || 7) * 24;
  const decayRatio = Math.min(1, Math.max(0, simulatedElapsedHours / maxHours));
  
  let simulatedCurrentPrice;
  if (decayRatio >= 1.0) {
    simulatedCurrentPrice = 0;
  } else if (decayRatio <= 0.1) {
    simulatedCurrentPrice = basePriceNum;
  } else {
    const decay = (decayRatio - 0.1) * 0.7;
    simulatedCurrentPrice = Math.max(floorPriceNum, Math.round(basePriceNum * (1 - decay)));
  }

  const simulatedSavings = Math.max(0, basePriceNum - simulatedCurrentPrice);
  const selectedCategory = CATEGORIES.find(c => c.id === parseInt(formData.category_id)) || CATEGORIES[0];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-2xl mx-auto mb-4"></div>
        <div className="h-96 bg-slate-200 rounded-3xl max-w-4xl mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      
      {/* Top Header & Navigation Back */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <Link
            to="/seller/inventory"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ইনভেন্টরিতে ফিরে যান' : 'Back to Inventory'}</span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {isEditing ? t('editCropTitle') : t('newCropTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            {t('cropFormSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/inventory"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-lg hover:scale-[1.02] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? t('savingCrop') : (isEditing ? t('updateCropBtn') : t('publishCropBtn'))}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorNotice && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* 2-COLUMN LAYOUT: FORM ON LEFT, LIVE PREVIEW ON RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: THE COMPLETE LISTING CREATOR FORM */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* SECTION 1: CROP IDENTIFICATION */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <Sprout className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base">
                {lang === 'bn' ? '১. ফসলের মৌলিক পরিচিতি' : '1. Produce Identification'}
              </h3>
            </div>

            {/* Crop Titles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('cropTitleBnLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title_bn}
                  onChange={(e) => handleChange('title_bn', e.target.value)}
                  placeholder="যেমন: রাজশাহীর তাজা হিমসাগর আম"
                  className="w-full px-4 py-3 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('cropTitleEnLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g. Fresh Rajshahi Himsagar Mango"
                  className="w-full px-4 py-3 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {t('cropCategoryLabel')} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = parseInt(formData.category_id) === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleChange('category_id', cat.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold leading-tight">
                          {lang === 'bn' ? cat.name_bn : cat.name_en}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t('cropDescriptionLabel')}
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="যেমন: রাসায়নিক মুক্ত, শতভাগ তাজা গাছপাকা আম। রাজশাহী পুঠিয়ার নিজস্ব বাগান থেকে সরাসরি তোলা।"
                className="w-full px-4 py-3 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* SECTION 2: DYNAMIC PRODUCE AGING ENGINE PARAMETERS */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base">
                  {lang === 'bn' ? '২. ডাইনামিক প্রাইসিং ও এজিং ইঞ্জিন' : '2. Dynamic Aging Pricing Engine'}
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                {lang === 'bn' ? 'পচন রোধ প্রযুক্তি' : 'Anti-Spoilage Tech'}
              </span>
            </div>

            {/* Pricing Row: Base Price vs Floor Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Base Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('basePriceLabelForm')} <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-2xl border border-slate-300 bg-slate-50 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden">
                  <span className="pl-4 text-sm font-black text-slate-500">৳</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.base_price_bdt}
                    onChange={(e) => handleChange('base_price_bdt', e.target.value)}
                    className="w-full px-3 py-3 text-sm font-bold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900"
                    required
                  />
                  <span className="pr-4 text-xs font-extrabold text-slate-500 uppercase">
                    / {formData.unit}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {lang === 'bn' ? 'ফসল তোলার পর প্রথম দিনের সর্বোচ্চ মূল্য' : 'Starting full price at harvest hour'}
                </span>
              </div>

              {/* Minimum Floor Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('minFloorPriceLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-2xl border border-slate-300 bg-slate-50 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden">
                  <span className="pl-4 text-sm font-black text-slate-500">৳</span>
                  <input
                    type="number"
                    min="1"
                    max={formData.base_price_bdt}
                    value={formData.min_floor_price_bdt}
                    onChange={(e) => handleChange('min_floor_price_bdt', e.target.value)}
                    className="w-full px-3 py-3 text-sm font-bold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900"
                    required
                  />
                  <span className="pr-4 text-xs font-extrabold text-slate-500 uppercase">
                    / {formData.unit}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block">
                  {t('minFloorPriceHelp')}
                </span>
              </div>
            </div>

            {/* Harvest Date & Max Shelf Life */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('harvestDateLabel')}</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.harvest_date}
                  onChange={(e) => handleChange('harvest_date', e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('maxShelfLifeLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleChange('max_shelf_life_days', Math.max(1, parseInt(formData.max_shelf_life_days) - 1))}
                      className="px-3.5 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-bold transition-colors select-none text-base"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={formData.max_shelf_life_days}
                      onChange={(e) => handleChange('max_shelf_life_days', e.target.value)}
                      className="w-full py-3 text-center text-sm font-bold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('max_shelf_life_days', Math.min(90, parseInt(formData.max_shelf_life_days) + 1))}
                      className="px-3.5 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-bold transition-colors select-none text-base"
                    >
                      +
                    </button>
                  </div>
                  <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-700 uppercase tracking-wider shrink-0 select-none">
                    {lang === 'bn' ? 'দিন' : 'Days'}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {t('maxShelfLifeHelp')}
                </span>
              </div>
            </div>

          </div>

          {/* SECTION 3: INVENTORY STOCK & UNIT OF MEASURE */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base">
                {lang === 'bn' ? '৩. মজুদ পরিমাণ ও একক' : '3. Stock & Measurement Unit'}
              </h3>
            </div>

            {/* Unit Selector Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {t('unitLabel')} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: 'kg', label: 'কেজি (Kg)' },
                  { id: 'mon', label: 'মন (৪০ কেজি)' },
                  { id: 'dozen', label: 'ডজন (Dozen)' },
                  { id: 'piece', label: 'পিস (Piece)' },
                  { id: 'liter', label: 'লিটার (Liter)' },
                ].map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleChange('unit', u.id)}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition-all text-center ${
                      formData.unit === u.id
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Quantity & Low Stock Threshold */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Initial Stock */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('stockQuantityLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleChange('stock_quantity', Math.max(0, parseInt(formData.stock_quantity) - 10))}
                      className="px-3.5 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-bold transition-colors select-none text-base"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => handleChange('stock_quantity', e.target.value)}
                      className="w-full py-3 text-center text-sm font-bold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('stock_quantity', parseInt(formData.stock_quantity) + 10)}
                      className="px-3.5 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-bold transition-colors select-none text-base"
                    >
                      +
                    </button>
                  </div>
                  <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-700 uppercase tracking-wider shrink-0 select-none">
                    {formData.unit}
                  </div>
                </div>
              </div>

              {/* Low Stock Alert Threshold */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t('lowStockThresholdLabel')}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleChange('low_stock_threshold', Math.max(1, parseInt(formData.low_stock_threshold) - 5))}
                      className="px-3.5 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-bold transition-colors select-none text-base"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={formData.low_stock_threshold}
                      onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
                      className="w-full py-3 text-center text-sm font-bold bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-800"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('low_stock_threshold', parseInt(formData.low_stock_threshold) + 5)}
                      className="px-3.5 py-3 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 font-bold transition-colors select-none text-base"
                    >
                      +
                    </button>
                  </div>
                  <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-700 uppercase tracking-wider shrink-0 select-none">
                    {formData.unit}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 4: PRODUCE MEDIA & PRESET PHOTOS */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base">
                {lang === 'bn' ? '৪. ফসলের ছবি নির্বাচন' : '4. Crop Photo'}
              </h3>
            </div>

            {/* Custom URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t('imageUrlLabel')}
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 text-xs sm:text-sm font-medium bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Preset Photo Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">
                {t('selectPresetImage')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_IMAGES.map((preset, idx) => {
                  const isSelected = formData.image_url === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('image_url', preset.url)}
                      className={`group relative rounded-2xl overflow-hidden border-2 transition-all text-left ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-102 shadow-md'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-20 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="p-1.5 bg-white text-[10px] font-bold text-slate-700 truncate">
                        {preset.name}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Action Bottom Bar */}
          <div className="pt-2 flex items-center justify-end gap-4">
            <Link
              to="/seller/inventory"
              className="px-6 py-3.5 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
            >
              {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? t('savingCrop') : (isEditing ? t('updateCropBtn') : t('publishCropBtn'))}</span>
            </button>
          </div>

        </form>

        {/* RIGHT COLUMN: STICKY REAL-TIME BUYER PREVIEW & SIMULATION SLIDER */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="bg-gradient-to-br from-emerald-950 to-slate-950 text-white p-6 rounded-3xl shadow-xl space-y-4 border border-emerald-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('livePreviewTitle')}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200 text-[10px] font-bold">
                {lang === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Sync'}
              </span>
            </div>

            {/* The Actual Produce Card Simulation */}
            <div className="bg-white text-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 transition-all">
              
              {/* Card Image Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={formData.image_url || PRESET_IMAGES[0].url}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />

                {/* Top Badge: Freshness or Age Deal */}
                <div className="absolute top-3 left-3">
                  {simulatedSavings > 0 ? (
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-extrabold shadow-md flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      <span>{lang === 'bn' ? `মূল্য হ্রাস -৳${simulatedSavings}` : `Age Deal -৳${simulatedSavings}`}</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === 'bn' ? '১০০% তাজা ফসল' : 'Peak Freshness'}</span>
                    </span>
                  )}
                </div>

                {/* Category Pill */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                  {lang === 'bn' ? selectedCategory.name_bn : selectedCategory.name_en}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 space-y-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base line-clamp-1">
                    {lang === 'bn' ? (formData.title_bn || 'ফসলের নাম') : (formData.title || 'Crop Name')}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>{user?.sellerProfile?.farm_name || 'আপনার খামার'}, {user?.sellerProfile?.district || 'বাংলাদেশ'}</span>
                  </p>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-400 block">{t('currentPriceLabel')}</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-700">
                        ৳{simulatedCurrentPrice}
                      </span>
                      {simulatedSavings > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          ৳{basePriceNum}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500">
                        / {formData.unit}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">{t('stockLabel')}</span>
                    <span className="text-xs font-extrabold text-slate-700">
                      {formData.stock_quantity} {formData.unit}
                    </span>
                  </div>
                </div>

                {/* Harvest Aging Indicator */}
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{simulatedElapsedHours} {lang === 'bn' ? 'ঘণ্টা অতিক্রান্ত' : 'hours elapsed'}</span>
                    </span>
                    <span className="font-bold text-slate-700">
                      {Math.max(1, parseInt(formData.max_shelf_life_days) - Math.floor(simulatedElapsedHours / 24))} {lang === 'bn' ? 'দিন বাকি' : 'days left'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        decayRatio > 0.8 ? 'bg-rose-500' : decayRatio > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, decayRatio * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Simulated Buy Button */}
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs text-center shadow-md opacity-90 cursor-default"
                >
                  {t('orderNow')}
                </button>
              </div>

            </div>

            {/* INTERACTIVE HARVEST AGING SLIDER SIMULATOR */}
            <div className="pt-2 space-y-2 border-t border-emerald-900/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-200">
                  {lang === 'bn' ? 'এজিং ইঞ্জিন পরীক্ষা (সিমুলেশন):' : 'Aging Decay Simulator:'}
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {simulatedElapsedHours}h / {maxHours}h
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={maxHours}
                value={simulatedElapsedHours}
                onChange={(e) => setSimulatedElapsedHours(parseInt(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-emerald-400/80">
                <span>{lang === 'bn' ? '০ ঘণ্টা (সদ্য তোলা)' : '0h (Fresh)'}</span>
                <span>{lang === 'bn' ? 'মধ্যবর্তী বয়স' : 'Mid Shelf-Life'}</span>
                <span>{lang === 'bn' ? 'ফ্লোর প্রাইস সীমা' : 'Floor Price Limit'}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
