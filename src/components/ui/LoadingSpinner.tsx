import React from "react";

export interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
}

/**
 * Accessible loading spinner component
 * Uses the exact spinner structure: animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600
 * 
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
  "aria-label": ariaLabel = "Loading",
}) => {
  const sizeStyles = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <>
      <div
        className={`animate-spin rounded-full border-b-2 border-purple-600 ${sizeStyles[size]} ${className}`}
        aria-hidden="true"
      />
      <span className="sr-only">{ariaLabel}</span>
    </>
  );
};
