/**
 * Vipps API client for OAuth and user info operations
 * @module vipps/client
 */

import {
  createApiError,
  createNetworkError,
  createOAuthError,
  VippsError,
} from './errors';
import { getVippsConfig, getVippsEndpoints } from './config';
import type {
  VippsConfig,
  VippsTokenResponse,
  VippsUserInfo,
  VippsErrorResponse,
  VippsRequestOptions,
} from './types';
import { VippsErrorCode } from './types';

/**
 * Default request timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Default number of retry attempts
 */
const DEFAULT_RETRIES = 2;

/**
 * Delay between retries in milliseconds
 */
const RETRY_DELAY = 1000; // 1 second

/**
 * Vipps API client class
 * Handles OAuth token exchange and user info retrieval
 *
 * @example
 * ```typescript
 * const client = new VippsClient();
 * const tokens = await client.exchangeCodeForToken(code, verifier, redirectUri);
 * const userInfo = await client.getUserInfo(tokens.access_token);
 * ```
 */
export class VippsClient {
  private config: VippsConfig;

  /**
   * Create a new Vipps client instance
   *
   * @param config - Optional Vipps configuration. If not provided, will be loaded from environment.
   * @throws {VippsError} If configuration is invalid or missing
   */
  constructor(config?: VippsConfig) {
    this.config = config || getVippsConfig();
  }

  /**
   * Exchange authorization code for access token
   * Implements OAuth 2.0 token exchange with PKCE
   *
   * @param code - Authorization code from Vipps
   * @param codeVerifier - PKCE code verifier
   * @param redirectUri - Redirect URI used in authorization request
   * @returns Token response with access token and user info
   * @throws {VippsOAuthError} If token exchange fails
   *
   * @example
   * ```typescript
   * const client = new VippsClient();
   * const tokens = await client.exchangeCodeForToken(
   *   'authorization-code',
   *   'code-verifier',
   *   'https://yourdomain.com/callback'
   * );
   * console.log(tokens.access_token);
   * ```
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<VippsTokenResponse> {
    const endpoints = getVippsEndpoints(this.config.environment);

    // Prepare form data for token request
    const formData = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      // Make token request
      const response = await this.makeRequest<VippsTokenResponse>(
        endpoints.token,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
            'Merchant-Serial-Number': this.config.merchantSerialNumber,
          },
          body: formData.toString(),
          timeout: DEFAULT_TIMEOUT,
          retries: DEFAULT_RETRIES,
        }
      );

      return response;
    } catch (error) {
      // Handle and re-throw with more context
      if (error instanceof VippsError) {
        throw error;
      }

      throw createOAuthError(
        'token_exchange_failed',
        error instanceof Error ? error.message : 'Token exchange failed'
      );
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - Refresh token from previous token response
   * @returns New token response
   * @throws {VippsOAuthError} If token refresh fails
   *
   * @example
   * ```typescript
   * const client = new VippsClient();
   * const tokens = await client.refreshAccessToken('refresh-token-here');
   * ```
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<VippsTokenResponse> {
    const endpoints = getVippsEndpoints(this.config.environment);

    const formData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      const response = await this.makeRequest<VippsTokenResponse>(
        endpoints.token,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
            'Merchant-Serial-Number': this.config.merchantSerialNumber,
          },
          body: formData.toString(),
          timeout: DEFAULT_TIMEOUT,
          retries: DEFAULT_RETRIES,
        }
      );

      return response;
    } catch (error) {
      if (error instanceof VippsError) {
        throw error;
      }

      throw createOAuthError(
        'token_refresh_failed',
        error instanceof Error ? error.message : 'Token refresh failed'
      );
    }
  }

  /**
   * Get user information from Vipps
   * Uses the access token to retrieve user profile data
   *
   * @param accessToken - Access token from token exchange
   * @returns User information from Vipps
   * @throws {VippsApiError} If user info request fails
   *
   * @example
   * ```typescript
   * const client = new VippsClient();
   * const userInfo = await client.getUserInfo('access-token');
   * console.log(userInfo.name, userInfo.email);
   * ```
   */
  async getUserInfo(accessToken: string): Promise<VippsUserInfo> {
    const endpoints = getVippsEndpoints(this.config.environment);

    try {
      const response = await this.makeRequest<VippsUserInfo>(
        endpoints.userInfo,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
            'Merchant-Serial-Number': this.config.merchantSerialNumber,
          },
          timeout: DEFAULT_TIMEOUT,
          retries: DEFAULT_RETRIES,
        }
      );

