import React from "react";
import Link from "next/link";

export interface HeaderProps {
  title: string;
  backLink?: {
    href: string;
    label?: string;
  };
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Reusable header component with semantic HTML and navigation
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  backLink,
  rightAction,
  className = "",
}) => {
  return (
    <header
      className={`bg-white border-b border-gray-200 sticky top-0 z-10 ${className}`}
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backLink && (
            <Link
              href={backLink.href}
              className="text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
              aria-label={backLink.label || "Go back"}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="sr-only">{backLink.label || "Go back"}</span>
            </Link>
          )}
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
};
