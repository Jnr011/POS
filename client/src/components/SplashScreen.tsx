import { useEffect, useState } from 'react'
import { Pill, Loader2 } from 'lucide-react'

interface SplashScreenProps {
  minimumDuration?: number
  onFinish?: () => void
}

export function SplashScreen({ minimumDuration = 800, onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onFinish?.()
    }, minimumDuration)
    return () => clearTimeout(timer)
  }, [minimumDuration, onFinish])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background animate-fade-in">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Pill className="size-10 text-primary" />
          </div>
          <div className="absolute -inset-1 rounded-2xl border border-primary/20 animate-pulse" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-3xl font-serif tracking-tight text-foreground">
            Pharmacy POS
          </h1>
          <p className="text-sm text-muted-foreground">
            Point of Sale System
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>

      <div className="absolute bottom-8 text-xs text-muted-foreground/50">
        Pharmacy POS v1.0.0
      </div>
    </div>
  )
}
