// dashboard/app/components/landing/Hero.tsx
import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'

export function Hero() {
  return (
    <section className="bg-background py-24">
      <div className="max-w-6xl mx-auto px-8 text-center">
        <Badge className="mb-6 bg-accent-light text-foreground border-0 rounded-full px-4 py-1">
          Text · Audio · Image
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
          Compress everything.<br />Ship faster.
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
          Robin gives you a simple API to compress text, audio, and images. Reduce size, reduce cost, keep quality.
        </p>
        <Button
          size="lg"
          className="rounded-full bg-accent-strong text-foreground hover:bg-accent-light px-8"
          asChild
        >
          <Link href="/sign-up">Start for free</Link>
        </Button>
      </div>
    </section>
  )
}
