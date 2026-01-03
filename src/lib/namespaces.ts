/**
 * Centralized namespace configuration for RDF vocabularies
 * 
 * This module provides a single source of truth for all namespace URIs used
 * throughout the application, ensuring consistency and making URI construction
 * maintainable.
 */

/**
 * Namespace URIs for RDF vocabularies used in the application
 */
export const NAMESPACES = {
  /** Volunteer Profile ontology namespace */
  vp: 'https://id.volunteeringdata.io/volunteer-profile/',
  
  /** Volunteering Data Model schema namespace */
  volunteering: 'https://id.volunteeringdata.io/schema/',
  
  /** W3C Time Ontology namespace */
  time: 'http://www.w3.org/2006/time#',
  
  /** WGS84 Geo positioning namespace */
  geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
  
  /** FOAF (Friend of a Friend) namespace */
  foaf: 'http://xmlns.com/foaf/0.1/',
  
  /** vCard namespace */
  vcard: 'http://www.w3.org/2006/vcard/ns#',
} as const;

/**
 * Constructs a full URI for a volunteering schema term
 * @param id - The local ID (e.g., "EmpathyAndCompassion")
 * @returns The full URI (e.g., "https://id.volunteeringdata.io/schema/EmpathyAndCompassion")
 */
export function toVolunteeringUri(id: string): string {
  return `${NAMESPACES.volunteering}${id}`;
}

/**
 * Constructs a full URI for a volunteer profile term
 * @param id - The local ID (e.g., "Morning")
 * @returns The full URI (e.g., "https://id.volunteeringdata.io/volunteer-profile/Morning")
 */
export function toVolunteerProfileUri(id: string): string {
  return `${NAMESPACES.vp}${id}`;
}

/**
 * Constructs a full URI for a W3C Time Ontology term
 * @param id - The local ID (e.g., "Monday")
 * @returns The full URI (e.g., "http://www.w3.org/2006/time#Monday")
 */
export function toTimeUri(id: string): string {
  return `${NAMESPACES.time}${id}`;
}

/**
 * Extracts the local ID from a full URI
 * @param uri - The full URI
 * @returns The local ID or the original URI if no namespace matches
 */
export function extractLocalId(uri: string): string {
  for (const namespace of Object.values(NAMESPACES)) {
    if (uri.startsWith(namespace)) {
      return uri.slice(namespace.length);
    }
  }
  // Handle hash URIs
  const hashIndex = uri.lastIndexOf('#');
  if (hashIndex !== -1) {
    return uri.slice(hashIndex + 1);
  }
  // Handle slash URIs
  const slashIndex = uri.lastIndexOf('/');
  if (slashIndex !== -1) {
    return uri.slice(slashIndex + 1);
  }
  return uri;
}

/**
 * Determines which namespace a URI belongs to
 * @param uri - The full URI
 * @returns The namespace key or undefined if not found
 */
export function getNamespaceKey(uri: string): keyof typeof NAMESPACES | undefined {
  for (const [key, namespace] of Object.entries(NAMESPACES)) {
    if (uri.startsWith(namespace)) {
      return key as keyof typeof NAMESPACES;
    }
  }
  return undefined;
}
