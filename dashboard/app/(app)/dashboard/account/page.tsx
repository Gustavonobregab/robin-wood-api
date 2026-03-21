// dashboard/app/(app)/dashboard/account/page.tsx
'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { useSession, signOut } from '@/app/lib/auth-client'

export default function AccountPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user

  return (
    <div className="h-full overflow-y-auto p-6">
    <div className="space-y-8 max-w-xl mx-auto">
      {/* Profile */}
      <div className="bg-background rounded-xl border border-border shadow-sm p-6">
        <h2 className="font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={user?.name ?? ''} disabled className="bg-background-section" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="bg-background-section" />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-full"
          onClick={async () => {
            try {
              await signOut()
            } catch {}
            router.push('/sign-in')
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
    </div>
  )
}
