import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-background-section border-t border-border">
      <div className="max-w-6xl mx-auto px-8 py-8 flex items-center justify-between text-sm text-muted">
        <span className="font-semibold text-foreground">Robin</span>
        <div className="flex gap-6">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
        </div>
        <span>© {new Date().getFullYear()} Robin</span>
      </div>
    </footer>
  )
}
