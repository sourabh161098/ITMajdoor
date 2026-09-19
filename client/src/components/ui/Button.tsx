import { ButtonHTMLAttributes, forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "transition-all duration-150 focus:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-accent/50 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[var(--bg)] active:scale-[0.97] " +
  "disabled:pointer-events-none disabled:opacity-40 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-sm shadow-accent/25 hover:bg-accent-hover hover:shadow-md hover:shadow-accent/30",
  secondary:
    "border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-accent/40 hover:bg-[var(--surface)]",
  ghost:
    "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
  danger:
    "bg-red-500 text-white shadow-sm shadow-red-500/25 hover:bg-red-600 hover:shadow-md hover:shadow-red-500/30",
  success:
    "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-8 text-base",
};

const iconSizes: Record<Size, number> = { sm: 16, md: 18, lg: 22 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      iconRight: IconRight,
      fullWidth,
      className = "",
      children,
      ...rest
    },
    ref
  ) => {
    const iconSize = iconSizes[size];
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${
          fullWidth ? "w-full" : ""
        } ${className}`}
        {...rest}
      >
        {Icon && <Icon size={iconSize} strokeWidth={2.2} />}
        {children}
        {IconRight && <IconRight size={iconSize} strokeWidth={2.2} />}
      </button>
    );
  }
);
Button.displayName = "Button";
