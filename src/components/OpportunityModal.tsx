"use client";

import React from "react";
import { Modal } from "./ui/Modal";
import { Section } from "./ui/Section";
import { LocationIcon } from "./icons";
import type { Opportunity } from "@/services/opportunities";

export interface OpportunityModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Format distance in a human-readable format
 */
function formatDistance(metres: number): string {
  if (metres < 1000) {
    return `${metres}m`;
  }
  return `${(metres / 1000).toFixed(1)}km`;
}

/**
 * Modal component for displaying full volunteer opportunity details
 */
export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  opportunity,
  isOpen,
  onClose,
}) => {
  if (!opportunity) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={opportunity.activity_name}
      size="xl"
    >
      <div className="space-y-6">
        {/* Organisation */}
        <Section title="Organisation">
          <p className="text-lg font-semibold text-purple-600">
            {opportunity.organisation_name}
          </p>
        </Section>

        {/* Organisation Description */}
        {opportunity.organisation_description && (
          <Section title="About the Organisation">
            {opportunity.organisation_description}
          </Section>
        )}

        {/* Activity Description */}
        <Section title="Activity Description">
          {opportunity.activity_description}
        </Section>

        {/* Location & Distance */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-start gap-6">
            <Section title="Location" className="flex-1">
              <div className="flex items-center gap-2">
                <LocationIcon className="w-5 h-5 text-gray-400" />
                <span>
                  {opportunity.activity_latitude.toFixed(4)},{" "}
                  {opportunity.activity_longitude.toFixed(4)}
                </span>
              </div>
            </Section>
            <Section title="Distance">
              <p className="font-medium">
                {formatDistance(
                  opportunity.activity_distance_from_search_location_in_metres
                )}
              </p>
            </Section>
          </div>
        </div>

      </div>
    </Modal>
  );
};
