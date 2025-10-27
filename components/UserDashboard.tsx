'use client'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Profile from './Profile'
import { ArrowLeftIcon, UsersIcon, ChartBarIcon } from './Icons'

interface UserDashboardProps {
  onGoToAnalytics: () => void
}

export default function UserDashboard({ onGoToAnalytics }: UserDashboardProps) {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UsersIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'billing', label: 'Billing', icon: UsersIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">YourSpace Analytics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'analytics') {
                        onGoToAnalytics()
                      } else {
                        setActiveTab(tab.id)
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && <Profile />}
            {activeTab === 'billing' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing</h2>
                <p className="text-gray-600">Billing management coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
