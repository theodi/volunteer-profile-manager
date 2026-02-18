import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated";
  hover?: boolean;
  children: React.ReactNode;
}

/**
 * Reusable card component with semantic HTML
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = "default", hover = false, className = "", children, ...props },
    ref
  ) => {
    const baseStyles = "rounded-lg";
    const variantStyles = {
      default: "bg-white border border-gray-200",
      outlined: "bg-white border-2 border-gray-300",
      elevated: "bg-white shadow-md",
    };
    const hoverStyles = hover
      ? "transition-shadow hover:shadow-md"
      : "";

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
