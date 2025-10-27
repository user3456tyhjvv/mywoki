export interface PricingPlan {
  name: string;
  price: string;
  monthlyPrice: number;
  pageviews: string;
  features: string[];
  cta: string;
  popular: boolean;
  trial?: boolean;
}

export const pricingPlans: Record<string, PricingPlan> = {
  free: {
    name: "Free",
    price: "$0",
    monthlyPrice: 0,
    pageviews: "1,000/month",
    features: [
      "Basic visitor analytics",
      "7-day data retention",
      "Real-time dashboard",
      "Top pages & referrers"
    ],
    cta: "Get Started",
    popular: false
  },
  starter: {
    name: "Starter",
    price: "$9",
    monthlyPrice: 9,
    pageviews: "10,000/month",
    features: [
      "Everything in Free",
      "30-day data retention",
      "Email reports",
      "Goal tracking",
      "Custom events"
    ],
    cta: "Subscribe Now",
    popular: false,
    trial: false
  },
  pro: {
    name: "Pro",
    price: "$19",
    monthlyPrice: 19,
    pageviews: "50,000/month",
    features: [
      "Everything in Starter",
      "6-month data retention",
      "Advanced filters",
      "API access",
      "White-label reports",
      "Priority support"
    ],
    cta: "Subscribe Now",
    popular: true,
    trial: false
  },
  business: {
    name: "Business",
    price: "$49",
    monthlyPrice: 49,
    pageviews: "200,000/month",
    features: [
      "Everything in Pro",
      "1-year data retention",
      "Unlimited team members",
      "Custom domains",
      "SAML/SSO",
      "Dedicated support"
    ],
    cta: "Subscribe Now",
    popular: false,
    trial: false
  }
}
