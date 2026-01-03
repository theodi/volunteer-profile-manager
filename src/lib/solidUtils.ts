/**
 * Solid resource utilities for profile management
 * 
 * This module provides utilities for working with Solid resources,
 * including profile URI derivation, container verification, and
 * HTTP error handling.
 */

import { NAMESPACES } from './namespaces';

/**
 * Known WebID patterns from common Pod providers.
 * Maps regex patterns to their profile path extraction logic.
 */
const WEBID_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  extractPodRoot: (match: RegExpMatchArray) => string;
}> = [
  // Inrupt PodSpaces: https://id.inrupt.com/{username}/profile/card#me
  {
    name: 'Inrupt PodSpaces',
    pattern: /^(https:\/\/[^/]+\/[^/]+)\/profile\/card#me$/,
    extractPodRoot: (match) => match[1],
  },
  // SolidCommunity.net: https://{username}.solidcommunity.net/profile/card#me
  {
    name: 'SolidCommunity.net',
    pattern: /^(https:\/\/[^/]+\.solidcommunity\.net)\/profile\/card#me$/,
    extractPodRoot: (match) => match[1],
  },
  // solidweb.org: https://{username}.solidweb.org/profile/card#me
  {
    name: 'solidweb.org',
    pattern: /^(https:\/\/[^/]+\.solidweb\.org)\/profile\/card#me$/,
    extractPodRoot: (match) => match[1],
  },
  // Generic CSS instances: https://{server}/{username}/profile/card#me
  {
    name: 'Generic CSS',
    pattern: /^(https?:\/\/[^/]+(?::\d+)?\/[^/]+)\/profile\/card#me$/,
    extractPodRoot: (match) => match[1],
  },
  // Generic pattern: https://{server}/profile/card#me (subdomain-based pods)
  {
    name: 'Subdomain-based Pod',
    pattern: /^(https?:\/\/[^/]+(?::\d+)?)\/profile\/card#me$/,
    extractPodRoot: (match) => match[1],
  },
];

/**
 * Derives the volunteer profile URI from a WebID.
 * 
 * This function attempts to determine the Pod root from the WebID
 * and constructs a standard path for the volunteer profile.
 * 
 * @param webId - The user's WebID
 * @returns The derived profile URI, or undefined if derivation fails
 */
export function deriveProfileUri(webId: string | undefined): string | undefined {
  if (!webId) return undefined;

  // Try each known pattern
  for (const { pattern, extractPodRoot } of WEBID_PATTERNS) {
    const match = webId.match(pattern);
    if (match) {
      const podRoot = extractPodRoot(match);
      return `${podRoot}/volunteer/profile`;
    }
  }

  // Fallback: try to extract pod root by removing #me and profile/card
  // This handles edge cases we might not have anticipated
  try {
    const url = new URL(webId);
    
    // Remove fragment (#me)
    url.hash = '';
    
    // Get the pathname and try to find profile/card
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Look for profile/card pattern
    const profileIndex = pathParts.findIndex(
      (part, idx) => part === 'profile' && pathParts[idx + 1] === 'card'
    );
    
    if (profileIndex !== -1) {
      // Remove profile/card from path
      pathParts.splice(profileIndex);
      url.pathname = '/' + pathParts.join('/');
      return `${url.origin}${url.pathname}/volunteer/profile`;
    }
    
    // Last resort: just use the WebID origin with a conventional path
    // This might not work for all providers but provides some fallback
    console.warn(
      `Could not derive volunteer profile URI from WebID: ${webId}. ` +
      'Using origin-based fallback.'
    );
    return `${url.origin}/volunteer/profile`;
  } catch (error) {
    console.error('Failed to parse WebID URL:', error);
    return undefined;
  }
}

/**
 * Extracts the parent container URI from a resource URI.
 * 
 * @param resourceUri - The resource URI
 * @returns The container URI
 */
export function getContainerUri(resourceUri: string): string {
  const lastSlashIndex = resourceUri.lastIndexOf('/');
  return resourceUri.substring(0, lastSlashIndex + 1);
}

/**
 * HTTP error status codes and their descriptions for Solid operations.
 */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. The data format may be incorrect.',
  401: 'Authentication expired. Please log in again.',
  403: "You don't have permission to access this resource.",
  404: 'Resource not found. It may have been deleted or moved.',
  409: 'Conflict. The resource may have been modified by another client.',
  412: 'The resource was modified since you last loaded it. Please refresh and try again.',
  413: 'The data is too large. Please reduce the amount of information.',
  415: 'Unsupported data format.',
  422: 'The data could not be processed. Please check for errors.',
  423: 'The resource is locked. Please try again later.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'The server encountered an error. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
  504: 'The server took too long to respond. Please try again later.',
};

/**
 * Status codes that indicate the request could be retried.
 */
export const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Determines if an error is retryable based on its status code.
 * 
 * @param error - The error object
 * @returns True if the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const statusCode = getErrorStatusCode(error);
  return statusCode !== undefined && RETRYABLE_STATUS_CODES.includes(statusCode);
}

/**
 * Extracts the HTTP status code from an error object.
 * 
 * @param error - The error object
 * @returns The status code, or undefined if not found
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  
  const err = error as Record<string, unknown>;
  
  // Check common error properties
  if (typeof err.statusCode === 'number') return err.statusCode;
  if (typeof err.status === 'number') return err.status;
  
  // Check response object
  if (err.response && typeof err.response === 'object') {
    const response = err.response as Record<string, unknown>;
    if (typeof response.status === 'number') return response.status;
    if (typeof response.statusCode === 'number') return response.statusCode;
  }
  
  return undefined;
}

/**
 * Gets a user-friendly error message for a given status code.
 * 
 * @param statusCode - The HTTP status code
 * @param defaultMessage - Default message if status code not recognized
 * @returns A user-friendly error message
 */
export function getErrorMessage(
  statusCode: number | undefined,
  defaultMessage: string = 'An unexpected error occurred. Please try again.'
): string {
  if (statusCode !== undefined && HTTP_ERROR_MESSAGES[statusCode]) {
    return HTTP_ERROR_MESSAGES[statusCode];
  }
  return defaultMessage;
}

/**
 * Formats an error into a user-friendly message.
 * 
 * @param error - The error object
 * @param context - Optional context for the error message
 * @returns A user-friendly error message
 */
export function formatErrorMessage(error: unknown, context?: string): string {
  const statusCode = getErrorStatusCode(error);
  const baseMessage = getErrorMessage(
    statusCode,
    error instanceof Error ? error.message : 'An unexpected error occurred.'
  );
  
  return context ? `${context}: ${baseMessage}` : baseMessage;
}

/**
 * Delays execution for a specified time.
 * Useful for implementing retry logic with backoff.
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay.
 * 
 * @param attempt - The current attempt number (0-based)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @param maxDelay - Maximum delay in milliseconds (default: 30000)
 * @returns The delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}
