"use client";

import Link from "next/link";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-violet-500 text-white hover:bg-violet-400 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_12px_40px_rgba(124,58,237,0.35)]",
  secondary:
    "bg-white/5 text-white hover:bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.10)_inset]",
  ghost: "text-white/80 hover:text-white hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>(function Button({ className = "", variant = "primary", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});

export function ButtonLink({
  href,
  children,
  className = "",
  variant = "primary",
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}

