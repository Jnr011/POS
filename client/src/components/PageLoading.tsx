import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface PageLoadingProps {
  className?: string
  sidebar?: boolean
}

export function PageLoading({ className, sidebar = true }: PageLoadingProps) {
  if (!sidebar) {
    return (
      <div className={cn("flex items-center justify-center min-h-[60vh]", className)}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background", className)}>
      <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 border-r bg-sidebar p-4 gap-4">
        <div className="flex items-center gap-2 px-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b flex items-center px-6 gap-4">
          <Skeleton className="size-5 rounded lg:hidden" />
          <Skeleton className="h-5 w-40" />
          <div className="flex-1" />
          <Skeleton className="size-9 rounded-full" />
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-4 max-w-5xl">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
            <Skeleton className="h-72 rounded-xl mt-4" />
          </div>
        </div>
      </main>
    </div>
  )
}
