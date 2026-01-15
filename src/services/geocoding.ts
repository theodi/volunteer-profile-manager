/**
 * Geocoding services for location services
 * 
 * Provides functions for reverse geocoding (coordinates to addresses/postcodes)
 * and forward geocoding (addresses/postcodes to coordinates).
 */

/**
 * Reverse geocode coordinates to get a postcode/address
 * 
 * Tries UK postcodes.io API first, then falls back to Nominatim for international addresses.
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise resolving to postcode/address string, or null if not found
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    // Try UK postcode first (postcodes.io reverse geocoding)
    const response = await fetch(
      `https://api.postcodes.io/postcodes?lat=${latitude}&lon=${longitude}&limit=1`
    );
    const data = await response.json();

    if (data.status === 200 && data.result && data.result.length > 0) {
      return data.result[0].postcode;
    }

    // Fallback to Nominatim for international addresses
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "VolunteerProfileManager/1.0",
        },
      }
    );
    const nominatimData = await nominatimResponse.json();

    if (nominatimData.address) {
      // Try to get postcode or formatted address
      const postcode =
        nominatimData.address.postcode ||
        nominatimData.address.postal_code ||
        nominatimData.display_name?.split(",")[0] ||
        "";
      return postcode || null;
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

/**
 * Geocode a postcode or address to coordinates
 * 
 * Tries UK postcodes.io API first for UK postcodes, then falls back to Nominatim.
 * 
 * @param query - Postcode or address string
 * @returns Promise resolving to { latitude, longitude } or null if not found
 */
export async function geocode(
  query: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Try UK postcode first (postcodes.io)
    const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

    if (ukPostcodeRegex.test(query)) {
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.status === 200 && data.result) {
        return {
          latitude: data.result.latitude,
          longitude: data.result.longitude,
        };
      }
    }

    // Fallback to Nominatim for international addresses/postcodes
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          "User-Agent": "VolunteerProfileManager/1.0",
        },
      }
    );
    const data = await response.json();

    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
