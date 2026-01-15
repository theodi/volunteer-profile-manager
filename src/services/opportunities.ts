/**
 * Opportunities API service
 * 
 * Handles fetching volunteering opportunities from the volunteeringdata.io API
 */

export interface Opportunity {
  activity_id: string;
  activity_name: string;
  activity_latitude: number;
  activity_longitude: number;
  activity_description: string;
  organisation_name: string;
  organisation_description: string;
  activity_distance_from_search_location_in_metres: number;
}

interface OpportunitiesResponse {
  head: {
    vars: string[];
  };
  results: {
    bindings: Array<{
      [key: string]: {
        type: string;
        value: string;
        datatype?: string;
      };
    }>;
  };
}

/**
 * Fetch opportunities by location
 * 
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @param within - Search radius in metres (default: 1000)
 * @returns Promise resolving to array of opportunities
 * @throws Error if the API request fails
 */
export async function fetchOpportunitiesByLocation(
  lat: number,
  lon: number,
  within: number = 1000
): Promise<Opportunity[]> {
  const url = `https://api.volunteeringdata.io/activity_by_location.json?lat=${lat}&lon=${lon}&within=${within}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch opportunities: ${response.status} ${response.statusText}`);
  }

  const data: OpportunitiesResponse = await response.json();

  return data.results.bindings.map((binding) => ({
    activity_id: binding.activity_id?.value || "",
    activity_name: binding.activity_name?.value || "",
    activity_latitude: parseFloat(binding.activity_latitude?.value || "0"),
    activity_longitude: parseFloat(binding.activity_longitude?.value || "0"),
    activity_description: binding.activity_description?.value || "",
    organisation_name: binding.organisation_name?.value || "",
    organisation_description: binding.organisation_description?.value || "",
    activity_distance_from_search_location_in_metres: parseInt(
      binding.activity_distance_from_search_location_in_metres?.value || "0"
    ),
  }));
}
