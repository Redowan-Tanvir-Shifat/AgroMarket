import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sprout, ShoppingBag, ShieldCheck, User, Phone, Mail, Lock, MapPin, Building2, CreditCard, ArrowRight, AlertCircle } from 'lucide-react';

const DIVISIONS = [
  'Dhaka', 'Rajshahi', 'Rangpur', 'Chattogram', 'Khulna', 'Barishal', 'Sylhet', 'Mymensingh'
];

const DISTRICTS_MAP = {
  Rajshahi: ['Rajshahi', 'Pabna', 'Bogura', 'Natore', 'Naogaon', 'Chapai Nawabganj'],
  Rangpur: ['Dinajpur', 'Rangpur', 'Kurigram', 'Gaibandha', 'Thakurgaon'],
  Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 'Manikganj'],
  Chattogram: ['Chattogram', 'Cox\'s Bazar', 'Cumilla', 'Noakhali', 'Feni'],
  Khulna: ['Jessore', 'Khulna', 'Kushtia', 'Satkhira', 'Jhenaidah'],
  Barishal: ['Barishal', 'Bhola', 'Patuakhali', 'Pirojpur'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur']
};

export default function Register() {
  const { registerUser, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState('buyer'); // buyer | seller
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [division, setDivision] = useState('Rajshahi');
  const [district, setDistrict] = useState('Rajshahi');
  const [upazila, setUpazila] = useState('');
  const [address, setAddress] = useState('');

  // Farmer specific inputs
  const [farmName, setFarmName] = useState('');
  const [farmDivision, setFarmDivision] = useState('Rajshahi');
  const [farmDistrict, setFarmDistrict] = useState('Rajshahi');
  const [farmUpazila, setFarmUpazila] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [nidTradeLicense, setNidTradeLicense] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('BKASH');
  const [payoutNumber, setPayoutNumber] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const handleDivisionChange = (e) => {
    const selected = e.target.value;
    setDivision(selected);
    const districtList = DISTRICTS_MAP[selected] || [];
    setDistrict(districtList[0] || selected);
  };

  const handleFarmDivisionChange = (e) => {
    const selected = e.target.value;
    setFarmDivision(selected);
    const districtList = DISTRICTS_MAP[selected] || [];
    setFarmDistrict(districtList[0] || selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !phone || !password) {
      setErrorMessage(t('fullNameLabel') + ', ' + t('phoneLabel') + ' & ' + t('passwordLabel') + ' required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (role === 'seller' && (!farmName || !farmDistrict)) {
      setErrorMessage('Farm name and district are required for Farmer registration.');
      return;
    }

    const payload = {
      fullName,
      email,
      phone,
      password,
      role,
      division,
      district,
      upazila,
      address,
      ...(role === 'seller' && {
        farmName,
        farmDivision,
        farmDistrict,
        farmUpazila,
        farmAddress: farmAddress || address,
        nidTradeLicense,
        payoutMethod,
        payoutNumber: payoutNumber || phone
      })
    };

    const res = await registerUser(payload);
    if (res.success) {
      if (role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-emerald-50/50">
      <div className="max-w-2xl w-full bg-white p-8 sm:p-12 rounded-3xl border border-emerald-100 shadow-xl relative">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-600/30 mb-3">
            <Sprout className="w-9 h-9" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('registerTitle')}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
            {t('registerSubtitle')}
          </p>
        </div>

        {/* Multi-Role Registration Tab Switcher */}
        <div className="grid grid-cols-2 gap-3 p-2 bg-slate-100 rounded-2xl mb-8 border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all border flex items-center justify-center gap-2 outline-none ${
              role === 'buyer'
                ? 'bg-white text-emerald-700 shadow-md border-emerald-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>{t('buyerAccount')}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setRole('seller')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all border flex items-center justify-center gap-2 outline-none ${
              role === 'seller'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 border-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>{t('farmerAccount')}</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Base User Account Fields */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-2">
              1. Account Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('fullNameLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('fullNamePlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('phoneLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('emailLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('passwordLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('confirmPasswordLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Role-Specific Fields Section */}
          {role === 'buyer' ? (
            /* Buyer Details */
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-2">
                2. Location & Payment Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('divisionLabel')}</label>
                  <select
                    value={division}
                    onChange={handleDivisionChange}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {DIVISIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('districtLabel')}</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {(DISTRICTS_MAP[division] || [division]).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Upazila / Area</label>
                  <input
                    type="text"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    placeholder="e.g. Charghat"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Holding no, Road, Village..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          ) : (
            /* Farmer Details */
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-2">
                2. Farm Profile & Payout Info
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Farm / Enterprise Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Rajshahi Mango Orchard"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Farm Division</label>
                  <select
                    value={farmDivision}
                    onChange={handleFarmDivisionChange}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {DIVISIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Farm District <span className="text-rose-500">*</span></label>
                  <select
                    value={farmDistrict}
                    onChange={(e) => setFarmDistrict(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    {(DISTRICTS_MAP[farmDivision] || [farmDivision]).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Upazila / Union</label>
                  <input
                    type="text"
                    value={farmUpazila}
                    onChange={(e) => setFarmUpazila(e.target.value)}
                    placeholder="e.g. Puthia"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('nidLabel')}
                  </label>
                  <input
                    type="text"
                    value={nidTradeLicense}
                    onChange={(e) => setNidTradeLicense(e.target.value)}
                    placeholder={t('nidPlaceholder')}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payout Mobile Account</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={payoutNumber}
                      onChange={(e) => setPayoutNumber(e.target.value)}
                      placeholder="bKash/Nagad 017xxxxxxxx"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-70 text-base"
          >
            {loading ? (
              <span>{t('processing')}</span>
            ) : (
              <>
                <span>{t('registerSubmitBtn')}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="pt-6 mt-6 border-t border-slate-100 text-center text-xs text-slate-600">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-bold text-emerald-600 hover:underline">
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
