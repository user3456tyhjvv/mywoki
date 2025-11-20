import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, Paperclip, Smile, MoreVertical, Search } from 'lucide-react';

interface TeamChatProps {
  teamId: string;
}

interface ChatMessage {
  id: string;
  text: string;
  user_id: string;
  team_id: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar?: string;
  };
}

const TeamChat: React.FC<TeamChatProps> = ({ teamId }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    subscribeToPresence();
  }, [teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('team_chat_messages')
        .select(`
          *,
          user:profiles(full_name, email, avatar)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat_messages',
          filter: `team_id=eq.${teamId}`
        },
        async (payload) => {
          // Fetch the complete message with user data
          const { data: completeMessage, error } = await supabase
            .from('team_chat_messages')
            .select(`
              *,
              user:profiles(full_name, email, avatar)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && completeMessage) {
            setMessages(prev => [...prev, completeMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const subscribeToPresence = () => {
    const presence = supabase.channel(`online-users-${teamId}`, {
      config: {
        presence: {
          key: user?.id
        }
      }
    });

    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState();
        const userIds = Object.keys(state);
        setOnlineUsers(userIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presence.track({
            user_id: user?.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      presence.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('team_chat_messages')
        .insert({
          team_id: teamId,
          user_id: user.id,
          text: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
      
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.includes(userId);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 rounded-xl ${
        isDark ? 'bg-slate-800' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-[600px] rounded-xl border ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      {/* Chat Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDark ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              Team Chat
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {onlineUsers.length} members online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={`p-2 rounded-lg ${
            isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
          }`}>
            <Search className="w-4 h-4" />
          </button>
          <button className={`p-2 rounded-lg ${
            isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
          }`}>
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        isDark ? 'bg-slate-900' : 'bg-gray-50'
      }`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700'
              }`}>
                {(message.user?.full_name || message.user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              {isUserOnline(message.user_id) && (
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
              )}
            </div>

            {/* Message Content */}
            <div className={`max-w-[70%] ${message.user_id === user?.id ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  {message.user_id === user?.id ? 'You' : message.user?.full_name || message.user?.email}
                </span>
                <span className={`text-xs ${
                  isDark ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  {formatTime(message.created_at)}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-2xl ${
                message.user_id === user?.id
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                {message.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={`p-4 border-t ${
        isDark ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className="flex items-end gap-3">
          <div className="flex gap-1">
            <button className={`p-2 rounded-lg ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
            }`}>
              <Paperclip className="w-4 h-4" />
            </button>
            <button className={`p-2 rounded-lg ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
            }`}>
              <Smile className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... (Press Enter to send)"
              className={`w-full px-4 py-3 pr-12 rounded-xl border resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDark
                  ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-xl transition-colors ${
              newMessage.trim() && !sending
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : isDark
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;