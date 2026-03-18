// dashboard/app/(public)/page.tsx
import { Hero } from '@/app/components/landing/Hero'
import { Features } from '@/app/components/landing/Features'
import { HowItWorks } from '@/app/components/landing/HowItWorks'
import { Pricing } from '@/app/components/landing/Pricing'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
    </>
  )
}
