import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: ReactNode;
}

/**
 * Reusable button component with consistent styling.
 * Supports primary and secondary variants with proper disabled states.
 */
export const Button = ({
  variant = "secondary",
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles = "px-6 py-2 rounded-lg text-center transition-all font-semibold";

  const variantStyles = disabled
    ? "bg-gray-500 text-gray-300 cursor-not-allowed opacity-50"
    : variant === "primary"
    ? "bg-primary text-primary-foreground hover:bg-[#FF7A10] focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-md hover:shadow-lg hover:cursor-pointer"
    : "bg-muted text-foreground border border-border hover:bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-secondary/50 hover:cursor-pointer";

  return (
    <button
      disabled={disabled}
      aria-disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
