'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyTrackingCode = () => {
    if (profile?.tracking_code) {
      navigator.clipboard.writeText(profile.tracking_code)
      // You could add a toast notification here
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-red-600">Error loading profile: {error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <p className="mt-1 text-sm text-gray-900">{profile?.name || 'Not set'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-sm text-gray-900">{profile?.email || 'Not set'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Plan</label>
          <p className="mt-1 text-sm text-gray-900 capitalize">{profile?.plan || 'Free'}</p>
        </div>

        {profile?.tracking_code && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Code</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800">
                {profile.tracking_code}
              </code>
              <button
                onClick={copyTrackingCode}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Add this code to your website's head section to start tracking visitors.
            </p>
          </div>
        )}

        {profile?.trial_ends_at && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Trial Ends</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(profile.trial_ends_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
