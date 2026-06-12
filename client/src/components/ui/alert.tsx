import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default:
          "bg-background text-foreground border border-border",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20",
        warning:
          "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("size-5 shrink-0", className)}
    {...props}
  />
))
AlertIcon.displayName = "AlertIcon"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// ─── Accordion Alert ──────────────────────────────────────────────────────────

interface AccordionAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: React.ReactNode
  summary: React.ReactNode
  expandedContent: React.ReactNode
}

function AccordionAlert({
  className,
  variant,
  icon,
  summary,
  expandedContent,
  ...props
}: AccordionAlertProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn(alertVariants({ variant }), "overflow-hidden", className)} {...props}>
      <div className="flex items-center gap-3">
        {icon && <div className="size-5 shrink-0 mt-0.5">{icon}</div>}
        <div className="flex-1 min-w-0">{summary}</div>
        <button
          onClick={() => setOpen(o => !o)}
          className="size-7 shrink-0 rounded-md flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label={open ? "Collapse" : "Expand"}
        >
          <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
        </button>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-current/10">
          {expandedContent}
        </div>
      )}
    </div>
  )
}

export { Alert, AlertIcon, AlertTitle, AlertDescription, AccordionAlert }
export type { AccordionAlertProps }
