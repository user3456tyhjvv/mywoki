import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { XMarkIcon, PaperAirplaneIcon, PaperClipIcon, MessageIcon, TrashIcon } from './Icons';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/firebase';
import firebase from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface Admin {
  id: string;
  full_name: string;
  avatar: string;
}

const getOrSetUserId = (): string => {
  let userId = localStorage.getItem('chat_user_id');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('chat_user_id', userId);
  }
  return userId;
};

const SUGGESTIONS = [
  "How do I start a campaign?",
  "Pricing and plans",
  "I need help with my account",
  "How do I integrate MyWoki?",
];

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊",
  "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
  "🤪", "😌", "😔", "😑", "😐", "😶", "🤐", "🤨", "🤔", "🤫", "🤭", "🤥",
  "😕", "😲", "🙁", "☹️", "😮", "😯", "😳", "🥺", "😦", "😧", "😨", "😰",
  "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
  "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻",
  "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
  "👋", "🤚", "🖐️", "✋", "🖖", "👌", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
  "👍", "👎", "👊", "👏", "🙌", "👐", "🤲", "🤝", "🤜", "🤛", "🦵", "🦶",
  "🧠", "🦷", "🦴", "🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🍾", "🍷",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💞",
  "💓", "💗", "💖", "💘", "💝", "💟", "💌", "💜", "🔥", "⚡", "✨", "💫",
  "⭐", "🌟", "💥", "⚙️", "🔧", "🔨", "🎯", "🎲", "🧩", "♻️", "🚀", "🛸"
];

const NotificationSound = "/sounds/notification.mp3";

