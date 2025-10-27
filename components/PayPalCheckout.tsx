'use client'
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { useAuth } from '../contexts/AuthContext'

// Backend URL
const backendUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://tooler-io.onrender.com'
    : 'http://localhost:3001';

export default function PayPalCheckout({ plan }) {
  const { user } = useAuth()

  // Create subscription on backend
  const createSubscription = async (data, actions) => {
    try {
      const response = await fetch(`${backendUrl}/api/paypal/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Failed to create subscription: ${errText}`)
      }

      const subscriptionData = await response.json()

      if (!subscriptionData.subscriptionId) {
        throw new Error('Backend did not return subscriptionId')
      }

      return subscriptionData.subscriptionId
    } catch (error) {
      console.error('❌ Create subscription error:', error)
      throw error
    }
  }

  // Handle successful approval
  const onApprove = async (data, actions) => {
    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Send subscription details to backend to store
      const response = await fetch(`${backendUrl}/api/paypal/save-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: data.subscriptionID,
          userId: user.id,
          plan
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Failed to save subscription: ${errText}`)
      }

      const result = await response.json()
      console.log("✅ Subscription saved:", result)

      // Redirect to success page
      window.location.href = `/payment/success?subscription=${data.subscriptionID}`
    } catch (error) {
      console.error('❌ Payment processing error:', error)
      // Redirect to failure page
      window.location.href = `/payment/failure`
    }
  }

  return (
    <PayPalScriptProvider options={{
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      currency: "USD",
      intent: "subscription",
      vault: true
    }}>
      <div className="mt-4">
        <PayPalButtons
          createSubscription={createSubscription}
          onApprove={onApprove}
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'subscribe'
          }}
        />
      </div>
    </PayPalScriptProvider>
  )
}
