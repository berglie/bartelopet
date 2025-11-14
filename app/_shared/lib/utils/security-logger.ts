/**
 * Security Logging System
 * Centralized logging for security-relevant events with PII redaction
 */

type LogLevel = 'info' | 'warn' | 'error' | 'critical';

type SecurityEvent =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed'
  | 'auth.session_expired'
  | 'authz.denied'
  | 'authz.granted'
  | 'data.export'
  | 'data.deletion'
  | 'csrf.attempt'
  | 'rate_limit.exceeded'
  | 'path_traversal.attempt'
  | 'injection.attempt'
  | 'validation.failed'
  | 'upload.failed'
  | 'upload.success';

interface SecurityLogContext {
  event: SecurityEvent;
  userId?: string;
  participantId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  success?: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Redact PII from log data
 */
function redactPII(value: unknown): unknown {
  if (typeof value === 'string') {
    // Redact email addresses
    let redactedValue = value.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[EMAIL_REDACTED]'
    );

    // Redact phone numbers (various formats)
    redactedValue = redactedValue.replace(
      /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
      '[PHONE_REDACTED]'
    );

    // Redact Norwegian postal codes with addresses
    redactedValue = redactedValue.replace(/\d{4}\s+[A-ZÆØÅ][a-zæøå]+/g, '[ADDRESS_REDACTED]');

    return redactedValue;
  } else if (typeof value === 'object' && value !== null) {
    // Redact specific PII fields
    const piiFields = ['email', 'phone', 'phone_number', 'postal_address', 'address', 'ssn'];

    if (Array.isArray(value)) {
      return value.map((item) => redactPII(item));
    }

    const redacted: Record<string, unknown> = {};

    for (const key in value) {
      if (piiFields.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactPII((value as Record<string, unknown>)[key]);
      }
    }

    return redacted;
  }

  return value;
}

/**
 * Format log message for output
 */
function formatLogMessage(level: LogLevel, context: SecurityLogContext): string {
  const timestamp = new Date().toISOString();
  const redactedMetadata = context.metadata
    ? (redactPII(context.metadata) as Record<string, unknown>)
    : {};

  return JSON.stringify({
    timestamp,
    level,
    event: context.event,
    userId: context.userId || '[anonymous]',
    participantId: context.participantId,
    ipAddress: context.ipAddress ? maskIP(context.ipAddress) : undefined,
    userAgent: context.userAgent ? maskUserAgent(context.userAgent) : undefined,
    resource: context.resource,
    action: context.action,
    success: context.success,
    error: context.error,
    ...redactedMetadata,
  });
}

/**
 * Mask IP address (keep first 2 octets for IPv4, first 4 groups for IPv6)
 */
function maskIP(ip: string): string {
  if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    return `${parts.slice(0, 4).join(':')}:****:****:****:****`;
  } else {
    // IPv4
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.***:***`;
  }
}

/**
 * Mask user agent (keep browser and OS, remove version details)
 */
function maskUserAgent(ua: string): string {
  // Simple masking - keep major browser/OS info
  return ua.replace(/\d+\.\d+(\.\d+)?/g, 'X.X');
}

/**
 * Log security event to console (in production, send to logging service)
 */
function logToDestination(level: LogLevel, message: string): void {
  if (process.env.NODE_ENV === 'production') {
    // In production, send to external logging service
    // Examples: Sentry, LogRocket, Datadog, CloudWatch, etc.

    // For now, use console with appropriate method
    switch (level) {
      case 'critical':
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'info':
      default:
        console.log(message);
    }

    // TODO: Send to external service
    // sendToLoggingService(level, message)
  } else {
    // In development, use console
    console.log(message);
  }
}

/**
 * Main logging functions
 */
export const securityLogger = {
  /**
   * Log informational security event
   */
  info(context: SecurityLogContext): void {
    const message = formatLogMessage('info', context);
    logToDestination('info', message);
  },

  /**
   * Log warning security event
   */
  warn(context: SecurityLogContext): void {
    const message = formatLogMessage('warn', context);
    logToDestination('warn', message);
  },

  /**
   * Log error security event
   */
  error(context: SecurityLogContext): void {
    const message = formatLogMessage('error', context);
    logToDestination('error', message);
  },

  /**
   * Log critical security event (requires immediate attention)
   */
  critical(context: SecurityLogContext): void {
    const message = formatLogMessage('critical', context);
    logToDestination('critical', message);

    // TODO: Send alerts for critical events (email, Slack, PagerDuty, etc.)
  },

  /**
   * Log authentication event
   */
  auth(
    success: boolean,
    userId?: string,
    error?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.info({
      event: success ? 'auth.login' : 'auth.failed',
      userId,
      success,
      error,
      metadata,
    });
  },

  /**
   * Log authorization event
   */
  authz(granted: boolean, userId: string, resource: string, action: string, error?: string): void {
    this.warn({
      event: granted ? 'authz.granted' : 'authz.denied',
      userId,
      resource,
      action,
      success: granted,
      error,
    });
  },

  /**
   * Log data export event (GDPR)
   */
  dataExport(userId: string, participantId: string): void {
    this.info({
      event: 'data.export',
      userId,
      participantId,
      action: 'export_user_data',
      success: true,
    });
  },

  /**
   * Log account deletion event (GDPR)
   */
  dataDeletion(userId: string, participantId: string, success: boolean): void {
    this.critical({
      event: 'data.deletion',
      userId,
      participantId,
      action: 'delete_user_account',
      success,
    });
  },

  /**
   * Log potential security attack
   */
  securityThreat(
    threatType: 'csrf' | 'path_traversal' | 'injection',
    userId?: string,
    details?: Record<string, unknown>
  ): void {
    const eventMap = {
      csrf: 'csrf.attempt' as const,
      path_traversal: 'path_traversal.attempt' as const,
      injection: 'injection.attempt' as const,
    };

    this.critical({
      event: eventMap[threatType],
      userId,
      success: false,
      metadata: details,
    });
  },

  /**
   * Log rate limit exceeded
   */
  rateLimitExceeded(action: string, identifier: string, ipAddress?: string): void {
    this.warn({
      event: 'rate_limit.exceeded',
      action,
      ipAddress,
      metadata: { identifier },
    });
  },

  /**
   * Log validation failure
   */
  validationFailed(resource: string, userId?: string, errors?: unknown): void {
    this.warn({
      event: 'validation.failed',
      userId,
      resource,
      success: false,
      metadata: { errors: redactPII(errors) },
    });
  },
};

/**
 * Export redactPII for use in other modules
 */
export { redactPII };
