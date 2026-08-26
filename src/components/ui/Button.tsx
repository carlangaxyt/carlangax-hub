import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-background hover:bg-accent-hover",
  secondary: "bg-surface border border-border hover:bg-surface-hover",
  ghost: "hover:bg-surface-hover",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
