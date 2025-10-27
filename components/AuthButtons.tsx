'use client'
import React from 'react'

export default function AuthButtons({ user, onNavigate }: { user: any, onNavigate: (route: string) => void }) {
  return (
    <div className="flex items-center space-x-4">
      {user ? (
        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Dashboard
        </button>
      ) : (
        <>
          <button
            onClick={() => onNavigate('signin')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('signup')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Start Free Trial
          </button>
        </>
      )}
    </div>
  )
}
