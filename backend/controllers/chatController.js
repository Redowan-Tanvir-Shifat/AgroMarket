import pool from '../config/db.js';
import { emitToConversation, emitToUser } from '../socket/socketManager.js';
import { createNotificationRecord } from './notificationController.js';

/**
 * @desc Get all conversation threads for logged-in user (buyer or seller)
 * @route GET /api/chat/conversations
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        c.id,
        c.buyer_id,
        c.seller_id,
        c.product_id,
        c.last_message_at,
        c.created_at,
        -- Buyer details
        bu.full_name AS buyer_name,
        bu.phone AS buyer_phone,
        bu.avatar_url AS buyer_avatar,
        -- Seller details
        s.farm_name,
        s.user_id AS seller_user_id,
        s.logo_image_url AS seller_logo,
        s.owner_image_url AS seller_owner_image,
        su.full_name AS seller_name,
        -- Product details (if chat started from produce)
        p.title_en AS product_title_en,
        p.title_bn AS product_title_bn,
        p.price_bdt AS product_price,
        p.unit AS product_unit,
        p.image_url AS product_image,
        -- Last message
        lm.content AS last_message_content,
        lm.sender_id AS last_message_sender_id,
        lm.sender_role AS last_message_sender_role,
        lm.created_at AS last_message_time,
        -- Unread count for current user
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.id 
           AND m.is_read = 0 
           AND m.sender_id != ?) AS unread_count
      FROM conversations c
      JOIN users bu ON c.buyer_id = bu.id
      JOIN sellers s ON c.seller_id = s.id
      JOIN users su ON s.user_id = su.id
      LEFT JOIN products p ON c.product_id = p.id
      LEFT JOIN (
        SELECT m1.*
        FROM messages m1
        JOIN (
          SELECT conversation_id, MAX(id) AS max_id
          FROM messages
          GROUP BY conversation_id
        ) m2 ON m1.id = m2.max_id
      ) lm ON lm.conversation_id = c.id
      WHERE c.buyer_id = ? OR s.user_id = ?
      ORDER BY c.last_message_at DESC
    `;

    const [conversations] = await pool.query(query, [userId, userId, userId]);

    return res.json({
      success: true,
      conversations
    });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
  }
};

/**
 * @desc Start or get existing conversation between buyer & seller
 * @route POST /api/chat/start
 */
export const startConversation = async (req, res) => {
  try {
    const buyerId = req.user.id;
    let { seller_id, product_id, initial_message } = req.body;

    // Resolve seller_id from product if not explicitly given
    if (!seller_id && product_id) {
      const [products] = await pool.query('SELECT seller_id FROM products WHERE id = ?', [product_id]);
      if (products.length > 0) {
        seller_id = products[0].seller_id;
      }
    }

    if (!seller_id) {
      return res.status(400).json({ message: 'Seller ID is required to start a chat' });
    }

    // Check if seller exists and prevent self-chat
    const [sellers] = await pool.query('SELECT id, user_id, farm_name FROM sellers WHERE id = ?', [seller_id]);
    if (sellers.length === 0) {
      return res.status(404).json({ message: 'Farmer storefront not found' });
    }

    const seller = sellers[0];
    if (seller.user_id === buyerId) {
      return res.status(400).json({ message: 'You cannot initiate a chat with your own storefront' });
    }

    // Check for existing conversation
    let [existing] = await pool.query(
      `SELECT id FROM conversations 
       WHERE buyer_id = ? AND seller_id = ? 
       ORDER BY last_message_at DESC LIMIT 1`,
      [buyerId, seller_id]
    );

    let conversationId = null;

    if (existing.length > 0) {
      conversationId = existing[0].id;
      // If product_id provided and conversation didn't have one, update product context
      if (product_id) {
        await pool.query('UPDATE conversations SET product_id = ? WHERE id = ?', [product_id, conversationId]);
      }
    } else {
      const [insertRes] = await pool.query(
        `INSERT INTO conversations (buyer_id, seller_id, product_id, last_message_at, created_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [buyerId, seller_id, product_id || null]
      );
      conversationId = insertRes.insertId;
    }

    // If an initial message was provided, send it
    if (initial_message && initial_message.trim()) {
      const content = initial_message.trim();
      const [msgRes] = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, sender_role, content, is_read, created_at)
         VALUES (?, ?, 'buyer', ?, 0, NOW())`,
        [conversationId, buyerId, content]
      );

      await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [conversationId]);

      // Emit live socket event to conversation
      const msgObj = {
        id: msgRes.insertId,
        conversation_id: conversationId,
        sender_id: buyerId,
        sender_role: 'buyer',
        sender_name: req.user.full_name,
        content,
        is_read: 0,
        created_at: new Date().toISOString()
      };
      emitToConversation(conversationId, 'new_message', msgObj);

      // Trigger notification for seller
      await createNotificationRecord({
        userId: seller.user_id,
        sellerId: seller.id,
        type: 'CHAT',
        title: `নতুন বার্তা: ${req.user.full_name}`,
        title_bn: `নতুন বার্তা: ${req.user.full_name}`,
        message: content.length > 90 ? `${content.slice(0, 90)}...` : content,
        message_bn: content.length > 90 ? `${content.slice(0, 90)}...` : content,
        link: `/messages?conversationId=${conversationId}`
      });
    }

    return res.json({
      success: true,
      conversationId
    });
  } catch (err) {
    console.error('Error starting conversation:', err);
    return res.status(500).json({ message: 'Failed to start conversation', error: err.message });
  }
};

