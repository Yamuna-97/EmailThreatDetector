import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#E50914] text-white hover:bg-[#FF1E2D]",
        secondary:
          "border-transparent bg-[#181818] text-[#F5F5F5] hover:bg-[#222222] border border-[#2A2A2A]",
        destructive:
          "border-[#FF1E2D]/40 bg-[#FF1E2D]/15 text-[#FF1E2D] hover:bg-[#FF1E2D]/25",
        outline: "text-[#F5F5F5] border-[#2A2A2A] bg-transparent",
        success: "border-emerald-800/50 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
