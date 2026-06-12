import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[oklch(0.55_0.16_220/0.1)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
