/**
 * Solid Storage Discovery Module
 * 
 * Implements proper discovery of pim:Storage containers as specified in the
 * Solid protocol. Discovery follows these steps:
 * 1. Fetch the WebID profile and look for pim:storage predicates
 * 2. If exactly one storage is found, use it
 * 3. If multiple storages are found, allow user selection
 * 4. If no storage is found, traverse the container hierarchy from the WebID
 *    document to find the first container of type pim:Storage
 * 
 * Reference: https://github.com/SolidLabResearch/Bashlib/blob/master/src/utils/util.ts
 */

import { NAMESPACES } from './namespaces';

/** Result of storage discovery */
export interface StorageDiscoveryResult {
  /** The discovered storage URIs */
  storages: string[];
  /** Whether user selection is required (multiple storages found) */
  requiresSelection: boolean;
  /** The selected or single storage URI */
  selectedStorage: string | undefined;
  /** Error message if discovery failed */
  error?: string;
}

/** Predicate URIs for storage discovery */
const PIM_STORAGE = `${NAMESPACES.pim}storage`;
const RDF_TYPE = `${NAMESPACES.rdf}type`;
const PIM_STORAGE_TYPE = `${NAMESPACES.pim}Storage`;

/**
 * Discovers storage locations for a WebID.
 * 
 * @param webId - The user's WebID
 * @param fetch - Authenticated fetch function
 * @returns Storage discovery result
 */
export async function discoverStorage(
  webId: string,
  fetch: typeof globalThis.fetch
): Promise<StorageDiscoveryResult> {
  try {
    // Step 1: Fetch the WebID profile and extract pim:storage predicates
    const storages = await getStoragesFromWebId(webId, fetch);
    
    if (storages.length === 1) {
      // Exactly one storage found - use it directly
      return {
        storages,
        requiresSelection: false,
        selectedStorage: storages[0],
      };
    }
    
    if (storages.length > 1) {
      // Multiple storages found - require user selection
      return {
        storages,
        requiresSelection: true,
        selectedStorage: undefined,
      };
    }
    
    // No pim:storage found - traverse container hierarchy to discover storage
    const discoveredStorage = await discoverStorageByTraversal(webId, fetch);
    
    if (discoveredStorage) {
      return {
        storages: [discoveredStorage],
        requiresSelection: false,
        selectedStorage: discoveredStorage,
      };
    }
    
    return {
      storages: [],
      requiresSelection: false,
      selectedStorage: undefined,
      error: 'No storage found for this WebID',
    };
  } catch (error) {
    return {
      storages: [],
      requiresSelection: false,
      selectedStorage: undefined,
      error: error instanceof Error ? error.message : 'Storage discovery failed',
    };
  }
}

/**
 * Extracts pim:storage values from a WebID profile.
 * 
 * @param webId - The WebID to fetch
 * @param fetch - Authenticated fetch function
 * @returns Array of storage URIs found in the profile
 */
