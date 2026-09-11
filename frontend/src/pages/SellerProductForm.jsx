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
  Layers,
  Upload,
  X,
  Camera,
  Trash2,
  Star,
  Plus
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

  // Multi-image state (Max 5 photos per produce)
  const [images, setImages] = useState([PRESET_IMAGES[0].url]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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

        if (crop.images && Array.isArray(crop.images) && crop.images.length > 0) {
          setImages(crop.images);
        } else if (crop.image_url) {
          setImages([crop.image_url]);
        }
      }
    } catch (err) {
      console.error('Failed to load crop for edit:', err);
      setErrorNotice(lang === 'bn' ? 'ফসল তথ্য লোড করা যায়নি।' : 'Failed to load crop details.');
    } finally {
      setLoading(false);
    }
  };

  // Upload crop images to Cloudinary (Max 5 photos)
  const handleImageFilesUpload = async (fileList) => {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const availableSlots = 5 - images.length;
    if (availableSlots <= 0) {
      setUploadError(lang === 'bn' ? 'সর্বোচ্চ ৫টি ছবি আপলোড করা যাবে।' : 'Maximum 5 photos allowed per produce.');
      return;
    }

    const filesToUpload = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setUploadError(lang === 'bn' 
        ? `কেবল প্রথম ${availableSlots}টি ছবি নেওয়া হয়েছে (সর্বোচ্চ ৫টি সীমা)।` 
        : `Only first ${availableSlots} photos uploaded (Max 5 limit).`);
    } else {
      setUploadError(null);
    }

    try {
      setUploadingImages(true);
      const uploadData = new FormData();
      filesToUpload.forEach(file => {
        uploadData.append('images', file);
      });

      const res = await axios.post('/api/upload/produce', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success && res.data.urls) {
        const newImages = [...images, ...res.data.urls].slice(0, 5);
        setImages(newImages);
        setFormData(prev => ({ ...prev, image_url: newImages[0] }));
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setUploadError(err.response?.data?.message || (lang === 'bn' ? 'ছবি আপলোড করতে ব্যর্থ হয়েছে।' : 'Failed to upload images.'));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updated);
    setFormData(prev => ({ ...prev, image_url: updated[0] || '' }));
    setUploadError(null);
  };

  const handleSetPrimary = (indexToPrimary) => {
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const updated = [selected, ...images.filter((_, idx) => idx !== indexToPrimary)];
    setImages(updated);
    setFormData(prev => ({ ...prev, image_url: updated[0] }));
  };

  const handleAddPreset = (presetUrl) => {
    if (images.includes(presetUrl)) return;
    if (images.length >= 5) {
      setUploadError(lang === 'bn' ? 'সর্বোচ্চ ৫টি ছবি যোগ করা সম্ভব।' : 'Maximum 5 photos limit reached.');
      return;
    }
    const updated = [...images, presetUrl];
    setImages(updated);
    setFormData(prev => ({ ...prev, image_url: updated[0] }));
    setUploadError(null);
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

      const payload = {
        ...formData,
        images: images.length > 0 ? images : [formData.image_url],
        image_url: images[0] || formData.image_url
      };

      if (isEditing) {
        await axios.put(`/api/seller/products/${id}`, payload);
      } else {
        await axios.post('/api/seller/products', payload);
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

          {/* SECTION 4: PRODUCE MEDIA & CLOUDINARY MULTI-PHOTO UPLOAD (MAX 5 PHOTOS) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">
                  {lang === 'bn' ? '৪. ফসলের ছবি (সর্বোচ্চ ৫টি ছবি)' : '4. Produce Photos (Max 5 Photos)'}
                </h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                images.length >= 5
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-50 text-emerald-700'
              }`}>
                {images.length} / 5 {lang === 'bn' ? 'ছবি' : 'Photos'}
              </span>
            </div>

            {/* Cloudinary Drag-and-Drop Dropzone */}
            {images.length < 5 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) {
                    handleImageFilesUpload(e.dataTransfer.files);
                  }
                }}
                className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  id="produce-photo-input"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleImageFilesUpload(e.target.files);
                    }
                  }}
                  className="hidden"
                  disabled={uploadingImages}
                />

                <label
                  htmlFor="produce-photo-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs">
                    {uploadingImages ? (
                      <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-7 h-7" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {uploadingImages
                        ? (lang === 'bn' ? 'ক্লাউডিনারিতে আপলোড হচ্ছে...' : 'Uploading to Cloudinary CDN...')
                        : (lang === 'bn' ? 'ছবি আপলোড করতে ক্লিক করুন বা টেনে আনুন' : 'Click to upload or drag & drop harvest photos')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {lang === 'bn'
                        ? `JPEG, PNG, WebP (প্রতি ছবি সর্বোচ্চ ১০ মেগাবাইট, আরও ${5 - images.length}টি বাকি)`
                        : `JPEG, PNG, WebP (Max 10MB each, ${5 - images.length} slots remaining)`}
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'আপনি সর্বোচ্চ ৫টি ছবি যুক্ত করেছেন। নতুন ছবি আপলোড করতে চাইলে আগের ছবি মুছুন।'
                    : 'Maximum 5 photos reached. Remove an image to upload a new one.'}
                </span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Gallery of Uploaded Photos */}
            {images.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {lang === 'bn' ? 'যুক্ত ছবিসমূহ (প্রথমটি মূল প্রদর্শনী ছবি হিসেবে ব্যবহৃত হবে):' : 'Uploaded Photos (First photo is primary thumbnail):'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`relative group rounded-2xl overflow-hidden border-2 transition-all bg-slate-100 ${
                        idx === 0
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Produce ${idx + 1}`}
                        className="w-full h-24 object-cover"
                      />

                      {/* Primary Indicator Badge */}
                      {idx === 0 ? (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-extrabold shadow-sm flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span>{lang === 'bn' ? 'প্রধান' : 'Primary'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="absolute bottom-1.5 left-1.5 right-1.5 py-1 px-1.5 rounded-lg bg-slate-900/80 hover:bg-emerald-600 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-center backdrop-blur-xs"
                        >
                          {lang === 'bn' ? 'মূল ছবি করুন' : 'Set Primary'}
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-sm"
                        title={lang === 'bn' ? 'ছবি মুছুন' : 'Remove image'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Presets Picker (if < 5 photos) */}
            {images.length < 5 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-600">
                  {lang === 'bn' ? 'অথবা দ্রুত ডেমো ছবি যোগ করুন:' : 'Or quickly add standard crop presets:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_IMAGES.map((preset, idx) => {
                    const isAlreadyAdded = images.includes(preset.url);
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAlreadyAdded}
                        onClick={() => handleAddPreset(preset.url)}
                        className={`group relative rounded-xl overflow-hidden border p-1 flex items-center gap-2 transition-all text-left ${
                          isAlreadyAdded
                            ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                            : 'border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/30'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-slate-700 truncate">{preset.name}</p>
                          <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            {isAlreadyAdded ? (
                              <span>{lang === 'bn' ? 'যুক্ত আছে' : 'Added'}</span>
                            ) : (
                              <>
                                <Plus className="w-2.5 h-2.5" />
                                <span>{lang === 'bn' ? 'যোগ করুন' : 'Add'}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
                  src={images[0] || formData.image_url || PRESET_IMAGES[0].url}
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

                {/* Category Pill & Photo Count */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {images.length > 1 && (
                    <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>{images.length}</span>
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                    {lang === 'bn' ? selectedCategory.name_bn : selectedCategory.name_en}
                  </span>
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
