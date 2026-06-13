import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { ShieldBan, ArrowLeft, Home } from 'lucide-react'

export default function Forbidden() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const dashboardPath = user?.role === 'admin' ? '/dashboard' : '/pos'

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto size-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldBan className="size-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-serif tracking-tight text-foreground">403</h1>
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You do not have the required permissions to view this page.
            {user && (
              <span className="block mt-1">
                Your current role is <span className="font-medium text-foreground capitalize">{user.role}</span>.
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
          <Button onClick={() => navigate(dashboardPath)} className="gap-2">
            <Home className="size-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
