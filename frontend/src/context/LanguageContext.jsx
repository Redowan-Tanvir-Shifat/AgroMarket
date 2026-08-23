import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  bn: {
    // Navigation
    navHome: 'হোম',
    navCatalog: 'বাজারের পণ্য',
    navStorefronts: 'কৃষকের বাগান',
    navLogin: 'লগইন করুন',
    navRegister: 'রেজিস্ট্রেশন',
    navDashboard: 'ড্যাশবোর্ড',
    navLogout: 'লগআউট',
    divisionsDropdownTitle: 'কৃষি বিভাগসমূহ',

    // Hero & Home
    heroTag: 'বাংলাদেশের কৃষকের সরাসরি ডিজিটাল বাজার',
    heroTitleLine1: 'মাঠের তাজা ফসল,',
    heroTitleLine2: 'সরাসরি আপনার দরজায়',
    heroSubtitle: 'মাঝারি সিন্ডিকেট ছাড়াই সরাসরি রাজশাহী, দিনাজপুর, বগুড়া ও পাবনার কৃষকদের কাছ থেকে সেরা দামে আম, চাল, লিচু ও সবজি সংগ্রহ করুন।',
    searchPlaceholder: 'হিমসাগর আম, মিনিকেট চাল, বগুড়ার আলু খুঁজুন...',
    searchBtn: 'পণ্য খুঁজুন',
    popularProduce: 'জনপ্রিয় ফসল:',
    bdAgriNetwork: 'বাংলাদেশ কৃষি নেটওয়ার্ক',
    bdAgriSubtitle: '৬৪ জেলায় সরাসরি কৃষক প্ল্যাটফর্ম',
    statFarmers: 'নিবন্ধিত খামারি',
    statSyndicateFee: 'সিন্ডিকেট ফি',
    statBuyerSavings: 'ক্রেতার সাশ্রয়',
    statFreshDelivery: 'তাজা ডেলিভারি',

    // Seasonal Harvest Categories
    seasonTag: 'বাংলাদেশের সেরা মৌসুমী ফসল',
    seasonTitle: 'বর্তমান মৌসুমী ফসল',
    viewAll: 'সব পণ্য দেখুন',
    catFruitsTitle: 'আম ও ফলমূল',
    catFruitsDesc: 'রাজশাহীর আম ও লিচু',
    catRiceTitle: 'চাল ও খাদ্যশস্য',
    catRiceDesc: 'মিনিকেট ও নাজিরশাইল',
    catVegTitle: 'শাকসবজি',
    catVegDesc: 'বগুড়ার আলু ও কাঁচামরিচ',
    catSpicesTitle: 'পেঁয়াজ ও মসলা',
    catSpicesDesc: 'পাবনার দেশি পেঁয়াজ',
    catDairyTitle: 'দুগ্ধ ও ডিম',
    catDairyDesc: 'খাঁটি গরুর দুধ ও ডিম',

    // Real-time Produce Aging Engine
    agingFeatureTag: 'বিশেষ ফিচার: রিয়েল-টাইম মূল্য হ্রাস (Price Aging Engine)',
    agingTitle: 'রিয়েল-টাইম তাজাত্ব ও স্পেশাল ছাড়',
    agingSubtitle: 'ফসল তোলার পর সময় যত গড়ায়, দাম স্বয়ংক্রিয়ভাবে কমে! পচন রোধ ও সর্বোচ্চ ছাড়ে সেরা ফসল বেছে নিন।',
    wasteSavings: 'পচনজনিত ক্ষতি রোধে সাশ্রয়',
    upToDiscount: '১০% - ৫০% পর্যন্ত ছাড়',

    // Division & Origin Section
    bdAgriMap: 'বাংলাদেশ কৃষি মানচিত্র',
    divisionsTitle: 'বিভাগ ও জেলা ভিত্তিক সেরা খামার',
    divisionsSubtitle: 'নির্দিষ্ট কৃষি অঞ্চল নির্বাচন করে সরাসরি ঐ এলাকার নিবন্ধিত কৃষকদের তাজা পণ্য ব্রাউজ করুন',
    tabAllDivisions: 'সকল অঞ্চল (All BD)',
    tabRajshahi: 'রাজশাহী (আম ও ধান)',
    tabRangpur: 'দিনাজপুর ও রংপুর (লিচু ও চাল)',
    tabBogura: 'বগুড়া (সবজি ভান্ডার)',
    tabDhaka: 'ঢাকা বিভাগ',

    // Why Choose AgroMarket
    whyUsBadge: 'কৃষকের অধিকার • ক্রেতার স্বস্তি',
    whyUsTitle: 'কেন এগ্রোমার্কেটে সরাসরি কেনাকাটা করবেন?',
    whyUsSubtitle: 'ঐতিহ্যবাহী আড়তদার সিন্ডিকেটে কৃষকরা মাত্র ৪০-৫০% মূল্য পায়। এগ্রোমার্কেট সরাসরি ডিজিটাল সংযোগ তৈরি করে কৃষকের জন্য ১০০% ন্যায্য মূল্য এবং ক্রেতার জন্য ২৫-৩৫% সাশ্রয়ী দাম নিশ্চিত করে।',
    zeroCommission: 'জিরো ফড়িয়া কমিশন',
    zeroCommissionSub: 'কোনো মধ্যস্বত্বভোগী লভ্যাংশ নেই',
    digitalPayment: 'বিকাশ/নগদ পেমেন্ট',
    digitalPaymentSub: 'সহজ ও সুরক্ষিত ডিজিটাল পেমেন্ট',
    joinAsFarmerBtn: 'কৃষক হিসেবে যুক্ত হন',
    startShoppingBtn: 'পণ্য কেনাকাটা শুরু করুন',
    farmerTestimonialTag: 'কৃষক টেস্টিক্রিয়েশন',
    farmerQuote: '"আগে রাজশাহীর আড়তে আম নিয়ে গেলে সিন্ডিকেট কম দাম দিত। এখন এগ্রোমার্কেটে সরাসরি ঢাকার ক্রেতাদের কাছে সঠিক দামে আম বিক্রি করছি।"',
    farmerAuthor: '— মো: রফিকুল ইসলাম, পুঠিয়া, রাজশাহী',

    // Catalog & Filters
    catalogTitle: 'কৃষি পণ্যের ক্যাটালগ',
    catalogSubtitle: 'সরাসরি রাজশাহী, দিনাজপুর, বগুড়া ও পাবনার নিবন্ধিত খামার থেকে তাজা ফসল',
    totalProducts: 'মোট প্রাপ্ত ফসল',
    searchProduce: 'পণ্যের নাম খুঁজুন...',
    allCategories: 'সকল ক্যাটাগরি',
    allDivisions: 'সকল বিভাগ',
    sortBy: 'সাজান',
    freshnessSort: 'সর্বশেষ তাজা ফসল',
    priceLowSort: 'দাম: কম থেকে বেশি',
    priceHighSort: 'দাম: বেশি থেকে কম',
    discountSort: 'সর্বোচ্চ ছাড়',
    noProductsFound: 'কোনো ফসল পাওয়া যায়নি',
    noProductsSub: 'অন্য ফিল্টার বা নাম লিখে অনুসন্ধান করে দেখুন।',

    // Product Card & Details
    harvested: 'ফসল তোলা',
    hoursAgo: 'ঘণ্টা আগে',
    priceDrop: 'মূল্য হ্রাস',
    stockLabel: 'মজুদ',
    directFromFarm: 'খামার থেকে সরাসরি',
    orderNow: 'অর্ডার করুন',

    // Categories
    catFruits: 'আম ও ফলমূল',
    catRice: 'চাল ও খাদ্যশস্য',
    catVeg: 'শাকসবজি',
    catSpices: 'পেঁয়াজ ও মসলা',
    catDairy: 'দুগ্ধ ও ডিম',

    // Roles & Badges
    buyerRole: 'ক্রেতা',
    farmerRole: 'কৃষক / বিক্রেতা',
    adminRole: 'অ্যাডমিন',
    verifiedFarmer: 'যাচাইকৃত কৃষক',
    discountBadge: 'ডিজিটাল ছাড়',
    freshBadge: '১০০% তাজা',
    kg: 'কেজি',
    mon: 'মন (৪০ কেজি)',
    piece: 'পিস / হালি',
    dozen: 'ডজন',
    liter: 'লিটার',

    // Authentication Form - Login
    loginTitle: 'এগ্রোমার্কেটে লগইন করুন',
    loginSubtitle: 'আপনার ভূমিকা নির্বাচন করে একাউন্টে প্রবেশ করুন',
    buyerTab: 'ক্রেতা',
    farmerTab: 'কৃষক',
    adminTab: 'অ্যাডমিন',
    identifierLabel: 'মোবাইল নম্বর অথবা ইমেইল ঠিকানা',
    identifierPlaceholder: '01711xxxxxx অথবা email@domain.com',
    passwordLabel: 'পাসওয়ার্ড',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    rememberMe: 'আমাকে মনে রাখুন',
    loginSubmitBtn: 'লগইন করুন',
    processing: 'প্রসেস করা হচ্ছে...',
    newToAgroMarket: 'এগ্রোমার্কেটে নতুন?',
    createNewAccount: 'নতুন অ্যাকাউন্ট তৈরি করুন',

    // Authentication Form - Register
    registerTitle: 'এগ্রোমার্কেটে রেজিস্ট্রেশন',
    registerSubtitle: 'নতুন অ্যাকাউন্ট তৈরি করুন ও সরাসরি কেনাবেচা শুরু করুন',
    selectAccountRole: 'অ্যাকাউন্টের ধরণ নির্বাচন করুন',
    buyerAccount: 'ক্রেতা অ্যাকাউন্ট',
    buyerAccountSub: 'তাজা ফসল সরাসরি কৃষকের কাছ থেকে কিনুন',
    farmerAccount: 'কৃষক / বিক্রেতা অ্যাকাউন্ট',
    farmerAccountSub: 'আপনার খামারের ফসল মধ্যস্বত্বভোগী ছাড়াই বিক্রি করুন',
    fullNameLabel: 'সম্পূর্ণ নাম',
    fullNamePlaceholder: 'মোঃ রহিম উল্লাহ',
    phoneLabel: 'মোবাইল নম্বর (১১ ডিজিট)',
    phonePlaceholder: '01711223344',
    emailLabel: 'ইমেইল ঠিকানা (ঐচ্ছিক)',
    emailPlaceholder: 'name@example.com',
    divisionLabel: 'বিভাগ',
    districtLabel: 'জেলা / থানা',
    districtPlaceholder: 'যেমন: চারঘাট, রাজশাহী',
    nidLabel: 'জাতীয় পরিচয়পত্র (NID) নম্বর',
    nidPlaceholder: '১৯ ৯০ ১২ ৩৪ ৫৬ ৭৮ ৯১ ০১',
    confirmPasswordLabel: 'পাসওয়ার্ড নিশ্চিত করুন',
    registerSubmitBtn: 'রেজিস্ট্রেশন সম্পন্ন করুন',
    alreadyHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    backToLogin: 'লগইন পৃষ্ঠায় যান'
  },
  en: {
    // Navigation
    navHome: 'Home',
    navCatalog: 'Marketplace',
    navStorefronts: 'Farmers',
    navLogin: 'Log In',
    navRegister: 'Register',
    navDashboard: 'Dashboard',
    navLogout: 'Log Out',
    divisionsDropdownTitle: 'Agri Divisions',

    // Hero & Home
    heroTag: 'Direct Farmer Marketplace of Bangladesh',
    heroTitleLine1: 'Farm-Fresh Harvest,',
    heroTitleLine2: 'Delivered Straight to You',
    heroSubtitle: 'Eliminate middlemen fees. Buy Himsagar mangoes, Miniket rice, Dinajpur lychees & Bogura vegetables directly from verified Bangladeshi farmers.',
    searchPlaceholder: 'Search Himsagar Mango, Miniket Rice, Bogura Potato...',
    searchBtn: 'Search Produce',
    popularProduce: 'Popular Crops:',
    bdAgriNetwork: 'Bangladesh Agri Network',
    bdAgriSubtitle: 'Direct farmer network across 64 districts',
    statFarmers: 'Registered Farmers',
    statSyndicateFee: 'Syndicate Fees',
    statBuyerSavings: 'Buyer Savings',
    statFreshDelivery: 'Fresh Delivery',

    // Seasonal Harvest Categories
    seasonTag: 'Bangladesh Top Seasonal Crops',
    seasonTitle: 'Current Seasonal Harvest',
    viewAll: 'View All Products',
    catFruitsTitle: 'Fruits & Mangoes',
    catFruitsDesc: 'Rajshahi Mangoes & Lychees',
    catRiceTitle: 'Rice & Grains',
    catRiceDesc: 'Miniket & Nazirshail',
    catVegTitle: 'Vegetables',
    catVegDesc: 'Bogura Potatoes & Green Chilis',
    catSpicesTitle: 'Onions & Spices',
    catSpicesDesc: 'Pabna Native Onions',
    catDairyTitle: 'Dairy & Eggs',
    catDairyDesc: 'Pure Cow Milk & Organic Eggs',

    // Real-time Produce Aging Engine
    agingFeatureTag: 'Special Feature: Real-Time Price Decay (Produce Aging Engine)',
    agingTitle: 'Real-Time Freshness & Age Deals',
    agingSubtitle: 'Prices drop automatically as harvest hours pass to prevent waste. Lock in peak freshness or budget savings!',
    wasteSavings: 'Spoilage Waste Savings',
    upToDiscount: '10% - 50% Age Discount',

    // Division & Origin Section
    bdAgriMap: 'Bangladesh Agri Map',
    divisionsTitle: 'Explore Produce by Divisions & Districts',
    divisionsSubtitle: 'Select a farming region to browse fresh harvest directly from local registered farmers',
    tabAllDivisions: 'All Regions (All BD)',
    tabRajshahi: 'Rajshahi (Mango & Rice)',
    tabRangpur: 'Dinajpur & Rangpur (Lychee & Rice)',
    tabBogura: 'Bogura (Vegetable Hub)',
    tabDhaka: 'Dhaka Division',

    // Why Choose AgroMarket
    whyUsBadge: 'Farmer Rights • Buyer Comfort',
    whyUsTitle: 'Why Buy Directly on AgroMarket?',
    whyUsSubtitle: 'Traditional middlemen syndicates pay farmers only 40-50% of retail price. AgroMarket establishes direct digital connectivity ensuring 100% fair payout to farmers and 25-35% savings for buyers.',
    zeroCommission: 'Zero Middlemen Commission',
    zeroCommissionSub: 'No hidden agent margins',
    digitalPayment: 'bKash / Nagad Payment',
    digitalPaymentSub: 'Instant & secure digital payout',
    joinAsFarmerBtn: 'Join as a Farmer',
    startShoppingBtn: 'Start Shopping',
    farmerTestimonialTag: 'Farmer Story',
    farmerQuote: '"Previously, middlemen forced low prices at Rajshahi wholesale markets. Now on AgroMarket, I sell directly to Dhaka buyers at a fair price."',
    farmerAuthor: '— Md. Rafiqul Islam, Puthia, Rajshahi',

    // Catalog & Filters
    catalogTitle: 'Agricultural Produce Catalog',
    catalogSubtitle: 'Direct fresh harvest from registered farms in Rajshahi, Dinajpur, Bogura & Pabna',
    totalProducts: 'Total Produce Found',
    searchProduce: 'Search produce name...',
    allCategories: 'All Categories',
    allDivisions: 'All Divisions',
    sortBy: 'Sort By',
    freshnessSort: 'Latest Fresh Harvest',
    priceLowSort: 'Price: Low to High',
    priceHighSort: 'Price: High to Low',
    discountSort: 'Highest Discount',
    noProductsFound: 'No produce found',
    noProductsSub: 'Try searching with different filters or keywords.',

    // Product Card & Details
    harvested: 'Harvested',
    hoursAgo: 'hours ago',
    priceDrop: 'Age Discount',
    stockLabel: 'Stock',
    directFromFarm: 'Direct from Farm',
    orderNow: 'Order Now',

    // Categories
    catFruits: 'Fruits & Mangoes',
    catRice: 'Rice & Grains',
    catVeg: 'Vegetables',
    catSpices: 'Onions & Spices',
    catDairy: 'Dairy & Eggs',

    // Roles & Badges
    buyerRole: 'Buyer',
    farmerRole: 'Farmer / Seller',
    adminRole: 'Admin',
    verifiedFarmer: 'Verified Farmer',
    discountBadge: 'Age Discount',
    freshBadge: '100% Fresh',
    kg: 'Kg',
    mon: 'Mon (40 Kg)',
    piece: 'Piece',
    dozen: 'Dozen',
    liter: 'Liter',

    // Authentication Form - Login
    loginTitle: 'Log in to AgroMarket',
    loginSubtitle: 'Select your role and sign in to your account',
    buyerTab: 'Buyer',
    farmerTab: 'Farmer',
    adminTab: 'Admin',
    identifierLabel: 'Mobile Number or Email Address',
    identifierPlaceholder: '01711xxxxxx or email@domain.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    loginSubmitBtn: 'Log In',
    processing: 'Processing...',
    newToAgroMarket: 'New to AgroMarket?',
    createNewAccount: 'Create New Account',

    // Authentication Form - Register
    registerTitle: 'Register for AgroMarket',
    registerSubtitle: 'Create your account and start trading directly',
    selectAccountRole: 'Select Account Type',
    buyerAccount: 'Buyer Account',
    buyerAccountSub: 'Buy fresh produce directly from farmers',
    farmerAccount: 'Farmer / Seller Account',
    farmerAccountSub: 'Sell your crops directly without middlemen commission',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'e.g. Md. Rahim Ullah',
    phoneLabel: 'Mobile Number (11 digits)',
    phonePlaceholder: '01711223344',
    emailLabel: 'Email Address (Optional)',
    emailPlaceholder: 'name@example.com',
    divisionLabel: 'Division',
    districtLabel: 'District / Upazila',
    districtPlaceholder: 'e.g. Charghat, Rajshahi',
    nidLabel: 'National ID (NID) Number',
    nidPlaceholder: '1990123456789101',
    confirmPasswordLabel: 'Confirm Password',
    registerSubmitBtn: 'Complete Registration',
    alreadyHaveAccount: 'Already have an account?',
    backToLogin: 'Go to Login'
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('agromarket_lang') || 'bn';
  });

  const toggleLanguage = (selectedLang) => {
    const newLang = selectedLang || (lang === 'bn' ? 'en' : 'bn');
    setLang(newLang);
    localStorage.setItem('agromarket_lang', newLang);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['bn']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
