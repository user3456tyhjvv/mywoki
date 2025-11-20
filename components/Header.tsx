import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, ChevronDownIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon, UserIcon, ArrowLeftOnRectangleIcon } from './Icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import NotificationModal from './NotificationModal';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { searchQuery, setSearchQuery } = useNavigation();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatar, setUserAvatar] = useState('https://picsum.photos/id/237/32/32');
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  const isDark = resolvedTheme === 'dark';

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (!error && count) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`notifications:${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchUnreadCount();
          // Play notification sound
          audioRef.current?.play().catch(err => console.log('Audio play failed:', err));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setUserEmail(user.email || '');
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/getting-started');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleViewProfile = () => {
    navigate('/settings');
    setShowProfileMenu(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <>
      <header className={`relative z-10 flex-shrink-0 flex h-16 border-b ${
        isDark 
          ? 'bg-slate-900 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <button
          type="button"
          className={`px-4 border-r focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 lg:hidden ${
            isDark 
              ? 'border-slate-700 text-slate-400 hover:text-slate-200' 
              : 'border-gray-200 text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setIsSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex-1 px-4 sm:px-6 flex justify-between">
          {/* Search Bar */}
          <div className="flex-1 flex">
            <form className="w-full flex md:ml-0" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="search-field" className="sr-only">
                Search
              </label>
              <div className={`relative w-full ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5" />
                </div>
                <input
                  id="search-field"
                  className={`block w-full h-full pl-8 pr-3 py-2 border-transparent focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm bg-transparent ${
                    isDark 
                      ? 'text-slate-100 placeholder-slate-500 focus:placeholder-slate-400' 
                      : 'text-gray-900 placeholder-gray-500 focus:placeholder-gray-400'
                  }`}
                  placeholder="Search dashboards, teams, documents..."
                  type="search"
                  name="search"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </form>
          </div>

          {/* Right Side Icons */}
          <div className="ml-4 flex items-center md:ml-6 gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors ${
                isDark 
                  ? 'text-slate-400 hover:text-slate-200 focus:ring-offset-slate-900' 
                  : 'text-gray-600 hover:text-gray-900 focus:ring-offset-white'
              }`}
            >
              <span className="sr-only">Toggle theme</span>
              {resolvedTheme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </button>

            {/* Notifications Bell */}
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`ml-3 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors relative ${
                  isDark 
                    ? 'text-slate-400 hover:text-slate-200 focus:ring-offset-slate-900' 
                    : 'text-gray-600 hover:text-gray-900 focus:ring-offset-white'
                }`}
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" />
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-screen max-w-sm">
                  <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileMenuRef} className="ml-3 relative">
              <div>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`max-w-xs rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 ${
                    isDark 
                      ? 'bg-slate-800 focus:ring-offset-slate-900' 
                      : 'bg-gray-100 focus:ring-offset-white'
                  }`}
                  id="user-menu-button"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full"
                    src={userAvatar}
                    alt={userName}
                  />
                  <span className={`hidden md:block ml-2 text-sm font-medium ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                    {userName}
                  </span>
                  <ChevronDownIcon className={`hidden md:block ml-1 h-5 w-5 transform transition-transform ${
                    showProfileMenu ? 'rotate-180' : ''
                  } ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
                </button>
              </div>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 ${
                  isDark ? 'bg-slate-800' : 'bg-white'
                }`}>
                  <div className={`px-4 py-2 text-sm border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>{userName}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{userEmail}</p>
                  </div>
                  
                  <button
                    onClick={handleViewProfile}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      isDark 
                        ? 'text-slate-300 hover:bg-slate-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <UserIcon className="h-4 w-4" />
                    View Profile
                  </button>

                  <button
                    onClick={handleSignOut}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 border-t ${
                      isDark 
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-700' 
                        : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hidden audio element for notifications */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
    </>
  );
};

export default Header;
