import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ShoppingBag, UserCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const { loginUser, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState('buyer'); // buyer | seller | admin
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier || !password) {
      setErrorMessage(t('identifierLabel') + ' & ' + t('passwordLabel') + ' required.');
      return;
    }

    const res = await loginUser(identifier, password);
    if (res.success) {
      if (res.user.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-emerald-50/50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-emerald-100 shadow-xl relative overflow-hidden">
        
        {/* Top Decorative Circle */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-600/30 mb-4">
            <Sprout className="w-9 h-9" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('loginTitle')}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveRole('buyer')}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all border flex items-center justify-center gap-1.5 outline-none ${
              activeRole === 'buyer'
                ? 'bg-white text-emerald-700 shadow-xs border-emerald-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('buyerTab')}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveRole('seller')}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all border flex items-center justify-center gap-1.5 outline-none ${
              activeRole === 'seller'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 border-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('farmerTab')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('admin')}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all border flex items-center justify-center gap-1.5 outline-none ${
              activeRole === 'admin'
                ? 'bg-slate-900 text-amber-400 shadow-xs border-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t('adminTab')}</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          
          {/* Mobile / Email Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('identifierLabel')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t('identifierPlaceholder')}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t('passwordLabel')}
              </label>
              <a href="#forgot" className="text-xs font-semibold text-emerald-600 hover:underline">
                {t('forgotPassword')}
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs text-slate-600 font-medium">{t('rememberMe')}</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? (
              <span>{t('processing')}</span>
            ) : (
              <>
                <span>{t('loginSubmitBtn')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Register */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          {t('newToAgroMarket')}{' '}
          <Link to="/register" className="font-bold text-emerald-600 hover:underline">
            {t('createNewAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