/**
 * @desc Get all messages in a specific conversation
 * @route GET /api/chat/conversations/:id/messages
 */
export const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    // Validate access permission
    const [conversations] = await pool.query(
      `SELECT 
        c.*,
        bu.full_name AS buyer_name,
        bu.phone AS buyer_phone,
        bu.avatar_url AS buyer_avatar,
        s.farm_name,
        s.user_id AS seller_user_id,
        s.logo_image_url AS seller_logo,
        s.owner_image_url AS seller_owner_image,
        su.full_name AS seller_name,
        p.title_en AS product_title_en,
        p.title_bn AS product_title_bn,
        p.price_bdt AS product_price,
        p.unit AS product_unit,
        p.image_url AS product_image
       FROM conversations c
       JOIN users bu ON c.buyer_id = bu.id
       JOIN sellers s ON c.seller_id = s.id
       JOIN users su ON s.user_id = su.id
       LEFT JOIN products p ON c.product_id = p.id
       WHERE c.id = ?`,
      [conversationId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ message: 'Conversation thread not found' });
    }

    const conv = conversations[0];
    if (conv.buyer_id !== userId && conv.seller_user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to view this conversation' });
    }

    // Retrieve messages
    const [messages] = await pool.query(
      `SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    // Mark unread messages sent by the other party as read
    await pool.query(
      `UPDATE messages SET is_read = 1 
       WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
      [conversationId, userId]
    );

    // Notify room that messages were marked read
    emitToConversation(conversationId, 'messages_read', {
      conversationId: parseInt(conversationId),
      readByUserId: userId
    });

    return res.json({
      success: true,
      conversation: conv,
      messages
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
  }
};

/**
 * @desc Send a message inside a conversation
 * @route POST /api/chat/conversations/:id/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    // Validate access
    const [conversations] = await pool.query(
      `SELECT 
        c.*,
        bu.full_name AS buyer_name,
        s.farm_name,
        s.id AS seller_farm_id,
        s.user_id AS seller_user_id,
        su.full_name AS seller_name
       FROM conversations c
       JOIN users bu ON c.buyer_id = bu.id
       JOIN sellers s ON c.seller_id = s.id
       JOIN users su ON s.user_id = su.id
       WHERE c.id = ?`,
      [conversationId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ message: 'Conversation thread not found' });
    }

    const conv = conversations[0];
    if (conv.buyer_id !== userId && conv.seller_user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to post to this conversation' });
    }

    const isBuyer = conv.buyer_id === userId;
    const senderRole = isBuyer ? 'buyer' : 'seller';
    const recipientUserId = isBuyer ? conv.seller_user_id : conv.buyer_id;
    const senderName = isBuyer ? conv.buyer_name : (conv.farm_name || conv.seller_name);

    // Insert message
    const [msgRes] = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, sender_role, content, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [conversationId, userId, senderRole, content.trim()]
    );

    // Update conversation timestamp
    await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [conversationId]);

    const messagePayload = {
      id: msgRes.insertId,
      conversation_id: parseInt(conversationId),
      sender_id: userId,
      sender_role: senderRole,
      sender_name: senderName,
      content: content.trim(),
      is_read: 0,
      created_at: new Date().toISOString()
    };

    // 1. Live emit to active conversation room
    emitToConversation(conversationId, 'new_message', messagePayload);

    // 2. Direct alert to recipient's personal user socket
    emitToUser(recipientUserId, 'chat_alert', {
      conversationId: parseInt(conversationId),
      senderName,
      content: content.slice(0, 100)
    });

    // 3. Persistent notification for recipient
    await createNotificationRecord({
      userId: recipientUserId,
      type: 'CHAT',
      title: `নতুন বার্তা: ${senderName}`,
      title_bn: `নতুন বার্তা: ${senderName}`,
      message: content.length > 90 ? `${content.slice(0, 90)}...` : content,
      message_bn: content.length > 90 ? `${content.slice(0, 90)}...` : content,
      link: `/messages?conversationId=${conversationId}`
    });

    return res.status(201).json({
      success: true,
      message: messagePayload
    });
  } catch (err) {
    console.error('Error sending message:', err);
    return res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};