      return response;
    } catch (error) {
      if (error instanceof VippsError) {
        throw error;
      }

      throw new VippsError(
        error instanceof Error ? error.message : 'Failed to get user info',
        VippsErrorCode.USER_INFO_ERROR
      );
    }
  }

  /**
   * Make an HTTP request with retries and error handling
   *
   * @param url - URL to request
   * @param options - Request options
   * @returns Parsed response data
   * @throws {VippsError} If request fails after all retries
   */
  private async makeRequest<T>(
    url: string,
    options: VippsRequestOptions
  ): Promise<T> {
    const {
      method,
      headers = {},
      body,
      timeout = DEFAULT_TIMEOUT,
      retries = DEFAULT_RETRIES,
    } = options;

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Make request
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle response
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          throw this.createErrorFromResponse(response, errorData);
        }

        // Parse and return successful response
        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if it's a VippsError (already processed)
        if (error instanceof VippsError) {
          throw error;
        }

        // Don't retry on certain errors
        if (this.shouldNotRetry(lastError)) {
          throw this.wrapError(lastError);
        }

        // Check if we should retry
        if (attempt < retries) {
          attempt++;
          await this.delay(RETRY_DELAY * attempt);
          continue;
        }

        // All retries exhausted
        throw this.wrapError(lastError);
      }
    }

    // Should never reach here, but TypeScript needs this
    throw this.wrapError(
      lastError || new Error('Request failed with no error details')
    );
  }

  /**
   * Parse error response from Vipps API
   *
   * @param response - HTTP response
   * @returns Parsed error data
   */
  private async parseErrorResponse(
    response: Response
  ): Promise<VippsErrorResponse | null> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Create VippsError from HTTP response
   *
   * @param response - HTTP response
   * @param errorData - Parsed error data
   * @returns VippsError instance
   */
  private createErrorFromResponse(
    response: Response,
    errorData: VippsErrorResponse | null
  ): VippsError {
    const statusCode = response.status;

    // Handle OAuth errors
    if (errorData && errorData.error) {
      return createOAuthError(
        errorData.error,
        errorData.error_description,
        statusCode
      );
    }

    // Handle other API errors
    const message =
      errorData?.error_description ||
      `API request failed with status ${statusCode}`;

    return createApiError(message, statusCode, errorData);
  }

  /**
   * Wrap generic errors in VippsError
   *
   * @param error - Original error
   * @returns VippsError instance
   */
  private wrapError(error: Error): VippsError {
    // Already a VippsError
    if (error instanceof VippsError) {
      return error;
    }

    // AbortError (timeout)
    if (error.name === 'AbortError') {
      return new VippsError(
        'Request timed out',
        VippsErrorCode.TIMEOUT_ERROR,
        error
      );
    }

    // Network errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('ECONNREFUSED')
    ) {
      return createNetworkError(error.message, error);
    }

    // Generic error
    return new VippsError(
      error.message,
      VippsErrorCode.UNKNOWN_ERROR,
      error
    );
  }

  /**
   * Check if error should not be retried
   *
   * @param error - Error to check
   * @returns true if error should not be retried
   */
  private shouldNotRetry(error: Error): boolean {
    // Don't retry VippsErrors
    if (error instanceof VippsError) {
      return true;
    }

    // Don't retry AbortError (timeout)
    if (error.name === 'AbortError') {
      return true;
    }

    // Don't retry 4xx errors (except 429 rate limit)
    if (error.message.includes('status 4')) {
      return !error.message.includes('429');
    }

    return false;
  }

  /**
   * Delay execution for specified milliseconds
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current configuration
   *
   * @returns Current Vipps configuration
   */
  getConfig(): VippsConfig {
    return { ...this.config };
  }

  /**
   * Update client configuration
   *
   * @param config - New configuration
   */
  setConfig(config: VippsConfig): void {
    this.config = config;
  }
}

/**
 * Create a new Vipps client instance
 * Convenience factory function
 *
 * @param config - Optional configuration
 * @returns VippsClient instance
 *
 * @example
 * ```typescript
 * const client = createVippsClient();
 * ```
 */
export function createVippsClient(config?: VippsConfig): VippsClient {
  return new VippsClient(config);
}
