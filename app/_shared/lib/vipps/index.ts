/**
 * Vipps OAuth Integration Library
 * Complete TypeScript implementation of Vipps OAuth with PKCE support
 *
 * @module vipps
 *
 * @example
 * ```typescript
 * // Generate PKCE parameters
 * import { generatePKCEParams } from '@/app/_shared/lib/vipps';
 * const { codeVerifier, codeChallenge } = generatePKCEParams();
 *
 * // Exchange code for token
 * import { VippsClient } from '@/app/_shared/lib/vipps';
 * const client = new VippsClient();
 * const tokens = await client.exchangeCodeForToken(code, codeVerifier, redirectUri);
 * const userInfo = await client.getUserInfo(tokens.access_token);
 * ```
 */

// PKCE utilities
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCEParams,
  base64UrlEncode,
  isValidCodeVerifier,
  isValidCodeChallenge,
  verifyCodeChallenge,
  validatePKCEParams,
} from './pkce';

// Configuration
export {
  getVippsConfig,
  getVippsConfigFromEnv,
  getVippsEndpoints,
  hasVippsConfig,
  getAuthorizationUrl,
} from './config';

// Client
export { VippsClient, createVippsClient } from './client';

// Error handling
export {
  VippsError,
  VippsOAuthError,
  VippsApiError,
  getErrorMessage,
  createVippsError,
  createOAuthError,
  createApiError,
  createNetworkError,
  createConfigError,
  isVippsError,
  isVippsOAuthError,
  isVippsApiError,
  ErrorMessages,
} from './errors';

// Types
export {
  VippsErrorCode,
  type VippsConfig,
  type VippsEndpoints,
  type VippsUserInfo,
  type VippsAddress,
  type VippsAccount,
  type VippsTokenResponse,
  type VippsErrorResponse,
  type VippsOAuthSession,
  type VippsRequestOptions,
  type PKCEParams,
} from './types';
