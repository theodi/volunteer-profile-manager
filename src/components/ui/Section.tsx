import React from "react";

export interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable section component with consistent heading styling
 */
export const Section: React.FC<SectionProps> = ({
  title,
  children,
  className = "",
}) => {
  return (
    <div className={className}>
      <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {children}
      </div>
    </div>
  );
};
