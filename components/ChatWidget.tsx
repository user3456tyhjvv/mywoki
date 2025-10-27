import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { XMarkIcon, PaperAirplaneIcon, PaperClipIcon, MessageIcon, TrashIcon } from './Icons';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/firebase';
import firebase from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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


const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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

  const isLiveAvailable = () => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  };

  const triggerRef = useRef<HTMLButtonElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        // When opening, focus the input field
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
             if (event.key === 'Tab') {
              // Focus trap
              const focusableElements = chatContainerRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
              );
              if (!focusableElements || focusableElements.length === 0) return;

              const firstElement = focusableElements[0];
              const lastElement = focusableElements[focusableElements.length - 1];

              if (event.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                  lastElement.focus();
                  event.preventDefault();
                }
              } else { // Tab
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
            // On close, return focus to the trigger button
            triggerRef.current?.focus();
        }
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
        setMessages(msgs);
      });
      return unsubscribe;
    }
  }, [userId]);

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

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        // Fallback to UUID if not logged in
        setUserId(getOrSetUserId());
      }
    });

    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch admins from Supabase
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

    // Save to Firebase
    await db.collection('messages').add({
      ...userMessage,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    setNewMessage('');
    setIsSending(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    await new Promise(res => setTimeout(res, 1500));
    
    await handleSendMessage(`https://yourspaceanalytics.info/uploads/${file.name}`, file.name);

    setIsUploading(false);
    if(fileInputRef.current) fileInputRef.current.value = "";
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

  return (
    <>
      <div className="fixed z-40" style={{ bottom: `${position.bottom}px`, right: `${position.right}px` }}>
        <button
          ref={triggerRef}
          onMouseDown={handleMouseDown}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="chat-widget-container"
          aria-label={isOpen ? "Close support chat" : "Open support chat"}
          title="Support Chat"
          className={`bg-blue-600 hover:bg-blue-700 text-white rounded-full p-5 shadow-2xl ring-2 ring-blue-500/30 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-move'}`}
        >
          {isOpen ? <XMarkIcon className="w-10 h-10" /> : <MessageIcon className="w-10 h-10" />}
        </button>
      </div>

      {isOpen && (
        <div
            id="chat-widget-container"
            ref={chatContainerRef}
            className="fixed w-full max-w-sm h-[70vh] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50"
            style={{ bottom: `${position.bottom + 76}px`, right: `${position.right}px` }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-widget-title"
        >
          <div className="p-3 bg-slate-700/50 rounded-t-lg flex flex-col items-center">
            <div className="flex justify-center mb-2">
              {admins.slice(0, 3).map((admin, index) => (
                <img
                  key={admin.id}
                  src={supabase.storage.from('admin-avatars').getPublicUrl(admin.avatar).data.publicUrl}
                  alt="Admin avatar"
                  className={`w-8 h-8 rounded-full border-2 border-slate-600 ${index > 0 ? '-ml-2' : ''} ${index === 2 ? 'opacity-50' : ''}`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center w-full">
              <div>
                <h3 id="chat-widget-title" className="font-bold text-sm text-white">
                  {isLiveAvailable() ? 'Live Support Chat' : 'We will be back Monday. Leave a message.'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isLiveAvailable() ? "We're here to help!" : "We'll get back to you on Monday."}
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={handleClearMessages}
                  aria-label="Clear all messages"
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Clear all messages"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4" aria-live="polite" aria-atomic="false">
            {messages.length === 0 && (
                <div className="text-center text-slate-400 pt-12">
                    <p>Ask us anything!</p>
                </div>
            )}
            {messages.map((msg) => {
              const admin = admins.find(a => a.id === msg.sender.id);
              return (
                <div key={msg.id} className={`flex ${msg.sender.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender.type !== 'user' && admin ? (
                    <div className="max-w-[80%] rounded-lg px-3 py-2 bg-slate-600">
                      {msg.content && <p className="text-sm text-white">{msg.content}</p>}
                      {msg.fileURL && (
                         <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 hover:underline flex items-center gap-2">
                            <PaperClipIcon className="w-4 h-4" />
                            {msg.fileName || 'View Attachment'}
                        </a>
                      )}
                      <p className="text-xs text-slate-300 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString()}</p>
                    </div>
                  ) : (
                    <div className="max-w-[80%] rounded-lg px-3 py-2 bg-blue-600">
                      {msg.content && <p className="text-sm text-white">{msg.content}</p>}
                      {msg.fileURL && (
                         <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 hover:underline flex items-center gap-2">
                            <PaperClipIcon className="w-4 h-4" />
                            {msg.fileName || 'View Attachment'}
                        </a>
                      )}
                      <p className="text-xs text-slate-300 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString()}</p>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          {(isUploading || isSending) && <div className="px-4 py-1 text-xs text-slate-400" role="status">{isUploading ? 'Uploading file...' : 'Sending message...'}</div>}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isUploading && !isSending && handleSendMessage()}
                placeholder="Type a message..."
                aria-label="Type a message"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isUploading || isSending}
              />
               <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" aria-hidden="true" />
               <button onClick={() => fileInputRef.current?.click()} aria-label="Attach file" className="p-2 text-slate-400 hover:text-white transition-colors" disabled={isUploading}>
                  <PaperClipIcon className="w-5 h-5"/>
               </button>
              <button onClick={() => handleSendMessage()} aria-label="Send message" className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-700 transition-colors" disabled={isUploading || isSending}>
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;