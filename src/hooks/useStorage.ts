"use client";

/**
 * React hook for Solid storage discovery and selection.
 * 
 * This hook handles:
 * 1. Discovering pim:storage from the user's WebID
 * 2. Container hierarchy traversal if no explicit storage is found
 * 3. UI for selecting from multiple storages
 * 4. Caching of selected storage for the session
 */

import { useState, useEffect, useCallback } from 'react';
import { useSolidAuth } from '@ldo/solid-react';
import { 
  discoverStorage, 
  getVolunteerProfileUri,
  StorageDiscoveryResult 
} from '@/lib/storageDiscovery';

/** State of storage discovery */
export interface StorageState {
  /** Whether storage discovery is in progress */
  isLoading: boolean;
  /** Error message if discovery failed */
  error: string | undefined;
  /** Array of available storage URIs */
  availableStorages: string[];
  /** Currently selected storage URI */
  selectedStorage: string | undefined;
  /** The volunteer profile URI derived from selected storage */
  profileUri: string | undefined;
  /** Whether user selection is required */
  requiresSelection: boolean;
}

/** Return type of the useStorage hook */
export interface UseStorageReturn extends StorageState {
  /** Select a storage from available options */
  selectStorage: (storageUri: string) => void;
  /** Retry storage discovery */
  retryDiscovery: () => void;
}

// Session storage key for persisting storage selection
const STORAGE_SELECTION_KEY = 'volunteer-profile-selected-storage';

/**
 * Safely get an item from sessionStorage (handles SSR)
 */
function getSessionItem(key: string): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely set an item in sessionStorage (handles SSR)
 */
function setSessionItem(key: string, value: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore errors (e.g., storage full, private browsing)
  }
}

/**
 * Safely remove an item from sessionStorage (handles SSR)
 */
function removeSessionItem(key: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

/**
 * Hook for discovering and managing Solid storage selection.
 * 
 * @returns Storage state and control functions
 */
export function useStorage(): UseStorageReturn {
  const { session, fetch } = useSolidAuth();
  
  const [state, setState] = useState<StorageState>({
    isLoading: true,
    error: undefined,
    availableStorages: [],
    selectedStorage: undefined,
    profileUri: undefined,
    requiresSelection: false,
  });

  // Function to perform storage discovery
  const performDiscovery = useCallback(async () => {
    if (!session.webId || !fetch) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Not logged in',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: undefined,
    }));

    try {
      // Check for cached storage selection
      const cachedStorage = getSessionItem(STORAGE_SELECTION_KEY);

      const result = await discoverStorage(session.webId, fetch);

      if (result.error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error,
          availableStorages: [],
          selectedStorage: undefined,
          profileUri: undefined,
          requiresSelection: false,
        }));
        return;
      }

      // Determine which storage to use
      let selectedStorage = result.selectedStorage;

      // If we have a cached selection and it's still valid, use it
      if (cachedStorage && result.storages.includes(cachedStorage)) {
        selectedStorage = cachedStorage;
      } else if (result.requiresSelection && !selectedStorage) {
        // Multiple storages, needs user selection
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: undefined,
          availableStorages: result.storages,
          selectedStorage: undefined,
          profileUri: undefined,
          requiresSelection: true,
        }));
        return;
      }

      // Calculate profile URI
      const profileUri = selectedStorage 
        ? getVolunteerProfileUri(selectedStorage)
        : undefined;

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: undefined,
        availableStorages: result.storages,
        selectedStorage,
        profileUri,
        requiresSelection: result.storages.length > 1 && !selectedStorage,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Storage discovery failed',
        availableStorages: [],
        selectedStorage: undefined,
        profileUri: undefined,
        requiresSelection: false,
      }));
    }
  }, [session.webId, fetch]);

  // Run discovery when WebID changes
  useEffect(() => {
    if (session.webId) {
      performDiscovery();
    } else {
      setState({
        isLoading: false,
        error: undefined,
        availableStorages: [],
        selectedStorage: undefined,
        profileUri: undefined,
        requiresSelection: false,
      });
    }
  }, [session.webId, performDiscovery]);

  // Function to select a storage
  const selectStorage = useCallback((storageUri: string) => {
    // Persist selection to session storage
    setSessionItem(STORAGE_SELECTION_KEY, storageUri);

    const profileUri = getVolunteerProfileUri(storageUri);

    setState(prev => ({
      ...prev,
      selectedStorage: storageUri,
      profileUri,
      requiresSelection: false,
    }));
  }, []);

  // Function to retry discovery
  const retryDiscovery = useCallback(() => {
    // Clear cached selection
    removeSessionItem(STORAGE_SELECTION_KEY);
    performDiscovery();
  }, [performDiscovery]);

  return {
    ...state,
    selectStorage,
    retryDiscovery,
  };
}
