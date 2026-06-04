import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em]",
  {
    variants: {
      variant: {
        default: "bg-surface-container-high text-on-surface-variant",
        primary: "bg-primary/10 text-primary",
        success: "bg-tertiary/10 text-tertiary",
        error: "bg-error/10 text-error",
        outline: "border border-outline-variant/30 text-outline",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
