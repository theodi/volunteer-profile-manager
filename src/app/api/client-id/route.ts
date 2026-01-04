import { NextRequest, NextResponse } from 'next/server';

/**
 * Solid Client Identifier Document endpoint
 * 
 * This endpoint serves a JSON-LD formatted client identifier document
 * that allows Solid Identity Providers to identify this application.
 * 
 * @see https://docs.inrupt.com/guides/identity-in-solid/the-client-id-document/
 * @see https://solidproject.org/TR/solid-oidc#clientids-document
 */
export async function GET(request: NextRequest) {
  // Get the origin from the request to build absolute URLs
  const origin = getOrigin(request);
  
  const clientIdDocument = {
    "@context": "https://www.w3.org/ns/solid/oidc-context.jsonld",
    "client_id": `${origin}/api/client-id`,
    "redirect_uris": [`${origin}/`],
    "post_logout_redirect_uris": [`${origin}/`],
    "client_name": "Volunteer Profile Editor",
    "client_uri": origin,
    "scope": "openid webid offline_access",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  };

  return NextResponse.json(clientIdDocument, {
    headers: {
      'Content-Type': 'application/ld+json',
    },
  });
}

/**
 * Get the origin URL from the request
 * Handles both development (localhost) and production environments
 */
function getOrigin(request: NextRequest): string {
  // Try to get the origin from the X-Forwarded headers (for proxied requests)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  
  // Only use forwarded headers when both are present for consistency
  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  // Fall back to the host header
  const host = request.headers.get('host');
  if (host) {
    const protocol = isLocalhost(host) ? 'http' : 'https';
    return `${protocol}://${host}`;
  }
  
  // Final fallback - use the request URL
  const url = new URL(request.url);
  return url.origin;
}

/**
 * Check if the host is localhost (for local development)
 * Uses precise matching to avoid false positives like 'mylocalhost.com'
 */
function isLocalhost(host: string): boolean {
  // Remove port if present
  const hostname = host.split(':')[0];
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
