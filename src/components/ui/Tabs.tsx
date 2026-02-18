import React from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Accessible tabs component with semantic HTML
 * 
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}) => {
  return (
    <div
      role="tablist"
      aria-label="Navigation tabs"
      className={`flex border-b border-gray-200 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isActive
                  ? "text-purple-600 bg-purple-50 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }
            `}
          >
            {tab.icon && <span className="mr-2" aria-hidden="true">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export interface TabPanelProps {
  id: string;
  tabId: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Tab panel component with proper ARIA attributes
 */
export const TabPanel: React.FC<TabPanelProps> = ({
  id,
  tabId,
  activeTab,
  children,
  className = "",
}) => {
  const isActive = activeTab === tabId;

  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={`tab-${tabId}`}
      hidden={!isActive}
      className={className}
    >
      {isActive && children}
    </div>
  );
};