const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string>(user?.id || getOrSetUserId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [position, setPosition] = useState({ bottom: 20, right: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminsOnline, setAdminsOnline] = useState<Record<string, boolean>>({});
  const [filePreview, setFilePreview] = useState<{ url: string; file?: File } | null>(null);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isLiveAvailable = () => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5;
  };

  useEffect(() => {
    if (isOpen) {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
             if (event.key === 'Tab') {
              const focusableElements = chatContainerRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
              );
              if (!focusableElements || focusableElements.length === 0) return;

              const firstElement = focusableElements[0];
              const lastElement = focusableElements[focusableElements.length - 1];

              if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                  lastElement.focus();
                  event.preventDefault();
                }
              } else {
                if (document.activeElement === lastElement) {
                  firstElement.focus();
                  event.preventDefault();
                }
              }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            triggerRef.current?.focus();
        }
    } else {
      setUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if(isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (userId) {
      const unsubscribe = db.collection('messages').where('chatId', '==', userId).orderBy('created_at').onSnapshot((snapshot) => {
        const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            created_at: data.created_at?.toDate()?.toISOString() || new Date().toISOString()
          } as ChatMessage;
        });

        const newest = msgs[msgs.length - 1];
        if (newest && newest.sender.type !== 'user') {
          if (!isOpen) {
            setUnreadCount((u) => u + 1);
            try {
              const audio = new Audio(NotificationSound);
              audio.play().catch(() => {
                audioRef.current?.play();
              });
            } catch (err) {
              console.log('Could not play notification sound');
            }
          }
        }

        setMessages(msgs);
      });
      return unsubscribe;
    }
  }, [userId, isOpen]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!userId) return;
    const docRef = db.collection('typing').doc(userId);
    const unsub = docRef.onSnapshot((snap) => {
      if (snap.exists) {
        const val = snap.data();
        setIsAdminTyping(!!val?.typing);
      } else {
        setIsAdminTyping(false);
      }
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(getOrSetUserId());
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      const { data, error } = await supabase.from('admins').select('id, full_name, avatar');
      if (error) {
        console.error('Error fetching admins:', error);
      } else {
        setAdmins(data || []);
      }
    };
    fetchAdmins();
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase.from('admins_status').select('admin_id, online');
      const map: Record<string, boolean> = {};
      (data || []).forEach((r: any) => {
        map[r.admin_id] = !!r.online;
      });
      setAdminsOnline(map);
    };
    fetchStatus();
    
    const channel = supabase.channel('admins_status');
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'admins_status' },
      (payload) => {
        const p = payload.new as any;
        setAdminsOnline((prev) => ({ ...prev, [p.admin_id]: !!p.online }));
      }
    );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      try {
        const typingRef = db.collection('typing').doc(userId);
        if (newMessage.trim() !== '') {
          await typingRef.set({ typing: true, updated_at: firebase.firestore.FieldValue.serverTimestamp() });
        } else {
          await typingRef.set({ typing: false, updated_at: firebase.firestore.FieldValue.serverTimestamp() });
        }
      } catch (e) {}
    }, 700);

    return () => clearTimeout(delay);
  }, [newMessage, userId]);

  const handleSendMessage = async (fileURL?: string, fileName?: string) => {
    const content = newMessage.trim();
    if (content === '' && !fileURL) return;

    setIsSending(true);

    const userMessage: ChatMessage = {
        id: uuidv4(),
        chatId: userId,
        sender: {
          id: userId, type: 'user',
          email: user?.email || ''
        },
        content,
        fileURL: fileURL || null,
        fileName: fileName || null,
        read: false,
        created_at: new Date().toISOString(),
    };

    await db.collection('messages').add({
      ...userMessage,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    setNewMessage('');
    setFilePreview(null);
    setShowEmojiPicker(false);
    setIsSending(false);

    try {
      const typingRef = db.collection('typing').doc(userId);
      await typingRef.set({ typing: false, updated_at: firebase.firestore.FieldValue.serverTimestamp() });
    } catch (e) {}
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview({ url, file });
    } else {
      setFilePreview({ url: '', file });
    }

    await new Promise(res => setTimeout(res, 1000));
    setIsUploading(false);
  };

  const handleAttachSend = async () => {
    if (!filePreview) return;
    const fakeUrl = filePreview.url || `https://yourspaceanalytics.info/uploads/${filePreview.file?.name}`;
    await handleSendMessage(fakeUrl, filePreview.file?.name || 'attachment');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isOpen) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setPosition(prev => ({
      right: Math.max(10, Math.min(prev.right - deltaX, window.innerWidth - 60)),
      bottom: Math.max(10, Math.min(prev.bottom - deltaY, window.innerHeight - 100))
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClearMessages = async () => {
    if (!userId) return;

    try {
      const batch = db.batch();
      const messagesRef = db.collection('messages').where('chatId', '==', userId);
      const snapshot = await messagesRef.get();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setMessages([]);
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  };

  const toggleOpen = () => {
    setIsOpen((s) => {
      const next = !s;
      if (next) {
        setUnreadCount(0);
      }
      return next;
    });
  };

  const insertSuggestion = (text: string) => {
    setNewMessage((prev) => (prev ? prev + ' ' + text : text));
    inputRef.current?.focus();
  };

  const endChatAndRate = () => {
    setShowRating(true);
  };

  const submitRating = async () => {
    if (!rating) return;
    
    try {
      await db.collection('ratings').add({
        chatId: userId,
        rating,
        comment: ratingComment,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
      });
      setShowRating(false);
      setRating(null);
      setRatingComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      // Fallback: Store rating locally if Firestore fails
      const ratings = JSON.parse(localStorage.getItem('chat_ratings') || '[]');
      ratings.push({
        chatId: userId,
        rating,
        comment: ratingComment,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem('chat_ratings', JSON.stringify(ratings));
      setShowRating(false);
      setRating(null);
      setRatingComment('');
    }
  };

  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString() : '');

  // Get appropriate icon colors based on theme
  const getIconColor = () => {
    return isDark ? 'text-white' : 'text-slate-700';
  };

  return (
    <>
      <audio ref={audioRef}>
        <source src={NotificationSound} />
      </audio>

      <div className="fixed z-40" style={{ bottom: `${position.bottom}px`, right: `${position.right}px` }}>
        <button
          ref={triggerRef}
          onMouseDown={handleMouseDown}
          onClick={toggleOpen}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="chat-widget-container"
          aria-label={isOpen ? "Close support chat" : "Open support chat"}
          title="Support Chat"
          className={`
            rounded-full p-4 shadow-2xl ring-2
            transition-all duration-200 hover:shadow-lg
            ${isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white ring-blue-400/30 shadow-blue-900/50' 
              : 'bg-blue-600 hover:bg-blue-700 text-white ring-blue-200 shadow-slate-200/50'
            }
            ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'}
          `}
        >
          <div className="relative">
            {isOpen ? (
              <XMarkIcon className={`w-7 h-7 ${getIconColor()}`} />
            ) : (
              <MessageIcon className={`w-7 h-7 ${getIconColor()}`} />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {isOpen && (
        <div
            id="chat-widget-container"
            ref={chatContainerRef}
            className={`
              fixed ${isFullscreen ? 'inset-0 m-4' : 'w-full max-w-sm'} 
              h-[70vh] ${isFullscreen ? 'h-auto' : ''} 
              border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 
              transform transition-all duration-300
              ${isDark 
                ? 'bg-slate-900 border-slate-700 shadow-slate-900/50' 
                : 'bg-white border-slate-200 shadow-slate-200/50'
              }
            `}
            style={{ bottom: `${isFullscreen ? 40 : position.bottom + 76}px`, right: `${isFullscreen ? 40 : position.right}px` }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-widget-title"
        >
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-start gap-3">
            <div className="flex -space-x-2 items-center">
              {admins.slice(0, 3).map((admin, i) => {
                const online = !!adminsOnline[admin.id];
                return admin.avatar ? (
                  <div key={admin.id} className="relative">
                    <img
                      src={supabase.storage.from('admin-avatars').getPublicUrl(admin.avatar).data.publicUrl}
                      alt={admin.full_name}
                      className="w-9 h-9 rounded-full border-2 border-white shadow"
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${online ? 'bg-green-400' : 'bg-slate-400'}`} />
                  </div>
                ) : (
                  <div key={i} className="relative">
                    <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-semibold">
                      {admin.full_name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${adminsOnline[admin.id] ? 'bg-green-400' : 'bg-slate-400'}`} />
                  </div>
                );
              })}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="chat-widget-title" className="font-semibold text-sm">MyWoki Support</h3>
                  <p className="text-xs opacity-90">{isLiveAvailable() ? 'Online · Typically replies quickly' : 'Offline · Weekend responses'}</p>
                </div>

                <div className="flex gap-2 items-center">
                  <button onClick={() => setIsFullscreen((s) => !s)} aria-label="Expand" className="p-1 rounded-md hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {isFullscreen ? (<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6h12v12" />) : (<path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3a1 1 0 001 1h3M16 21v-3a1 1 0 00-1-1h-3" />)}
                    </svg>
                  </button>

                  <button onClick={handleClearMessages} title="Clear messages" className="p-1 rounded-md hover:bg-white/10">
                    <TrashIcon className="w-4 h-4" />
                  </button>

                  <button onClick={() => { setIsOpen(false); endChatAndRate(); }} title="End chat & rate" className="p-1 rounded-md hover:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l9-5-9-5-9 5 9 5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {!isLiveAvailable() && (
                <div className="mt-2 text-xs bg-white/10 p-2 rounded-md">We're away for the weekend — leave a message and we'll reply on Monday.</div>
              )}
            </div>
          </div>

          <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`} aria-live="polite" aria-atomic="false">
            <div className="space-y-2">
              <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Hi — welcome to MyWoki support 👋</div>
              <div className="flex gap-2 flex-wrap">
                {SUGGESTIONS.map((s) => (
                  <button 
                    key={s} 
                    onClick={() => insertSuggestion(s)} 
                    className={`
                      text-xs px-3 py-2 rounded-full border transition-colors
                      ${isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }
                    `}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {messages.length === 0 && (
                <div className={`text-center pt-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <p>No messages yet — start the conversation!</p>
                </div>
            )}
            {messages.map((msg) => {
              const isUser = msg.sender.type === 'user';
              const admin = admins.find(a => a.id === msg.sender.id);
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end`}>
                  {!isUser && admin && (
                    <img 
                      src={admin.avatar ? supabase.storage.from('admin-avatars').getPublicUrl(admin.avatar).data.publicUrl : 'https://via.placeholder.com/40'} 
                      alt={admin.full_name} 
                      className="w-8 h-8 rounded-full mr-2 self-end border-2 border-blue-400" 
                    />
                  )}
                  <div className={`
                    max-w-[78%] px-4 py-3 rounded-2xl shadow-md
                    ${isUser 
                      ? 'bg-blue-600 text-white' 
                      : isDark
                        ? 'bg-slate-700 text-slate-100 border border-slate-600'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }
                  `}>
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    {msg.fileURL && msg.fileURL.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <img src={msg.fileURL} alt={msg.fileName} className="mt-2 rounded-md max-h-48 object-cover border border-white/20" />
                    ) : msg.fileURL ? (
                      <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className={`underline text-xs ${isUser ? 'text-blue-200' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {msg.fileName || 'Attachment'}
                      </a>
                    ) : null}
                    <div className={`text-[10px] opacity-60 mt-1 text-right`}>{fmt(msg.created_at)}</div>
                  </div>
                </div>
              );
            })}

            {isAdminTyping && (
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full mr-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                <div className={`rounded-full px-3 py-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-slate-400' : 'bg-slate-500'}`} />
                    <div className={`w-2 h-2 rounded-full animate-pulse delay-75 ${isDark ? 'bg-slate-400' : 'bg-slate-500'}`} />
                    <div className={`w-2 h-2 rounded-full animate-pulse delay-150 ${isDark ? 'bg-slate-400' : 'bg-slate-500'}`} />
                    <span className={`ml-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Support is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {filePreview && (
            <div className={`p-4 border-t flex items-center gap-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              {filePreview.url ? (
                <img src={filePreview.url} alt="preview" className="w-12 h-12 rounded-lg object-cover border-2 border-blue-400" />
              ) : (
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  {filePreview.file?.name?.slice(0, 10)}
                </div>
              )}
              <div className="flex-1">
                <div className={`text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{filePreview.file?.name || 'Attachment'}</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ready to send</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilePreview(null)} 
                  className={`text-xs px-3 py-1 rounded-md transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                >
                  Remove
                </button>
                <button 
                  onClick={handleAttachSend} 
                  className="text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {(isUploading || isSending) && (
            <div className={`px-4 py-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`} role="status">
              {isUploading ? '⬆️ Uploading file...' : '📤 Sending message...'}
            </div>
          )}
          
          <div className={`p-3 border-t ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message or choose a suggestion..."
                aria-label="Type a message"
                className={`
                  flex-1 px-4 py-3 rounded-xl border transition-colors
                  ${isDark 
                    ? 'bg-slate-700 text-slate-100 placeholder-slate-400 border-slate-600 focus:border-blue-500' 
                    : 'bg-white text-slate-900 placeholder-slate-500 border-slate-300 focus:border-blue-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                `}
                disabled={isUploading || isSending}
              />
              
              <div className="relative">
                <button 
                  onClick={() => setShowEmojiPicker((s) => !s)} 
                  className={`p-3 rounded-xl transition-colors ${
                    isDark 
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                  title="Add emoji"
                >
                  <span className="text-lg">😊</span>
                </button>
                {showEmojiPicker && (
                  <div className={`
                    absolute bottom-14 right-0 p-3 border rounded-xl shadow-2xl z-10
                    grid grid-cols-8 gap-1 w-64 max-h-64 overflow-y-auto
                    ${isDark 
                      ? 'bg-slate-800 border-slate-700' 
                      : 'bg-white border-slate-200'
                    }
                  `}>
                    {EMOJIS.map((em) => (
                      <button 
                        key={em} 
                        onClick={() => { 
                          setNewMessage((p) => p + em); 
                          setShowEmojiPicker(false); 
                          inputRef.current?.focus(); 
                        }} 
                        className={`
                          text-lg p-1 rounded-md transition-colors text-center hover:scale-110
                          ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}
                        `}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-hidden="true" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                aria-label="Attach file" 
                className={`p-3 rounded-xl transition-colors ${
                  isDark 
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                disabled={isUploading}
                title="Attach a file"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => handleSendMessage()}
                aria-label="Send message"
                className={`
                  p-3 rounded-xl transition-all active:scale-95 shadow-md
                  ${isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }
                  ${(isUploading || isSending) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={isUploading || isSending}
                title="Send message (Enter)"
              >
                <PaperAirplaneIcon className="w-5 h-5 rotate-45" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showRating && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-xl p-6 shadow-2xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Rate your support experience</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Your feedback helps us improve MyWoki support.</p>

            <div className="mt-4 flex items-center gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setRating(s)} 
                  className={`text-3xl transition-transform hover:scale-125 ${
                    rating && rating >= s 
                      ? 'text-yellow-400' 
                      : isDark 
                        ? 'text-slate-600' 
                        : 'text-slate-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea 
              className={`
                mt-4 w-full p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isDark 
                  ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-500'
                }
              `}
              placeholder="Anything we can do better?" 
              value={ratingComment} 
              onChange={(e) => setRatingComment(e.target.value)}
              rows={3}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button 
                onClick={() => setShowRating(false)} 
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isDark 
                    ? 'border-slate-600 text-slate-200 hover:bg-slate-700' 
                    : 'border-slate-200 text-slate-900 hover:bg-slate-50'
                }`}
              >
                Skip
              </button>
              <button 
                onClick={submitRating} 
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!rating}
              >
                Send Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;