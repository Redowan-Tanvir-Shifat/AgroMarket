import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Radio,
  AlertCircle
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

  const getIconForType = (type, size = 'small') => {
    const cls = size === 'large' ? 'w-6 h-6 stroke-[2.5]' : 'w-4 h-4';
    switch (type) {
      case 'ORDER_NEW':
        return <Package className={`${cls} ${size === 'small' ? 'text-emerald-600' : ''}`} />;
      case 'ORDER_STATUS':
        return <Truck className={`${cls} ${size === 'small' ? 'text-blue-600' : ''}`} />;
      case 'CHAT':
        return <MessageSquare className={`${cls} ${size === 'small' ? 'text-purple-600' : ''}`} />;
      default:
        return <CheckCircle2 className={`${cls} ${size === 'small' ? 'text-emerald-600' : ''}`} />;
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

      {/* 3. Floating Pop-Up Notification Toast (Matching Seller Profile update toast aesthetic) */}
      {toastNotification &&
        createPortal(
          (() => {
            const isDanger =
              toastNotification.type === 'CANCELLED' ||
              toastNotification.title?.toLowerCase().includes('cancel') ||
              toastNotification.message?.toLowerCase().includes('cancel') ||
              toastNotification.title_bn?.includes('বাতিল') ||
              toastNotification.message_bn?.includes('বাতিল');

            const isChat = toastNotification.type === 'CHAT';

            return (
              <div className="fixed top-6 right-6 z-50 max-w-md w-[calc(100%-3rem)] sm:w-auto animate-in slide-in-from-top-5 fade-in duration-300 pointer-events-auto">
                <div
                  className={`p-4 sm:p-5 rounded-3xl shadow-2xl border-2 backdrop-blur-xl flex items-start gap-3.5 transition-all ${
                    isDanger
                      ? 'bg-white/95 border-rose-500 text-slate-900 shadow-rose-500/25 ring-4 ring-rose-500/10'
                      : isChat
                        ? 'bg-white/95 border-purple-500 text-slate-900 shadow-purple-500/25 ring-4 ring-purple-500/10'
                        : 'bg-white/95 border-emerald-500 text-slate-900 shadow-emerald-500/25 ring-4 ring-emerald-500/10'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      isDanger
                        ? 'bg-rose-100 text-rose-700'
                        : isChat
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isDanger ? (
                      <AlertCircle className="w-6 h-6 stroke-[2.5]" />
                    ) : (
                      getIconForType(toastNotification.type, 'large')
                    )}
                  </div>

                  <div className="flex-1 pr-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isDanger
                            ? 'text-rose-700 bg-rose-100/70'
                            : isChat
                              ? 'text-purple-700 bg-purple-100/80 border border-purple-200'
                              : 'text-emerald-700 bg-emerald-100/70'
                        }`}
                      >
                        {isDanger
                          ? (lang === 'bn' ? 'অর্ডার বাতিল' : 'Order Alert')
                          : isChat
                            ? (lang === 'bn' ? 'নতুন বার্তা' : 'New Message')
                            : (lang === 'bn' ? 'নতুন অ্যালার্ট' : 'Live Alert')}
                      </span>
                      {!isDanger && (
                        <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isChat ? 'text-purple-600' : 'text-emerald-600'}`} />
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 mt-1">
                      {lang === 'bn'
                        ? (toastNotification.title_bn || toastNotification.title)
                        : toastNotification.title}
                    </h4>

                    <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                      {lang === 'bn'
                        ? (toastNotification.message_bn || toastNotification.message)
                        : toastNotification.message}
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
                        className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl mt-2.5 transition-all cursor-pointer shadow-2xs group ${
                          isDanger
                            ? 'text-rose-800 hover:text-rose-950 bg-rose-100/70 hover:bg-rose-200/80 border border-rose-300/80'
                            : isChat
                              ? 'text-purple-800 hover:text-purple-950 bg-purple-100/70 hover:bg-purple-200/80 border border-purple-300/80'
                              : 'text-emerald-800 hover:text-emerald-950 bg-emerald-100/70 hover:bg-emerald-200/80 border border-emerald-300/80'
                        }`}
                      >
                        <span>{lang === 'bn' ? 'বার্তা দেখুন' : 'View Message'}</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={dismissToast}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                    aria-label="Close notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })(),
          document.body
        )}
    </div>
  );
}
