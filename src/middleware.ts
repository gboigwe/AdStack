import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security-focused middleware that sets standard HTTP response headers.
 * These headers mitigate common web vulnerabilities (XSS, clickjacking,
 * MIME sniffing) without breaking existing functionality.
 */

const SECURITY_HEADERS = new Map<string, string>([
  // Prevent clickjacking — allow only same-origin framing
  ['X-Frame-Options', 'SAMEORIGIN'],

  // Block MIME-type sniffing
  ['X-Content-Type-Options', 'nosniff'],

  // Referrer policy — send origin only on cross-origin, full on same-origin
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],

  // Permissions policy — disable unused browser features
  [
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  ],

  // Basic XSS protection for older browsers that don't support CSP
  ['X-XSS-Protection', '1; mode=block'],

  // Strict transport security — enforce HTTPS for 1 year
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
]);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  for (const [key, value] of SECURITY_HEADERS) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  // Apply to all routes except static assets and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)'],
};
