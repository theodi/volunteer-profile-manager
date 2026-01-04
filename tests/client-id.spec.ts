import { test, expect } from '@playwright/test';

/**
 * Tests for the Client Identifier Document endpoint
 * 
 * The Client Identifier Document is a JSON-LD document that allows
 * Solid Identity Providers to identify this application.
 * 
 * @see https://docs.inrupt.com/guides/identity-in-solid/the-client-id-document/
 * @see https://solidproject.org/TR/solid-oidc#clientids-document
 */

test.describe('Client Identifier Document', () => {
  test('should serve a valid client identifier document at /api/client-id', async ({ request }) => {
    const response = await request.get('/api/client-id');
    
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/ld+json');
    
    const clientId = await response.json();
    
    // Verify required fields per Solid-OIDC specification
    expect(clientId['@context']).toBe('https://www.w3.org/ns/solid/oidc-context.jsonld');
    expect(clientId.client_id).toContain('/api/client-id');
    expect(clientId.client_name).toBe('Volunteer Profile Editor');
    expect(clientId.redirect_uris).toBeDefined();
    expect(Array.isArray(clientId.redirect_uris)).toBe(true);
    expect(clientId.redirect_uris.length).toBeGreaterThan(0);
    expect(clientId.scope).toContain('openid');
    expect(clientId.scope).toContain('webid');
    expect(clientId.grant_types).toContain('authorization_code');
    expect(clientId.response_types).toContain('code');
    expect(clientId.token_endpoint_auth_method).toBe('none');
  });

  test('should have matching client_id and request URL origin', async ({ request, baseURL }) => {
    const response = await request.get('/api/client-id');
    const clientId = await response.json();
    
    // The client_id should be the full URL of this endpoint
    expect(clientId.client_id).toBe(`${baseURL}/api/client-id`);
  });

  test('should include client_uri matching the application origin', async ({ request, baseURL }) => {
    const response = await request.get('/api/client-id');
    const clientId = await response.json();
    
    expect(clientId.client_uri).toBe(baseURL);
  });

  test('should have redirect_uris pointing to the application root', async ({ request, baseURL }) => {
    const response = await request.get('/api/client-id');
    const clientId = await response.json();
    
    expect(clientId.redirect_uris).toContain(`${baseURL}/login`);
  });

  test('should have post_logout_redirect_uris defined', async ({ request, baseURL }) => {
    const response = await request.get('/api/client-id');
    const clientId = await response.json();
    
    expect(clientId.post_logout_redirect_uris).toBeDefined();
    expect(Array.isArray(clientId.post_logout_redirect_uris)).toBe(true);
    expect(clientId.post_logout_redirect_uris).toContain(`${baseURL}/`);
  });

  test('should support refresh_token grant type for offline access', async ({ request }) => {
    const response = await request.get('/api/client-id');
    const clientId = await response.json();
    
    expect(clientId.grant_types).toContain('refresh_token');
    expect(clientId.scope).toContain('offline_access');
  });

  test('should have logo_uri pointing to the application icon', async ({ request, baseURL }) => {
    const response = await request.get('/api/client-id');
    const clientId = await response.json();
    
    expect(clientId.logo_uri).toBe(`${baseURL}/icon.svg`);
  });
});
