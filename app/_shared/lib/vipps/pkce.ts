/**
 * PKCE (Proof Key for Code Exchange) implementation for Vipps OAuth
 * Implements RFC 7636 specification
 * @module vipps/pkce
 */

import { createHash, randomBytes } from 'crypto';
import { VippsError } from './errors';
import type { PKCEParams } from './types';
import { VippsErrorCode } from './types';

/**
 * Minimum length for code verifier (RFC 7636)
 */
const CODE_VERIFIER_MIN_LENGTH = 43;

/**
 * Maximum length for code verifier (RFC 7636)
 */
const CODE_VERIFIER_MAX_LENGTH = 128;

/**
 * Generate a cryptographically secure random code verifier for PKCE
 * According to RFC 7636, the code verifier must be:
 * - 43-128 characters long
 * - Composed of unreserved characters [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
 *
 * @param length - Length of the code verifier (default: 43, minimum safe length)
 * @returns Base64url-encoded random string suitable for PKCE code verifier
 * @throws {VippsError} If length is outside valid range
 *
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier();
 * console.log(verifier.length); // 43
 * ```
 */
export function generateCodeVerifier(length: number = 43): string {
  // Validate length according to RFC 7636
  if (length < CODE_VERIFIER_MIN_LENGTH || length > CODE_VERIFIER_MAX_LENGTH) {
    throw new VippsError(
      `Code verifier length must be between ${CODE_VERIFIER_MIN_LENGTH} and ${CODE_VERIFIER_MAX_LENGTH} characters`,
      VippsErrorCode.INVALID_CODE_VERIFIER
    );
  }

  // Generate random bytes
  // We need more bytes than characters since base64url encoding reduces entropy
  // 32 bytes = 43 base64url characters (optimal for minimum length)
  const byteLength = Math.ceil((length * 3) / 4);
  const randomBuffer = randomBytes(byteLength);

  // Encode to base64url and trim to exact length
  const verifier = base64UrlEncode(randomBuffer).slice(0, length);

  // Validate the generated verifier
  if (!isValidCodeVerifier(verifier)) {
    throw new VippsError(
      'Generated code verifier is invalid',
      VippsErrorCode.INVALID_CODE_VERIFIER
    );
  }

  return verifier;
}

/**
 * Generate a code challenge from a code verifier using SHA256
 * According to RFC 7636, the code challenge is:
 * - BASE64URL(SHA256(ASCII(code_verifier)))
 *
 * @param codeVerifier - The code verifier to hash
 * @returns Base64url-encoded SHA256 hash of the code verifier
 * @throws {VippsError} If code verifier is invalid
 *
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier();
 * const challenge = generateCodeChallenge(verifier);
 * // Store verifier securely, send challenge to Vipps
 * ```
 */
export function generateCodeChallenge(codeVerifier: string): string {
  // Validate code verifier
  if (!isValidCodeVerifier(codeVerifier)) {
    throw new VippsError(
      'Invalid code verifier format',
      VippsErrorCode.INVALID_CODE_VERIFIER
    );
  }

  // Create SHA256 hash
  const hash = createHash('sha256');
  hash.update(codeVerifier);
  const digest = hash.digest();

  // Encode to base64url
  return base64UrlEncode(digest);
}

/**
 * Convert a Buffer to base64url encoding
 * Base64url encoding is base64 with:
 * - '+' replaced with '-'
 * - '/' replaced with '_'
 * - Padding '=' removed
 *
 * @param buffer - Buffer to encode
 * @returns Base64url-encoded string
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from('hello world');
 * const encoded = base64UrlEncode(buffer);
 * console.log(encoded); // 'aGVsbG8gd29ybGQ'
 * ```
 */
export function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Validate that a code verifier meets RFC 7636 requirements
 *
 * @param codeVerifier - Code verifier to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier();
 * console.log(isValidCodeVerifier(verifier)); // true
 * console.log(isValidCodeVerifier('abc')); // false (too short)
 * ```
 */
export function isValidCodeVerifier(codeVerifier: string): boolean {
  // Check if codeVerifier is a string
  if (typeof codeVerifier !== 'string') {
    return false;
  }

  // Check length
  if (
    codeVerifier.length < CODE_VERIFIER_MIN_LENGTH ||
    codeVerifier.length > CODE_VERIFIER_MAX_LENGTH
  ) {
    return false;
  }

  // Check if it only contains unreserved characters [A-Za-z0-9-._~]
  // RFC 7636 Section 4.1
  const unreservedChars = /^[A-Za-z0-9\-._~]+$/;
  return unreservedChars.test(codeVerifier);
}

/**
 * Validate that a code challenge meets RFC 7636 requirements
 *
 * @param codeChallenge - Code challenge to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier();
 * const challenge = generateCodeChallenge(verifier);
 * console.log(isValidCodeChallenge(challenge)); // true
 * ```
 */
