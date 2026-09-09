import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Sprout, ShoppingCart, LogOut, Globe, Menu, X, ShieldCheck, ChevronDown, MapPin, Bookmark, Package, Layers, Truck, PlusCircle, Wallet } from 'lucide-react';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { totalItemsCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [divisionDropdownOpen, setDivisionDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const navLinkStyle = ({ isActive }) =>
    `relative py-2 px-0.5 text-sm font-bold transition-all border-b-2 flex items-center gap-1.5 ${
      isActive
        ? 'text-emerald-700 font-extrabold border-emerald-600'
        : 'text-slate-600 border-transparent hover:text-emerald-600 hover:border-emerald-300'
    }`;

  const mobileNavLinkStyle = ({ isActive }) =>
    `block py-2.5 px-3 text-sm font-bold rounded-xl transition-all ${
      isActive
        ? 'text-emerald-700 bg-emerald-50 border-l-4 border-emerald-600 font-extrabold'
        : 'text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-emerald-800 text-emerald-50 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">সরাসরি বাজার</span>
        <span>কৃষকের ফসলের ন্যায্যমূল্য নিশ্চিতকরণে কোনো মধ্যস্বত্বভোগী কমিশন নেই!</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-emerald-950 block leading-none">
                Agro<span className="text-emerald-600">Market</span>
              </span>
              <span className="text-xs font-semibold text-emerald-700 block mt-0.5">
                এগ্রোমার্কেট (বাংলাদেশ)
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Active Highlighting */}
          <nav className="hidden md:flex items-center gap-8 font-medium">
            <NavLink to="/" end className={navLinkStyle}>
              {t('navHome')}
            </NavLink>
            
            <NavLink to="/products" className={navLinkStyle}>
              {t('navCatalog')}
            </NavLink>

            {/* Division Interactive Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDivisionDropdownOpen(!divisionDropdownOpen)}
                className="py-2 px-0.5 text-sm font-bold text-slate-600 border-b-2 border-transparent hover:text-emerald-600 hover:border-emerald-300 transition-all flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>কৃষি বিভাগসমূহ</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {divisionDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setDivisionDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
                    বিভাগ ও অঞ্চল নির্বাচন করুন
                  </div>
                  {[
                    { name: 'রাজশাহী (আম ও ধান)', division: 'Rajshahi' },
                    { name: 'দিনাজপুর ও রংপুর (লিচু ও চাল)', division: 'Rangpur' },
                    { name: 'বগুড়া (সবজি ভান্ডার)', division: 'Bogura' },
                    { name: 'ঢাকা বিভাগ', division: 'Dhaka' },
                    { name: 'চট্টগ্রাম বিভাগ', division: 'Chattogram' },
                  ].map((item) => (
                    <Link
                      key={item.division}
                      to={`/products?division=${item.division}`}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-semibold"
                      onClick={() => setDivisionDropdownOpen(false)}
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Action Tools & Auth Options */}
          <div className="hidden md:flex items-center gap-4">

            {/* Language Switcher */}
            <button
              onClick={() => toggleLanguage()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Cart Icon Preview */}
            <Link to="/checkout" className="relative p-2 text-slate-700 hover:text-emerald-600 transition-colors" title="Shopping Cart">
              <ShoppingCart className="w-6 h-6" />
              {totalItemsCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                  {totalItemsCount}
                </span>
              )}
            </Link>

            {/* Auth Buttons / Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all text-emerald-900 font-semibold text-sm cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold leading-tight">{user.fullName}</span>
                    <span className="block text-[10px] text-emerald-700 capitalize font-medium">
                      {user.role === 'seller' ? t('farmerRole') : user.role === 'admin' ? t('adminRole') : t('buyerRole')}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-emerald-600" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">লগইন অ্যাকাউন্ট</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{user.phone}</p>
                    </div>

                    {/* Buyer Dashboard Links */}
                    {user.role === 'buyer' && (
                      <>
                        <Link
                          to="/account/orders"
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Package className="w-4 h-4 text-emerald-600" />
                          {t('myOrdersTitle')}
                        </Link>
                        <Link
                          to="/account/wishlist"
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Bookmark className="w-4 h-4 text-emerald-600" />
                          {t('wishlistTitle')}
                        </Link>
                      </>
                    )}

                    {user.role === 'seller' && (
                      <>
                        <Link
                          to="/seller/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-bold"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          {t('sellerDashboardTitle')}
                        </Link>
                        <Link
                          to="/seller/inventory"
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Layers className="w-4 h-4 text-emerald-600" />
                          {t('manageInventoryBtn')}
                        </Link>
                        <Link
                          to="/seller/orders"
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Truck className="w-4 h-4 text-emerald-600" />
                          {t('manageOrdersBtn')}
                        </Link>
                        <Link
                          to="/seller/products/new"
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <PlusCircle className="w-4 h-4 text-emerald-600" />
                          {t('addNewCropBtn')}
                        </Link>
                        <Link
                          to="/seller/profile"
                          className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Wallet className="w-4 h-4 text-emerald-600" />
                          {t('sellerProfileTitle')}
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold border-t border-slate-100 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('navLogout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-semibold rounded-xl transition-colors border outline-none focus:outline-none ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-slate-700 bg-slate-50/80 border-slate-200/60 hover:text-emerald-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {t('navLogin')}
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm border outline-none focus:outline-none ${
                      isActive
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-md'
                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    }`
                  }
                >
                  {t('navRegister')}
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => toggleLanguage()}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-xs font-bold border border-slate-200 cursor-pointer transition-colors"
            >
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2">
          <NavLink
            to="/"
            end
            className={mobileNavLinkStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('navHome')}
          </NavLink>

          <NavLink
            to="/products"
            className={mobileNavLinkStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('navCatalog')}
          </NavLink>

          {user ? (
            <div className="pt-2 space-y-2 border-t border-slate-100">
              <div className="text-xs font-bold text-emerald-800">লগইন: {user.fullName}</div>
              {user.role === 'seller' && (
                <div className="space-y-1 py-1 border-y border-slate-100">
                  <NavLink to="/seller/dashboard" className={mobileNavLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t('sellerDashboardTitle')}</span>
                  </NavLink>
                  <NavLink to="/seller/inventory" className={mobileNavLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>{t('manageInventoryBtn')}</span>
                  </NavLink>
                  <NavLink to="/seller/orders" className={mobileNavLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>{t('manageOrdersBtn')}</span>
                  </NavLink>
                  <NavLink to="/seller/products/new" className={mobileNavLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>{t('addNewCropBtn')}</span>
                  </NavLink>
                  <NavLink to="/seller/profile" className={mobileNavLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span>{t('sellerProfileTitle')}</span>
                  </NavLink>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 text-sm font-bold text-rose-600 cursor-pointer"
              >
                {t('navLogout')}
              </button>
            </div>
          ) : (
            <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
              <NavLink
                to="/login"
                className="w-full py-2.5 text-center font-bold text-slate-700 bg-slate-100 rounded-xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navLogin')}
              </NavLink>
              <NavLink
                to="/register"
                className="w-full py-2.5 text-center font-bold text-white bg-emerald-600 rounded-xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('navRegister')}
              </NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
