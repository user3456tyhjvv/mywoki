import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from './Dashboard';
import Team from './newdashboard/components/Team';

interface ContentAreaProps {
  section: string;
  searchQuery: string;
}

const ContentArea: React.FC<ContentAreaProps> = ({ section, searchQuery }) => {
  const { resolvedTheme } = useTheme();
  const { selectedTeam } = useNavigation();
  const isDark = resolvedTheme === 'dark';

  const stripedBg = "bg-[repeating-linear-gradient(45deg,var(--tw-gradient-from),var(--tw-gradient-from)_1rem,var(--tw-gradient-to)_1rem,var(--tw-gradient-to)_2rem)]";

  // Placeholder content components
  const PlaceholderContent: React.FC<{ title: string }> = ({ title }) => (
    <div className={`rounded-lg p-6 shadow-sm ${
      isDark 
        ? 'bg-slate-800 border border-slate-700' 
        : 'bg-white border border-gray-200'
    }`}>
      <div className={`min-h-96 rounded-lg border-2 border-dashed flex items-center justify-center ${stripedBg} ${
        isDark 
          ? 'border-slate-600 from-slate-700/50 to-transparent' 
          : 'border-gray-300 from-gray-100/50 to-transparent'
      }`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>{title}</h2>
          <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
            {searchQuery ? `Search results for: "${searchQuery}"` : 'Content area'}
          </p>
        </div>
      </div>
    </div>
  );

  switch (section) {
    case 'dashboard':
      return <Dashboard domain="example.com" onReset={() => {}} onGoToAdmin={() => {}} onAddHelpRequest={() => {}} onNavigate={() => {}} />;
    
    case 'team':
      return <Team teamId={selectedTeam} />;
    
    case 'socials':
      return <PlaceholderContent title="Socials" />;
    
    case 'webs':
      return <PlaceholderContent title="Webs" />;
    
    case 'documents':
      return <PlaceholderContent title="Documents" />;
    
    case 'reports':
      return <PlaceholderContent title="Reports" />;
    
    case 'settings':
      return <PlaceholderContent title="Settings" />;
    
    default:
      return <PlaceholderContent title="Dashboard" />;
  }
};

const MainContent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { activeSection, searchQuery } = useNavigation();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`flex-1 overflow-auto ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      <div className="p-4 sm:p-6">
        <ContentArea section={activeSection} searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default MainContent;
