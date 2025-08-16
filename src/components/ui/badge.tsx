"use client";

import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline";
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors";
  const styles: Record<string, string> = {
    default: "bg-primary text-white border-transparent",
    secondary: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    outline: "bg-transparent text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700",
  };
  return <span className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
