import pool from '../config/db.js';
import { emitToUser, emitToSeller } from '../socket/socketManager.js';

/**
 * Helper to resolve user ID safely (from JWT auth, query, or fallback)
 */
const resolveUserId = (req) => {
  if (req.user?.id) return req.user.id;
  if (req.query?.userId) {
    const parsed = parseInt(req.query.userId);
    if (!isNaN(parsed)) return parsed;
  }
  return 1; // Default demo user
};

/**
 * @desc Get all notifications for authenticated user
 * @route GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = resolveUserId(req);

    const [notifications] = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 40`,
      [userId]
    );

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

/**
 * @desc Mark a single notification as read
 * @route PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = resolveUserId(req);

    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return res.status(500).json({ message: 'Failed to mark notification as read', error: err.message });
  }
};

/**
 * @desc Mark all notifications as read for current user
 * @route PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = resolveUserId(req);

    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [userId]
    );

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    return res.status(500).json({ message: 'Failed to mark all as read', error: err.message });
  }
};

/**
 * System helper: Create notification record in MySQL and emit live Socket.io event
 */
export const createNotificationRecord = async ({
  userId,
  sellerId = null,
  type,
  title,
  title_bn,
  message,
  message_bn,
  link = null
}) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, title_bn, message, message_bn, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [userId, type, title, title_bn, message, message_bn, link]
    );

    const notificationPayload = {
      id: result.insertId,
      user_id: userId,
      type,
      title,
      title_bn,
      message,
      message_bn,
      link,
      is_read: 0,
      created_at: new Date().toISOString()
    };

    // Emit live to specific user's socket room
    emitToUser(userId, 'new_notification', notificationPayload);

    // If sellerId provided, also alert seller's farm channel
    if (sellerId) {
      emitToSeller(sellerId, 'new_order_alert', notificationPayload);
    }

    return notificationPayload;
  } catch (err) {
    console.error('Error creating notification record:', err);
    return null;
  }
};
