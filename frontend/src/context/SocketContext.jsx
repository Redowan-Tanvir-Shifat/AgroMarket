import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { userId: user.id }
      });
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [user]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/notifications/${id}/read`, {}, {
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
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/read-all', {}, {
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
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const s = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      setIsConnected(true);
      if (user?.id) {
        s.emit('join_user', user.id);
        if (user.role === 'seller' && user.sellerProfile?.id) {
          s.emit('join_seller', user.sellerProfile.id);
        }
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('online_users_count', (count) => {
      setOnlineCount(count);
    });

    // Listen for live notifications
    s.on('new_notification', (notif) => {
      playNotificationChime();
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setToastNotification(notif);
      setTimeout(() => setToastNotification((curr) => (curr?.id === notif.id ? null : curr)), 6000);
    });

    // Listen for new order alerts
    s.on('new_order_alert', (orderNotif) => {
      playNotificationChime();
      setNotifications((prev) => [orderNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setToastNotification(orderNotif);
      setTimeout(() => setToastNotification((curr) => (curr?.id === orderNotif.id ? null : curr)), 6000);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [playNotificationChime]);

  // 2. Re-register rooms when user login state changes
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join_user', user.id);
      if (user.role === 'seller' && user.sellerProfile?.id) {
        socket.emit('join_seller', user.sellerProfile.id);
      }
      fetchNotifications();
    }
  }, [socket, isConnected, user, fetchNotifications]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineCount,
        notifications,
        unreadCount,
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
