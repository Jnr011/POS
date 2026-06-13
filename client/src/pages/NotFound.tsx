import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { FileQuestion, Home, ShoppingCart } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const dashboardPath = user?.role === 'admin' ? '/dashboard' : '/pos'

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto size-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileQuestion className="size-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-serif tracking-tight text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you are looking for does not exist or has been moved.
            Check the URL or navigate back to a known page.
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate(dashboardPath)} className="gap-2">
            <Home className="size-4" />
            Dashboard
          </Button>
          {user && (
            <Button onClick={() => navigate('/pos')} className="gap-2">
              <ShoppingCart className="size-4" />
              Go to POS
            </Button>
          )}
        </div>

        <div className="pt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Go back to previous page
          </button>
        </div>
      </div>
    </div>
  )
}
