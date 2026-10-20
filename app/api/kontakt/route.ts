import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/app/_shared/lib/utils/rate-limit';
import { securityLogger } from '@/app/_shared/lib/utils/security-logger';

const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Navn må være minst 2 tegn')
    .max(100, 'Navn kan ikke være lengre enn 100 tegn'),
  email: z
    .string()
    .email('Ugyldig e-postadresse')
    .max(254, 'E-post kan ikke være lengre enn 254 tegn'), // RFC 5321 max length
  message: z
    .string()
    .min(10, 'Meldingen må være minst 10 tegn')
    .max(1000, 'Meldingen kan ikke være lengre enn 1000 tegn'),
});

// Escape HTML special characters to prevent XSS and ensure proper display
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format message for HTML display (escape + preserve line breaks)
function formatMessageForHtml(message: string): string {
  return escapeHtml(message).replace(/\n/g, '<br>');
}

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection: Validate origin header against hardcoded whitelist
    // SECURITY: Do NOT use Host header - it can be manipulated by attackers
    const origin = request.headers.get('origin');

    // Hardcoded allowed origins - NEVER use request.headers.get('host')!
    // Include both Unicode and punycode versions of the domain
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://barteløpet.no',
      'https://www.barteløpet.no',
      'https://xn--bartelpet-q8a.no',
      'https://www.xn--bartelpet-q8a.no',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
      process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null,
    ].filter(Boolean) as string[];

    // Reject requests without Origin header (potential CSRF)
    if (!origin) {
      securityLogger.securityThreat('csrf', undefined, {
        reason: 'Missing Origin header',
        host: request.headers.get('host'),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Ugyldig forespørsel',
        },
        { status: 403 }
      );
    }

    // Validate Origin against whitelist
    if (!allowedOrigins.includes(origin)) {
      securityLogger.securityThreat('csrf', undefined, {
        reason: 'Origin not in whitelist',
        origin,
        host: request.headers.get('host'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Ugyldig forespørsel',
        },
        { status: 403 }
      );
    }

    // Rate limiting check - prevent spam/abuse
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit('contact', clientIp);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'For mange forsøk. Vennligst prøv igjen senere.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = contactSchema.parse(body);

    // Additional email validation to prevent header injection
    // Remove any newlines or carriage returns that could be used for header injection
    const sanitizedEmail = validatedData.email.replace(/[\r\n]/g, '').trim();
    const sanitizedName = validatedData.name.replace(/[\r\n]/g, '').trim();

    // Validate email format again after sanitization
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Ugyldig e-postadresse' },
        { status: 400 }
      );
    }

    // Check for API key (should be server-only, not NEXT_PUBLIC_)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Resend API key is missing');
      return NextResponse.json(
        { success: false, message: 'E-posttjenesten er ikke konfigurert. Kontakt administrator.' },
        { status: 500 }
      );
    }

    // Get admin email from environment variable (required)
    const adminEmail = process.env.CONTACT_FORM_ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('CONTACT_FORM_ADMIN_EMAIL environment variable is missing');
      return NextResponse.json(
        { success: false, message: 'E-posttjenesten er ikke konfigurert. Kontakt administrator.' },
        { status: 500 }
      );
    }

    // Validate admin email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      console.error('Invalid CONTACT_FORM_ADMIN_EMAIL configuration');
      return NextResponse.json(
        {
          success: false,
          message: 'E-posttjenesten er ikke konfigurert korrekt. Kontakt administrator.',
        },
        { status: 500 }
      );
    }

    // Send email to admin using Resend API
    const adminEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Barteløpet Kontaktskjema <onboarding@resend.dev>',
        to: [adminEmail],
        reply_to: sanitizedEmail, // Use sanitized email to prevent header injection
        subject: `Kontaktskjema: ${sanitizedName}`,
        text: `Ny melding fra kontaktskjemaet\n\nFra: ${sanitizedName}\nE-post: ${sanitizedEmail}\n\nMelding:\n${validatedData.message}`,
        html: `
          <h2>Ny melding fra kontaktskjemaet</h2>
          <p><strong>Fra:</strong> ${escapeHtml(sanitizedName)}</p>
          <p><strong>E-post:</strong> ${escapeHtml(sanitizedEmail)}</p>
          <p><strong>Melding:</strong></p>
          <p>${formatMessageForHtml(validatedData.message)}</p>
        `,
      }),
    });

    // No confirmation e-mail is sent to the address in the form. Anyone can type any address
    // there, so a confirmation would let strangers send mail in Barteløpet's name.
    if (!adminEmailResponse.ok) {
      console.error('Resend API error:', adminEmailResponse.status);
      return NextResponse.json(
        {
          success: false,
          message: 'Meldingen kunne ikke sendes. Prøv igjen senere, eller send oss en e-post.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Takk for din henvendelse! Vi svarer på e-postadressen du oppga.',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message ?? 'Ugyldig skjema' },
        { status: 400 }
      );
    }

    console.error('Contact form error:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json(
      { success: false, message: 'En feil oppstod. Vennligst prøv igjen senere.' },
      { status: 500 }
    );
  }
}
