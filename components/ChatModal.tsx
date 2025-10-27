import React, { useState, useEffect, useRef } from 'react';
import type { Message, User } from '../types';
import { supabase } from '../lib/supabase';
import { XMarkIcon, PaperAirplaneIcon, ClockIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from './Icons';

interface SupportHubProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

const SupportHub: React.FC<SupportHubProps> = ({ isOpen, onClose, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWorkday, setIsWorkday] = useState(false);
  const [isBusinessHours, setIsBusinessHours] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');
  const [showOfflineForm, setShowOfflineForm] = useState(false);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current time is within business hours (9 AM - 6 PM, Monday to Friday)
  useEffect(() => {
    const checkBusinessHours = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const hour = now.getHours();
      
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isBusinessHour = hour >= 9 && hour < 18;
      
      setIsWorkday(isWeekday);
      setIsBusinessHours(isWeekday && isBusinessHour);
    };

    checkBusinessHours();
    // Check every minute in case the time changes
    const interval = setInterval(checkBusinessHours, 60000);
    return () => clearInterval(interval);
  }, []);

  // Create user profile if it doesn't exist
  useEffect(() => {
    const createUserIfNotExists = async () => {
      if (!currentUser) return;

      try {
        const { error } = await supabase
          .from('users')
          .upsert({
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.full_name,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (error && error.code !== '23505') { // Ignore duplicate key errors
          console.error('Error creating user:', error);
        }
      } catch (error) {
        console.error('Error in user creation:', error);
      }
    };

    if (isOpen && currentUser) {
      createUserIfNotExists();
    }
  }, [isOpen, currentUser]);

  // Fetch messages and set up real-time subscription
  useEffect(() => {
    if (isOpen) {
      fetchMessages();

      // Subscribe to new messages
      const messageChannel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      // Subscribe to typing indicators
      const typingChannel = supabase
        .channel('typing')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators'
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const typingUser = payload.new as { user_id: string; is_typing: boolean };
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                if (typingUser.is_typing) {
                  newSet.add(typingUser.user_id);
                } else {
                  newSet.delete(typingUser.user_id);
                }
                return newSet;
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
        supabase.removeChannel(typingChannel);
      };
    }
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(email, full_name)
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle typing indicators
  const handleTypingStart = async () => {
    if (!currentUser || !isBusinessHours) return;

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          user_id: currentUser.id,
          is_typing: true,
          updated_at: new Date().toISOString()
        });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 3000);
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  };

  const handleTypingStop = async () => {
    if (!currentUser) return;

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          user_id: currentUser.id,
          is_typing: false,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error clearing typing indicator:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !isBusinessHours) return;

    setLoading(true);
    try {
      // Stop typing indicator
      await handleTypingStop();

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendOfflineMessage = async () => {
    if (!offlineMessage.trim() || !currentUser) return;

    setOfflineLoading(true);
    try {
      const { error } = await supabase
        .from('offline_messages')
        .insert({
          user_id: currentUser.id,
          message: offlineMessage.trim(),
          user_email: currentUser.email,
          user_name: currentUser.full_name
        });

      if (error) throw error;
      
      setOfflineMessage('');
      setShowOfflineForm(false);
      
      // Show success message
      alert('Your message has been sent! We\'ll get back to you within 24 hours.');
    } catch (error) {
      console.error('Error sending offline message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setOfflineLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTypingStart();
  };

  // Get typing indicator text
  const getTypingText = () => {
    if (typingUsers.size === 0) return null;
    
    const typingArray = Array.from(typingUsers);
    if (typingArray.length === 1) {
      return 'Someone is typing...';
    } else if (typingArray.length === 2) {
      return 'Two people are typing...';
    } else {
      return 'Several people are typing...';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-secondary rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              isBusinessHours ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Support Hub</h2>
            </div>
            {isBusinessHours ? (
              <span className="text-sm text-green-400 flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                Live Support Available
              </span>
            ) : (
              <span className="text-sm text-yellow-400 flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                Leave a Message
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <div className="flex flex-col items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-slate-600" />
                <p>No messages yet. Start a conversation!</p>
                {!isBusinessHours && (
                  <button
                    onClick={() => setShowOfflineForm(true)}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <EnvelopeIcon className="w-4 h-4" />
                    Leave a Message
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === currentUser?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="text-xs text-slate-300 mb-1">
                      {message.sender?.full_name || message.sender?.email || 'Support Team'}
                    </div>
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {getTypingText() && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 text-slate-400 px-4 py-2 rounded-lg text-sm italic">
                    {getTypingText()}
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-700">
          {showOfflineForm ? (
            <div className="space-y-3">
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  💡 We're currently offline. Leave a message and we'll get back to you within 24 hours.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={offlineMessage}
                  onChange={(e) => setOfflineMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  disabled={offlineLoading}
                />
                <button
                  onClick={sendOfflineMessage}
                  disabled={!offlineMessage.trim() || offlineLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  {offlineLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
              <button
                onClick={() => setShowOfflineForm(false)}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                ← Back to chat
              </button>
            </div>
          ) : isBusinessHours ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onBlur={handleTypingStop}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
              <p className="text-xs text-slate-400 text-center">
                Live support available Monday - Friday, 9 AM - 6 PM
              </p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-300">
                  Our support team is currently offline. Leave a message and we'll respond within 24 hours.
                </p>
              </div>
              <button
                onClick={() => setShowOfflineForm(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <EnvelopeIcon className="w-4 h-4" />
                Leave a Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportHub;