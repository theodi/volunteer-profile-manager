import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state component with semantic HTML
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`w-fit mx-auto text-center py-12 bg-white rounded-lg  ${className}`}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div className="mb-4 flex justify-center" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-gray-600 text-lg font-medium">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
