/**
 * TypeScript types and interfaces for Vipps OAuth integration
 * @module vipps/types
 */

/**
 * Vipps error codes for different error scenarios
 */
export enum VippsErrorCode {
  // Configuration errors
  MISSING_CONFIG = 'MISSING_CONFIG',
  INVALID_CONFIG = 'INVALID_CONFIG',
  CLIENT_SIDE_ACCESS = 'CLIENT_SIDE_ACCESS',

  // OAuth errors
  INVALID_CODE = 'INVALID_CODE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_GRANT = 'INVALID_GRANT',

  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',

  // PKCE errors
  INVALID_CODE_VERIFIER = 'INVALID_CODE_VERIFIER',
  INVALID_CODE_CHALLENGE = 'INVALID_CODE_CHALLENGE',

  // User info errors
  USER_INFO_ERROR = 'USER_INFO_ERROR',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Vipps configuration interface
 * Contains all required settings for Vipps OAuth integration
 */
export interface VippsConfig {
  /** Vipps client ID */
  clientId: string;

  /** Vipps client secret (server-side only) */
  clientSecret: string;

  /** Vipps merchant serial number (MSN) */
  merchantSerialNumber: string;

  /** Vipps subscription key (Ocp-Apim-Subscription-Key) */
  subscriptionKey: string;

  /** OAuth redirect URI */
  redirectUri: string;

  /** Environment: test or production */
  environment: 'test' | 'production';
}

/**
 * Vipps API endpoints for different environments
 */
export interface VippsEndpoints {
  /** Authorization endpoint for OAuth flow */
  authorize: string;

  /** Token endpoint for exchanging authorization code */
  token: string;

  /** User info endpoint for retrieving user details */
  userInfo: string;

  /** Base API URL */
  baseUrl: string;
}

/**
 * Vipps user information response
 * Matches the structure returned by Vipps /userinfo endpoint
 */
export interface VippsUserInfo {
  /** Unique user identifier (subject) */
  sub: string;

  /** User's birth date (YYYY-MM-DD) */
  birthdate?: string;

  /** User's email address */
  email?: string;

  /** Whether email is verified */
  email_verified?: boolean;

  /** User's family name (last name) */
  family_name?: string;

  /** User's given name (first name) */
  given_name?: string;

  /** User's full name */
  name?: string;

  /** Norwegian national identity number (11 digits) */
  nin?: string;

  /** User's phone number (E.164 format) */
  phone_number?: string;

  /** ISO 3166-1 Alpha-2 country code for phone number */
  sid?: string;

  /** User's street address */
  address?: VippsAddress;

  /** Additional accounts linked to user */
  accounts?: VippsAccount[];

  /** Other names user is known by */
  other_addresses?: VippsAddress[];
}

/**
 * Vipps address information
 */
export interface VippsAddress {
  /** Street address */
  street_address?: string;

  /** Postal code */
  postal_code?: string;

  /** Region/city */
  region?: string;

  /** Country code (ISO 3166-1 Alpha-2) */
  country?: string;

  /** Formatted address string */
  formatted?: string;

  /** Address type (e.g., "home", "work") */
  address_type?: string;
}

/**
 * Vipps account information (for linked accounts)
 */
export interface VippsAccount {
  /** Account number */
  account_number?: string;

  /** Account name */
  account_name?: string;

  /** Bank name */
  bank_name?: string;
}

/**
 * Vipps token response from OAuth token endpoint
 */
export interface VippsTokenResponse {
  /** Access token for API requests */
  access_token: string;

  /** Token type (typically "Bearer") */
  token_type: string;

  /** Token expiration time in seconds */
  expires_in: number;

  /** Refresh token for obtaining new access tokens */
  refresh_token?: string;

  /** Granted scopes (space-separated) */
  scope: string;

  /** ID token (JWT) if openid scope was requested */
  id_token?: string;
}

/**
 * Vipps error response structure
 */
export interface VippsErrorResponse {
  /** Error code */
  error: string;

  /** Human-readable error description */
  error_description?: string;

  /** URI with more information about the error */
  error_uri?: string;
}

/**
 * OAuth session data stored during authentication flow
 */
export interface VippsOAuthSession {
  /** PKCE code verifier (must be stored securely) */
  codeVerifier: string;

  /** PKCE code challenge sent to Vipps */
  codeChallenge: string;

  /** OAuth state parameter for CSRF protection */
  state: string;

  /** Redirect URI used in the authorization request */
  redirectUri: string;

  /** Timestamp when session was created */
  createdAt: number;

  /** Requested scopes */
  scopes: string[];
}

/**
 * Vipps API request options
 */
export interface VippsRequestOptions {
  /** Request method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';

  /** Request headers */
  headers?: Record<string, string>;

  /** Request body */
  body?: string | FormData;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Number of retry attempts */
  retries?: number;
}

/**
 * PKCE parameters for OAuth flow
 */
export interface PKCEParams {
  /** Code verifier (43-128 characters) */
  codeVerifier: string;

  /** Code challenge (base64url encoded SHA256 hash of verifier) */
  codeChallenge: string;

  /** Code challenge method (always "S256" for SHA256) */
  codeChallengeMethod: 'S256';
}
