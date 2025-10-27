'use client'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircleIcon, SparklesIcon, RefreshIcon, ArrowRightIcon } from './Icons'
import { useNavigate } from 'react-router-dom'

export default function PaymentSuccess() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [updating, setUpdating] = useState(false)
  const [profileUpdated, setProfileUpdated] = useState(false)

  useEffect(() => {
    // Refresh profile data when component mounts
    const updateProfile = async () => {
      if (user) {
        setUpdating(true)
        try {
          await refreshProfile?.()
          setProfileUpdated(true)
        } catch (error) {
          console.error('Failed to refresh profile:', error)
        } finally {
          setUpdating(false)
        }
      }
    }

    updateProfile()
  }, [user, refreshProfile])

  const handleContinue = () => {
    navigate('/dashboard')
  }

  const getPlanDetails = (plan: string) => {
    const plans = {
      starter: { name: 'Starter', price: '$9.99', features: ['Enhanced Analytics', '5 Websites', '30-day Data Retention'] },
      pro: { name: 'Pro', price: '$19.99', features: ['Advanced Analytics', 'Unlimited Websites', '6-month Data Retention'] },
      business: { name: 'Business', price: '$39.99', features: ['Enterprise Features', 'Unlimited Everything', 'Priority Support'] }
    }
    return plans[plan as keyof typeof plans] || plans.starter
  }

  const planDetails = user?.plan ? getPlanDetails(user.plan) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600">
            Welcome to your new plan. Your subscription has been activated.
          </p>
        </div>

        {/* Plan Details Card */}
        {planDetails && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {planDetails.name} Plan Activated
              </h2>
              <p className="text-gray-600">
                {planDetails.price}/month • Billed monthly
              </p>
            </div>

            {/* Profile Update Status */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {updating ? (
                    <RefreshIcon className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : profileUpdated ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className="text-gray-900 font-medium">
                    {updating ? 'Updating your profile...' : profileUpdated ? 'Profile updated successfully' : 'Profile update pending'}
                  </span>
                </div>
                {!profileUpdated && !updating && (
                  <button
                    onClick={async () => {
                      setUpdating(true)
                      try {
                        await refreshProfile?.()
                        setProfileUpdated(true)
                      } catch (error) {
                        console.error('Failed to refresh profile:', error)
                      } finally {
                        setUpdating(false)
                      }
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>

            {/* Plan Features */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {planDetails.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                What's Next?
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  Your tracking code has been generated
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  Access advanced analytics features
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  Get AI-powered insights and recommendations
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleContinue}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            Go to Dashboard
            <ArrowRightIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            View Profile
          </button>
        </div>

        {/* Support Info */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@yourspaceanalytics.info" className="text-blue-600 hover:underline">
              support@yourspaceanalytics.info
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
