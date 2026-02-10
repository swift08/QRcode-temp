import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

/**
 * Supabase JWT verification helper
 *
 * Uses Supabase's public JWKS endpoint to verify access tokens issued
 * by Supabase Auth. This should only be used on the server side.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

// Supabase exposes its JWK set at this well-known URL
const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);

// Remote JWK set that jose will cache and use to verify JWT signatures
const JWKS = createRemoteJWKSet(jwksUrl);

export interface VerifiedSupabaseToken extends JWTPayload {
  role?: string;
  sub?: string; // user id
  iss?: string;
}

/**
 * Verify a Supabase JWT access token and return its payload.
 *
 * Throws if the token is invalid, expired, or not issued by this Supabase project.
 * Issuer is validated as https://<project-ref>.supabase.co/auth/v1 per Supabase JWT spec.
 */
export async function verifySupabaseToken(token: string): Promise<VerifiedSupabaseToken> {
  const issuer = new URL('/auth/v1', supabaseUrl).href;
  const { payload } = await jwtVerify(token, JWKS, {
    issuer,
  });

  return payload as VerifiedSupabaseToken;
}

/**
 * Extract a Bearer token from a Request's Authorization header.
 * Returns null if none present or malformed.
 */
export function getBearerTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;

  const [scheme, value] = auth.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !value) return null;

  return value.trim();
}

