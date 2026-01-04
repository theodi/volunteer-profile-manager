"use client";

/**
 * Storage Selector Component
 * 
 * Displays when multiple pim:storage options are available for a user's WebID,
 * allowing them to select which storage to use for their volunteer profile.
 */

import { useState } from 'react';
import { getVolunteerProfileUri } from '@/lib/storageDiscovery';

interface StorageSelectorProps {
  storages: string[];
  onSelect: (storageUri: string) => void;
  isLoading?: boolean;
}

/**
 * Extracts a display name from a storage URI.
 * 
 * @param uri - The storage URI
 * @returns A human-readable display name
 */
function getStorageDisplayName(uri: string): string {
  try {
    const url = new URL(uri);
    // Use hostname and path for display
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      return `${url.hostname}/${pathParts.join('/')}`;
    }
    return url.hostname;
  } catch {
    return uri;
  }
}

export default function StorageSelector({ 
  storages, 
  onSelect,
  isLoading = false 
}: StorageSelectorProps) {
  const [selectedUri, setSelectedUri] = useState<string | undefined>(
    storages.length > 0 ? storages[0] : undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUri) {
      onSelect(selectedUri);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Select Storage Location
          </h2>
          <p className="text-sm text-gray-600">
            Your WebID has multiple storage locations. Please select where to store your volunteer profile.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-3 mb-6">
          {storages.map((uri) => (
            <label
              key={uri}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedUri === uri
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="storage"
                value={uri}
                checked={selectedUri === uri}
                onChange={(e) => setSelectedUri(e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {getStorageDisplayName(uri)}
                </p>
                <p className="text-xs text-gray-500 truncate" title={uri}>
                  {uri}
                </p>
              </div>
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={!selectedUri || isLoading}
          className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </span>
          ) : (
            'Continue with Selected Storage'
          )}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Your volunteer profile will be stored at:{' '}
        <span className="font-mono">
          {selectedUri ? getVolunteerProfileUri(selectedUri) : '...'}
        </span>
      </p>
    </div>
  );
}
