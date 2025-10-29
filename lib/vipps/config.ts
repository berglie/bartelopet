/**
 * Configuration management for Vipps OAuth integration
 * Handles environment variables and endpoint configuration
 * @module vipps/config
 */

import { createConfigError } from './errors';
import { VippsErrorCode } from './types';
import type { VippsConfig, VippsEndpoints } from './types';

/**
 * Vipps API endpoints for test environment
 */
const TEST_ENDPOINTS: VippsEndpoints = {
  authorize: 'https://apitest.vipps.no/access-management-1.0/access/oauth2/auth',
  token: 'https://apitest.vipps.no/access-management-1.0/access/oauth2/token',
  userInfo: 'https://apitest.vipps.no/vipps-userinfo-api/userinfo',
  baseUrl: 'https://apitest.vipps.no',
};

/**
 * Vipps API endpoints for production environment
 */
const PRODUCTION_ENDPOINTS: VippsEndpoints = {
  authorize: 'https://api.vipps.no/access-management-1.0/access/oauth2/auth',
  token: 'https://api.vipps.no/access-management-1.0/access/oauth2/token',
  userInfo: 'https://api.vipps.no/vipps-userinfo-api/userinfo',
  baseUrl: 'https://api.vipps.no',
};

/**
 * Get Vipps API endpoints for the specified environment
 *
 * @param environment - Environment to get endpoints for ('test' or 'production')
 * @returns Vipps API endpoints object
 *
 * @example
 * ```typescript
 * const endpoints = getVippsEndpoints('test');
 * console.log(endpoints.authorize); // https://apitest.vipps.no/access-management-1.0/access/oauth2/auth
 * ```
 */
export function getVippsEndpoints(
  environment: 'test' | 'production'
): VippsEndpoints {
  return environment === 'production' ? PRODUCTION_ENDPOINTS : TEST_ENDPOINTS;
}

/**
 * Validate that a string is not empty
 *
 * @param value - Value to validate
 * @param name - Name of the value (for error messages)
 * @throws {VippsError} If value is empty or not a string
 */
function validateRequiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createConfigError(
      `${name} is required and must be a non-empty string`,
      VippsErrorCode.MISSING_CONFIG
    );
  }
  return value.trim();
}

/**
 * Validate environment variable
 *
 * @param env - Environment variables object
 * @param key - Environment variable key
 * @param displayName - Human-readable name for error messages
 * @returns Validated and trimmed environment variable value
 * @throws {VippsError} If environment variable is missing or invalid
 */
function validateEnvVar(
  env: Record<string, string | undefined>,
  key: string,
  displayName: string
): string {
  const value = env[key];
  if (!value || value.trim() === '') {
    throw createConfigError(
      `Missing required environment variable: ${key} (${displayName})`,
      VippsErrorCode.MISSING_CONFIG
    );
  }
  return value.trim();
}

/**
 * Validate environment value (test or production)
 *
 * @param value - Environment value to validate
 * @returns Validated environment value
 * @throws {VippsError} If environment value is invalid
 */
function validateEnvironment(value: string): 'test' | 'production' {
  if (value !== 'test' && value !== 'production') {
    throw createConfigError(
      `VIPPS_ENVIRONMENT must be either 'test' or 'production', got: ${value}`,
      VippsErrorCode.INVALID_CONFIG
    );
  }
  return value;
}

/**
 * Validate redirect URI format
 *
 * @param uri - URI to validate
 * @returns Validated URI
 * @throws {VippsError} If URI is invalid
 */
function validateRedirectUri(uri: string): string {
  try {
    const url = new URL(uri);

    // Ensure HTTPS in production (HTTP allowed in development/test)
    if (
      process.env.NODE_ENV === 'production' &&
      url.protocol !== 'https:'
    ) {
      throw createConfigError(
        'Redirect URI must use HTTPS in production',
        VippsErrorCode.INVALID_CONFIG
      );
    }

    return uri;
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTTPS')) {
      throw error;
    }
    throw createConfigError(
      `Invalid redirect URI format: ${uri}`,
      VippsErrorCode.INVALID_CONFIG
    );
  }
}

/**
 * Prevent client-side access to server-only configuration
 * Throws an error if called in a browser environment
 *
 * @throws {VippsError} If called in browser environment
 */
function preventClientSideAccess(): void {
  if (typeof window !== 'undefined') {
    throw createConfigError(
      'Vipps configuration cannot be accessed from client-side code. ' +
        'This configuration contains sensitive information and must only be used in server-side code.',
      VippsErrorCode.CLIENT_SIDE_ACCESS
    );
  }
}

/**
 * Get validated Vipps configuration from environment variables
 * This function must only be called from server-side code (API routes, server components, etc.)
 *
 * Required environment variables:
 * - VIPPS_CLIENT_ID: Vipps client ID
 * - VIPPS_CLIENT_SECRET: Vipps client secret
 * - VIPPS_MERCHANT_SERIAL_NUMBER: Vipps merchant serial number (MSN)
 * - VIPPS_SUBSCRIPTION_KEY: Vipps subscription key (Ocp-Apim-Subscription-Key)
 * - VIPPS_REDIRECT_URI: OAuth redirect URI
 * - VIPPS_ENVIRONMENT: 'test' or 'production'
 *
 * @returns Validated Vipps configuration object
 * @throws {VippsError} If any required configuration is missing or invalid
 * @throws {VippsError} If called from client-side code
 *
 * @example
 * ```typescript
 * // In API route or server component
 * const config = getVippsConfig();
 * console.log(config.clientId);
 * console.log(config.environment); // 'test' or 'production'
 * ```
 *
 * @example
 * ```typescript
 * // .env file example
 * VIPPS_CLIENT_ID=your-client-id
 * VIPPS_CLIENT_SECRET=your-client-secret
 * VIPPS_MERCHANT_SERIAL_NUMBER=123456
 * VIPPS_SUBSCRIPTION_KEY=your-subscription-key
 * VIPPS_REDIRECT_URI=https://yourdomain.com/api/auth/vipps/callback
 * VIPPS_ENVIRONMENT=test
 * ```
 */
