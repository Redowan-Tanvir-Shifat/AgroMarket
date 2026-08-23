import React from 'react';
import { Link } from 'react-router-dom';
import FreshnessBadge from './FreshnessBadge';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, ShieldCheck, ShoppingBag, Star, Calendar } from 'lucide-react';

export default function ProductCard({ product }) {
  const { t, lang } = useLanguage();
  if (!product) return null;

  const {
    id,
    title,
    title_bn,
    base_price_bdt,
    current_dynamic_price_bdt,
    unit,
    farm_name,
    farm_division,
    farm_district,
    seller_rating,
    seller_total_ratings,
    image_url,
    stock_quantity,
    age_in_days,
    max_shelf_life_days
  } = product;

  const currentPrice = parseFloat(current_dynamic_price_bdt || base_price_bdt);
  const basePrice = parseFloat(base_price_bdt);
  const hasDiscount = currentPrice < basePrice;

  // Title translation logic
  const displayTitle = (lang === 'bn' && title_bn) ? title_bn : title;

  // Format harvest hours
  const hoursAgo = Math.max(1, Math.round((parseFloat(age_in_days) || 0) * 24));

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-emerald-100 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between">
      
      {/* Image Container */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
        <img
          src={image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'}
          alt={displayTitle}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
        />
        
        {/* Origin District Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 border border-white/50 shadow-sm flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>{farm_district || farm_division}</span>
        </div>

        {/* Freshness / Aging Discount Badge */}
        <div className="absolute top-3 right-3">
          <FreshnessBadge
            ageInDays={parseFloat(age_in_days)}
            maxShelfLifeDays={max_shelf_life_days}
            basePrice={basePrice}
            currentPrice={currentPrice}
          />
        </div>

        {/* Harvest Date Tag */}
        <div className="absolute bottom-3 left-3 bg-emerald-950/80 backdrop-blur-md text-emerald-200 text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-emerald-500/30">
          <Calendar className="w-3 h-3 text-emerald-400" />
          <span>{t('harvested')}: {hoursAgo} {t('hoursAgo')}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Farm Storefront Name */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-emerald-800 truncate flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {farm_name}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{seller_rating ? parseFloat(seller_rating).toFixed(1) : '4.9'}</span>
              <span className="text-[10px] text-slate-400">({seller_total_ratings || 12})</span>
            </div>
          </div>

          {/* Title */}
          <Link to={`/products/${id}`} className="block group-hover:text-emerald-700 transition-colors">
            <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
              {displayTitle}
            </h3>
          </Link>
        </div>

        {/* Stock Status & Unit */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-700">
                ৳{lang === 'bn' ? currentPrice.toLocaleString('bn-BD') : currentPrice.toLocaleString('en-US')}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {t(unit) || unit}
              </span>
            </div>

            {hasDiscount && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-400 line-through font-medium">
                  ৳{lang === 'bn' ? basePrice.toLocaleString('bn-BD') : basePrice.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                  {t('priceDrop')}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Link
            to={`/products/${id}`}
            className="p-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-2xl transition-all shadow-xs flex items-center justify-center group/btn"
            title={t('orderNow')}
          >
            <ShoppingBag className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
          </Link>
        </div>

        {/* Stock Quantity Footer */}
        <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center justify-between">
          <span>{t('stockLabel')}: <strong className="text-slate-700">{stock_quantity} {t(unit) || unit}</strong></span>
          <span className="text-emerald-700 font-bold text-[10px] uppercase">{t('directFromFarm')}</span>
        </div>
      </div>
    </div>
  );
}
