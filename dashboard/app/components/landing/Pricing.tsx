// dashboard/app/components/landing/Pricing.tsx
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For getting started',
    features: ['10,000 tokens/month', '1 API key', 'Text + Audio compression'],
    cta: 'Start for free',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    description: 'For teams shipping fast',
    features: ['500,000 tokens/month', '5 API keys', 'Text + Audio + Image', 'Priority processing'],
    cta: 'Get Pro',
    href: '/sign-up',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large scale needs',
    features: ['Unlimited tokens', 'Unlimited API keys', 'Dedicated support', 'SLA'],
    cta: 'Contact us',
    href: '/sign-up',
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="bg-background-section py-24">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-muted text-center mb-16">Start free, scale as you grow.</p>
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 border ${
                plan.highlight
                  ? 'bg-accent-light border-accent-strong shadow-sm'
                  : 'bg-background border-border shadow-sm'
              }`}
            >
              <div className="mb-6">
                <h3 className="font-semibold mb-1">{plan.name}</h3>
                <div className="text-3xl font-bold mb-1">{plan.price}<span className="text-base font-normal text-muted">{plan.price !== 'Custom' ? '/mo' : ''}</span></div>
                <p className="text-sm text-muted">{plan.description}</p>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent-strong flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full rounded-full ${
                  plan.highlight
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'bg-accent-strong text-foreground hover:bg-accent-light'
                }`}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
