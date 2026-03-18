import Link from 'next/link'
import { Button } from '@/app/components/ui/button'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-[1400px] mx-auto px-10 h-14 flex items-center">
        <div className="flex items-center gap-7 text-sm">
          <Link href="#features" className="text-muted hover:text-foreground transition-colors">Features</Link>
          <Link href="#platforms" className="text-muted hover:text-foreground transition-colors">Platforms</Link>
          <Link href="#pricing" className="text-muted hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#" className="text-muted hover:text-foreground transition-colors">Docs</Link>
        </div>

        <div className="flex items-center gap-2 ml-auto">
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
