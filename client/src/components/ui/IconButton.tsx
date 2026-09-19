import { ButtonHTMLAttributes, forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: Variant;
  size?: Size;
  /** Required for accessibility since there is no visible label. */
  label: string;
}

const base =
  "inline-grid place-items-center rounded-full transition-all duration-150 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 " +
  "active:scale-90 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-sm shadow-accent/25",
  secondary:
    "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-accent/40",
  ghost: "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

const sizes: Record<Size, string> = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

const iconSizes: Record<Size, number> = { sm: 16, md: 19, lg: 22 };

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon: Icon, variant = "secondary", size = "md", label, className = "", ...rest },
    ref
  ) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      <Icon size={iconSizes[size]} strokeWidth={2.2} />
    </button>
  )
);
IconButton.displayName = "IconButton";