export function getVippsConfig(): VippsConfig {
  // Prevent client-side access
  preventClientSideAccess();

  // Get environment variables
  const env = process.env;

  try {
    // Validate all required environment variables
    const clientId = validateEnvVar(env, 'VIPPS_CLIENT_ID', 'Client ID');
    const clientSecret = validateEnvVar(
      env,
      'VIPPS_CLIENT_SECRET',
      'Client Secret'
    );
    const merchantSerialNumber = validateEnvVar(
      env,
      'VIPPS_MERCHANT_SERIAL_NUMBER',
      'Merchant Serial Number'
    );
    const subscriptionKey = validateEnvVar(
      env,
      'VIPPS_SUBSCRIPTION_KEY',
      'Subscription Key'
    );
    const redirectUri = validateEnvVar(
      env,
      'VIPPS_REDIRECT_URI',
      'Redirect URI'
    );
    const environmentRaw = validateEnvVar(
      env,
      'VIPPS_ENVIRONMENT',
      'Environment'
    );

    // Validate environment value
    const environment = validateEnvironment(environmentRaw);

    // Validate redirect URI format
    const validatedRedirectUri = validateRedirectUri(redirectUri);

    // Return validated configuration
    return {
      clientId,
      clientSecret,
      merchantSerialNumber,
      subscriptionKey,
      redirectUri: validatedRedirectUri,
      environment,
    };
  } catch (error) {
    // Re-throw VippsError instances
    if (error instanceof Error && error.name === 'VippsError') {
      throw error;
    }

    // Wrap other errors
    throw createConfigError(
      `Failed to load Vipps configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      VippsErrorCode.INVALID_CONFIG
    );
  }
}

/**
 * Get configuration with custom environment variables (useful for testing)
 *
 * @param env - Environment variables object
 * @returns Validated Vipps configuration object
 * @throws {VippsError} If any required configuration is missing or invalid
 *
 * @example
 * ```typescript
 * const config = getVippsConfigFromEnv({
 *   VIPPS_CLIENT_ID: 'test-client-id',
 *   VIPPS_CLIENT_SECRET: 'test-secret',
 *   // ... other required vars
 * });
 * ```
 */
export function getVippsConfigFromEnv(
  env: Record<string, string | undefined>
): VippsConfig {
  // Prevent client-side access
  preventClientSideAccess();

  const clientId = validateEnvVar(env, 'VIPPS_CLIENT_ID', 'Client ID');
  const clientSecret = validateEnvVar(
    env,
    'VIPPS_CLIENT_SECRET',
    'Client Secret'
  );
  const merchantSerialNumber = validateEnvVar(
    env,
    'VIPPS_MERCHANT_SERIAL_NUMBER',
    'Merchant Serial Number'
  );
  const subscriptionKey = validateEnvVar(
    env,
    'VIPPS_SUBSCRIPTION_KEY',
    'Subscription Key'
  );
  const redirectUri = validateEnvVar(env, 'VIPPS_REDIRECT_URI', 'Redirect URI');
  const environmentRaw = validateEnvVar(env, 'VIPPS_ENVIRONMENT', 'Environment');

  const environment = validateEnvironment(environmentRaw);
  const validatedRedirectUri = validateRedirectUri(redirectUri);

  return {
    clientId,
    clientSecret,
    merchantSerialNumber,
    subscriptionKey,
    redirectUri: validatedRedirectUri,
    environment,
  };
}

/**
 * Check if Vipps configuration is available
 * Returns true if all required environment variables are set
 * Does not throw errors, useful for conditional features
 *
 * @returns true if configuration is available, false otherwise
 *
 * @example
 * ```typescript
 * if (hasVippsConfig()) {
 *   // Show Vipps login button
 * } else {
 *   // Hide Vipps login option
 * }
 * ```
 */
export function hasVippsConfig(): boolean {
  // Prevent client-side access
  if (typeof window !== 'undefined') {
    return false;
  }

  try {
    getVippsConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get full authorization URL for Vipps OAuth flow
 *
 * @param config - Vipps configuration
 * @param params - Authorization parameters
 * @returns Full authorization URL
 *
 * @example
 * ```typescript
 * const config = getVippsConfig();
 * const url = getAuthorizationUrl(config, {
 *   state: 'random-state',
 *   codeChallenge: 'challenge-string',
 *   scope: 'openid email',
 * });
 * // Redirect user to url
 * ```
 */
export function getAuthorizationUrl(
  config: VippsConfig,
  params: {
    state: string;
    codeChallenge: string;
    scope?: string;
    loginHint?: string;
  }
): string {
  const endpoints = getVippsEndpoints(config.environment);
  const scope = params.scope || 'openid email';

  const searchParams = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope,
    state: params.state,
    redirect_uri: config.redirectUri,
    code_challenge: params.codeChallenge,
    code_challenge_method: 'S256',
  });

  // Add optional login hint
  if (params.loginHint) {
    searchParams.set('login_hint', params.loginHint);
  }

  return `${endpoints.authorize}?${searchParams.toString()}`;
}
