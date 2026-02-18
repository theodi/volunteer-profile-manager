"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { PreferredLocation, Point } from "@/ldo/volunteer.typings";
import { reverseGeocode, geocode } from "@/services/geocoding";
import { LoadingState } from "../ui";

// Dynamically import the map component to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

interface LocationEditorProps {
  locations: PreferredLocation[];
  onChange: (locations: PreferredLocation[]) => void;
  isLoading?: boolean;
}

interface LocationAddress {
  postcode?: string;
  city?: string;
  county?: string;
  country?: string;
  displayName: string;
  isLoading: boolean;
}

export default function LocationEditor({ locations, onChange, isLoading = false }: LocationEditorProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [postcodeInput, setPostcodeInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(10); // Default 10km
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [addresses, setAddresses] = useState<Record<string, LocationAddress>>({});
  
  // Track which keys we've already started fetching to prevent duplicate requests
  const fetchingRef = useRef<Set<string>>(new Set());

  // Reverse geocode locations to get human-readable addresses
  useEffect(() => {
    const fetchAddress = async (lat: number, lng: number, key: string) => {
      // Add delay to respect Nominatim rate limits (1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              "User-Agent": "VolunteerProfileManager/1.0",
            },
          }
        );
        const data = await response.json();
        
        const address = data.address || {};
        setAddresses(prev => ({
          ...prev,
          [key]: {
            postcode: address.postcode,
            city: address.city || address.town || address.village || address.hamlet,
            county: address.county || address.state_district || address.state,
            country: address.country,
            displayName: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            isLoading: false,
          }
        }));
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        setAddresses(prev => ({
          ...prev,
          [key]: {
            displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            isLoading: false,
          }
        }));
      }
    };

    // Process locations that haven't been fetched yet
    for (const location of locations) {
      const lat = location.point?.lat;
      const lng = location.point?.long;
      if (lat === undefined || lng === undefined) continue;
      
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      
      // Skip if already fetched or currently fetching
      if (fetchingRef.current.has(key)) continue;
      
      // Mark as being fetched
      fetchingRef.current.add(key);
      
      // Set loading state
      setAddresses(prev => ({
        ...prev,
        [key]: { displayName: "Loading...", isLoading: true }
      }));
      
      // Fetch address (don't await - let them queue up with delays)
      fetchAddress(lat, lng, key);
    }
  }, [locations]);

  // Helper to get address for a location
  const getLocationAddress = useCallback((location: PreferredLocation): LocationAddress => {
    const lat = location.point?.lat;
    const lng = location.point?.long;
    if (lat === undefined || lng === undefined) {
      return { displayName: "Unknown location", isLoading: false };
    }
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    return addresses[key] || { displayName: "Loading...", isLoading: true };
  }, [addresses]);

  // Initialize map center based on existing locations or request geolocation if none
  useEffect(() => {
    // Don't initialize until loading is complete to avoid premature geolocation request
    if (isLoading) return;
    if (hasInitialized) return;
    setHasInitialized(true);

    // If there are already locations, don't request browser geolocation
    // The map will auto-fit to show all locations
    if (locations.length > 0) {
      // Calculate center from existing locations for initial map view
      const avgLat = locations.reduce((sum, loc) => sum + (loc.point?.lat || 0), 0) / locations.length;
      const avgLng = locations.reduce((sum, loc) => sum + (loc.point?.long || 0), 0) / locations.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
      return;
    }

    // No existing locations - request browser geolocation
    if (!navigator.geolocation) {
      // Default to London if geolocation not available
      setMapCenter({ lat: 51.5074, lng: -0.1278 });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter({ lat: latitude, lng: longitude });
        
        // Add initial location with 10km radius
        const newLocation: PreferredLocation = {
          point: {
            lat: latitude,
            long: longitude,
          } as Point,
          rad: 10,
        };
        onChange([newLocation]);
        setSelectedIndex(0);
        setIsGettingLocation(false);
      },
      (error) => {
        console.log("Geolocation not available or denied:", error.message);
        setIsGettingLocation(false);
        // Default to London if geolocation fails
        setMapCenter({ lat: 51.5074, lng: -0.1278 });
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    );
  }, [isLoading, hasInitialized, locations, onChange]);

  // Convert locations for map
  const mapLocations = useMemo(
    () =>
      locations.map((loc) => ({
        lat: loc.point?.lat || 0,
        lng: loc.point?.long || 0,
        radius: loc.rad || 10,
      })),
    [locations]
  );

  const handleLocationAdd = useCallback(
    (lat: number, lng: number) => {
      const newLocation: PreferredLocation = {
        point: {
          lat,
          long: lng,
        } as Point,
        rad: 10,
      };
      const newLocations = [...locations, newLocation];
      onChange(newLocations);
      setSelectedIndex(newLocations.length - 1);
    },
    [locations, onChange]
  );

  const handleLocationRemove = useCallback(
    (index: number) => {
      const newLocations = locations.filter((_, i) => i !== index);
      onChange(newLocations);
      if (selectedIndex === index) {
        setSelectedIndex(null);
      } else if (selectedIndex !== null && selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1);
      }
    },
    [locations, onChange, selectedIndex]
  );

  const handleRadiusChange = useCallback(
    (index: number, radius: number) => {
      const updated = [...locations];
      updated[index] = { ...updated[index], rad: radius };
      onChange(updated);
    },
    [locations, onChange]
  );

  const navigateToOpportunities = useCallback((lat: number, lng: number, radius: number) => {
    // Convert radius from km to metres for the API
    const withinMetres = radius * 1000;
    // Navigate to search page with location params
    router.push(`/search?lat=${lat}&lon=${lng}&within=${withinMetres}`);
  }, [router]);

  const handleUseCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationAdd(latitude, longitude);
        setMapCenter({ lat: latitude, lng: longitude });
        
        // Reverse geocode to get postcode and fill the input
        const postcode = await reverseGeocode(latitude, longitude);
        if (postcode) {
          setPostcodeInput(postcode);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Location information unavailable");
            break;
          case error.TIMEOUT:
            setGeoError("Location request timed out");
            break;
          default:
            setGeoError("An unknown error occurred");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [handleLocationAdd]);

  const handlePostcodeSearch = useCallback(async () => {
    const postcode = postcodeInput.trim();
    if (!postcode) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const coordinates = await geocode(postcode);

      if (coordinates) {
        // Add location to the list
        handleLocationAdd(coordinates.latitude, coordinates.longitude);
        setMapCenter({ lat: coordinates.latitude, lng: coordinates.longitude });
        setPostcodeInput("");
        
        // Navigate to opportunities search page
        navigateToOpportunities(
          coordinates.latitude,
          coordinates.longitude,
          searchRadius
        );
      } else {
        setSearchError("Location not found. Try a different postcode or address.");
      }
    } catch (error) {
      console.error("Postcode search error:", error);
      setSearchError("Failed to search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [postcodeInput, handleLocationAdd, navigateToOpportunities, searchRadius]);

  const selectedLocation = selectedIndex !== null ? locations[selectedIndex] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Preferred Locations</h2>
        <p className="text-sm text-gray-600 mt-1">
          Add locations where you&apos;d like to volunteer. Click on the map to add a location,
          or use the search box to find by postcode/address.
        </p>
      </div>

      {/* Search and add controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Postcode/Address search */}
          <div className="flex-1">
            <div className="flex gap-2">
              <input
                type="text"
                value={postcodeInput}
                onChange={(e) => setPostcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePostcodeSearch()}
                placeholder="Enter postcode or address..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isSearching}
              />
              <button
                onClick={handlePostcodeSearch}
                disabled={isSearching || !postcodeInput.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                Search
              </button>
            </div>
            {searchError && (
              <p className="mt-1 text-sm text-red-600">{searchError}</p>
            )}
          </div>

          {/* Use current location button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-gray-700"
          >
            {isGettingLocation ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            Use my location
          </button>
        </div>

        {/* Search radius selector */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <label htmlFor="search-radius" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Search radius:
          </label>
          <div className="flex items-center gap-3 flex-1">
            <input
              type="range"
              id="search-radius"
              min="1"
              max="100"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex items-center gap-2 min-w-[100px]">
              <input
                type="number"
                min="1"
                max="500"
                value={searchRadius}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setSearchRadius(Math.min(Math.max(value, 1), 500));
                }}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">km</span>
            </div>
          </div>
        </div>
      </div>

      {geoError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {geoError}
        </div>
      )}

      {/* Map */}
      <LocationMap
        locations={mapLocations}
        onLocationAdd={handleLocationAdd}
        onLocationRemove={handleLocationRemove}
        onRadiusChange={handleRadiusChange}
        selectedIndex={selectedIndex}
        onSelectLocation={setSelectedIndex}
        center={mapCenter}
      />

      {/* Location list and controls */}
      {locations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Your locations ({locations.length})
          </h3>
          
          <div className="grid gap-3">
            {locations.map((location, index) => {
              const isSelected = selectedIndex === index;
              const address = getLocationAddress(location);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedIndex(isSelected ? null : index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isSelected
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        {address.isLoading ? (
                          <p className="text-sm text-gray-500 animate-pulse">Loading address...</p>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-gray-900">
                              {address.postcode && <span className="text-purple-600">{address.postcode}</span>}
                              {address.postcode && (address.city || address.county) && " • "}
                              {address.city}
                              {address.city && address.county && ", "}
                              {address.county}
                            </p>
                            {!address.postcode && !address.city && !address.county && (
                              <p className="text-sm font-medium text-gray-900">
                                {address.country || `${location.point?.lat.toFixed(4)}, ${location.point?.long.toFixed(4)}`}
                              </p>
                            )}
                          </>
                        )}
                        <p className="text-xs text-gray-500">
                          Within {location.rad} km radius
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocationRemove(index);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove location"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Radius slider - shown when selected */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search radius: {location.rad} km
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={location.rad}
                          onChange={(e) => handleRadiusChange(index, parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={location.rad}
                          onChange={(e) => handleRadiusChange(index, parseInt(e.target.value) || 1)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-500">km</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>1 km</span>
                        <span>100 km</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {locations.length === 0 && !isGettingLocation && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-gray-600 font-medium">No locations added yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Click on the map, search by postcode, or use your current location
          </p>
        </div>
      )}

      {/* Loading state */}
      {isGettingLocation && locations.length === 0 && (
        <LoadingState message="Detecting your location..." />
      )}

      {/* Help text */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click anywhere on the map to add a new location</li>
          <li>• Click on a marker or location card to select it and adjust the radius</li>
          <li>• Use the slider to set how far you&apos;re willing to travel</li>
          <li>• Add multiple locations if you can volunteer in different areas</li>
        </ul>
      </div>
    </div>
  );
}
