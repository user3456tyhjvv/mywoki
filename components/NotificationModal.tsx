import React, { useState, useEffect, useRef } from 'react';
import type { Notification, Message } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  XMarkIcon,
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon
} from './Icons';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  messages: Message[];
  onMarkAsRead: (id: string) => Promise<any>;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onMarkMessageAsRead: (id: string) => Promise<any>;
  onMarkAllMessagesAsRead: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch notifications when modal opens and user is logged in
  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
        if (event.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
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
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const onMarkAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const onDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" aria-hidden="true"/>;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" aria-hidden="true"/>;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" aria-hidden="true"/>;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" aria-hidden="true"/>;
    }
  };

  const getNotificationStyle = (type: string, read: boolean) => {
    const baseStyle = read ? 'border-slate-600/30 bg-slate-600/10' : 'border-blue-500/30 bg-blue-500/10';
    const hoverStyle = read ? 'hover:bg-slate-600/20 focus:bg-slate-600/20' : 'hover:bg-blue-500/20 focus:bg-blue-500/20';

    switch (type) {
      case 'warning':
        return `border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 focus:bg-yellow-500/20`;
      case 'error':
        return `border-red-500/30 bg-red-500/10 hover:bg-red-500/20 focus:bg-red-500/20`;
      case 'success':
        return `border-green-500/30 bg-green-500/10 hover:bg-green-500/20 focus:bg-green-500/20`;
      default:
        return `${baseStyle} ${hoverStyle}`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-700/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-notification-modal-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg" aria-hidden="true">
              <BellIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 id="user-notification-modal-title" className="text-xl font-bold text-white">Your Notifications</h2>
              <p className="text-slate-400 text-sm">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All caught up!'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <CheckBadgeIcon className="w-4 h-4" aria-hidden="true" />
                Mark All Read
              </button>
            )}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close notifications"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center text-slate-400 py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <BellIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" aria-hidden="true" />
              <p className="text-lg font-medium text-slate-300 mb-2">No notifications yet</p>
              <p className="text-sm">We'll notify you when there's something new!</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => onMarkAsRead(notification.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${getNotificationStyle(notification.type, notification.read)} ${
                    !notification.read ? 'ring-2 ring-blue-500/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1" aria-hidden="true">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-semibold text-sm ${
                            !notification.read ? 'text-white' : 'text-slate-300'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                              New
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                          {!notification.read && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                              }}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                              role="button"
                              aria-label={`Mark "${notification.title}" as read`}
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && onMarkAsRead(notification.id)}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNotification(notification.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            role="button"
                            aria-label={`Delete "${notification.title}" notification`}
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && onDeleteNotification(notification.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>

                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors font-medium"
                          >
                            {notification.action_text || 'View Details'}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-750/50">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-4">
              <span>Total: {notifications.length} notifications</span>
              <span>•</span>
              <span>Unread: {unreadCount}</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
