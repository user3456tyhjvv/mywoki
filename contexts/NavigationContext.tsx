import React, { createContext, useContext, useState } from 'react';

export type ActiveSection = 'dashboard' | 'team' | 'socials' | 'webs' | 'documents' | 'reports' | 'settings';

interface NavigationContextType {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTeam: string | null;
  setSelectedTeam: (team: string | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  return (
    <NavigationContext.Provider
      value={{
        activeSection,
        setActiveSection,
        searchQuery,
        setSearchQuery,
        selectedTeam,
        setSelectedTeam,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
