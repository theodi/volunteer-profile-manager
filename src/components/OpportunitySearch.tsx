"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Header,
  SearchInput,
  LoadingState,
  ErrorState,
  EmptyState,
  Card,
  Button,
} from "./ui";
import { SearchIcon, LocationIcon } from "./icons";
import { fetchOpportunitiesByLocation, type Opportunity } from "@/services/opportunities";
import { OpportunityModal } from "./OpportunityModal";

/**
 * Format distance in a human-readable format
 */
function formatDistance(metres: number): string {
  if (metres < 1000) {
    return `${metres}m`;
  }
  return `${(metres / 1000).toFixed(1)}km`;
}

export default function OpportunitySearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const lat = parseFloat(searchParams.get("lat") || "0");
  const lon = parseFloat(searchParams.get("lon") || "0");
  const within = parseInt(searchParams.get("within") || "1000");

  const {
    data: opportunities,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["opportunities", lat, lon, within],
    queryFn: () => fetchOpportunitiesByLocation(lat, lon, within),
    enabled: lat !== 0 && lon !== 0,
  });

  // Client-side filtering
  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];
    if (!searchQuery.trim()) return opportunities;

    const query = searchQuery.toLowerCase();
    return opportunities.filter(
      (opp) =>
        opp.activity_name.toLowerCase().includes(query) ||
        opp.activity_description.toLowerCase().includes(query) ||
        opp.organisation_name.toLowerCase().includes(query) ||
        opp.organisation_description.toLowerCase().includes(query)
    );
  }, [opportunities, searchQuery]);

  const handleViewDetails = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Search Opportunities"
        backLink={{
          href: "/",
          label: "Back to Profile",
        }}
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search bar */}
        <section aria-label="Search opportunities" className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search opportunities by name, description, or organisation..."
            aria-label="Search opportunities"
          />
          {lat !== 0 && lon !== 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Searching within {formatDistance(within)} of location (
              {lat.toFixed(4)}, {lon.toFixed(4)})
            </p>
          )}
        </section>

        {/* Loading state */}
        {isLoading && <LoadingState message="Loading opportunities..." />}

        {/* Error state */}
        {error && (
          <ErrorState
            title="Error loading opportunities"
            message={
              error instanceof Error
                ? error.message
                : "An unknown error occurred"
            }
            action={{
              label: "Try again",
              onClick: () => router.refresh(),
            }}
          />
        )}

        {/* No location provided */}
        {!isLoading && !error && lat === 0 && lon === 0 && (
          <ErrorState
            variant="warning"
            title="No location provided"
            message="Please search from the location editor to find opportunities."
            action={{
              label: "Go to Profile Editor",
              onClick: () => router.push("/"),
            }}
          />
        )}

        {/* Results */}
        {!isLoading && !error && lat !== 0 && lon !== 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredOpportunities.length} opportunit
                {filteredOpportunities.length !== 1 ? "ies" : "y"} found
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>

            {filteredOpportunities.length === 0 ? (
              <EmptyState
                icon={<SearchIcon className="w-12 h-12 mx-auto text-gray-400" />}
                title="No opportunities found"
                description="Try adjusting your search query or location"
              />
            ) : (
              <ul className="grid gap-4" role="list">
                {filteredOpportunities.map((opportunity) => (
                  <li key={opportunity.activity_id}>
                    <OpportunityCard
                      opportunity={opportunity}
                      formatDistance={formatDistance}
                      onViewDetails={handleViewDetails}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {/* Opportunity Details Modal */}
      <OpportunityModal
        opportunity={selectedOpportunity}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOpportunity(null);
        }}
      />
    </div>
  );
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  formatDistance: (metres: number) => string;
}

function OpportunityCard({
  opportunity,
  formatDistance,
  onViewDetails,
}: OpportunityCardProps & { onViewDetails: (opportunity: Opportunity) => void }) {
  return (
    <Card hover className="p-6">
      <article>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {opportunity.activity_name}
            </h3>
            <p className="text-sm font-medium text-purple-600 mb-3">
              {opportunity.organisation_name}
            </p>
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
              {opportunity.activity_description}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <LocationIcon className="w-4 h-4" />
                {formatDistance(
                  opportunity.activity_distance_from_search_location_in_metres
                )}{" "}
                away
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              onClick={() => onViewDetails(opportunity)}
              variant="primary"
              size="sm"
            >
              View Details
            </Button>
          </div>
        </div>
      </article>
    </Card>
  );
}
