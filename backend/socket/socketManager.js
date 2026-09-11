import { Server as SocketIOServer } from 'socket.io';

let io = null;
const onlineUsers = new Map(); // userId -> socketId

/**
 * Initialize Socket.io server and setup event handlers
 */
export const initSocketServer = (httpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    // 1. User joins personal room for notifications & direct alerts
    socket.on('join_user', (userId) => {
      if (!userId) return;
      const uid = String(userId);
      socket.join(`user_${uid}`);
      socket.userId = uid;
      onlineUsers.set(uid, socket.id);
      io.emit('online_users_count', onlineUsers.size);
    });

    // 2. Seller joins dedicated farm channel for instant fulfillment alerts
    socket.on('join_seller', (sellerId) => {
      if (!sellerId) return;
      const sid = String(sellerId);
      socket.join(`seller_${sid}`);
      socket.sellerId = sid;
    });

    // 3. Join active chat room between buyer and farmer
    socket.on('join_conversation', (conversationId) => {
      if (!conversationId) return;
      const room = `conv_${conversationId}`;
      socket.join(room);
    });

    // 4. Leave chat room
    socket.on('leave_conversation', (conversationId) => {
      if (!conversationId) return;
      socket.leave(`conv_${conversationId}`);
    });

    // 5. Typing indicator in chat
    socket.on('typing_start', ({ conversationId, senderName, senderRole }) => {
      if (!conversationId) return;
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        senderName,
        senderRole,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        isTyping: false
      });
    });

    // 6. Disconnect cleanup
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('online_users_count', onlineUsers.size);
      }
    });
  });

  return io;
};

/**
 * Access the active Socket.io instance
 */
export const getIO = () => {
  return io;
};

/**
 * Emit event to a specific user (buyer or seller)
 */
export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user_${String(userId)}`).emit(event, payload);
};

/**
 * Emit event to a specific seller's farm channel
 */
export const emitToSeller = (sellerId, event, payload) => {
  if (!io || !sellerId) return;
  io.to(`seller_${String(sellerId)}`).emit(event, payload);
};

/**
 * Emit event to an active conversation room
 */
export const emitToConversation = (conversationId, event, payload) => {
  if (!io || !conversationId) return;
  io.to(`conv_${String(conversationId)}`).emit(event, payload);
};

/**
 * Broadcast event to all connected clients
 */
export const broadcastEvent = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};
