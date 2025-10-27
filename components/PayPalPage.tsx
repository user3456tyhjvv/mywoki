'use client'
import { useState } from 'react'
import { pricingPlans, PricingPlan } from '../lib/pricingData'
import PayPalCheckout from './PayPalCheckout'

export default function PayPalPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleSubscribe = (planKey: string) => {
    setSelectedPlan(planKey)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select a plan that fits your needs and subscribe instantly.
          </p>
        </div>

        {!selectedPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {Object.entries(pricingPlans).filter(([key]) => key !== 'free').map(([key, plan]) => (
              <div
                key={key}
                className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-lg cursor-pointer ${
                  plan.popular
                    ? 'border-blue-500 scale-105 shadow-lg'
                    : 'border-gray-200'
                }`}
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

                  <button
                    onClick={() => handleSubscribe(key)}
                    className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Subscribe to {pricingPlans[selectedPlan].name}
            </h2>
            <div className="text-center mb-6">
              <span className="text-3xl font-bold text-gray-900">{pricingPlans[selectedPlan].price}</span>
              <span className="text-gray-600">/month</span>
            </div>
            <PayPalCheckout plan={selectedPlan} />
            <button
              onClick={() => setSelectedPlan(null)}
              className="mt-4 w-full text-center py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Plans
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
