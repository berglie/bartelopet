/**
 * Error classes and utilities for Vipps OAuth integration
 * @module vipps/errors
 */

import { VippsErrorCode } from './types';

/**
 * Base error class for all Vipps-related errors
 */
export class VippsError extends Error {
  public readonly code: VippsErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: VippsErrorCode = VippsErrorCode.UNKNOWN_ERROR,
    details?: unknown
  ) {
    super(message);
    this.name = 'VippsError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VippsError);
    }
  }

  /**
   * Convert error to JSON-serializable object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * OAuth-specific errors (authorization, token exchange, etc.)
 */
export class VippsOAuthError extends VippsError {
  public readonly statusCode?: number;
  public readonly errorDescription?: string;

  constructor(
    message: string,
    code: VippsErrorCode,
    statusCode?: number,
    errorDescription?: string,
    details?: unknown
  ) {
    super(message, code, details);
    this.name = 'VippsOAuthError';
    this.statusCode = statusCode;
    this.errorDescription = errorDescription;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      errorDescription: this.errorDescription,
    };
  }
}

/**
 * API-specific errors (network issues, rate limits, etc.)
 */
export class VippsApiError extends VippsError {
  public readonly statusCode?: number;
  public readonly response?: unknown;

  constructor(
    message: string,
    code: VippsErrorCode,
    statusCode?: number,
    response?: unknown
  ) {
    super(message, code, response);
    this.name = 'VippsApiError';
    this.statusCode = statusCode;
    this.response = response;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      response: this.response,
    };
  }
}

/**
 * Norwegian error messages for user-friendly display
 */
export const ErrorMessages: Record<VippsErrorCode, string> = {
  [VippsErrorCode.MISSING_CONFIG]:
    'Vipps-konfigurasjon mangler. Kontakt systemadministrator.',
  [VippsErrorCode.INVALID_CONFIG]:
    'Ugyldig Vipps-konfigurasjon. Kontakt systemadministrator.',
  [VippsErrorCode.CLIENT_SIDE_ACCESS]:
    'Vipps-konfigurasjon kan ikke aksesseres fra klientsiden.',

  [VippsErrorCode.INVALID_CODE]: 'Ugyldig autorisasjonskode fra Vipps.',
  [VippsErrorCode.INVALID_TOKEN]: 'Ugyldig eller utløpt Vipps-token.',
  [VippsErrorCode.TOKEN_EXPIRED]:
    'Vipps-innloggingen har utløpt. Vennligst logg inn på nytt.',
  [VippsErrorCode.INVALID_GRANT]:
    'Ugyldig autorisasjon. Vennligst prøv å logge inn på nytt.',

  [VippsErrorCode.API_ERROR]:
    'Feil ved kommunikasjon med Vipps. Prøv igjen senere.',
  [VippsErrorCode.NETWORK_ERROR]:
    'Nettverksfeil ved tilkobling til Vipps. Sjekk internettforbindelsen din.',
  [VippsErrorCode.TIMEOUT_ERROR]:
    'Forespørselen til Vipps tok for lang tid. Prøv igjen.',
  [VippsErrorCode.RATE_LIMIT_ERROR]:
    'For mange forespørsler til Vipps. Vennligst vent litt før du prøver igjen.',

  [VippsErrorCode.INVALID_CODE_VERIFIER]:
    'Ugyldig PKCE-verifiseringskode. Prøv å logge inn på nytt.',
  [VippsErrorCode.INVALID_CODE_CHALLENGE]:
    'Ugyldig PKCE-utfordringskode. Prøv å logge inn på nytt.',

  [VippsErrorCode.USER_INFO_ERROR]:
    'Kunne ikke hente brukerinformasjon fra Vipps.',

  [VippsErrorCode.UNKNOWN_ERROR]:
    'En ukjent feil oppstod. Vennligst prøv igjen.',
};

/**
 * Get user-friendly Norwegian error message for error code
 */
export function getErrorMessage(code: VippsErrorCode): string {
  return ErrorMessages[code] || ErrorMessages[VippsErrorCode.UNKNOWN_ERROR];
}

/**
 * Create a VippsError from an unknown error object
 */
export function createVippsError(error: unknown): VippsError {
  if (error instanceof VippsError) {
    return error;
  }

  if (error instanceof Error) {
    return new VippsError(
      error.message,
      VippsErrorCode.UNKNOWN_ERROR,
      error
    );
  }

  if (typeof error === 'string') {
    return new VippsError(error, VippsErrorCode.UNKNOWN_ERROR);
  }

  return new VippsError(
    'An unknown error occurred',
    VippsErrorCode.UNKNOWN_ERROR,
    error
  );
}

/**
 * Create a VippsOAuthError from OAuth error response
 */
export function createOAuthError(
  error: string,
  errorDescription?: string,
  statusCode?: number
): VippsOAuthError {
  // Map OAuth error codes to VippsErrorCode
  const errorCodeMap: Record<string, VippsErrorCode> = {
    invalid_request: VippsErrorCode.INVALID_CONFIG,
    invalid_client: VippsErrorCode.INVALID_CONFIG,
    invalid_grant: VippsErrorCode.INVALID_GRANT,
    unauthorized_client: VippsErrorCode.INVALID_CONFIG,
    unsupported_grant_type: VippsErrorCode.INVALID_CONFIG,
    invalid_scope: VippsErrorCode.INVALID_CONFIG,
    access_denied: VippsErrorCode.INVALID_GRANT,
    expired_token: VippsErrorCode.TOKEN_EXPIRED,
  };

  const code = errorCodeMap[error] || VippsErrorCode.API_ERROR;
  const message = errorDescription || error || 'OAuth error occurred';

  return new VippsOAuthError(message, code, statusCode, errorDescription, {
    error,
  });
}

/**
 * Create a VippsApiError from HTTP response
 */
export function createApiError(
  message: string,
  statusCode: number,
  response?: unknown
): VippsApiError {
  let code = VippsErrorCode.API_ERROR;

  // Map HTTP status codes to error codes
  if (statusCode === 429) {
    code = VippsErrorCode.RATE_LIMIT_ERROR;
  } else if (statusCode === 401 || statusCode === 403) {
    code = VippsErrorCode.INVALID_TOKEN;
  } else if (statusCode >= 500) {
    code = VippsErrorCode.API_ERROR;
  } else if (statusCode === 408 || statusCode === 504) {
    code = VippsErrorCode.TIMEOUT_ERROR;
  }

  return new VippsApiError(message, code, statusCode, response);
}

/**
 * Create a network error
 */
export function createNetworkError(
  message: string = 'Network error occurred',
  details?: unknown
): VippsApiError {
  return new VippsApiError(
    message,
    VippsErrorCode.NETWORK_ERROR,
    undefined,
    details
  );
}

/**
 * Create a configuration error
 */
export function createConfigError(
  message: string,
  code:
    | VippsErrorCode.MISSING_CONFIG
    | VippsErrorCode.INVALID_CONFIG
    | VippsErrorCode.CLIENT_SIDE_ACCESS = VippsErrorCode.INVALID_CONFIG
): VippsError {
  return new VippsError(message, code);
}

/**
 * Check if error is a Vipps error
 */
export function isVippsError(error: unknown): error is VippsError {
  return error instanceof VippsError;
}

/**
 * Check if error is a Vipps OAuth error
 */
export function isVippsOAuthError(error: unknown): error is VippsOAuthError {
  return error instanceof VippsOAuthError;
}

/**
 * Check if error is a Vipps API error
 */
export function isVippsApiError(error: unknown): error is VippsApiError {
  return error instanceof VippsApiError;
}
