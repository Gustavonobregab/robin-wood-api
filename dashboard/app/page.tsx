import { Navbar } from '@/app/components/landing/Navbar'
import { Footer } from '@/app/components/landing/Footer'
import { Hero } from '@/app/components/landing/Hero'
import { TrustedBy } from '@/app/components/landing/TrustedBy'
import { Features } from '@/app/components/landing/Features'
import { Showcase } from '@/app/components/landing/Showcase'
import { Pricing } from '@/app/components/landing/Pricing'

function SectionDivider() {
  return (
    <div className="relative h-px bg-border/60">
      <div className="absolute -left-[3px] -top-[3px] w-1.5 h-1.5 rounded-full bg-border" />
      <div className="absolute -right-[3px] -top-[3px] w-1.5 h-1.5 rounded-full bg-border" />
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="relative max-w-6xl mx-auto">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-border/60" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-border/60" />
          <Hero />
          <SectionDivider />
          <TrustedBy />
          <SectionDivider />
          <Features />
          <SectionDivider />
          {/* <HowItWorks /> */}
          {/* <SectionDivider /> */}
          <Showcase />
          <SectionDivider />
          <Pricing />
        </div>
      </main>
      <Footer />
    </div>
  )
}
