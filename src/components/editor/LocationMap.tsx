"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  locations: Array<{ lat: number; lng: number; radius: number }>;
  onLocationAdd: (lat: number, lng: number) => void;
  onLocationRemove: (index: number) => void;
  onRadiusChange: (index: number, radius: number) => void;
  selectedIndex: number | null;
  onSelectLocation: (index: number | null) => void;
  center?: { lat: number; lng: number };
}

// Fix for default marker icons in Leaflet with webpack/next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "selected-marker",
});

export default function LocationMap({
  locations,
  onLocationAdd,
  onLocationRemove,
  onRadiusChange,
  selectedIndex,
  onSelectLocation,
  center = { lat: 51.5074, lng: -0.1278 }, // Default to London
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Use ref to always have the latest callback without re-initializing the map
  const onLocationAddRef = useRef(onLocationAdd);
  useEffect(() => {
    onLocationAddRef.current = onLocationAdd;
  }, [onLocationAdd]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 10,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Click to add location - use ref to always get latest callback
    map.on("click", (e: L.LeafletMouseEvent) => {
      onLocationAddRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.lat, center.lng], 12);
    }
  }, [center]);

  // Update markers and circles when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and circles
    markersRef.current.forEach((marker) => marker.remove());
    circlesRef.current.forEach((circle) => circle.remove());
    markersRef.current = [];
    circlesRef.current = [];

    // Add new markers and circles
    locations.forEach((loc, index) => {
      const isSelected = selectedIndex === index;

      // Add circle for radius
      const circle = L.circle([loc.lat, loc.lng], {
        radius: loc.radius * 1000, // Convert km to meters
        color: isSelected ? "#9333ea" : "#6366f1",
        fillColor: isSelected ? "#9333ea" : "#6366f1",
        fillOpacity: isSelected ? 0.2 : 0.1,
        weight: isSelected ? 3 : 2,
      }).addTo(map);

      // Add marker
      const marker = L.marker([loc.lat, loc.lng], {
        icon: isSelected ? selectedIcon : defaultIcon,
        draggable: false,
      }).addTo(map);

      // Click to select
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectLocation(isSelected ? null : index);
      });

      circle.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectLocation(isSelected ? null : index);
      });

      markersRef.current.push(marker);
      circlesRef.current.push(circle);
    });

    // Fit bounds if there are locations
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
      // Add padding for circles
      const maxRadius = Math.max(...locations.map((l) => l.radius)) * 1000;
      map.fitBounds(bounds.pad(0.2), { maxZoom: 12 });
    }
  }, [locations, selectedIndex, isMapReady, onSelectLocation]);

  return (
    <div className="relative isolate">
      <div
        ref={mapRef}
        className="w-full h-80 rounded-lg border border-gray-200 z-0"
        style={{ minHeight: "320px" }}
      />
      <div className="absolute top-2 right-2 z-[1000] bg-white rounded-lg shadow-md p-2 text-xs text-gray-600">
        Click map to add location
      </div>
    </div>
  );
}
