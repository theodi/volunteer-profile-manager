import React from "react";

export interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Full loading state component with semantic HTML
 * Uses the exact spinner structure: animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  fullScreen = false,
  className = "",
}) => {
  const containerStyles = fullScreen
    ? "flex min-h-screen items-center justify-center bg-white"
    : "text-center py-12";

  return (
    <div className={`${containerStyles} ${className}`} role="status" aria-live="polite">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
};
