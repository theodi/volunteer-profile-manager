import React from "react";

export type ErrorStateVariant = "error" | "warning" | "info";

export interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Error state component with semantic HTML and accessibility
 * 
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  variant = "error",
  title,
  message,
  action,
  className = "",
}) => {
  const variantStyles = {
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const defaultTitle = {
    error: "Error",
    warning: "Warning",
    info: "Information",
  };

  const role = variant === "error" ? "alert" : "status";
  const ariaLive = variant === "error" ? "assertive" : "polite";

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`border rounded-lg p-4 ${variantStyles[variant]} ${className}`}
    >
      <p className="font-medium">{title || defaultTitle[variant]}</p>
      <p className="text-sm mt-1">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`mt-3 text-sm underline hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded ${
            variant === "error"
              ? "text-red-900 focus:ring-red-500"
              : variant === "warning"
              ? "text-yellow-900 focus:ring-yellow-500"
              : "text-blue-900 focus:ring-blue-500"
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
