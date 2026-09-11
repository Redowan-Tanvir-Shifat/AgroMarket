import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Phone,
  User,
  X,
  Store,
  Star,
  CheckCircle2,
  ExternalLink,
  Award,
  Sparkles
} from 'lucide-react';

export default function FarmerIdentityModal({
  isOpen,
  onClose,
  farmerName,
  farmerPhone,
  farmName,
  ownerImageUrl,
  logoImageUrl,
  division,
  district,
  upazila,
  address,
  bio,
  createdAt,
  ratingAvg = 4.9,
  totalRatings = 18,
  sellerId
}) {
  const { lang, t } = useLanguage();

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedYear = createdAt ? new Date(createdAt).getFullYear() : '2024';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-200/80 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header Strip with Agro Gradient */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-2 relative z-10">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-extrabold text-sm tracking-wide">
              {lang === 'bn' ? 'যাচাইকৃত কৃষক পরিচয়পত্র' : 'Verified Farmer Identity'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer relative z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 sm:p-7 space-y-5 text-center">
          
          {/* Large Farmer Portrait Showcase */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500 bg-slate-100 group">
            {ownerImageUrl ? (
              <img
                src={ownerImageUrl}
                alt={farmerName || 'Farmer Portrait'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-emerald-50">
                <User className="w-20 h-20 text-emerald-600 mb-2" />
                <span className="text-xs font-semibold text-emerald-800">
                  {lang === 'bn' ? 'প্রোফাইল ছবি নেই' : 'No photo uploaded'}
                </span>
              </div>
            )}

            {/* Verified Farmer Floating Seal */}
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-md py-1 px-2.5 rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-1.5 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'সরকারি কৃষি বাতায়ন অংশীদার' : 'DAE Verified Farmer'}</span>
            </div>
          </div>

          {/* Farmer & Farm Titles */}
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {farmerName || (lang === 'bn' ? 'মোঃ রফিকুল ইসলাম' : 'Farmer Rafiqul Islam')}
            </h3>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-emerald-800">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>{farmName || (lang === 'bn' ? 'অর্গানিক খামার' : 'Organic Farm')}</span>
            </div>
          </div>

          {/* Key Farmer Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-left pt-1">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {lang === 'bn' ? 'খামারের অবস্থান' : 'Location'}
              </span>
              <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{district || 'রাজশাহী'}, {division || 'Rajshahi'}</span>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {lang === 'bn' ? 'গ্রাহক রেটিং' : 'Rating'}
              </span>
              <p className="text-xs font-black text-amber-500 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{parseFloat(ratingAvg || 4.9).toFixed(1)}</span>
                <span className="text-slate-400 font-normal text-[11px]">({totalRatings || 18})</span>
              </p>
            </div>
          </div>

          {/* Bio Quote (if available) */}
          {bio && (
            <p className="text-xs text-slate-600 leading-relaxed italic bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 break-words [overflow-wrap:anywhere] break-all whitespace-pre-line max-h-36 overflow-y-auto text-left">
              "{bio}"
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {farmerPhone ? (
              <a
                href={`tel:${farmerPhone}`}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-102"
              >
                <Phone className="w-4 h-4" />
                <span>{lang === 'bn' ? 'সরাসরি কল করুন' : 'Call Farmer'}</span>
              </a>
            ) : null}

            {sellerId && (
              <Link
                to={`/storefront/${sellerId}`}
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>{lang === 'bn' ? 'স্টোরফ্রন্ট ভিজিট' : 'View Storefront'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
