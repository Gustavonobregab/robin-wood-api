import Link from 'next/link'
import { Button } from '@/app/components/ui/button'
import { Logo } from '@/app/components/layout/Logo'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background">
      <div className="max-w-6xl mx-auto px-8 h-12 flex items-center">
        <div className="flex items-center gap-5 text-sm">
          <Link href="/" aria-label="Robin home" className="flex items-center">
            <Logo size={20} />
          </Link>
          <Link href="#features" className="text-muted hover:text-foreground transition-colors">Features</Link>
          <Link href="#platforms" className="text-muted hover:text-foreground transition-colors">Platforms</Link>
          <Link href="#pricing" className="text-muted hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#" className="text-muted hover:text-foreground transition-colors">Docs</Link>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button variant="outline" size="sm" className="rounded-full" asChild>
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
