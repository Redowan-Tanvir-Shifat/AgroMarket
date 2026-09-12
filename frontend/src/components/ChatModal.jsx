import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { getApiUrl } from '../config/api';
import {
  X,
  Send,
  MessageSquare,
  Sprout,
  ShieldCheck,
  Maximize2,
  ExternalLink,
  User,
  Check,
  CheckCheck
} from 'lucide-react';

export default function ChatModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  farmName,
  farmLogo = null,
  farmerAvatar = null,
  buyerId = null,
  buyerName = null,
  buyerAvatar = null,
  productId = null,
  productTitle = null,
  productImage = null,
  productPrice = null,
  productUnit = null
}) {
  const { user } = useAuth();
  const { socket, playNotificationChime } = useSocket();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [conversationId, setConversationId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to latest message inside container ONLY (without scrolling browser page)
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  // Initialize or fetch conversation when modal opens
  useEffect(() => {
    if (!isOpen || !user || (!sellerId && !buyerId)) return;

    let isMounted = true;

    const initChat = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
        const res = await fetch(getApiUrl('/api/chat/start'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            seller_id: sellerId || user?.sellerProfile?.id,
            buyer_id: buyerId,
            product_id: productId
          })
        });

        if (!res.ok) throw new Error('Could not initialize chat session');
        const data = await res.json();
        const convId = data.conversationId;

        if (isMounted) {
          setConversationId(convId);

          // Fetch messages
          const msgRes = await fetch(getApiUrl(`/api/chat/conversations/${convId}/messages`), {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setConversation(msgData.conversation || null);
            setMessages(msgData.messages || []);
          }
        }
      } catch (err) {
        console.error('Chat init error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChat();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, sellerId, buyerId, productId]);

  // Manage Socket.io room & listeners
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join room
    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (newMsg) => {
      if (newMsg.conversation_id === parseInt(conversationId)) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Play audio chime if received from other person
        if (newMsg.sender_id !== user?.id) {
          playNotificationChime();
        }
      }
    };

    const handleUserTyping = (data) => {
      if (data.conversationId === parseInt(conversationId)) {
        setOtherUserTyping(data.isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, conversationId, user]);

  // Handle Typing indicator broadcast
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socket || !conversationId) return;

    socket.emit('typing_start', {
      conversationId,
      senderName: user?.fullName || 'User',
      senderRole: user?.role === 'seller' ? 'seller' : 'buyer'
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId });
    }, 1500);
  };

  const handleSendMessage = async (e, textToSend) => {
    if (e && e.preventDefault) e.preventDefault();
    const content = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!content || sending || !conversationId) return;

    if (textToSend === undefined) {
      setInputText('');
    }
    setSending(true);

    if (socket && conversationId) {
      socket.emit('typing_stop', { conversationId });
    }

    try {
      const token = localStorage.getItem('agromarket_token') || localStorage.getItem('token');
      const res = await fetch(getApiUrl(`/api/chat/conversations/${conversationId}/messages`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();

      // In case socket didn't append yet
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleExpandToInbox = () => {
    onClose();
    if (conversationId) {
      navigate(`/messages?conversationId=${conversationId}`);
    } else {
      navigate('/messages');
    }
  };

  if (!isOpen) return null;

  const isFarmerTarget = user?.role === 'seller' ? false : (user?.role === 'buyer' ? true : Boolean(!buyerId));
  const targetFarmLogo = conversation?.seller_logo || conversation?.seller_owner_image || farmLogo || farmerAvatar;
  const targetBuyerAvatar = conversation?.buyer_avatar || buyerAvatar;
  const activeAvatar = isFarmerTarget ? targetFarmLogo : targetBuyerAvatar;
  const activeTitle = isFarmerTarget
    ? (farmName || conversation?.farm_name || sellerName || conversation?.seller_name || (lang === 'bn' ? 'খামারির সাথে সরাসরি চ্যাট' : 'Farmer Live Chat'))
    : (buyerName || conversation?.buyer_name || (lang === 'bn' ? 'ক্রেতার সাথে সরাসরি চ্যাট' : 'Buyer Live Chat'));

  const quickReplies = user?.role === 'seller'
    ? [
        { bn: 'ফসল একদম তাজা ও প্রস্তুত আছে', en: 'Crop is 100% fresh & ready' },
        { bn: 'আজই ডেলিভারির জন্য বুক করা যাবে', en: 'Can dispatch for delivery today' },
        { bn: 'পাইকারি অর্ডারে বিশেষ মূল্যছাড় রয়েছে', en: 'Bulk order discount available' },
        { bn: 'খামার থেকে সরাসরি সংগ্রহ করতে পারবেন', en: 'Farm pickup is available' }
      ]
    : [
        { bn: 'দাম কি কিছুটা কমানো সম্ভব?', en: 'Is there any discount on bulk order?' },
        { bn: 'আজকে পাঠালে কবে নাগাদ পাবো?', en: 'When can this be delivered?' },
        { bn: 'ফসলটি কি একদম টাটকা?', en: 'How fresh is this harvest?' },
        { bn: 'খামার থেকে সরাসরি পিকআপ করা যাবে?', en: 'Can I pick up directly from the farm?' }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[85vh] sm:h-[680px] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        
        {/* 1. Header with Farm Logo or Buyer Profile Photo */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden shadow-2xs border ${
              isFarmerTarget 
                ? 'rounded-2xl bg-emerald-700/80 border-emerald-500/50' 
                : 'rounded-full bg-blue-700/80 border-blue-400/50'
            }`}>
              {activeAvatar ? (
                <img 
                  src={activeAvatar} 
                  alt={activeTitle} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                />
              ) : isFarmerTarget ? (
                <Sprout className="w-5 h-5 text-emerald-300" />
              ) : (
                <User className="w-5 h-5 text-blue-200" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-white truncate">
                  {activeTitle}
                </h3>
                {isFarmerTarget ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-sm text-[9px] font-black bg-emerald-700 text-emerald-200 border border-emerald-500/40 shrink-0">
                    <Sprout className="w-2.5 h-2.5 text-emerald-300" />
                    {lang === 'bn' ? 'ফার্ম লোগো' : 'Farm'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-sm text-[9px] font-black bg-blue-700 text-blue-200 border border-blue-400/40 shrink-0">
                    <User className="w-2.5 h-2.5 text-blue-300" />
                    {lang === 'bn' ? 'ক্রেতার ছবি' : 'Buyer'}
                  </span>
                )}
                {isFarmerTarget && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[11px] text-emerald-200 truncate">
                {buyerName
                  ? (lang === 'bn' ? 'সম্মানিত ক্রেতা • সরাসরি মেসেজ' : 'Valued Buyer • Direct Message')
                  : (sellerName ? `${sellerName} • ` : '')}
                {!buyerName && (
                  <span className="text-emerald-300 font-bold">{lang === 'bn' ? 'সরাসরি যোগাযোগ' : 'Direct Message'}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExpandToInbox}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              title={lang === 'bn' ? 'পূর্ণ চ্যাট ইনবক্স খুলুন' : 'Open Full Inbox'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Attached Produce Context Banner (if discussing a crop) */}
        {productTitle && (
          <div className="px-4 py-2.5 bg-emerald-50/90 border-b border-emerald-100 flex items-center gap-3 shrink-0">
            {productImage ? (
              <img
                src={productImage}
                alt={productTitle}
                className="w-10 h-10 rounded-xl object-cover border border-emerald-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                {lang === 'bn' ? 'আলোচিত ফসল' : 'Produce Inquiry'}
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">{productTitle}</p>
            </div>
            {productPrice && (
              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-emerald-700">৳{productPrice}</span>
                <span className="text-[10px] text-slate-500 block">/{productUnit || 'kg'}</span>
              </div>
            )}
          </div>
        )}

        {/* 3. Messages Feed */}
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
          {!user ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <h4 className="font-bold text-sm text-slate-700">
                {lang === 'bn' ? 'চ্যাট করতে অনুগ্রহ করে লগইন করুন' : 'Please log in to chat with farmer'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                {lang === 'bn'
                  ? 'কৃষকের সাথে সরাসরি ফসলের দাম ও ডেলিভারি নিয়ে কথা বলতে লগইন করুন।'
                  : 'Log in to negotiate harvest prices, verify freshness, or arrange farm pickup.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {t('navLogin')}
              </button>
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <MessageSquare className="w-10 h-10 stroke-1 text-slate-300" />
              <p className="text-xs font-semibold">
                {lang === 'bn' ? 'কোনো পূর্ববর্তী বার্তা নেই।' : 'No messages yet.'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                {lang === 'bn'
                  ? 'নিচে বার্তা লিখে কৃষকের সাথে সরাসরি যোগাযোগ শুরু করুন।'
                  : 'Type a message below to start an instant conversation with the farmer.'}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                const isMsgFromSeller = msg.sender_role === 'seller' || (conversation && msg.sender_id === conversation.seller_user_id);
                const msgAvatar = isMsgFromSeller
                  ? (msg.sender_avatar || conversation?.seller_logo || targetFarmLogo || (isMe && user?.sellerProfile?.logo_image_url))
                  : (msg.sender_avatar || conversation?.buyer_avatar || targetBuyerAvatar || (isMe && user?.avatar_url));
                const msgSenderName = isMsgFromSeller
                  ? (conversation?.farm_name || farmName || msg.sender_name || (lang === 'bn' ? 'খামার' : 'Farm'))
                  : (conversation?.buyer_name || buyerName || msg.sender_name || (lang === 'bn' ? 'ক্রেতা' : 'Buyer'));

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Incoming sender avatar (Left) */}
                    {!isMe && (
                      <div
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold shrink-0 mb-1 overflow-hidden shadow-2xs border ${
                          isMsgFromSeller 
                            ? 'rounded-2xl bg-emerald-50 text-emerald-800 border-emerald-300' 
                            : 'rounded-full bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        title={`${msgSenderName} (${isMsgFromSeller ? (lang === 'bn' ? 'ফার্ম লোগো' : 'Farm Logo') : (lang === 'bn' ? 'ক্রেতার ছবি' : 'Buyer Photo')})`}
                      >
                        {msgAvatar ? (
                          <img
                            src={msgAvatar}
                            alt={msgSenderName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : isMsgFromSeller ? (
                          <Sprout className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-2xs text-xs leading-relaxed ${
                        isMe
                          ? 'bg-emerald-700 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                      }`}
                    >
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-black tracking-wide ${isMsgFromSeller ? 'text-emerald-700' : 'text-blue-700'}`}>
                            {msgSenderName}
                          </span>
                          <span className={`text-[8px] px-1 py-0.2 rounded-xs font-bold inline-flex items-center gap-0.5 ${
                            isMsgFromSeller ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isMsgFromSeller ? <Sprout className="w-2.5 h-2.5 text-emerald-700" /> : <User className="w-2.5 h-2.5 text-blue-700" />}
                            {isMsgFromSeller ? (lang === 'bn' ? 'খামার' : 'Farm') : (lang === 'bn' ? 'ক্রেতা' : 'Buyer')}
                          </span>
                        </div>
                      )}

                      <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isMe ? 'text-emerald-200' : 'text-slate-400'
                        }`}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {isMe && (
                          <span>
                            {msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-emerald-300 inline" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-emerald-300/80 inline" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Outgoing current user avatar (Right) */}
                    {isMe && (
                      <div
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold shrink-0 mb-1 overflow-hidden shadow-2xs border ${
                          isMsgFromSeller 
                            ? 'rounded-2xl bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'rounded-full bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        title={isMsgFromSeller ? (lang === 'bn' ? 'আপনার ফার্ম লোগো' : 'Your Farm Logo') : (lang === 'bn' ? 'আপনার প্রোফাইল ছবি' : 'Your Profile Picture')}
                      >
                        {msgAvatar ? (
                          <img
                            src={msgAvatar}
                            alt={msgSenderName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : isMsgFromSeller ? (
                          <Sprout className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <User className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold italic bg-emerald-50 px-3 py-1.5 rounded-full w-max">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  <span>{lang === 'bn' ? 'লিখছেন...' : 'Typing...'}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Quick Reply Shortcuts */}
        {user && (
          <div className="px-4 py-2 bg-white/95 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
              {lang === 'bn' ? 'দ্রুত প্রশ্ন:' : 'Quick:'}
            </span>
            {quickReplies.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(undefined, lang === 'bn' ? q.bn : q.en)}
                className="px-3 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 text-[11px] font-medium border border-slate-200 transition-all shrink-0 cursor-pointer"
              >
                {lang === 'bn' ? q.bn : q.en}
              </button>
            ))}
          </div>
        )}

        {/* 4. Input Area */}
        {user && (
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 sm:gap-3 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={lang === 'bn' ? 'আপনার বার্তা বা প্রস্তাব লিখুন...' : 'Type your message or price offer...'}
              disabled={loading || sending}
              className="flex-1 px-4 sm:px-5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title={lang === 'bn' ? 'পাঠান' : 'Send'}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