async function getStoragesFromWebId(
  webId: string,
  fetch: typeof globalThis.fetch
): Promise<string[]> {
  // Get the profile document URL (remove fragment)
  const profileUrl = webId.split('#')[0];
  
  const response = await fetch(profileUrl, {
    headers: {
      'Accept': 'text/turtle, application/ld+json, application/n-triples',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch WebID profile: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();
  
  // Parse the RDF to extract pim:storage predicates
  const storages = parseStoragePredicates(body, contentType, webId);
  
  return storages;
}

/**
 * Parses RDF content to extract pim:storage predicates.
 * This is a simplified parser that handles common Turtle patterns.
 * 
 * @param content - RDF content as string
 * @param contentType - Content-Type header value
 * @param subject - The subject (WebID) to look for
 * @returns Array of storage URIs
 */
function parseStoragePredicates(
  content: string,
  contentType: string,
  subject: string
): string[] {
  const storages: string[] = [];
  
  // Normalize content type
  const normalizedType = contentType.split(';')[0].trim().toLowerCase();
  
  if (normalizedType.includes('turtle') || normalizedType.includes('text/turtle')) {
    // Parse Turtle format
    // Look for patterns like:
    // <#me> pim:storage <...> .
    // <#me> <http://www.w3.org/ns/pim/space#storage> <...> .
    // :me pim:storage <...> .
    
    const lines = content.split('\n');
    const prefixes: Record<string, string> = {};
    
    // First pass: collect prefixes (allow hyphens in prefix names)
    for (const line of lines) {
      const prefixMatch = line.match(/@prefix\s+([\w-]+):\s*<([^>]+)>/i);
      if (prefixMatch) {
        prefixes[prefixMatch[1]] = prefixMatch[2];
      }
    }
    
    // Create regex patterns for storage predicate
    const storagePredicatePatterns = [
      // Full URI: <http://www.w3.org/ns/pim/space#storage>
      /<http:\/\/www\.w3\.org\/ns\/pim\/space#storage>/,
      // Prefixed form: pim:storage or space:storage
      /\b(pim|space):storage\b/,
    ];
    
    // Second pass: find storage triples
    for (const line of lines) {
      // Skip comments and prefix declarations
      if (line.trim().startsWith('#') || line.trim().startsWith('@')) continue;
      
      // Check if this line contains a storage predicate
      const hasStoragePredicate = storagePredicatePatterns.some(p => p.test(line));
      if (!hasStoragePredicate) continue;
      
      // Extract all storage URIs from the line (handles multiple objects with commas)
      const uriPattern = /<(https?:\/\/[^>]+)>/g;
      let match;
      // Skip the first match if it's the predicate URI
      const lineWithoutPredicate = line.replace(/<http:\/\/www\.w3\.org\/ns\/pim\/space#storage>/, '');
      while ((match = uriPattern.exec(lineWithoutPredicate)) !== null) {
        const storageUri = match[1];
        // Validate it looks like a valid URI
        if (storageUri.startsWith('http://') || storageUri.startsWith('https://')) {
          storages.push(storageUri);
        }
      }
    }
  } else if (normalizedType.includes('json') || normalizedType.includes('ld+json')) {
    // Parse JSON-LD format
    try {
      const json = JSON.parse(content);
      const graph = Array.isArray(json) ? json : (json['@graph'] || [json]);
      
      // Remove fragment from subject for comparison
      const subjectWithoutFragment = subject.split('#')[0];
      
      for (const node of graph) {
        // Check if this is the WebID subject - flexible matching
        const nodeId = node['@id'] || '';
        const nodeIdNormalized = nodeId.startsWith('#') 
          ? `${subjectWithoutFragment}${nodeId}`
          : nodeId;
        
        // Match against WebID with various possible representations
        const isMatchingSubject = 
          nodeIdNormalized === subject ||
          nodeId.endsWith('#me') ||
          nodeId === '#me' ||
          nodeId === 'me' ||
          nodeId === '';
        
        if (!isMatchingSubject) continue;
        
        // Look for pim:storage or expanded form
        const storageValue = 
          node['http://www.w3.org/ns/pim/space#storage'] ||
          node['pim:storage'] ||
          node['space:storage'];
        
        if (storageValue) {
          const values = Array.isArray(storageValue) ? storageValue : [storageValue];
          for (const val of values) {
            const uri = typeof val === 'string' ? val : val['@id'];
            if (uri) storages.push(uri);
          }
        }
      }
    } catch {
      // JSON parsing failed, return empty
    }
  }
  
  return [...new Set(storages)]; // Remove duplicates
}

/**
 * Discovers storage by traversing the container hierarchy from the WebID.
 * This follows the algorithm from Bashlib:
 * 1. Start from the WebID document's parent container
 * 2. Check if it's a pim:Storage
 * 3. If not, move to parent container
 * 4. Repeat until root or storage found
 * 
 * @param webId - The WebID to start from
 * @param fetch - Authenticated fetch function
 * @returns The discovered storage URI or undefined
 */
async function discoverStorageByTraversal(
  webId: string,
  fetch: typeof globalThis.fetch
): Promise<string | undefined> {
  // Get the profile document URL (remove fragment)
  const profileUrl = webId.split('#')[0];
  
  // Start from the profile document's parent container
  let currentUrl = getParentContainer(profileUrl);
  
  // Track visited URLs to prevent infinite loops
  const visited = new Set<string>();
  
  while (currentUrl && !visited.has(currentUrl)) {
    visited.add(currentUrl);
    
    try {
      // Check if this container is a pim:Storage
      const isStorage = await checkIfStorage(currentUrl, fetch);
      
      if (isStorage) {
        return currentUrl;
      }
      
      // Move to parent container
      const parentUrl = getParentContainer(currentUrl);
      
      // Stop if we've reached the root
      if (!parentUrl || parentUrl === currentUrl) {
        break;
      }
      
      currentUrl = parentUrl;
    } catch {
      // If we can't access a container, stop traversal
      break;
    }
  }
  
  return undefined;
}

/**
 * Checks if a container is of type pim:Storage.
 * This checks both the Link header and the RDF content.
 * 
 * @param containerUrl - The container URL to check
 * @param fetch - Authenticated fetch function
 * @returns True if the container is a pim:Storage
 */
async function checkIfStorage(
  containerUrl: string,
  fetch: typeof globalThis.fetch
): Promise<boolean> {
  try {
    const response = await fetch(containerUrl, {
      method: 'HEAD',
      headers: {
        'Accept': 'text/turtle',
      },
    });
    
    if (!response.ok) return false;
    
    // Check Link header for type - this is the most reliable method
    const linkHeader = response.headers.get('link') || '';
    
    // Parse Link header properly: <http://www.w3.org/ns/pim/space#Storage>; rel="type"
    const linkParts = linkHeader.split(',');
    for (const part of linkParts) {
      const trimmed = part.trim();
      // Check if this part declares a type relationship
      if (trimmed.includes('rel="type"') || trimmed.includes("rel='type'")) {
        // Check if the URI is pim:Storage
        const uriMatch = trimmed.match(/<([^>]+)>/);
        if (uriMatch && uriMatch[1] === PIM_STORAGE_TYPE) {
          return true;
        }
      }
    }
    
    // Some servers may not include the type in Link header
    // Make a GET request to check the RDF content more carefully
    const getResponse = await fetch(containerUrl, {
      headers: {
        'Accept': 'text/turtle',
      },
    });
    
    if (!getResponse.ok) return false;
    
    const body = await getResponse.text();
    
    // Check if the container has rdf:type pim:Storage
    // Parse more carefully to avoid false positives from comments
    const lines = body.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip comments
      if (trimmedLine.startsWith('#')) continue;
      
      // Look for type statements that include pim:Storage or space:Storage
      // Must have both 'a' or 'rdf:type' predicate and the Storage type
      const hasTypePredicate = /\ba\b|rdf:type|<http:\/\/www\.w3\.org\/1999\/02\/22-rdf-syntax-ns#type>/.test(trimmedLine);
      const hasStorageType = trimmedLine.includes(PIM_STORAGE_TYPE) || 
                            /\b(pim|space):Storage\b/.test(trimmedLine);
      
      if (hasTypePredicate && hasStorageType) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Gets the parent container URL for a given URL.
 * 
 * @param url - The URL
 * @returns The parent container URL or undefined
 */
function getParentContainer(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    
    // Remove trailing slash if present
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    
    // Find the last path segment
    const lastSlash = normalizedPath.lastIndexOf('/');
    
    if (lastSlash <= 0) {
      // We're at the root
      return undefined;
    }
    
    // Return parent path with trailing slash (container convention)
    parsed.pathname = normalizedPath.substring(0, lastSlash) + '/';
    
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/**
 * Constructs the volunteer profile URI from a storage root.
 * 
 * @param storageRoot - The storage root URI
 * @returns The volunteer profile URI
 */
export function getVolunteerProfileUri(storageRoot: string): string {
  // Ensure storage root ends with /
  const normalizedRoot = storageRoot.endsWith('/') ? storageRoot : storageRoot + '/';
  return `${normalizedRoot}volunteer/profile`;
}

/**
 * Constructs the volunteer profile container URI from a storage root.
 * 
 * @param storageRoot - The storage root URI
 * @returns The volunteer profile container URI
 */
export function getVolunteerContainerUri(storageRoot: string): string {
  // Ensure storage root ends with /
  const normalizedRoot = storageRoot.endsWith('/') ? storageRoot : storageRoot + '/';
  return `${normalizedRoot}volunteer/`;
}
