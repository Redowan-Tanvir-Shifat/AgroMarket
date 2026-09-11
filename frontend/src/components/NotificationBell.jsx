import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Bell,
  CheckCircle2,
  Package,
  Truck,
  MessageSquare,
  Sparkles,
  ExternalLink,
  X,
  Clock,
  Radio
} from 'lucide-react';

export default function NotificationBell() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
    toastNotification,
    dismissToast,
    fetchNotifications
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'ORDER_NEW':
        return <Package className="w-4 h-4 text-emerald-600" />;
      case 'ORDER_STATUS':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'CHAT':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-600" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return lang === 'bn' ? `${mins} মিনিট আগে` : `${mins}m ago`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return lang === 'bn' ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
    }
    const days = Math.floor(diff / 86400);
    return lang === 'bn' ? `${days} দিন আগে` : `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. Navbar Bell Trigger */}
      <button
        type="button"
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState && fetchNotifications) {
            fetchNotifications();
          }
        }}
        className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-800 transition-all cursor-pointer focus:outline-none"
        title={lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Live Connected Dot */}
        {isConnected && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 2. Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">
                {lang === 'bn' ? 'বিজ্ঞপ্তি ও লাইভ অ্যালার্ট' : 'Live Notifications'}
              </span>
              {isConnected && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  <span>Real-time</span>
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
              >
                {lang === 'bn' ? 'সব পঠিত করুন' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <Bell className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
                <p className="text-xs font-semibold">
                  {lang === 'bn' ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors hover:bg-slate-50 cursor-pointer ${
                    !notif.is_read ? 'bg-emerald-50/50' : 'bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                    {getIconForType(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs truncate ${!notif.is_read ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {lang === 'bn' ? (notif.title_bn || notif.title) : notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {lang === 'bn' ? (notif.message_bn || notif.message) : notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Floating Live Real-Time Toast Notification Popup */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-950 text-white p-4 rounded-3xl shadow-2xl border border-emerald-500/40 animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md">
            {getIconForType(toastNotification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                {lang === 'bn' ? 'নতুন অ্যালার্ট' : 'Live Alert'}
              </span>
              <button
                type="button"
                onClick={dismissToast}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-bold text-white truncate mt-0.5">
              {lang === 'bn' ? (toastNotification.title_bn || toastNotification.title) : toastNotification.title}
            </h4>
            <p className="text-[11px] text-emerald-200/90 line-clamp-2 mt-0.5 leading-relaxed">
              {lang === 'bn' ? (toastNotification.message_bn || toastNotification.message) : toastNotification.message}
            </p>
            {toastNotification.link && (
              <button
                type="button"
                onClick={() => {
                  if (toastNotification.id && !toastNotification.is_read) {
                    markAsRead(toastNotification.id);
                  }
                  dismissToast();
                  navigate(toastNotification.link);
                }}
                className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 underline mt-2 block"
              >
                {lang === 'bn' ? 'বিস্তারিত দেখুন →' : 'View Details →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
