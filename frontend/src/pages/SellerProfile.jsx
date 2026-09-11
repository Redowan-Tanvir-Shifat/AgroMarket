import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import FarmHeaderBanner from '../components/FarmHeaderBanner';
import {
  Building2,
  ShieldCheck,
  CreditCard,
  Phone,
  MapPin,
  User,
  Wallet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Landmark,
  Check,
  Store,
  Star,
  Mail,
  Info,
  Lock,
  ChevronRight,
  X,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export default function SellerProfile() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const sellerIdParam = searchParams.get('sellerId');
  const [selectedSellerId, setSelectedSellerId] = useState(() => {
    if (sellerIdParam) {
      const parsed = parseInt(sellerIdParam);
      if (!isNaN(parsed)) return parsed;
    }
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // Cloudinary media upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingOwner, setUploadingOwner] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    farm_name: '',
    full_name: '',
    phone: '',
    email: '',
    division: 'Rajshahi',
    district: '',
    upazila: '',
    address: '',
    bio: '',
    cover_image_url: '',
    logo_image_url: '',
    owner_image_url: '',
    nid_trade_license: '',
    payout_method: 'bkash',
    payout_number: '',
    rating_avg: 4.9,
    total_ratings: 18
  });

  const bangladeshDivisions = [
    { value: 'Dhaka', labelBn: 'ঢাকা', labelEn: 'Dhaka' },
    { value: 'Rajshahi', labelBn: 'রাজশাহী', labelEn: 'Rajshahi' },
    { value: 'Rangpur', labelBn: 'রংপুর', labelEn: 'Rangpur' },
    { value: 'Chattogram', labelBn: 'চট্টগ্রাম', labelEn: 'Chattogram' },
    { value: 'Khulna', labelBn: 'খুলনা', labelEn: 'Khulna' },
    { value: 'Barishal', labelBn: 'বরিশাল', labelEn: 'Barishal' },
    { value: 'Sylhet', labelBn: 'সিলেট', labelEn: 'Sylhet' },
    { value: 'Mymensingh', labelBn: 'ময়মনসিংহ', labelEn: 'Mymensingh' }
  ];

  const payoutRails = [
    {
      id: 'bkash',
      name: 'bKash (বিকাশ)',
      nameEn: 'bKash Wallet',
      tag: 'MFS Personal / Merchant',
      tagBn: 'ব্যক্তিগত / মার্চেন্ট ওয়ালেট',
      color: 'border-pink-300 bg-pink-50/50 text-pink-700',
      activeColor: 'border-pink-600 bg-pink-50 ring-2 ring-pink-500/20 text-pink-900',
      badgeColor: 'bg-pink-100 text-pink-800'
    },
    {
      id: 'nagad',
      name: 'Nagad (নগদ)',
      nameEn: 'Nagad Wallet',
      tag: 'Postal MFS Wallet',
      tagBn: 'বাংলাদেশ ডাক বিভাগ ওয়ালেট',
      color: 'border-amber-300 bg-amber-50/50 text-amber-700',
      activeColor: 'border-amber-600 bg-amber-50 ring-2 ring-amber-500/20 text-amber-900',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'rocket',
      name: 'Rocket (রকেট)',
      nameEn: 'Rocket (DBBL)',
      tag: 'Dutch-Bangla Bank MFS',
      tagBn: 'ডাচ-বাংলা ব্যাংক ওয়ালেট',
      color: 'border-purple-300 bg-purple-50/50 text-purple-700',
      activeColor: 'border-purple-600 bg-purple-50 ring-2 ring-purple-500/20 text-purple-900',
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'bank',
      name: 'Bank Account (ব্যাংক)',
      nameEn: 'Direct Bank Wire',
      tag: 'BEFTN / NPSB Direct',
      tagBn: 'সরাসরি ব্যাংক একাউন্ট ট্রান্সফার',
      color: 'border-emerald-300 bg-emerald-50/50 text-emerald-700',
      activeColor: 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20 text-emerald-900',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    }
  ];

  useEffect(() => {
    fetchProfile(selectedSellerId);
  }, [selectedSellerId]);

  const fetchProfile = async (sellerId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('agromarket_token');
      const res = await axios.get(`/api/seller/profile?sellerId=${sellerId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data.profile) {
        const p = res.data.profile;
        setFormData({
          farm_name: p.farm_name || '',
          full_name: p.full_name || '',
          phone: p.phone || '',
          email: p.email || '',
          division: p.division || 'Rajshahi',
          district: p.district || '',
          upazila: p.upazila || '',
          address: p.address || '',
          bio: p.bio || '',
          cover_image_url: p.cover_image_url || '',
          logo_image_url: p.logo_image_url || '',
          owner_image_url: p.owner_image_url || p.avatar_url || '',
          nid_trade_license: p.nid_trade_license || 'NID-19845012345678',
          payout_method: (p.payout_method || 'bkash').toLowerCase(),
          payout_number: p.payout_number || '',
          rating_avg: p.rating_avg ? parseFloat(p.rating_avg) : 4.9,
          total_ratings: p.total_ratings || 18
        });
      }
    } catch (err) {
      console.error('Failed to load seller profile:', err);
      setActionNotice({
        type: 'error',
        message: lang === 'bn' ? 'প্রোফাইল তথ্য লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load profile details.'
      });
      setTimeout(() => setActionNotice(null), 3500);
    } finally {
      setLoading(false);
    }
  };

  // Upload Farm Cover Photo to Cloudinary
  const handleCoverUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingCover(true);
      const data = new FormData();
      data.append('image', file);
      const res = await axios.post('/api/upload/farm-cover', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success && res.data.url) {
        setFormData(prev => ({ ...prev, cover_image_url: res.data.url }));
        setActionNotice({
          type: 'success',
          title: lang === 'bn' ? 'কভার ছবি আপলোড হয়েছে!' : 'Cover Photo Uploaded!',
          message: lang === 'bn' ? 'খামারের কভার ছবি ক্লাউডিনারিতে সফলভাবে সংরক্ষিত হয়েছে।' : 'Farm cover photo uploaded to Cloudinary successfully.'
        });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      setActionNotice({
        type: 'error',
        title: lang === 'bn' ? 'আপলোড ব্যর্থ' : 'Upload Failed',
        message: err.response?.data?.message || (lang === 'bn' ? 'কভার ছবি আপলোড করতে সমস্যা হয়েছে।' : 'Failed to upload cover photo.')
      });
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload Farm Logo to Cloudinary
  const handleLogoUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingLogo(true);
      const data = new FormData();
      data.append('image', file);
      const res = await axios.post('/api/upload/farm-logo', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success && res.data.url) {
        setFormData(prev => ({ ...prev, logo_image_url: res.data.url }));
        setActionNotice({
          type: 'success',
          title: lang === 'bn' ? 'লোগো আপলোড হয়েছে!' : 'Logo Uploaded!',
          message: lang === 'bn' ? 'খামারের প্রোফাইল লোগো ক্লাউডিনারিতে সফলভাবে সংরক্ষিত হয়েছে।' : 'Farm profile logo uploaded to Cloudinary successfully.'
        });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      setActionNotice({
        type: 'error',
        title: lang === 'bn' ? 'আপলোড ব্যর্থ' : 'Upload Failed',
        message: err.response?.data?.message || (lang === 'bn' ? 'লোগো আপলোড করতে সমস্যা হয়েছে।' : 'Failed to upload farm logo.')
      });
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Upload Owner Avatar to Cloudinary
  const handleOwnerUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingOwner(true);
      const data = new FormData();
      data.append('image', file);
      const res = await axios.post('/api/upload/owner-avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success && res.data.url) {
        setFormData(prev => ({ ...prev, owner_image_url: res.data.url }));
        setActionNotice({
          type: 'success',
          title: lang === 'bn' ? 'মালিকের ছবি আপলোড হয়েছে!' : 'Owner Photo Uploaded!',
          message: lang === 'bn' ? 'খামার মালিকের ছবি ক্লাউডিনারিতে সফলভাবে সংরক্ষিত হয়েছে।' : 'Owner photo uploaded to Cloudinary successfully.'
        });
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err) {
      console.error('Owner avatar upload error:', err);
      setActionNotice({
        type: 'error',
        title: lang === 'bn' ? 'আপলোড ব্যর্থ' : 'Upload Failed',
        message: err.response?.data?.message || (lang === 'bn' ? 'মালিকের ছবি আপলোড করতে সমস্যা হয়েছে।' : 'Failed to upload owner photo.')
      });
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setUploadingOwner(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('agromarket_token');
      const payload = {
        ...formData,
        sellerId: selectedSellerId
      };

      const res = await axios.put(`/api/seller/profile?sellerId=${selectedSellerId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setSaveSuccess(true);
      setActionNotice({
        type: 'success',
        title: lang === 'bn' ? 'সফলভাবে সংরক্ষিত হয়েছে!' : 'Profile Saved Successfully!',
        message: res.data.message || (lang === 'bn' ? 'খামারের প্রোফাইল ও সেটিংস তথ্য সফলভাবে আপডেট হয়েছে।' : 'Farm profile and settings updated successfully.')
      });
      setTimeout(() => setSaveSuccess(false), 3500);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setActionNotice({
        type: 'error',
        title: lang === 'bn' ? 'সংরক্ষণ ব্যর্থ হয়েছে' : 'Save Failed',
        message: err.response?.data?.message || (lang === 'bn' ? 'প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to save profile changes. Please try again.')
      });
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="space-y-2 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'bn' ? 'খামার প্রোফাইল ও সেটিংস হাব' : 'Farm Profile & Settings Hub'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
          <span>{t('sellerProfileTitle')}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
          {t('sellerProfileSubtitle')}
        </p>
      </div>

      {/* Floating Pop-Up Notification Toast */}
      {actionNotice && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-[calc(100%-3rem)] sm:w-auto animate-in slide-in-from-top-5 fade-in duration-300">
          <div
            className={`p-4 sm:p-5 rounded-3xl shadow-2xl border-2 backdrop-blur-xl flex items-start gap-3.5 transition-all ${
              actionNotice.type === 'success'
                ? 'bg-white/95 border-emerald-500 text-slate-900 shadow-emerald-500/25 ring-4 ring-emerald-500/10'
                : 'bg-white/95 border-rose-500 text-slate-900 shadow-rose-500/25 ring-4 ring-rose-500/10'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                actionNotice.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>

            <div className="flex-1 pr-2 min-w-0">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>{actionNotice.title}</span>
                {actionNotice.type === 'success' && (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                {actionNotice.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Unified Modern Farm Overview Banner (100% Unobstructed Cover Photo & Clean Details Bar) */}
      <FarmHeaderBanner
        farmName={formData.farm_name}
        farmerName={formData.full_name}
        farmerPhone={formData.phone}
        coverImageUrl={formData.cover_image_url}
        logoImageUrl={formData.logo_image_url}
        ownerImageUrl={formData.owner_image_url}
        division={formData.division}
        district={formData.district}
        upazila={formData.upazila}
        address={formData.address}
        bio={formData.bio}
        ratingAvg={formData.rating_avg}
        totalRatings={formData.total_ratings}
        isSellerView={true}
        sellerId={selectedSellerId}
        uploadingCover={uploadingCover}
        uploadingLogo={uploadingLogo}
        onCoverUpload={handleCoverUpload}
        onLogoUpload={handleLogoUpload}
        payoutMethod={formData.payout_method}
        payoutNumber={formData.payout_number}
      />

      {/* Main Grid: Form (8 cols) & Live Preview (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Comprehensive Settings Form (8 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          {/* Card 1: Farm & Personal Identity */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {lang === 'bn' ? 'খামারের সাধারণ তথ্য ও পরিচয়' : 'Farm & Personal Identity'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'bn' ? 'মার্কেটপ্লেসে ক্রেতারা এই নাম ও তথ্যাবলী দেখতে পাবেন' : 'Public details displayed to prospective buyers'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                {lang === 'bn' ? 'ধাপ ১' : 'Step 1'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Farm Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('farmNameLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="farm_name"
                    value={formData.farm_name}
                    onChange={handleInputChange}
                    required
                    placeholder={lang === 'bn' ? 'যেমন: রাজশাহী অর্গানিক আম বাগান' : 'e.g. Rajshahi Organic Mango Hub'}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                  />
                </div>
              </div>

              {/* Farmer Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {lang === 'bn' ? 'কৃষকের পূর্ণ নাম' : 'Farmer Full Name'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    placeholder={lang === 'bn' ? 'মোঃ রফিকুল ইসলাম' : 'Md. Rafiqul Islam'}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Contact Phone'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="01711223344"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="farmer@agromarket.bd"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                  />
                </div>
              </div>

              {/* NID / Trade License */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('nidLicenseLabel')} <span className="text-emerald-700 font-normal">({lang === 'bn' ? 'যাচাইকৃত' : 'Verified'})</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="nid_trade_license"
                    value={formData.nid_trade_license}
                    onChange={handleInputChange}
                    placeholder="NID-19845012345678"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono font-semibold bg-slate-50/70"
                  />
                </div>
              </div>

              {/* Farm Story & Bio */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('farmBioLabel')}
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formData.bio.length}/500 {lang === 'bn' ? 'অক্ষর' : 'chars'}
                  </span>
                </div>
                <textarea
                  name="bio"
                  rows={4}
                  maxLength={500}
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder={lang === 'bn' ? 'আপনার খামারের ইতিহাস, অর্গানিক চাষাবাদ ও বিশেষ ফসল সম্পর্কে লিখুন...' : 'Describe your farm history, organic soil management, and specialty crops...'}
                  className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed bg-white"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Farm Media & Branding (Cloudinary Powered) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <span>{lang === 'bn' ? 'খামারের ব্র্যান্ডিং ও ফটো মিডিয়া' : 'Farm Media & Branding'}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      Cloudinary CDN
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'bn'
                      ? 'খামারের ব্যানার কভার, প্রোফাইল লোগো ও মালিকের ছবি আপলোড করুন'
                      : 'Upload HD farm cover photo, profile logo, and owner portrait photo'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                {lang === 'bn' ? 'ধাপ ২' : 'Step 2'}
              </span>
            </div>

            {/* Media Item 1: Farm Cover Photo (Wide Aspect Ratio) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {lang === 'bn' ? '১. খামারের ব্যানার / কভার ছবি (Cover Photo)' : '1. Farm Banner / Cover Photo'}
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {lang === 'bn' ? 'অনুপাত ১৬:৯ বা প্যানোরামিক (সর্বোচ্চ ১০ এমবি)' : 'Recommended 16:9 / Panoramic (Max 10MB)'}
                </span>
              </div>

              {formData.cover_image_url ? (
                <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-emerald-300 shadow-sm group">
                  <img
                    src={formData.cover_image_url}
                    alt="Farm Cover"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent flex items-end justify-between p-4">
                    <div className="text-white">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600/90 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {lang === 'bn' ? 'কভার ছবি সক্রিয়' : 'Cover Photo Active'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="card-cover-file-input"
                        className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold cursor-pointer transition-colors shadow-md flex items-center gap-1.5"
                      >
                        {uploadingCover ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-emerald-700" />
                        )}
                        <span>{lang === 'bn' ? 'পরিবর্তন করুন' : 'Replace'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                        className="p-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white text-xs cursor-pointer shadow-md transition-colors"
                        title={lang === 'bn' ? 'ছবি মুছুন' : 'Remove Cover Photo'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="card-cover-file-input"
                  className={`w-full h-36 sm:h-44 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all flex flex-col items-center justify-center cursor-pointer p-4 text-center group ${
                    uploadingCover ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {uploadingCover ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                      <p className="text-xs font-bold text-emerald-800">
                        {lang === 'bn' ? 'ক্লাউডিনারিতে আপলোড হচ্ছে...' : 'Uploading cover to Cloudinary CDN...'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-extrabold text-slate-800">
                        {lang === 'bn' ? 'কভার ছবি আপলোড করতে ক্লিক করুন' : 'Click to Upload Farm Cover Photo'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {lang === 'bn'
                          ? 'আপনার খামার বা শস্যক্ষেত্রের সুন্দর দৃশ্য আপলোড করুন (JPG, PNG, WebP)'
                          : 'High resolution landscape photo of your farm or fields'}
                      </p>
                    </>
                  )}
                </label>
              )}
              <input
                type="file"
                id="card-cover-file-input"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                className="hidden"
                disabled={uploadingCover}
              />
            </div>

            {/* Media Items 2 & 3: Logo and Owner Photo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Farm Profile Logo */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {lang === 'bn' ? '২. খামারের প্রতীক / লোগো' : '2. Farm Profile Logo'}
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">১:১ (বর্গাকার)</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-emerald-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0 group">
                    {formData.logo_image_url ? (
                      <img src={formData.logo_image_url} alt="Farm Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-10 h-10 text-emerald-600" />
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 leading-tight">
                      {lang === 'bn'
                        ? 'খামারের নিজস্ব ব্র্যান্ড প্রতীক বা পরিচিতি লোগো।'
                        : 'Square identity mark shown on product cards & farm header.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="card-logo-file-input"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{formData.logo_image_url ? (lang === 'bn' ? 'বদলান' : 'Change') : (lang === 'bn' ? 'লোগো দিন' : 'Upload Logo')}</span>
                      </label>
                      {formData.logo_image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logo_image_url: '' }))}
                          className="p-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove Logo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  type="file"
                  id="card-logo-file-input"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </div>

              {/* Owner / Farmer Portrait Photo */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {lang === 'bn' ? '৩. কৃষক / মালিকের ছবি' : '3. Owner / Farmer Photo'}
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">১:১ (প্রোফাইল)</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full bg-white border-2 border-dashed border-emerald-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0 group">
                    {formData.owner_image_url ? (
                      <img src={formData.owner_image_url} alt="Owner" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-emerald-600" />
                    )}
                    {uploadingOwner && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 leading-tight">
                      {lang === 'bn'
                        ? 'কৃষকের আসল ছবি থাকলে সরাসরি ক্রেতাদের আস্থা বহুগুণ বাড়ে।'
                        : 'Real farmer portrait builds strong customer trust.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="card-owner-file-input"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{formData.owner_image_url ? (lang === 'bn' ? 'বদলান' : 'Change') : (lang === 'bn' ? 'ছবি দিন' : 'Upload Photo')}</span>
                      </label>
                      {formData.owner_image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, owner_image_url: '' }))}
                          className="p-1.5 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove Owner Photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  type="file"
                  id="card-owner-file-input"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleOwnerUpload(e.target.files[0])}
                  className="hidden"
                  disabled={uploadingOwner}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Geographical Farm Coordinates */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {lang === 'bn' ? 'খামারের ভৌগোলিক অবস্থান ও গেট ঠিকানা' : 'Geographical Farm Coordinates'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'bn' ? 'কুরিয়ার ডেলিভারি ও গেট সংগ্রহের সুনির্দিষ্ট এলাকা' : 'Accurate regional coordinates for couriers and direct farm gate pickup'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                {lang === 'bn' ? 'ধাপ ৩' : 'Step 3'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Division Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('farmDivisionLabel')} <span className="text-rose-500">*</span>
                </label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                >
                  {bangladeshDivisions.map((div) => (
                    <option key={div.value} value={div.value}>
                      {lang === 'bn' ? div.labelBn : div.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('farmDistrictLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  placeholder={lang === 'bn' ? 'যেমন: রাজশাহী' : 'e.g. Rajshahi'}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                />
              </div>

              {/* Upazila */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t('farmUpazilaLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="upazila"
                  value={formData.upazila}
                  onChange={handleInputChange}
                  required
                  placeholder={lang === 'bn' ? 'যেমন: বাঘা / পুঠিয়া' : 'e.g. Bagha / Puthia'}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                />
              </div>

              {/* Full Gate Pickup & Dispatch Address */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {lang === 'bn' ? 'খামার গেট ঠিকানা / ফসল হস্তান্তর পয়েন্ট' : 'Farm Gate Pickup & Dispatch Address'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder={lang === 'bn' ? 'গ্রাম: আড়ানী, বাঘা, রাজশাহী (মেইন রোডের পূর্ব পার্শ্বে)' : 'Village: Arani, Bagha, Rajshahi (East of Highway)'}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {lang === 'bn'
                    ? '* খামার গেট থেকে ক্রেতাদের সরাসরি সংগ্রহের ক্ষেত্রে এই সুনির্দিষ্ট ঠিকানা ইনভয়েসে প্রিন্ট হবে।'
                    : '* This precise gate coordinate will be printed on official invoices for customers choosing Farm Direct Pickup.'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Digital MFS & Banking Payout Settings */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {lang === 'bn' ? 'ডিজিটাল পেমেন্ট ও ব্যাংক উইথড্রয়াল সেটিংস' : 'Digital MFS & Bank Payout Settings'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'bn' ? 'আপনার বিক্রিত ফসলের টাকা সরাসরি যে অ্যাকাউন্টে জমা হবে' : 'Configure where your crop sales revenue is deposited with 0% commission'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                {lang === 'bn' ? 'ধাপ ৪' : 'Step 4'}
              </span>
            </div>

            {/* Payout Rail Cards Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('payoutMethodLabel')} <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {payoutRails.map((rail) => {
                  const isSelected = formData.payout_method === rail.id;
                  return (
                    <button
                      key={rail.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payout_method: rail.id }))}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected ? rail.activeColor : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-black text-sm text-slate-900">
                            {lang === 'bn' ? rail.name : rail.nameEn}
                          </p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${rail.badgeColor}`}>
                            {lang === 'bn' ? rail.tagBn : rail.tag}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payout Number / Account */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {formData.payout_method === 'bank'
                  ? (lang === 'bn' ? 'ব্যাংক একাউন্ট নম্বর ও শাখার নাম' : 'Bank Account Number & Branch Name')
                  : t('payoutNumberLabel')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="payout_number"
                  value={formData.payout_number}
                  onChange={handleInputChange}
                  required
                  placeholder={
                    formData.payout_method === 'bank'
                      ? (lang === 'bn' ? 'যেমন: ডাচ-বাংলা ব্যাংক, একাউন্ট নং ১২৩.১৫১.XXXX, রাজশাহী শাখা' : 'e.g. DBBL, A/C: 123.151.XXXX, Rajshahi Branch')
                      : (lang === 'bn' ? '01711xxxxxx (১১ ডিজিট মোবাইল ওয়ালেট)' : '01711xxxxxx (11 digit mobile number)')
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white font-mono"
                />
              </div>
            </div>

            {/* Zero Commission Policy Callout */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-3 text-xs leading-relaxed">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black block text-emerald-950">
                  {lang === 'bn' ? '১০০% সরাসরি পেমেন্ট — কোনো গোপন বা সিন্ডিকেট চার্জ নেই' : '100% Direct Payout — Zero Hidden or Middlemen Deductions'}
                </span>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  {lang === 'bn'
                    ? 'গ্রাহক পণ্য গ্রহণ করার সাথে সাথেই ডিজিটাল পেমেন্ট অথবা ক্যাশ অন ডেলিভারি (COD) এর সম্পূর্ণ টাকা আপনার নির্ধারিত ওয়ালেটে জমা হয়। এগ্রোমার্কেট কৃষকদের কাছ থেকে কোনো কমিশন নেয় না।'
                    : 'Upon customer delivery confirmation, 100% of order revenue is credited directly to your chosen wallet or bank account. AgroMarket operates on a strictly 0% farmer deduction model.'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Submit Button Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            {saveSuccess && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-300 text-xs font-black shadow-xs animate-in fade-in slide-in-from-right-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span>{lang === 'bn' ? 'প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে!' : 'Profile Changes Saved Successfully!'}</span>
              </div>
            )}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Link
                to="/seller/dashboard"
                className="px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              </Link>
              <button
                type="submit"
                disabled={saving}
                className={`px-8 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  saveSuccess
                    ? 'bg-emerald-700 shadow-emerald-700/30 ring-4 ring-emerald-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30'
                }`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving Profile...'}</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                    <span>{lang === 'bn' ? 'সংরক্ষিত হয়েছে!' : 'Saved!'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                    <span>{t('saveProfileBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Right Column: Sticky Live Preview & Verification Center (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          {/* Live Buyer Trust Preview Card */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'bn' ? 'লাইভ প্রিভিউ (ক্রেতারা যা দেখবেন)' : 'Live Buyer Trust Preview'}</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Mirrored Farmer Public Card with Live Media Branding */}
            <div className="rounded-2xl bg-slate-950 border border-emerald-800/60 overflow-hidden shadow-md space-y-0 text-white">
              {/* Mini Cover Header */}
              <div
                className="h-28 w-full bg-gradient-to-r from-emerald-800 to-slate-900 relative overflow-hidden"
                style={formData.cover_image_url ? {
                  backgroundImage: `url(${formData.cover_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
              >
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3 h-3" />
                    {lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                  </span>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4 pt-0 space-y-3 relative bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950">
                {/* Overlapping Logo */}
                <div className="-mt-8 flex items-end justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-black text-xl shadow-md border-2 border-emerald-500/40 overflow-hidden shrink-0">
                    {formData.logo_image_url ? (
                      <img src={formData.logo_image_url} alt="Farm Logo" className="w-full h-full object-cover" />
                    ) : (
                      formData.farm_name ? formData.farm_name.charAt(0) : 'F'
                    )}
                  </div>
                  {formData.owner_image_url && (
                    <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full border border-white/15 shadow-2xs backdrop-blur-md">
                      <img src={formData.owner_image_url} alt="Owner" className="w-4 h-4 rounded-full object-cover border border-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-100 truncate max-w-[100px]">
                        {formData.full_name || 'কৃষক'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-black text-sm text-white truncate">
                    {formData.farm_name || (lang === 'bn' ? 'খামারের নাম' : 'Farm Name')}
                  </h4>
                  <p className="text-[11px] text-emerald-300/80 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{formData.upazila ? `${formData.upazila}, ` : ''}{formData.district || 'রাজশাহী'}, {formData.division || 'Rajshahi'}</span>
                  </p>
                </div>

                {formData.bio && (
                  <p className="text-xs text-emerald-100/90 line-clamp-2 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/10 italic break-words [overflow-wrap:anywhere] break-all">
                    "{formData.bio}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{formData.rating_avg.toFixed(1)}</span>
                    <span className="text-emerald-300/80 font-normal">({formData.total_ratings} {lang === 'bn' ? 'রিভিউ' : 'reviews'})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 font-bold text-[10px]">
                    {lang === 'bn' ? 'সরাসরি খামার' : 'Direct Farm'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              {lang === 'bn'
                ? '* ফরমের যেকোনো তথ্য পরিবর্তন করলে উপরের প্রিভিউ স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।'
                : '* Edits made in the form reflect immediately in this customer-facing preview card.'}
            </p>
          </div>

          {/* Accreditation & Quality Verification Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2.5 text-emerald-400 font-black text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>{lang === 'bn' ? 'অংশীদারিত্ব ও নিরাপত্তা গ্যারান্টি' : 'Trust & Partnership Guarantee'}</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>NID / Trade License:</strong> {formData.nid_trade_license}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {lang === 'bn'
                    ? 'সরকারি কৃষি বাতায়ন ও আঞ্চলিক কৃষি সম্প্রসারণ অধিদপ্তর অনুমোদিত।'
                    : 'Recognized by Department of Agricultural Extension (DAE).'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {lang === 'bn'
                    ? 'কৃষি বাতায়ন হটলাইন সাপোর্ট: ১৬১২৩ (টোল-ফ্রি)'
                    : 'National Agri Helpline Support: 16123'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>AgroMarket Partner ID: #AGRO-FARM-{selectedSellerId.toString().padStart(4, '0')}</span>
              <span className="text-emerald-400 font-bold">{lang === 'bn' ? 'স্বীকৃত' : 'Verified'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
