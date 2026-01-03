"use client";

import { useState, useCallback, useMemo } from "react";
import { CAUSES } from "../ProfileEditor";

interface CausesEditorProps {
  causes: string[];
  onChange: (causes: string[]) => void;
}

// Group causes by category
const CAUSE_CATEGORIES = {
  Health: ["MentalHealth", "PhysicalHealth", "DisabilitySupport", "ElderCare"],
  Education: ["Education", "YouthDevelopment", "Mentoring", "Literacy"],
  Environment: [
    "EnvironmentalConservation",
    "ClimateAction",
    "WildlifeProtection",
    "SustainableLiving",
  ],
  Community: [
    "Homelessness",
    "FoodSecurity",
    "CommunityDevelopment",
    "SocialInclusion",
    "RefugeeSupport",
  ],
  "Arts & Recreation": ["ArtsAndCulture", "HeritagePreservation", "Sports"],
  Emergency: ["DisasterRelief", "EmergencyResponse"],
  "Animal Welfare": ["AnimalWelfare", "AnimalRescue"],
  International: ["InternationalDevelopment", "HumanRights"],
};

export default function CausesEditor({ causes, onChange }: CausesEditorProps) {
  const [search, setSearch] = useState("");

  const toggleCause = useCallback(
    (causeId: string) => {
      if (causes.includes(causeId)) {
        onChange(causes.filter((c) => c !== causeId));
      } else {
        onChange([...causes, causeId]);
      }
    },
    [causes, onChange]
  );

  const toggleCategory = useCallback(
    (categoryIds: string[]) => {
      const allSelected = categoryIds.every((id) => causes.includes(id));
      if (allSelected) {
        // Remove all from category
        onChange(causes.filter((c) => !categoryIds.includes(c)));
      } else {
        // Add all from category
        const newCauses = [...causes];
        categoryIds.forEach((id) => {
          if (!newCauses.includes(id)) {
            newCauses.push(id);
          }
        });
        onChange(newCauses);
      }
    },
    [causes, onChange]
  );

  const filteredCausesByCategory = useMemo(() => {
    const searchLower = search.toLowerCase();
    const result: Record<string, typeof CAUSES> = {};

    Object.entries(CAUSE_CATEGORIES).forEach(([category, causeIds]) => {
      const categoryCauses = causeIds
        .map((id) => CAUSES.find((c) => c.id === id))
        .filter(
          (cause): cause is (typeof CAUSES)[0] =>
            cause !== undefined &&
            (search === "" || cause.label.toLowerCase().includes(searchLower))
        );

      if (categoryCauses.length > 0) {
        result[category] = categoryCauses;
      }
    });

    return result;
  }, [search]);

  const categoryIcons: Record<string, string> = {
    Health: "🏥",
    Education: "📚",
    Environment: "🌍",
    Community: "🏘️",
    "Arts & Recreation": "🎨",
    Emergency: "🚨",
    "Animal Welfare": "🐾",
    International: "🌐",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Charitable Causes</h2>
        <p className="text-sm text-gray-600 mt-1">
          Select the causes you&apos;re passionate about supporting.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search causes..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Causes by category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(filteredCausesByCategory).map(
          ([category, categoryCauses]) => {
            const categoryIds = CAUSE_CATEGORIES[category as keyof typeof CAUSE_CATEGORIES];
            const selectedCount = categoryIds.filter((id) =>
              causes.includes(id)
            ).length;
            const allSelected = selectedCount === categoryIds.length;

            return (
              <div
                key={category}
                className="p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span>{categoryIcons[category] || "📌"}</span>
                    {category}
                  </h3>
                  <button
                    onClick={() => toggleCategory(categoryIds)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      allSelected
                        ? "bg-purple-100 text-purple-700"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="space-y-2">
                  {categoryCauses.map((cause) => {
                    const selected = causes.includes(cause.id);
                    return (
                      <label
                        key={cause.id}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selected
                              ? "bg-purple-600 border-purple-600"
                              : "border-gray-300 group-hover:border-purple-400"
                          }`}
                        >
                          {selected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCause(cause.id)}
                          className="sr-only"
                        />
                        <span
                          className={`text-sm ${
                            selected ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {cause.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Selected causes summary */}
      {causes.length > 0 && (
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-800">
              {causes.length} cause{causes.length !== 1 ? "s" : ""} selected
            </p>
            <button
              onClick={() => onChange([])}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {causes.map((causeId) => {
              const cause = CAUSES.find((c) => c.id === causeId);
              return (
                <span
                  key={causeId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700"
                >
                  {cause?.label || causeId}
                  <button
                    onClick={() => toggleCause(causeId)}
                    className="ml-2 hover:text-purple-900"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {causes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No causes selected yet</p>
          <p className="text-sm mt-1">
            Select the causes that matter most to you
          </p>
        </div>
      )}
    </div>
  );
}
