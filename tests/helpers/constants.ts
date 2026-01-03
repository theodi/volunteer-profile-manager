/**
 * Test configuration constants
 * 
 * These constants define timeout values and other configuration
 * used across the test suite for consistency and maintainability.
 */

/** Time to wait for page navigation and basic DOM updates */
export const PAGE_TRANSITION_TIMEOUT = 1000;

/** Time to wait for editor components to fully load */
export const EDITOR_LOAD_TIMEOUT = 2000;

/** Time to wait for save operations to complete */
export const SAVE_OPERATION_TIMEOUT = 10000;

/** Time to wait for authentication flows to complete */
export const AUTH_FLOW_TIMEOUT = 15000;

/** Time to wait for OAuth redirect handling */
export const OAUTH_REDIRECT_TIMEOUT = 10000;

/** Time to wait for CSS login page to appear */
export const CSS_LOGIN_TIMEOUT = 15000;

/** Default credentials for test account */
export const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'test123',
} as const;

/** Local CSS issuer URL (Next.js app acts as OIDC proxy) */
export const LOCAL_CSS_ISSUER = 'http://localhost:3000';
