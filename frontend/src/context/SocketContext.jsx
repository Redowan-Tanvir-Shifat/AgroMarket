import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { SOCKET_URL, getApiUrl } from '../config/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [toastNotification, setToastNotification] = useState(null);

  // Synthesize a pleasant, modern chime with Web Audio API (zero audio file dependencies)
  const playNotificationChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Pleasant rising two-tone chime (D5 -> A5)
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (err) {
      // Ignore autoplay restriction errors before user gesture
    }
  }, []);

  const seenNotificationIds = useRef(new Set());

  // Helper to reliably get JWT token
  const getAuthToken = () => localStorage.getItem('agromarket_token') || localStorage.getItem('token');

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = getAuthToken();
      const res = await axios.get(getApiUrl('/api/notifications'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { userId: user.id }
      });
      if (res.data?.success) {
        const notifs = res.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(res.data.unreadCount || 0);
        notifs.forEach((n) => seenNotificationIds.current.add(n.id));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [user]);

  // Fetch unread messages count from backend
  const fetchUnreadMessageCount = useCallback(async () => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await axios.get(getApiUrl('/api/chat/unread-count'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setUnreadMessageCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load unread message count:', err);
    }
  }, [user]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      const token = getAuthToken();
      await axios.patch(getApiUrl(`/api/notifications/${id}/read`), {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { userId: user?.id }
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      await axios.put(getApiUrl('/api/notifications/read-all'), {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { userId: user?.id }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // 1. Initialize Socket.io connection
  useEffect(() => {
    const s = io(SOCKET_URL, {
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      setIsConnected(true);
      if (user?.id) {
        s.emit('join_user', user.id);
        const sId = user.sellerProfile?.id || (user.role === 'seller' ? (user.seller_id || 1) : null);
        if (sId) {
          s.emit('join_seller', sId);
        }
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('online_users_count', (count) => {
      setOnlineCount(count);
    });

    // Centralized handler for live notifications
    const handleLiveNotification = (notif) => {
      if (!notif || !notif.id) return;
      if (seenNotificationIds.current.has(notif.id)) return;
      seenNotificationIds.current.add(notif.id);

      playNotificationChime();
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      setUnreadCount((cnt) => cnt + 1);
      setToastNotification(notif);
      setTimeout(() => {
        setToastNotification((curr) => (curr?.id === notif.id ? null : curr));
      }, 7000);
    };

    // Listen for live notifications (direct user channel)
    s.on('new_notification', (notif) => {
      handleLiveNotification(notif);
      if (notif?.type === 'CHAT') {
        fetchUnreadMessageCount();
      }
    });

    // Listen for new order alerts (seller farm channel)
    s.on('new_order_alert', handleLiveNotification);

    // Listen for live chat alerts and messages
    s.on('chat_alert', () => {
      fetchUnreadMessageCount();
    });
    s.on('new_chat_message', () => {
      fetchUnreadMessageCount();
    });
    s.on('new_message', () => {
      fetchUnreadMessageCount();
    });
    s.on('messages_read', () => {
      fetchUnreadMessageCount();
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [playNotificationChime, user]);

  // 2. Re-register rooms when user login state changes
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join_user', user.id);
      const sId = user.sellerProfile?.id || (user.role === 'seller' ? (user.seller_id || 1) : null);
      if (sId) {
        socket.emit('join_seller', sId);
      }
      fetchNotifications();
      fetchUnreadMessageCount();
    }
  }, [socket, isConnected, user, fetchNotifications, fetchUnreadMessageCount]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineCount,
        onlineUsersCount: onlineCount,
        notifications,
        unreadCount,
        unreadMessageCount,
        fetchUnreadMessageCount,
        toastNotification,
        dismissToast: () => setToastNotification(null),
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        playNotificationChime
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
