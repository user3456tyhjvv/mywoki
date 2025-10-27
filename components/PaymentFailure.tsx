'use client'
import React from 'react'
import { XCircleIcon, ArrowLeftIcon, RefreshIcon } from './Icons'
import { useNavigate } from 'react-router-dom'

export default function PaymentFailure() {
  const navigate = useNavigate()

  const handleRetry = () => {
    navigate('/subscribe')
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Failure Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <XCircleIcon className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Failed
          </h1>
          <p className="text-xl text-gray-600">
            We couldn't process your payment. Don't worry, no charges were made.
          </p>
        </div>

        {/* Error Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What happened?
          </h2>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-red-900 font-medium mb-2">Possible reasons:</h3>
              <ul className="space-y-2 text-red-800">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  Insufficient funds in your PayPal account
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  Payment method was declined
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  Temporary PayPal service issue
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  Network connection problem during payment
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-blue-900 font-medium mb-2">What you can do:</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  Check your PayPal account balance and payment method
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  Try a different payment method in PayPal
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  Contact PayPal support if the issue persists
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  Try the payment again with a stable internet connection
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            <RefreshIcon className="w-5 h-5" />
            Try Again
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Go Home
          </button>
        </div>

        {/* Support Info */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm mb-2">
            Still having issues? Our support team is here to help.
          </p>
          <p className="text-sm">
            Contact us at{' '}
            <a href="mailto:support@yourspaceanalytics.info" className="text-blue-600 hover:underline">
              support@yourspaceanalytics.info
            </a>
            {' '}or{' '}
            <a href="tel:+1234567890" className="text-blue-600 hover:underline">
              +1 (234) 567-8900
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
