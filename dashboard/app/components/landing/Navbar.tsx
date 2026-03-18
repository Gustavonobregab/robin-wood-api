import Link from 'next/link'
import { Button } from '@/app/components/ui/button'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Robin
        </Link>
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">Docs</Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button size="sm" className="rounded-full bg-accent-strong text-foreground hover:bg-accent-light" asChild>
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
