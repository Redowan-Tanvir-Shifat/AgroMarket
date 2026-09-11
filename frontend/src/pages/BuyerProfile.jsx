import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import {
  User,
  Camera,
  Upload,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Package,
  Heart,
  Wallet,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Check,
  X,
  Info,
  ChevronRight,
  Store,
  Calendar,
  Layers
} from 'lucide-react';

export default function BuyerProfile() {
  const { user, updateUser } = useAuth();
  const { lang, t } = useLanguage();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  // Loading & Action States
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Floating Pop-Up Notification Modal (matching SellerProfile toast)
  const [actionNotice, setActionNotice] = useState(null); // { type: 'success' | 'error', title: string, message: string }

  // Buyer Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    totalWishlist: 0
  });

  // Profile Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    division: 'Dhaka',
    district: '',
    upazila: '',
    address: '',
    avatar_url: ''
  });

  // Security Form Data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Divisions in Bangladesh
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

  // Initialize data on load
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFormData({
      fullName: user.fullName || user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      division: user.division || 'Dhaka',
      district: user.district || '',
      upazila: user.upazila || '',
      address: user.address || '',
      avatar_url: user.avatar_url || ''
    });

    fetchBuyerStats();
    fetchFreshUserProfile();
  }, [user?.id]);

  // Real-time automatic stats refresh when an order is updated or notification received
  useEffect(() => {
    if (!socket) return;
    const handleLiveStatsRefresh = () => {
      fetchBuyerStats();
    };

    socket.on('order_status_updated', handleLiveStatsRefresh);
    socket.on('new_notification', handleLiveStatsRefresh);

    return () => {
      socket.off('order_status_updated', handleLiveStatsRefresh);
      socket.off('new_notification', handleLiveStatsRefresh);
    };
  }, [socket]);

  // Fetch full refreshed user profile
  const fetchFreshUserProfile = async () => {
    try {
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let res;
      try {
        res = await axios.get('/api/auth/me', { headers });
      } catch {
        res = await axios.get('http://localhost:5000/api/auth/me', { headers });
      }

      if (res?.data?.user) {
        const u = res.data.user;
        setFormData((prev) => ({
          ...prev,
          fullName: u.fullName || u.full_name || prev.fullName,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
          division: u.division || prev.division,
          district: u.district || prev.district,
          upazila: u.upazila || prev.upazila,
          address: u.address || prev.address,
          avatar_url: u.avatar_url || prev.avatar_url
        }));
        updateUser(u);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  // Fetch buyer statistics
  const fetchBuyerStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let res;
      try {
        res = await axios.get('/api/auth/buyer-stats', { headers });
      } catch (proxyErr) {
        res = await axios.get('http://localhost:5000/api/auth/buyer-stats', { headers });
      }

      if (res?.data?.success && res.data.stats) {
        setStats({
          totalOrders: Number(res.data.stats.totalOrders) || 0,
          totalSpent: Number(res.data.stats.totalSpent) || 0,
          totalWishlist: Number(res.data.stats.totalWishlist) || 0
        });
      }
    } catch (err) {
      console.error('Failed to load buyer stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Display auto-expiring pop-up notification modal
  const triggerNotice = (type, title, message) => {
    setActionNotice({ type, title, message });
    setTimeout(() => {
      setActionNotice(null);
    }, 5000);
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle avatar file selection & Cloudinary upload
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerNotice(
        'error',
        lang === 'bn' ? 'অবৈধ ফাইল' : 'Invalid File',
        lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন (JPG, PNG, WebP)' : 'Please select a valid image file (JPG, PNG, WebP)'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      triggerNotice(
        'error',
        lang === 'bn' ? 'ফাইল সাইজ বেশি' : 'File Too Large',
        lang === 'bn' ? 'ছবির সাইজ ৫MB এর কম হতে হবে।' : 'Image size must be under 5MB.'
      );
      return;
    }

    try {
      setUploadingAvatar(true);
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      let res;
      try {
        res = await axios.post('/api/upload/avatar', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
      } catch (uploadErr) {
        res = await axios.post('http://localhost:5000/api/upload/avatar', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
      }

      if (res.data?.success && res.data.url) {
        const newUrl = res.data.url;
        setFormData((prev) => ({ ...prev, avatar_url: newUrl }));

        // Automatically persist avatar change to user profile
        try {
          await axios.put(
            '/api/auth/profile',
            { ...formData, avatar_url: newUrl },
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
        } catch {
          await axios.put(
            'http://localhost:5000/api/auth/profile',
            { ...formData, avatar_url: newUrl },
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
        }

        updateUser({ avatar_url: newUrl });
        triggerNotice(
          'success',
          lang === 'bn' ? 'প্রোফাইল ছবি আপলোড হয়েছে!' : 'Profile Picture Uploaded!',
          lang === 'bn' ? 'আপনার প্রোফাইল ছবি ক্লাউডিনারিতে সফলভাবে সংরক্ষিত হয়েছে।' : 'Your avatar photo has been uploaded to Cloudinary successfully.'
        );
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      triggerNotice(
        'error',
        lang === 'bn' ? 'আপলোড ব্যর্থ' : 'Upload Failed',
        err.response?.data?.message || (lang === 'bn' ? 'ছবি আপলোড করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to upload photo. Please try again.')
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove current avatar photo
  const handleRemoveAvatar = async () => {
    try {
      setFormData((prev) => ({ ...prev, avatar_url: '' }));
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put('/api/auth/profile', { ...formData, avatar_url: '' }, { headers });
      updateUser({ avatar_url: '' });
      triggerNotice(
        'success',
        lang === 'bn' ? 'ছবি মুছে ফেলা হয়েছে' : 'Photo Removed',
        lang === 'bn' ? 'প্রোফাইল ছবি মুছে ফেলা হয়েছে।' : 'Profile avatar has been removed.'
      );
    } catch (err) {
      console.error('Failed to remove avatar:', err);
    }
  };

  // Handle saving general and address profile fields
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    if (!formData.fullName.trim()) {
      triggerNotice(
        'error',
        lang === 'bn' ? 'নাম প্রয়োজন' : 'Name Required',
        lang === 'bn' ? 'আপনার পূর্ণ নাম প্রদান করা আবশ্যক।' : 'Full name is required.'
      );
      return;
    }

    try {
      setSavingProfile(true);
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let res;
      try {
        res = await axios.put('/api/auth/profile', formData, { headers });
      } catch {
        res = await axios.put('http://localhost:5000/api/auth/profile', formData, { headers });
      }

      if (res.data?.success && res.data.user) {
        updateUser(res.data.user);
        setSaveSuccess(true);
        triggerNotice(
          'success',
          lang === 'bn' ? 'সফলভাবে সংরক্ষিত হয়েছে!' : 'Profile Saved Successfully!',
          res.data.message || (lang === 'bn' ? 'ক্রেতার প্রোফাইল ও ডেলিভারি তথ্য সফলভাবে আপডেট হয়েছে।' : 'Buyer profile details and delivery coordinates updated successfully.')
        );
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      triggerNotice(
        'error',
        lang === 'bn' ? 'সংরক্ষণ ব্যর্থ' : 'Save Failed',
        err.response?.data?.message || (lang === 'bn' ? 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to update profile settings.')
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      triggerNotice(
        'error',
        lang === 'bn' ? 'তথ্য অসম্পূর্ণ' : 'Incomplete Fields',
        lang === 'bn' ? 'বর্তমান ও নতুন উভয় পাসওয়ার্ড লিখুন।' : 'Please provide current and new password.'
      );
      return;
    }

    if (passwordData.newPassword.length < 6) {
      triggerNotice(
        'error',
        lang === 'bn' ? 'দুর্বল পাসওয়ার্ড' : 'Weak Password',
        lang === 'bn' ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'New password must be at least 6 characters long.'
      );
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      triggerNotice(
        'error',
        lang === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Password Mismatch',
        lang === 'bn' ? 'নতুন পাসওয়ার্ড দুটি হুবহু মিলছে না।' : 'New password and confirmation do not match.'
      );
      return;
    }

    try {
      setChangingPassword(true);
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      };

      let res;
      try {
        res = await axios.put('/api/auth/change-password', payload, { headers });
      } catch {
        res = await axios.put('http://localhost:5000/api/auth/change-password', payload, { headers });
      }

      if (res.data?.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordSuccess(true);
        triggerNotice(
          'success',
          lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তিত হয়েছে!' : 'Password Changed Successfully!',
          lang === 'bn' ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।' : 'Your account password has been updated securely.'
        );
        setTimeout(() => setPasswordSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Password change error:', err);
      triggerNotice(
        'error',
        lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ' : 'Change Password Failed',
        err.response?.data?.message || (lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে। বর্তমান পাসওয়ার্ড সঠিক কি না পরীক্ষা করুন।' : 'Failed to change password. Check your current password.')
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="space-y-2 pb-6 border-b border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <User className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'bn' ? 'ক্রেতা প্রোফাইল ও সেটিংস হাব' : 'Buyer Profile & Settings Hub'}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
          <span>{lang === 'bn' ? 'ক্রেতা প্রোফাইল ও অ্যাকাউন্ট সেটিংস' : 'Buyer Profile & Account Settings'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
          {lang === 'bn'
            ? 'আপনার ব্যক্তিগত পরিচিতি, ডেলিভারি শিপিং ঠিকানা এবং পাসওয়ার্ড নিরাপত্তা পরিচালনা করুন।'
            : 'Manage your personal identity, default delivery shipping coordinates, and account security credentials.'}
        </p>
      </div>

      {/* Floating Pop-Up Notification Modal (matching SellerProfile toast) */}
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

      {/* Unified Modern Buyer Overview Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border border-emerald-800/40 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden space-y-6">
        {/* Subtle decorative glow elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Identity & Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500/40 ring-4 ring-emerald-500/20 bg-slate-900 flex items-center justify-center relative">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt={formData.fullName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center font-black text-3xl text-white">
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'B'}
                  </div>
                )}

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1.5">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <span>{lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}</span>
                  </div>
                )}
              </div>

              {/* Camera Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg border-2 border-slate-950 transition-all cursor-pointer group-hover:scale-110 active:scale-95 disabled:opacity-50"
                title={lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Profile Picture'}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Buyer Text Info & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {formData.fullName || (lang === 'bn' ? 'সম্মানিত ক্রেতা' : 'Valued Buyer')}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? 'যাচাইকৃত ক্রেতা' : 'Verified Buyer'}</span>
                </span>
              </div>

              {/* Contact Chips */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-slate-300 font-medium pt-0.5">
                {formData.phone && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 font-mono">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formData.phone}</span>
                  </span>
                )}
                {formData.email && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10">
                    <Mail className="w-3.5 h-3.5 text-teal-400" />
                    <span>{formData.email}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-emerald-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {formData.upazila ? `${formData.upazila}, ` : ''}
                    {formData.district ? `${formData.district}, ` : ''}
                    {formData.division || 'Bangladesh'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Links */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/account/orders"
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black flex items-center gap-2 border border-white/15 transition-all shadow-sm backdrop-blur-md"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'bn' ? 'আমার অর্ডার' : 'My Orders'}</span>
            </Link>
            <Link
              to="/messages"
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{lang === 'bn' ? 'লাইভ চ্যাট' : 'Live Chat'}</span>
            </Link>
          </div>
        </div>

        {/* Activity Summary Stat Tiles */}
        <div className="relative z-10 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'কার্যকলাপ সারসংক্ষেপ' : 'Account Activity Overview'}</span>
            </span>
            <button
              type="button"
              onClick={fetchBuyerStats}
              disabled={loadingStats}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title={lang === 'bn' ? 'ডাটা রিফ্রেশ করুন' : 'Refresh activity statistics'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Orders Tile */}
            <Link
              to="/account/orders"
              className="bg-white/10 hover:bg-white/15 rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-3 transition-all duration-200 group cursor-pointer shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-emerald-200/70 uppercase tracking-wider block truncate">
                    {lang === 'bn' ? 'মোট অর্ডার' : 'Total Orders'}
                  </span>
                  <span className="text-xl font-black text-white block truncate">
                    {loadingStats ? (
                      <span className="inline-block w-12 h-6 bg-white/20 rounded animate-pulse align-middle" />
                    ) : (
                      `${Number(stats?.totalOrders ?? 0)} ${lang === 'bn' ? 'টি' : 'orders'}`
                    )}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>

            {/* Total Spent Tile */}
            <Link
              to="/account/orders"
              className="bg-white/10 hover:bg-white/15 rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-3 transition-all duration-200 group cursor-pointer shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30 group-hover:scale-105 transition-transform">
                  <Wallet className="w-6 h-6 text-teal-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-teal-200/70 uppercase tracking-wider block truncate">
                    {lang === 'bn' ? 'মোট খরচ' : 'Total Spent'}
                  </span>
                  <span className="text-xl font-black text-white block truncate">
                    {loadingStats ? (
                      <span className="inline-block w-20 h-6 bg-white/20 rounded animate-pulse align-middle" />
                    ) : (
                      `৳${Number(stats?.totalSpent ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                    )}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-300 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>

            {/* Saved Wishlist Tile */}
            <Link
              to="/account/wishlist"
              className="bg-white/10 hover:bg-white/15 rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-3 transition-all duration-200 group cursor-pointer shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 group-hover:scale-105 transition-transform">
                  <Heart className="w-6 h-6 text-rose-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-rose-200/70 uppercase tracking-wider block truncate">
                    {lang === 'bn' ? 'পছন্দের ফসল' : 'Saved Crops'}
                  </span>
                  <span className="text-xl font-black text-white block truncate">
                    {loadingStats ? (
                      <span className="inline-block w-12 h-6 bg-white/20 rounded animate-pulse align-middle" />
                    ) : (
                      `${Number(stats?.totalWishlist ?? 0)} ${lang === 'bn' ? 'টি' : 'crops'}`
                    )}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-300 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Form (8 cols) & Live Preview / Trust (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Comprehensive Settings Form (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Profile & Address Form */}
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* CARD 1: Personal Details & Identity */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">
                      {lang === 'bn' ? 'ব্যক্তিগত তথ্য ও পরিচিতি' : 'Personal Identity & Contact'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'bn' ? 'অর্ডার ও চ্যাটে কৃষকদের কাছে এই নাম ও তথ্য প্রদর্শিত হবে' : 'Profile information shown to sellers during orders and live chat'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                  {lang === 'bn' ? 'ধাপ ১' : 'Step 1'}
                </span>
              </div>

              {/* Photo Upload & Management Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {lang === 'bn' ? 'প্রোফাইল ছবি (Avatar Photo)' : 'Profile Avatar Photo'}
                  </label>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Cloudinary CDN
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Avatar Preview Box */}
                  <div className="relative w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-emerald-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0 group">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-emerald-600" />
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Actions & Explanations */}
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <p className="text-xs text-slate-600 leading-tight">
                      {lang === 'bn'
                        ? 'আপনার আসল ছবি থাকলে কৃষকদের সাথে আস্থা তৈরি হয় ও দ্রুত অর্ডার নিশ্চিত হয়।'
                        : 'A clear photo builds trust with local farmers and speeds up order processing.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {uploadingAvatar ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-white" />
                        )}
                        <span>
                          {formData.avatar_url
                            ? (lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Photo')
                            : (lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo')}
                        </span>
                      </button>

                      {formData.avatar_url && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Remove Photo"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'মুছুন' : 'Remove'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {lang === 'bn' ? 'অথবা ছবির সরাসরি ওয়েব লিংক দিন (URL)' : 'Or specify direct image URL'}
                  </label>
                  <input
                    type="url"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleInputChange}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-700 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Personal Details Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder={lang === 'bn' ? 'মোঃ রেদোয়ান আহমেদ' : 'Md. Redowan Ahmed'}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'} <span className="text-rose-500">*</span>
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
                      placeholder="buyer@agromarket.bd"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Delivery & Shipping Address */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">
                      {lang === 'bn' ? 'ডেলিভারি ও শিপিং ঠিকানা' : 'Delivery & Shipping Coordinates'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'bn' ? 'তাজা ফসল সরাসরি খামার থেকে দ্রুত ডেলিভারি পাওয়ার নিয়মিত ঠিকানা' : 'Primary delivery destination for direct farm-to-door harvest dispatch'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                  {lang === 'bn' ? 'ধাপ ২' : 'Step 2'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Division Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'বিভাগ' : 'Division'} <span className="text-rose-500">*</span>
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
                    {lang === 'bn' ? 'জেলা' : 'District'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder={lang === 'bn' ? 'যেমন: ঢাকা / রাজশাহী' : 'e.g. Dhaka / Rajshahi'}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                  />
                </div>

                {/* Upazila / Area */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'উপজেলা / এলাকা' : 'Upazila / Area'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="upazila"
                    value={formData.upazila}
                    onChange={handleInputChange}
                    placeholder={lang === 'bn' ? 'যেমন: ধানমন্ডি / বোয়ালিয়া' : 'e.g. Dhanmondi'}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                  />
                </div>

                {/* Full Street Address */}
                <div className="sm:col-span-3 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'বিস্তারিত ঠিকানা (রোড, বাসা, ফ্ল্যাট নং)' : 'Detailed Address (Road, House, Flat No)'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <textarea
                      rows={3}
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder={
                        lang === 'bn'
                          ? 'বাড়ি # ১২, রোড # ৪, ব্লক # সি, ধানমন্ডি, ঢাকা (ল্যান্ডমার্ক: মেইন রোডের নিকটবর্তী)'
                          : 'House #12, Road #4, Block #C, Dhanmondi, Dhaka (Landmark: Near City Bank)'
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Instant Checkout Advantage Callout */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 flex items-start gap-3 text-xs leading-relaxed">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block text-blue-950">
                    {lang === 'bn' ? 'দ্রুত চেকআউট সুবিধা' : 'One-Click Fast Checkout Advantage'}
                  </span>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    {lang === 'bn'
                      ? 'এই ডেলিভারি ঠিকানা সেট থাকলে নতুন অর্ডার করার সময় চেকআউটে স্বয়ংক্রিয়ভাবে পূরণ হবে। কোনো বাড়তি টাইপিং ছাড়াই সরাসরি কৃষকের বাগান থেকে অর্ডার সম্পন্ন করতে পারবেন।'
                      : 'This address pre-fills automatically during checkout. You can place direct farm-fresh orders in 1-click without re-entering shipping details.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Save Button Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              {saveSuccess && (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-300 text-xs font-black shadow-xs animate-in fade-in slide-in-from-right-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>{lang === 'bn' ? 'প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে!' : 'Profile Changes Saved Successfully!'}</span>
                </div>
              )}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Link
                  to="/products"
                  className="px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                </Link>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className={`px-8 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    saveSuccess
                      ? 'bg-emerald-700 shadow-emerald-700/30 ring-4 ring-emerald-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30'
                  }`}
                >
                  {savingProfile ? (
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
                      <span>{lang === 'bn' ? 'প্রোফাইল পরিবর্তন সংরক্ষণ করুন' : 'Save Profile Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* CARD 3: Password & Account Security (Separate Form for Security) */}
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">
                      {lang === 'bn' ? 'পাসওয়ার্ড ও অ্যাকাউন্ট নিরাপত্তা' : 'Password & Account Security'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'bn' ? 'অ্যাকাউন্টের সুরক্ষার জন্য নিয়মিত নতুন ও শক্তিশালী পাসওয়ার্ড ব্যবহার করুন' : 'Protect your buyer account with a strong, distinct password'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                  {lang === 'bn' ? 'ধাপ ৩' : 'Step 3'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••"
                      minLength={6}
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {lang === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters'}
                  </p>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিতকরণ' : 'Confirm Password'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-medium">
                  {lang === 'bn'
                    ? 'নিয়মিত পাসওয়ার্ড পরিবর্তন করলে আপনার ব্যক্তিগত ডেটা ও অর্ডার নিরাপদ থাকে।'
                    : 'Changing your password periodically keeps your order history and details safe.'}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {passwordSuccess && (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-300 text-xs font-black shadow-xs animate-in fade-in slide-in-from-right-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                      <span>{lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তিত হয়েছে!' : 'Password Updated!'}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className={`px-8 py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 ${
                      passwordSuccess
                        ? 'bg-emerald-700 shadow-emerald-700/30 ring-4 ring-emerald-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30'
                    }`}
                  >
                    {changingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>{lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...'}</span>
                      </>
                    ) : passwordSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                        <span>{lang === 'bn' ? 'পরিবর্তিত হয়েছে!' : 'Updated!'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-white" />
                        <span>{lang === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Sticky Live Preview & Trust Center (4 cols) */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          {/* Card 1: Live Buyer Trust Preview Card */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'bn' ? 'লাইভ প্রিভিউ (ক্রেতা প্রোফাইল কার্ড)' : 'Live Buyer Profile Preview'}</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Dark Styled Buyer ID / Trust Card */}
            <div className="rounded-2xl bg-slate-950 border border-emerald-800/60 overflow-hidden shadow-md space-y-0 text-white">
              {/* Mini Banner Header */}
              <div className="h-24 w-full bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 relative p-3 flex items-start justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'যাচাইকৃত ক্রেতা' : 'Verified Buyer'}</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-200/80 uppercase">AgroMarket ID</span>
              </div>

              {/* Content Area with overlapping Avatar */}
              <div className="p-4 pt-0 space-y-3 relative bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950">
                <div className="-mt-8 flex items-end justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-black text-xl shadow-md border-2 border-emerald-500/40 overflow-hidden shrink-0">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Buyer Avatar" className="w-full h-full object-cover" />
                    ) : (
                      formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'B'
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/15 shadow-2xs backdrop-blur-md">
                    <ShoppingBag className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-100">
                      {stats.totalOrders} {lang === 'bn' ? 'অর্ডার সম্পন্ন' : 'orders placed'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-base text-white truncate">
                    {formData.fullName || (lang === 'bn' ? 'সম্মানিত ক্রেতা' : 'Valued Buyer')}
                  </h4>
                  <p className="text-[11px] text-emerald-300/80 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>
                      {formData.upazila ? `${formData.upazila}, ` : ''}
                      {formData.district || (lang === 'bn' ? 'ঢাকা' : 'Dhaka')}, {formData.division || 'Dhaka'}
                    </span>
                  </p>
                </div>

                {formData.address && (
                  <p className="text-xs text-emerald-100/90 line-clamp-2 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/10 break-words">
                    <span className="text-emerald-400 font-bold block text-[10px] uppercase">
                      {lang === 'bn' ? 'ডেলিভারি ঠিকানা:' : 'Delivery Coordinate:'}
                    </span>
                    {formData.address}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[11px]">
                  <div className="bg-white/5 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block">{lang === 'bn' ? 'মোট খরচ' : 'Total Spent'}</span>
                    <span className="font-black text-emerald-400">
                      ৳{Number(stats.totalSpent || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block">{lang === 'bn' ? 'পছন্দের ফসল' : 'Wishlist'}</span>
                    <span className="font-black text-rose-400">
                      {stats.totalWishlist} {lang === 'bn' ? 'টি' : 'items'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              {lang === 'bn'
                ? '* ফরমের যেকোনো তথ্য পরিবর্তন করলে উপরের প্রিভিউ স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।'
                : '* Edits made in the form reflect immediately in this buyer preview card.'}
            </p>
          </div>

          {/* Card 2: AgroMarket Buyer Guarantee & Trust */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-2.5 text-emerald-400 font-black text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>{lang === 'bn' ? 'নিরাপদ কেনাকাটা ও গ্যারান্টি' : 'AgroMarket Buyer Guarantee'}</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{lang === 'bn' ? '১০০% মাঠের তাজা ফসল:' : '100% Farm-Fresh Harvest:'}</strong>{' '}
                  {lang === 'bn'
                    ? 'কোনো মধ্যস্বত্বভোগী বা সিন্ডিকেট ছাড়াই সরাসরি মাঠ থেকে সংগৃহীত ফসল।'
                    : 'Sourced directly from verified farmers without any middlemen marks.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{lang === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD):' : 'Cash on Delivery:'}</strong>{' '}
                  {lang === 'bn'
                    ? 'পণ্য হাতে পেয়ে যাচাই করার পর মূল্য পরিশোধের সুবিধা।'
                    : 'Inspect produce freshness at your door before making payment.'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>{lang === 'bn' ? 'নিরাপদ ডেটা এনক্রিপশন:' : 'Encrypted Security:'}</strong>{' '}
                  {lang === 'bn'
                    ? 'আপনার মোবাইল নম্বর, পাসওয়ার্ড ও ঠিকানা সম্পূর্ণ সুরক্ষিত।'
                    : 'Your personal phone, password, and location are protected securely.'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Shortcuts Navigation */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {lang === 'bn' ? 'দ্রুত নেভিগেশন' : 'Quick Navigation'}
            </h4>
            <div className="space-y-2">
              <Link
                to="/account/orders"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 text-xs font-bold transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'bn' ? 'আমার সকল অর্ডার তালিকা' : 'My Orders List'}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/account/wishlist"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:text-rose-900 text-slate-700 text-xs font-bold transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>{lang === 'bn' ? 'পছন্দের ফসলের তালিকা' : 'Saved Wishlist Crops'}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/messages"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-teal-50 hover:text-teal-900 text-slate-700 text-xs font-bold transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>{lang === 'bn' ? 'কৃষকদের সাথে সরাসরি বার্তা' : 'Live Chat with Farmers'}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/products"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 text-xs font-bold transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'bn' ? 'বাজারের সকল তাজা ফসল' : 'Browse Harvest Catalog'}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
