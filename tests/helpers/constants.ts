/**
 * Test configuration constants
 * 
 * These constants define timeout values and other configuration
 * used across the test suite for consistency and maintainability.
 * 
 * All tests run against localhost (Next.js on 3000, CSS on 3001),
 * so timeouts are kept reasonably short for fast feedback while
 * still allowing for OAuth redirects and page loads.
 */

/** Time to wait for page navigation and basic DOM updates */
export const PAGE_TRANSITION_TIMEOUT = 500;

/** Time to wait for editor components to fully load */
export const EDITOR_LOAD_TIMEOUT = 500;

/** Time to wait for same-page operations like checking boxes */
export const UI_INTERACTION_TIMEOUT = 500;

/** Time to wait for profile data to fully load from the pod */
export const PROFILE_LOAD_TIMEOUT = 15000;

/** Time to wait for save operations to complete (network to local CSS) */
export const SAVE_OPERATION_TIMEOUT = 15000;

/** Time to wait for authentication flows to complete (includes OAuth redirects) */
export const AUTH_FLOW_TIMEOUT = 10000;

/** Time to wait for OAuth redirect handling */
export const OAUTH_REDIRECT_TIMEOUT = 8000;

/** Time to wait for CSS login page to appear */
export const CSS_LOGIN_TIMEOUT = 8000;

/** Default credentials for test account */
export const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'test123',
} as const;

/** Local CSS issuer URL (Community Solid Server is the OIDC provider) */
export const LOCAL_CSS_ISSUER = 'http://localhost:3001';
