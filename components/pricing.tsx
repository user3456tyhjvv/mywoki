'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import PayPalCheckout from './PayPalCheckout'
import { pricingPlans, PricingPlan } from '../lib/pricingData'

export default function PricingPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check URL parameters for message
    const urlParams = new URLSearchParams(window.location.search)
    const msg = urlParams.get('message')
    if (msg) {
      setMessage(msg)
    }
  }, [])

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan)
  }

  const navigateToSignup = (plan?: string) => {
    if (plan) {
      onNavigate(`signup?plan=${plan}`)
    } else {
      onNavigate('signup')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required.
            Upgrade anytime during your trial or continue with our free plan.
          </p>

          {message === 'signup_success' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-green-800 font-medium">
                🎉 Account created successfully! Start your free trial below.
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {Object.entries(pricingPlans).map(([key, plan]) => (
            <div
              key={key}
              className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-lg cursor-pointer ${
                plan.popular
                  ? 'border-blue-500 scale-105 shadow-lg'
                  : 'border-gray-200'
              } ${
                selectedPlan === key ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handlePlanSelect(key)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>

                <p className="text-gray-600 mb-6">{plan.pageviews}</p>

                {plan.trial && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                    <p className="text-green-800 text-sm font-medium text-center">
                      🚀 14-day free trial
                    </p>
                  </div>
                )}

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {user ? (
                  // User is logged in - show PayPal checkout
                  selectedPlan === key && key !== 'free' && (
                    <PayPalCheckout plan={key} />
                  )
                ) : (
                  // User not logged in - show sign up CTA
                  <button
                    onClick={() => navigateToSignup(key)}
                    className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Free Plan Info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Start with Our Free Plan
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Our free plan is perfect for personal projects, testing, and small websites.
            Get basic analytics without any time limits.
          </p>
          <button
            onClick={() => navigateToSignup()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </div>
  )
}
