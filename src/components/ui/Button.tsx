import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
  as?: "button" | "a";
  href?: string;
  target?: string;
  rel?: string;
}

/**
 * Reusable Button component with accessibility and semantic HTML
 * 
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */
export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      children,
      as = "button",
      href,
      target,
      rel,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const variantStyles = {
      primary:
        "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
      secondary:
        "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
      outline:
        "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-purple-500",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-purple-500",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const commonProps = {
      className: `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`,
      "aria-busy": isLoading,
    };

    if (as === "a" && href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={rel}
          {...(commonProps as any)}
          {...(props as any)}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        disabled={disabled || isLoading}
        {...commonProps}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
