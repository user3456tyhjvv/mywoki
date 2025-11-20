import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MainContent from './MainContent';
import ChatWidget from './ChatWidget';
import { useTheme } from '../contexts/ThemeContext';

const NewDashboard: React.FC = () => {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className={`h-screen flex font-sans ${
          isDark
            ? 'bg-slate-950 text-slate-100'
            : 'bg-gray-50 text-gray-900'
        }`}>
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setIsSidebarOpen={setIsSidebarOpen} />
                <main className={`flex-1 overflow-x-hidden overflow-y-auto ${
                  isDark
                    ? 'bg-slate-950'
                    : 'bg-gray-50'
                }`}>
                   <div className="container mx-auto px-4 sm:px-6 py-8">
                       <div className="mt-8">
                         <MainContent />
                       </div>
                   </div>
                </main>
            </div>
            <ChatWidget />
        </div>
    );
};

export default NewDashboard;