export function isValidCodeChallenge(codeChallenge: string): boolean {
  // Check if codeChallenge is a string
  if (typeof codeChallenge !== 'string') {
    return false;
  }

  // SHA256 base64url encoded should be 43 characters
  if (codeChallenge.length !== 43) {
    return false;
  }

  // Check if it only contains base64url characters [A-Za-z0-9-_]
  const base64UrlChars = /^[A-Za-z0-9\-_]+$/;
  return base64UrlChars.test(codeChallenge);
}

/**
 * Generate PKCE parameters (verifier and challenge)
 * Convenience function that generates both code verifier and challenge
 *
 * @param verifierLength - Length of code verifier (default: 43)
 * @returns Object containing code verifier, challenge, and method
 *
 * @example
 * ```typescript
 * const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePKCEParams();
 * // Store codeVerifier securely in session
 * // Send codeChallenge and codeChallengeMethod to Vipps authorization endpoint
 * ```
 */
export function generatePKCEParams(verifierLength: number = 43): PKCEParams {
  const codeVerifier = generateCodeVerifier(verifierLength);
  const codeChallenge = generateCodeChallenge(codeVerifier);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Verify that a code verifier generates the expected code challenge
 * Useful for validating stored PKCE parameters
 *
 * @param codeVerifier - The code verifier to test
 * @param expectedChallenge - The expected code challenge
 * @returns true if verifier generates the expected challenge
 *
 * @example
 * ```typescript
 * const verifier = generateCodeVerifier();
 * const challenge = generateCodeChallenge(verifier);
 * console.log(verifyCodeChallenge(verifier, challenge)); // true
 * console.log(verifyCodeChallenge(verifier, 'wrong_challenge')); // false
 * ```
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  expectedChallenge: string
): boolean {
  try {
    const actualChallenge = generateCodeChallenge(codeVerifier);
    return actualChallenge === expectedChallenge;
  } catch {
    return false;
  }
}

/**
 * Sanitize and validate PKCE parameters from storage
 * Use this when retrieving PKCE parameters from session/cookies
 *
 * @param params - PKCE parameters to validate
 * @returns Validated PKCE parameters
 * @throws {VippsError} If parameters are invalid
 *
 * @example
 * ```typescript
 * const storedParams = getFromSession('pkce');
 * const validParams = validatePKCEParams(storedParams);
 * ```
 */
export function validatePKCEParams(params: unknown): PKCEParams {
  if (!params || typeof params !== 'object') {
    throw new VippsError(
      'Invalid PKCE parameters',
      VippsErrorCode.INVALID_CODE_VERIFIER
    );
  }

  const { codeVerifier, codeChallenge, codeChallengeMethod } = params as Record<
    string,
    unknown
  >;

  // Validate code verifier
  if (typeof codeVerifier !== 'string' || !isValidCodeVerifier(codeVerifier)) {
    throw new VippsError(
      'Invalid code verifier',
      VippsErrorCode.INVALID_CODE_VERIFIER
    );
  }

  // Validate code challenge
  if (
    typeof codeChallenge !== 'string' ||
    !isValidCodeChallenge(codeChallenge)
  ) {
    throw new VippsError(
      'Invalid code challenge',
      VippsErrorCode.INVALID_CODE_CHALLENGE
    );
  }

  // Validate code challenge method
  if (codeChallengeMethod !== 'S256') {
    throw new VippsError(
      'Invalid code challenge method. Only S256 is supported.',
      VippsErrorCode.INVALID_CODE_CHALLENGE
    );
  }

  // Verify that challenge matches verifier
  if (!verifyCodeChallenge(codeVerifier, codeChallenge)) {
    throw new VippsError(
      'Code challenge does not match code verifier',
      VippsErrorCode.INVALID_CODE_CHALLENGE
    );
  }

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}
