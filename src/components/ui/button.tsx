import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // 主按钮：蓝底白字（对应旧版 primary）
        default:
          "border border-cyan-300/40 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 dark:from-cyan-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500",
        // 危险按钮：红底白字（对应旧版 danger）
        destructive:
          "border border-red-300/40 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 hover:from-rose-400 hover:to-red-500",
        // 轮廓按钮
        outline:
          "liquid-control text-muted-foreground hover:text-foreground hover:border-cyan-400/45 hover:shadow-cyan-500/15",
        // 次按钮：灰色（对应旧版 secondary）
        secondary:
          "liquid-control text-muted-foreground hover:text-foreground hover:bg-white/55 dark:hover:bg-white/10",
        // 幽灵按钮（对应旧版 ghost）
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-white/45 hover:shadow-sm dark:hover:bg-white/10",
        // MCP 专属按钮：祖母绿
        mcp: "border border-emerald-300/40 bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-300 hover:to-teal-500",
        // 链接按钮
        link: "text-cyan-600 underline-offset-4 hover:underline dark:text-cyan-300",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9 p-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
