import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import FarmerIdentityModal from './FarmerIdentityModal';
import {
  ShieldCheck,
  MapPin,
  Star,
  Calendar,
  Phone,
  User,
  Store,
  Camera,
  RefreshCw,
  Wallet,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Package,
  Sprout,
  ZoomIn,
  Quote,
  PlusCircle,
  MessageSquare
} from 'lucide-react';

export default function FarmHeaderBanner({
  farmName,
  farmerName,
  farmerPhone,
  coverImageUrl,
  logoImageUrl,
  ownerImageUrl,
  division,
  district,
  upazila,
  address,
  bio,
  createdAt,
  ratingAvg = 4.9,
  totalRatings = 15,
  totalProducts,
  isSellerView = false,
  sellerId,
  showAddCropButton = false,
  showBio = true,
  uploadingCover = false,
  uploadingLogo = false,
  onCoverUpload,
  onLogoUpload,
  payoutMethod,
  payoutNumber,
  onOpenChat
}) {
  const { lang, t } = useLanguage();
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  const formattedYear = createdAt ? new Date(createdAt).getFullYear() : '2024';

  return (
    <div className="bg-slate-950 rounded-3xl overflow-hidden border border-emerald-800/50 shadow-2xl relative mb-8">
      {/* 1. Dedicated Panoramic Cover Photo Area (100% Clear & Vivid) */}
      <div className="h-52 sm:h-64 md:h-80 w-full relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-950">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={farmName || 'Farm Cover'}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-102"
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
            {/* Scenic Geometric Agri-Pattern Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950" />
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-10 bottom-0 w-80 h-80 bg-teal-400/15 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 text-emerald-200/80">
              <Sprout className="w-16 h-16 text-emerald-400/60 mb-2 stroke-[1.5]" />
              <p className="text-sm font-bold tracking-wide">
                {lang === 'bn' ? 'প্রাকৃতিক অর্গানিক কৃষি খামার' : 'Natural Organic Agro Farm'}
              </p>
            </div>
          </div>
        )}

        {/* Subtle Bottom Vignette Gradient for smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges & Shortcuts on Cover */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/70 hover:bg-slate-950/90 text-emerald-300 border border-white/20 text-xs font-bold backdrop-blur-md shadow-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'bn' ? 'যাচাইকৃত খামার অংশীদার' : 'Verified Farm Partner'}</span>
            </span>
          </div>

          {/* Quick Actions on Cover */}
          <div className="flex items-center gap-2.5">
            {isSellerView ? (
              <>
                {/* View Public Storefront Link Button */}
                {sellerId && (
                  <Link
                    to={`/storefront/${sellerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-emerald-900 text-xs font-black shadow-md backdrop-blur-md transition-all hover:scale-105"
                    title={lang === 'bn' ? 'পাবলিক স্টোরফ্রন্ট দেখুন' : 'View Public Storefront'}
                  >
                    <span>{lang === 'bn' ? 'স্টোরফ্রন্ট দেখুন' : 'View Storefront'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                  </Link>
                )}

                {/* Add New Crop Shortcut Button */}
                {showAddCropButton && (
                  <Link
                    to="/seller/products/new"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md backdrop-blur-md transition-all hover:scale-105"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
                    <span>{lang === 'bn' ? 'নতুন ফসল যোগ' : 'Add New Crop'}</span>
                  </Link>
                )}

                {/* Change Cover Photo Button (only if upload handler provided) */}
                {onCoverUpload && (
                  <>
                    <label
                      htmlFor="farm-header-cover-upload"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold cursor-pointer transition-all backdrop-blur-md shadow-md border border-white/20 hover:scale-105"
                    >
                      {uploadingCover ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-emerald-300" />
                      )}
                      <span>{lang === 'bn' ? 'কভার ছবি পরিবর্তন' : 'Change Cover Photo'}</span>
                    </label>
                    <input
                      type="file"
                      id="farm-header-cover-upload"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && onCoverUpload(e.target.files[0])}
                      className="hidden"
                      disabled={uploadingCover}
                    />
                  </>
                )}
              </>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/90 text-white border border-white/20 text-xs font-extrabold backdrop-blur-md shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '১০০% সরাসরি খামার থেকে' : '100% Direct From Farm'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Farm Identity & Details Bar (Rich Shaded Emerald & Slate Gradient Background) */}
      <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 relative z-20 bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-950 text-white border-t border-emerald-800/40">
        {/* Soft Ambient Glow Blurs */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 relative z-10">
          
          {/* Left Column: Overlapping Logo & Farm Bio/Location */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 w-full lg:w-auto">
            {/* Overlapping Farm Logo (Floats cleanly over cover photo without being cut off) */}
            <div className="-mt-14 sm:-mt-20 relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white text-emerald-800 flex items-center justify-center overflow-hidden shadow-2xl border-4 border-white sm:border-[5px] ring-2 ring-emerald-500/40 shrink-0 group z-30">
              {logoImageUrl ? (
                <img src={logoImageUrl} alt={farmName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center font-black text-4xl text-emerald-900">
                  {farmName ? farmName.charAt(0) : 'F'}
                </div>
              )}

              {/* In Seller View: Change Logo Overlay (only if upload handler provided) */}
              {isSellerView && onLogoUpload && (
                <>
                  <label
                    htmlFor="farm-header-logo-upload"
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[11px] font-bold text-white text-center p-1"
                  >
                    {uploadingLogo ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-white mb-1" />
                    ) : (
                      <Camera className="w-5 h-5 mb-1" />
                    )}
                    <span>{lang === 'bn' ? 'লোগো বদলান' : 'Change Logo'}</span>
                  </label>
                  <input
                    type="file"
                    id="farm-header-logo-upload"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && onLogoUpload && onLogoUpload(e.target.files[0])}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </>
              )}
            </div>

            {/* Farm Title, Owner Badge & Coordinates */}
            <div className="space-y-2 pt-2 sm:pt-0 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {farmName || (lang === 'bn' ? 'এগ্রোমার্কেট খামার' : 'AgroMarket Farm')}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? 'যাচাইকৃত খামার' : 'Verified Partner'}</span>
                </span>
              </div>

              {/* Farmer Owner Row with Avatar (Click to enlarge photo modal) */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-emerald-200/90 font-medium">
                <button
                  type="button"
                  onClick={() => setShowOwnerModal(true)}
                  className="flex items-center gap-2.5 text-emerald-100 font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-xs cursor-pointer group transition-all hover:scale-102"
                  title={lang === 'bn' ? 'কৃষকের ছবি ও পরিচিতি বড় করে দেখতে ক্লিক করুন' : 'Click to view farmer photo and credentials'}
                >
                  <div className="relative">
                    {ownerImageUrl ? (
                      <img
                        src={ownerImageUrl}
                        alt={farmerName || 'Farmer'}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-emerald-400 shrink-0 group-hover:ring-2 group-hover:ring-emerald-300 transition-all"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-300 flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs">
                      <ZoomIn className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-emerald-300 block font-normal leading-tight">
                      {lang === 'bn' ? 'খামার মালিক' : 'Farmer Owner'}
                    </span>
                    <span className="text-xs sm:text-sm text-white font-black group-hover:text-emerald-200 transition-colors">
                      {farmerName || (lang === 'bn' ? 'মোঃ রফিকুল ইসলাম' : 'Farmer Rafiq')}
                    </span>
                  </div>
                </button>

                {farmerPhone && (
                  <div className="flex items-center gap-1 text-emerald-300 font-mono text-xs">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{farmerPhone}</span>
                  </div>
                )}
              </div>

              {/* Location Coordinates & Member Since Strip */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-emerald-200/80 font-medium pt-0.5">
                <div className="flex items-center gap-1.5 text-emerald-200">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {upazila ? `${upazila}, ` : ''}{district || 'রাজশাহী'}, {division || 'Rajshahi'}
                  </span>
                </div>

                <span>•</span>

                <div className="flex items-center gap-1.5 text-emerald-300/80">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {lang === 'bn' ? 'নিবন্ধিত:' : 'Member Since:'} {formattedYear}
                  </span>
                </div>

                {address && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-300/80 truncate max-w-xs" title={address}>
                      {address}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Rating Box & Metrics / Payout Controls */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-emerald-800/60 pt-4 lg:pt-0 shrink-0">
            {/* Rating Widget */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center gap-3.5 shadow-md">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-xl sm:text-2xl">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>{parseFloat(ratingAvg || 4.9).toFixed(1)}</span>
                </div>
                <span className="text-[11px] text-emerald-200 block mt-0.5 font-medium">
                  {totalRatings || 18} {lang === 'bn' ? 'গ্রাহক রিভিউ' : 'reviews'}
                </span>
              </div>

              {totalProducts !== undefined && (
                <>
                  <div className="h-9 w-px bg-white/20" />
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-white font-black text-xl sm:text-2xl">
                      <Package className="w-5 h-5 text-emerald-400" />
                      <span>{totalProducts}</span>
                    </div>
                    <span className="text-[11px] text-emerald-200 block mt-0.5 font-medium">
                      {lang === 'bn' ? 'ফসল তালিকা' : 'crops listed'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* In Seller View: Payout Badge */}
            {isSellerView && payoutNumber && (
              <div className="hidden sm:flex flex-col items-end gap-1 bg-emerald-800/70 p-3 rounded-2xl border border-emerald-500/40 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-bold">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span className="uppercase">{payoutMethod || 'bKash'}</span>
                </div>
                <span className="font-mono text-white font-extrabold text-xs">
                  {payoutNumber}
                </span>
              </div>
            )}

            {/* In Buyer Storefront View: Direct Call & Chat Live Buttons */}
            {!isSellerView && (
              <div className="flex items-center gap-2">
                {onOpenChat && (
                  <button
                    type="button"
                    onClick={onOpenChat}
                    className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
                    title={lang === 'bn' ? 'কৃষকের সাথে সরাসরি লাইভ চ্যাট করুন' : 'Chat live with farmer'}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-200" />
                    <span>{lang === 'bn' ? 'সরাসরি চ্যাট' : 'Chat Live'}</span>
                  </button>
                )}

                {farmerPhone && (
                  <a
                    href={`tel:${farmerPhone}`}
                    className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'সরাসরি কল করুন' : 'Call Farmer'}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Farm Story & Biography Section (Full width, aligns with Call Farmer button, never overflows) */}
        {showBio && bio ? (
          <div className="mt-6 pt-5 border-t border-emerald-800/60 relative z-10 w-full">
            <div className="w-full bg-emerald-900/35 hover:bg-emerald-900/45 transition-colors backdrop-blur-md p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-emerald-700/50 shadow-inner overflow-hidden">
              <div className="flex items-center gap-2 mb-3 text-emerald-300">
                <Quote className="w-4 h-4 text-emerald-400 rotate-180 shrink-0" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-200">
                  {t('farmBioLabel') || (lang === 'bn' ? 'খামারের পরিচিতি ও ইতিহাস' : 'Farm Story & Biography')}
                </h3>
              </div>
              <p className="text-sm sm:text-base text-emerald-50/95 leading-relaxed font-medium break-words [overflow-wrap:anywhere] break-all whitespace-pre-line">
                "{bio}"
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Farmer Owner Identity Modal (Enlarged Portrait & Verification Credentials) */}
      <FarmerIdentityModal
        isOpen={showOwnerModal}
        onClose={() => setShowOwnerModal(false)}
        farmerName={farmerName}
        farmerPhone={farmerPhone}
        farmName={farmName}
        ownerImageUrl={ownerImageUrl}
        logoImageUrl={logoImageUrl}
        division={division}
        district={district}
        upazila={upazila}
        address={address}
        bio={bio}
        createdAt={createdAt}
        ratingAvg={ratingAvg}
        totalRatings={totalRatings}
        sellerId={sellerId}
      />
    </div>
  );
}
