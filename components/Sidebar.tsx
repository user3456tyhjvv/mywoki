import React, { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  LogoIcon,
  SettingsIcon,
  TeamsIcon,
  WebIcon,
  XIcon,
} from './Icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Team {
  id: string;
  name: string;
  initial: string;
  icon: React.ComponentType<{ className: string }>;
}

interface NavItem {
  id: string;
  name: string;
  section: 'dashboard' | 'team' | 'socials' | 'webs' | 'documents' | 'reports' | 'settings';
  icon: React.ComponentType<{ className: string }>;
}

const mainNavigation: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', section: 'dashboard', icon: HomeIcon },
  { id: 'team', name: 'Team', section: 'team', icon: TeamsIcon },
  { id: 'socials', name: 'Socials', section: 'socials', icon: FolderIcon },
  { id: 'webs', name: 'Webs', section: 'webs', icon: WebIcon },
];

const secondaryNavigation: NavItem[] = [
  { id: 'documents', name: 'Documents', section: 'documents', icon: DocumentDuplicateIcon },
  { id: 'reports', name: 'Reports', section: 'reports', icon: ChartBarIcon },
];

const NavigationContent: React.FC<{ onItemClick?: () => void }> = ({ onItemClick }) => {
  const { resolvedTheme } = useTheme();
  const { activeSection, setActiveSection, selectedTeam, setSelectedTeam } = useNavigation();
  const { user } = useAuth();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const navigate = useNavigate();
  const isDark = resolvedTheme === 'dark';

  // Fetch user's teams
  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return;
      setLoadingTeams(true);
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('team_id, teams(id, name)')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching teams:', error);
          return;
        }

        const teams: Team[] = (data || []).map((item: any, index: number) => ({
          id: item.teams.id,
          name: item.teams.name,
          initial: item.teams.name.charAt(0).toUpperCase(),
          icon: TeamsIcon,
        }));

        setUserTeams(teams);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [user]);

  const handleNavClick = (section: NavItem['section']) => {
    setActiveSection(section);
    onItemClick?.();
  };

  const handleTeamClick = (teamId: string) => {
    setSelectedTeam(teamId);
    setActiveSection('team');
    onItemClick?.();
  };

  const handleSettingsClick = () => {
    setActiveSection('settings');
    navigate('/settings');
    onItemClick?.();
  };

  return (
    <div className={`flex flex-col h-0 flex-1 border-r ${
      isDark 
        ? 'bg-slate-900 border-slate-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className={`flex-1 flex flex-col pt-5 pb-4 overflow-y-auto ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        {/* Logo */}
        <div className={`w-8 h-8 sm:w-11 sm:h-11 ml-4 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
          <img src="/mywoki-logo.png" alt="mywoki logo" className="w-6 h-6 sm:w-9 sm:h-9 rounded-full ml-4" />
        </div>
        
        {/* Main Navigation */}
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {mainNavigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.section)}
              className={`
                w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                ${activeSection === item.section
                  ? isDark 
                    ? 'bg-blue-900 text-blue-100' 
                    : 'bg-blue-50 text-blue-700'
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <item.icon className={`mr-3 flex-shrink-0 h-6 w-6 ${
                activeSection === item.section
                  ? 'text-blue-400' 
                  : isDark
                    ? 'text-slate-500 group-hover:text-slate-400'
                    : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {item.name}
            </button>
          ))}
        </nav>
        
        {/* Secondary Navigation */}
        <div className={`mt-6 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="px-2 space-y-1">
            {secondaryNavigation.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.section)}
                className={`
                  w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === item.section
                    ? isDark 
                      ? 'bg-blue-900 text-blue-100' 
                      : 'bg-blue-50 text-blue-700'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`mr-3 h-6 w-6 ${
                  activeSection === item.section
                    ? 'text-blue-400'
                    : isDark
                      ? 'text-slate-500 group-hover:text-slate-400'
                      : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {item.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Your Teams Section */}
        <div className="mt-auto pt-6">
          <div className="px-3 mb-3">
            <p className={`text-xs font-semibold uppercase tracking-wider ${
              isDark 
                ? 'text-slate-500' 
                : 'text-gray-500'
            }`}>Your teams</p>
          </div>
          <div className="px-2 space-y-1">
            {loadingTeams ? (
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Loading...</p>
            ) : userTeams.length > 0 ? (
              userTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamClick(team.id)}
                  className={`
                    w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${selectedTeam === team.id
                      ? isDark 
                        ? 'bg-blue-900 text-blue-100' 
                        : 'bg-blue-50 text-blue-700'
                      : isDark
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                    selectedTeam === team.id
                      ? isDark
                        ? 'bg-blue-700'
                        : 'bg-blue-200'
                      : isDark
                        ? 'bg-slate-700'
                        : 'bg-gray-200'
                  }`}>
                    {team.initial}
                  </span>
                  <span className="truncate">{team.name}</span>
                </button>
              ))
            ) : (
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No teams yet</p>
            )}
          </div>

          {/* Settings */}
          <div className="mt-8 px-2">
            <button
              onClick={handleSettingsClick}
              className={`
                w-full text-left group flex items-center space-x-3 px-2 py-2 text-sm font-medium rounded-md transition-colors
                ${activeSection === 'settings'
                  ? isDark 
                    ? 'bg-blue-900 text-blue-100' 
                    : 'bg-blue-50 text-blue-700'
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <SettingsIcon
                className={`h-6 w-6 ${
                  activeSection === 'settings'
                    ? 'text-blue-400'
                    : isDark
                      ? 'text-slate-500 group-hover:text-slate-400'
                      : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 flex lg:hidden transition-opacity ease-linear duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`fixed inset-0 ${isDark ? 'bg-slate-900 bg-opacity-75' : 'bg-gray-600 bg-opacity-75'}`} onClick={() => setIsSidebarOpen(false)}></div>
        <div className={`relative flex-1 flex flex-col max-w-xs w-full transform ease-in-out duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className={`ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset ${
                isDark ? 'focus:ring-slate-400' : 'focus:ring-white'
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XIcon className={`h-6 w-6 ${isDark ? 'text-slate-400' : 'text-white'}`} />
            </button>
          </div>
          <NavigationContent onItemClick={() => setIsSidebarOpen(false)} />
        </div>
        <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <NavigationContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
