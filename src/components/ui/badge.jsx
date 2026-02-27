import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800",
        primary: "bg-primary-light text-primary",
        success: "bg-success-light text-success",
        danger: "bg-danger-light text-danger",
        warning: "bg-warning-light text-warning",
        outline: "border border-border text-text-secondary bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className = "", variant, children }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
