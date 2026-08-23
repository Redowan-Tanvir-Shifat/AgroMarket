import React from 'react';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function FreshnessBadge({ ageInDays, maxShelfLifeDays, basePrice, currentPrice }) {
  const { lang } = useLanguage();
  const ageRatio = ageInDays && maxShelfLifeDays ? ageInDays / maxShelfLifeDays : 0;
  const isFresh = ageRatio <= 0.15;
  const isExpired = ageRatio >= 1.0;
  const discountPercent = basePrice && currentPrice && currentPrice < basePrice
    ? Math.round(((basePrice - currentPrice) / basePrice) * 100)
    : 0;

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        {lang === 'bn' ? 'মেয়াদউত্তীর্ণ' : 'Expired'}
      </span>
    );
  }

  if (isFresh || discountPercent === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
        <Clock className="w-3 h-3 text-emerald-600 animate-spin-slow" />
        {lang === 'bn' ? '১০০% তাজা ফসল' : '100% Peak Fresh'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
      <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
      {discountPercent}% {lang === 'bn' ? 'রিয়েল-টাইম ছাড়' : 'Age Discount'}
    </span>
  );
}
