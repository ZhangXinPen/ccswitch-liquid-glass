import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-md",
  {
    variants: {
      variant: {
        default:
          "border-cyan-300/40 bg-cyan-500/18 text-cyan-700 hover:bg-cyan-500/25 dark:text-cyan-200",
        secondary:
          "border-white/40 bg-white/35 text-secondary-foreground hover:bg-white/50 dark:border-white/10 dark:bg-white/10",
        destructive:
          "border-rose-300/40 bg-rose-500/18 text-rose-700 hover:bg-rose-500/25 dark:text-rose-200",
        outline: "border-white/45 bg-white/20 text-foreground dark:border-white/10 dark:bg-white/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
