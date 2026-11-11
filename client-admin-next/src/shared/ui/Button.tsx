import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "danger-outline" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-light",
  secondary: "border border-line-strong bg-white text-brand hover:bg-surface",
  danger: "bg-danger text-white hover:bg-red-800",
  "danger-outline":
    "border border-red-200 bg-white text-danger hover:bg-red-50",
  ghost: "text-brand hover:bg-surface",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "sm";
  loading?: boolean;
}

/** Botón del sistema de diseño (44 px de alto por defecto, 36 px en tablas) */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${size === "md" ? "min-h-11 px-[18px] text-sm" : "min-h-9 px-3.5 text-sm"} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
