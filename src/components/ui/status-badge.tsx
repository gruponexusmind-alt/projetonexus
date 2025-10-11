import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground",
        success: "border-success/20 bg-success/10 text-success-foreground",
        warning: "border-warning/20 bg-warning/10 text-warning-foreground", 
        destructive: "border-destructive/20 bg-destructive/10 text-destructive-foreground",
        accent: "border-accent/20 bg-accent/10 text-accent-foreground",
        primary: "border-primary/20 bg-primary/10 text-primary-foreground",
      },
      complexity: {
        baixa: "border-success/20 bg-success/10 text-success",
        media: "border-warning/20 bg-warning/10 text-warning",
        alta: "border-destructive/20 bg-destructive/10 text-destructive",
      },
      progress: {
        "0": "border-muted bg-muted/50 text-muted-foreground",
        "25": "border-warning/20 bg-warning/10 text-warning",
        "50": "border-primary/20 bg-primary/10 text-primary",
        "75": "border-accent/20 bg-accent/10 text-accent",
        "100": "border-success/20 bg-success/10 text-success",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
}

function StatusBadge({ className, variant, complexity, progress, children, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant, complexity, progress }), className)} {...props}>
      {children}
    </div>
  );
}

export { StatusBadge, statusBadgeVariants };