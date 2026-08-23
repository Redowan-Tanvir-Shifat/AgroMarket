import React from 'react';
import { Sprout, PhoneCall, ShieldCheck, Truck, RefreshCw, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-100 pt-16 pb-8 border-t border-emerald-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Feature Highlights Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-emerald-900/80">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-900/40 border border-emerald-800/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">১০০% ফরমালিন মুক্ত</h4>
              <p className="text-xs text-emerald-300">যাচাইকৃত খামার থেকে তাজা ফসল</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-900/40 border border-emerald-800/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">দ্রুত কুরিয়ার ও খামার পিকআপ</h4>
              <p className="text-xs text-emerald-300">২৪-৪৮ ঘণ্টার মধ্যে ডেলিভারি</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-900/40 border border-emerald-800/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">রিয়েল-টাইম তাজাত্ব ডিসকাউন্ট</h4>
              <p className="text-xs text-emerald-300">পচন রোধে ঘণ্টার সাথে মূল্য হ্রাস</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-900/40 border border-emerald-800/50">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-400">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">কৃষক হেল্পলাইন সাপোর্ট</h4>
              <p className="text-xs text-emerald-300">১৬১১১ (টোল ফ্রি)</p>
            </div>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Sprout className="w-6 h-6" />
              </div>
              <span className="text-xl font-black text-white">AgroMarket BD</span>
            </div>
            <p className="text-xs text-emerald-300/90 leading-relaxed">
              বাংলাদেশের কৃষকদের সরাসরি উৎপাদিত তাজা ফসল ভুক্তভোগী ক্রেতা ও ব্যবসায়ীদের কাছে পৌঁছে দেওয়ার সর্বাধুনিক ডিজিটাল বাজার প্ল্যাটফর্ম।
            </p>
            <div className="text-xs font-semibold text-emerald-400">
              📍 ঢাকা • রাজশাহী • রংপুর • বগুড়া • দিনাজপুর • পাবনা • যশোর
            </div>
          </div>

          {/* BD Divisions Grid Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 border-l-4 border-emerald-500 pl-2">কৃষি বিভাগসমূহ</h4>
            <ul className="space-y-2 text-xs text-emerald-300">
              <li><a href="#divisions" className="hover:text-white transition-colors">রাজশাহী বিভাগ (আম ও ধান)</a></li>
              <li><a href="#divisions" className="hover:text-white transition-colors">রংপুর ও দিনাজপুর (লিচু ও চিকন চাল)</a></li>
              <li><a href="#divisions" className="hover:text-white transition-colors">বগুড়া জেলা (সবজি ভান্ডার)</a></li>
              <li><a href="#divisions" className="hover:text-white transition-colors">পাবনা ও কুষ্টিয়া (পেঁয়াজ ও মসলা)</a></li>
              <li><a href="#divisions" className="hover:text-white transition-colors">যশোর ও খুলনা (তাজা সবজি ও মাছ)</a></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 border-l-4 border-emerald-500 pl-2">দ্রুত লিংক</h4>
            <ul className="space-y-2 text-xs text-emerald-300">
              <li><a href="/login" className="hover:text-white transition-colors">কৃষক রেজিস্ট্রেশন</a></li>
              <li><a href="/register" className="hover:text-white transition-colors">ক্রেতা একাউন্ট তৈরি</a></li>
              <li><a href="/products" className="hover:text-white transition-colors">তাজা ফসলের ক্যাটালগ</a></li>
              <li><a href="#aging" className="hover:text-white transition-colors">রিয়েল-টাইম অফার</a></li>
            </ul>
          </div>

          {/* Local Payment Methods */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 border-l-4 border-emerald-500 pl-2">পেমেন্ট সুবিধা</h4>
            <p className="text-xs text-emerald-300 mb-3">
              নিরাপদ পেমেন্ট গেটওয়ে এর মাধ্যমে পেমেন্ট করুন:
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="px-3 py-1.5 rounded-lg bg-pink-600 text-white shadow-xs">bKash (বিকাশ)</span>
              <span className="px-3 py-1.5 rounded-lg bg-orange-600 text-white shadow-xs">Nagad (নগদ)</span>
              <span className="px-3 py-1.5 rounded-lg bg-purple-700 text-white shadow-xs">Rocket (রকেট)</span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-800 text-emerald-200 border border-emerald-700">ক্যাশ অন ডেলিভারি</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-emerald-900/60 text-center text-xs text-emerald-400/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AgroMarket Bangladesh. সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="flex items-center gap-1">
            বাংলাদেশের কৃষকদের সম্মানে নির্মিত <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
