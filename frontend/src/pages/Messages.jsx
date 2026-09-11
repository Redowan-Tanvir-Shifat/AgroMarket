import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import {
  MessageSquare,
  Search,
  Send,
  Sprout,
  ShieldCheck,
  User,
  ArrowLeft,
  ExternalLink,
  Phone,
  Check,
  CheckCheck,
  Sparkles,
  Clock,
  Radio,
  ChevronRight,
  Package
} from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const { socket, playNotificationChime, isConnected } = useSocket();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Quick reply suggestions for buyer / farmer negotiations
  const quickReplies = [
    { bn: 'দাম কি কিছুটা কমানো সম্ভব?', en: 'Is there any discount on bulk order?' },
    { bn: 'আজকে পাঠালে কবে নাগাদ পাবো?', en: 'When can this be delivered?' },
    { bn: 'ফসলটি কি একদম টাটকা?', en: 'How fresh is this harvest?' },
    { bn: 'খামার থেকে সরাসরি পিকআপ করা যাবে?', en: 'Can I pick up directly from the farm?' }
  ];

  // Fetch all user conversations
  const fetchConversations = async (selectFirst = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:5000/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch conversation list');
      const data = await res.json();
      const list = data.conversations || [];
      setConversations(list);

      // Handle query param or select first
      const paramId = searchParams.get('conversationId') || searchParams.get('id');
      if (paramId) {
        const found = list.find((c) => c.id === parseInt(paramId));
        if (found) {
          setActiveConvId(found.id);
        } else if (list.length > 0) {
          setActiveConvId(parseInt(paramId));
        }
      } else if (selectFirst && list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConversations(true);
  }, [user]);

  // Handle sellerId query param (start chat if from storefront)
  useEffect(() => {
    const sellerId = searchParams.get('sellerId');
    const productId = searchParams.get('productId');
    if (sellerId && user) {
      const startChat = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5000/api/chat/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              seller_id: parseInt(sellerId),
              product_id: productId ? parseInt(productId) : null
            })
          });
          if (res.ok) {
            const data = await res.json();
            setActiveConvId(data.conversationId);
            fetchConversations();
          }
        } catch (err) {
          console.error('Failed to initiate seller chat:', err);
        }
      };
      startChat();
    }
  }, [searchParams, user]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    let isMounted = true;
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/chat/conversations/${activeConvId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load messages');
        const data = await res.json();

        if (isMounted) {
          setActiveConv(data.conversation);
          setMessages(data.messages || []);

          // Clear unread count for this conversation in list
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
          );
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [activeConvId]);

  // Socket.io room management & events
  useEffect(() => {
    if (!socket || !activeConvId) return;

    socket.emit('join_conversation', activeConvId);

    const handleNewMessage = (newMsg) => {
      // If message belongs to active thread
      if (newMsg.conversation_id === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender_id !== user.id) {
          playNotificationChime();
        }
      }

      // Also update conversations list snippets
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === newMsg.conversation_id) {
            return {
              ...c,
              last_message_content: newMsg.content,
              last_message_time: newMsg.created_at,
              unread_count:
                newMsg.conversation_id === activeConvId || newMsg.sender_id === user.id
                  ? 0
                  : (c.unread_count || 0) + 1
            };
          }
          return c;
        })
      );
    };

    const handleUserTyping = (data) => {
      if (data.conversationId === activeConvId) {
        setTypingUser(data.isTyping ? data.senderName : null);
      }
    };

    const handleMessagesRead = (data) => {
      if (data.conversationId === activeConvId) {
        setMessages((prev) =>
          prev.map((m) => (m.sender_id === user.id ? { ...m, is_read: 1 } : m))
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.emit('leave_conversation', activeConvId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, activeConvId, user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Handle typing broadcast
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!socket || !activeConvId) return;
    socket.emit('typing_start', {
      conversationId: activeConvId,
      senderName: user.fullName,
      senderRole: user.role === 'seller' ? 'seller' : 'buyer'
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId: activeConvId });
    }, 1500);
  };

  const handleSendMessage = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : inputText;
    if (!text || !text.trim() || sending || !activeConvId) return;

    const content = text.trim();
    setInputText('');
    setSending(true);

    if (socket && activeConvId) {
      socket.emit('typing_stop', { conversationId: activeConvId });
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/chat/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });

      // Update conversations sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, last_message_content: content, last_message_time: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations by search term
  const filteredConversations = conversations.filter((c) => {
    const isBuyer = user?.role === 'buyer' || c.buyer_id === user?.id;
    const targetName = isBuyer ? `${c.farm_name} ${c.seller_name}` : c.buyer_name;
    const crop = `${c.product_title_bn || ''} ${c.product_title_en || ''}`;
    return (
      targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getRecipientInfo = (conv) => {
    if (!conv) return { name: '', sub: '', avatar: null, isFarmer: false };
    const isBuyer = conv.buyer_id === user?.id;
    if (isBuyer) {
      return {
        name: conv.farm_name || conv.seller_name || 'Farmer',
        sub: conv.seller_name ? `কৃষক: ${conv.seller_name}` : 'যাচাইকৃত কৃষক',
        avatar: conv.seller_logo || conv.seller_owner_image,
        phone: conv.seller_phone,
        isFarmer: true,
        sellerId: conv.seller_id
      };
    } else {
      return {
        name: conv.buyer_name || 'Customer',
        sub: conv.buyer_phone || 'ক্রেতা',
        avatar: conv.buyer_avatar,
        phone: conv.buyer_phone,
        isFarmer: false,
        sellerId: null
      };
    }
  };

  const recipient = getRecipientInfo(activeConv);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5" />
            </span>
            <span>{lang === 'bn' ? 'সরাসরি কৃষক-ক্রেতা বার্তা' : 'Live Chat & Messaging'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'bn'
              ? 'ফসলের দরদাম, পরিমাণ ও খামার থেকে সংগ্রহের জন্য সরাসরি যোগাযোগ'
              : 'Direct communication for harvest negotiations, stock inquiries, and farm pickups'}
          </p>
        </div>

        {isConnected && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Socket.io Real-time</span>
          </div>
        )}
      </div>

      {/* Main Dual-Panel Hub */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] max-h-[750px]">
        
        {/* LEFT COLUMN: Conversations List (4 cols) */}
        <div
          className={`lg:col-span-4 border-r border-slate-200 flex flex-col ${
            activeConvId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Box */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'খামার বা ক্রেতা খুঁজুন...' : 'Search threads or crops...'}
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingList ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">{t('processing')}</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-12 text-center space-y-2 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-bold text-slate-600">
                  {lang === 'bn' ? 'কোনো সক্রিয় বার্তা নেই' : 'No conversations found'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {lang === 'bn'
                    ? 'ফসল বা খামারের পেজ থেকে "চ্যাট করুন" বাটনে ক্লিক করে যোগাযোগ শুরু করুন।'
                    : 'Start a chat from any produce or storefront page.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const info = getRecipientInfo(conv);
                const isSelected = conv.id === activeConvId;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setSearchParams({ conversationId: conv.id });
                    }}
                    className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
                      {info.avatar ? (
                        <img src={info.avatar} alt={info.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{info.name ? info.name.charAt(0) : 'U'}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-extrabold text-slate-900 truncate">{info.name}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {conv.last_message_time
                            ? new Date(conv.last_message_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : ''}
                        </span>
                      </div>

                      {/* Product snippet tag */}
                      {(conv.product_title_bn || conv.product_title_en) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full mt-1">
                          <Sprout className="w-3 h-3 text-emerald-600" />
                          <span className="truncate max-w-[130px]">
                            {lang === 'bn' ? (conv.product_title_bn || conv.product_title_en) : conv.product_title_en}
                          </span>
                        </span>
                      )}

                      {/* Last Message Preview */}
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {conv.last_message_content || (lang === 'bn' ? 'বার্তা পাঠান...' : 'Send message...')}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Window (8 cols) */}
        <div
          className={`lg:col-span-8 flex flex-col bg-slate-50/50 ${
            !activeConvId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeConvId && activeConv ? (
            <>
              {/* 1. Chat Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back to List Button */}
                  <button
                    type="button"
                    onClick={() => setActiveConvId(null)}
                    className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-2xs">
                    {recipient.avatar ? (
                      <img src={recipient.avatar} alt={recipient.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{recipient.name ? recipient.name.charAt(0) : 'U'}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                        {recipient.name}
                      </h3>
                      {recipient.isFarmer && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{recipient.sub}</p>
                  </div>
                </div>

                {/* Header Action Links */}
                <div className="flex items-center gap-2 shrink-0">
                  {recipient.sellerId && (
                    <Link
                      to={`/storefront/${recipient.sellerId}`}
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200"
                    >
                      <span>{lang === 'bn' ? 'ফার্ম দেখুন' : 'View Farm'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {recipient.phone && (
                    <a
                      href={`tel:${recipient.phone}`}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title={recipient.phone}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* 2. Attached Crop Context Card (if any) */}
              {activeConv.product_title_en && (
                <div className="px-5 py-3 bg-emerald-50/90 border-b border-emerald-100 flex items-center gap-3 shrink-0">
                  {activeConv.product_image ? (
                    <img
                      src={activeConv.product_image}
                      alt={activeConv.product_title_en}
                      className="w-11 h-11 rounded-xl object-cover border border-emerald-200 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                      {lang === 'bn' ? 'আলোচিত ফসল ও পণ্য' : 'Crop In Discussion'}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      {lang === 'bn' ? (activeConv.product_title_bn || activeConv.product_title_en) : activeConv.product_title_en}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-emerald-800">৳{activeConv.product_price}</span>
                    <span className="text-[10px] text-slate-500 block">/{activeConv.product_unit || 'kg'}</span>
                  </div>

                  {activeConv.product_id && (
                    <Link
                      to={`/products/${activeConv.product_id}`}
                      className="ml-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0"
                    >
                      {lang === 'bn' ? 'পণ্য দেখুন →' : 'View Crop →'}
                    </Link>
                  )}
                </div>
              )}

              {/* 3. Message Bubble Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                    <MessageSquare className="w-12 h-12 stroke-1 text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">
                      {lang === 'bn' ? 'কোনো পূর্ববর্তী বার্তা নেই' : 'No messages in this chat yet'}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm">
                      {lang === 'bn'
                        ? 'নিচে বার্তা লিখে কৃষকের সাথে সরাসরি যোগাযোগ ও দাম নিয়ে কথা বলুন।'
                        : 'Type a message below or pick one of the quick suggestions.'}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mb-1">
                            {msg.sender_name ? msg.sender_name.charAt(0) : 'U'}
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-3xl px-4 py-3 shadow-2xs text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-emerald-700 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
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
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-300 inline" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-emerald-300/80 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Real-time Typing indicator */}
                {typingUser && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold italic bg-emerald-50 px-3.5 py-1.5 rounded-full w-max">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    <span>{typingUser} {lang === 'bn' ? 'লিখছেন...' : 'is typing...'}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 4. Quick Reply Shortcuts */}
              <div className="px-4 py-2 bg-white/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
                  {lang === 'bn' ? 'দ্রুত প্রশ্ন:' : 'Quick:'}
                </span>
                {quickReplies.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(lang === 'bn' ? q.bn : q.en)}
                    className="px-3 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 text-[11px] font-medium border border-slate-200 transition-all shrink-0 cursor-pointer"
                  >
                    {lang === 'bn' ? q.bn : q.en}
                  </button>
                ))}
              </div>

              {/* 5. Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 sm:gap-3 shrink-0"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={lang === 'bn' ? 'আপনার বার্তা বা প্রস্তাব লিখুন...' : 'Type your message or price offer...'}
                  disabled={sending}
                  className="flex-1 px-4 sm:px-5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                </button>
              </form>
            </>
          ) : (
            /* Empty selection state */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">
                {lang === 'bn' ? 'কোনো আলাপ নির্বাচন করা হয়নি' : 'Select a conversation'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {lang === 'bn'
                  ? 'বামপাশের তালিকা থেকে যেকোনো আলাপ নির্বাচন করুন অথবা ফসলের পেজ থেকে সরাসরি কৃষকের সাথে যোগাযোগ শুরু করুন।'
                  : 'Choose an active thread from the sidebar or click "Chat" on any farm product to start a new inquiry.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
