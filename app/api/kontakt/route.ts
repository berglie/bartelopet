import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/app/_shared/lib/utils/rate-limit';
import { securityLogger } from '@/app/_shared/lib/utils/security-logger';

const contactSchema = z.object({
  name: z.string().min(2, 'Navn må være minst 2 tegn').max(100, 'Navn kan ikke være lengre enn 100 tegn'),
  email: z.string().email('Ugyldig e-postadresse').max(254, 'E-post kan ikke være lengre enn 254 tegn'), // RFC 5321 max length
  message: z.string().min(10, 'Meldingen må være minst 10 tegn').max(1000, 'Meldingen kan ikke være lengre enn 1000 tegn'),
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
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      'https://barteløpet.no',
      'https://www.barteløpet.no',
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
    const rateLimitResult = await checkRateLimit('api', clientIp);

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
      console.error('Invalid admin email configuration:', adminEmail);
      return NextResponse.json(
        { success: false, message: 'E-posttjenesten er ikke konfigurert korrekt. Kontakt administrator.' },
        { status: 500 }
      );
    }

    // Send email to admin using Resend API
    const adminEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
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

    // Send confirmation email to sender
    const confirmationEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Barteløpet <onboarding@resend.dev>',
        to: [sanitizedEmail], // Use sanitized email
        subject: 'Bekreftelse på din henvendelse - Barteløpet',
        text: `Hei ${sanitizedName},\n\nVi har mottatt din melding og kommer tilbake til deg så snart som mulig.\n\nDin melding:\n${validatedData.message}\n\nHvis du har spørsmål i mellomtiden, kan du svare direkte på denne e-posten.\n\nMed vennlig hilsen,\nBarteløpet-teamet\n\nBesøk barteløpet.no`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                h1 { margin: 0; font-size: 24px; }
                h2 { color: #667eea; font-size: 18px; margin-top: 0; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Takk for din henvendelse!</h1>
                </div>
                <div class="content">
                  <p>Hei ${escapeHtml(sanitizedName)},</p>
                  <p>Vi har mottatt din melding og kommer tilbake til deg så snart som mulig.</p>

                  <div class="message-box">
                    <h2>Din melding:</h2>
                    <p>${formatMessageForHtml(validatedData.message)}</p>
                  </div>

                  <p>Hvis du har spørsmål i mellomtiden, kan du svare direkte på denne e-posten.</p>

                  <p>Med vennlig hilsen,<br>Barteløpet-teamet</p>

                  <a href="https://barteløpet.no" class="button">Besøk barteløpet.no</a>
                </div>
                <div class="footer">
                  <p>Dette er en automatisk bekreftelse fra Barteløpet</p>
                  <p>© ${new Date().getFullYear()} ÅpenAid - Støtter mental helse gjennom Movember</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    // Check if both emails were sent successfully
    if (!adminEmailResponse.ok || !confirmationEmailResponse.ok) {
      const adminError = !adminEmailResponse.ok ? await adminEmailResponse.json() : null;
      const confirmError = !confirmationEmailResponse.ok ? await confirmationEmailResponse.json() : null;

      console.error('Resend API error:', { adminError, confirmError });
      console.error('Contact form submission (email failed):', validatedData);

      return NextResponse.json(
        {
          success: true,
          message: 'Takk for din henvendelse! Vi har mottatt meldingen din.'
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Takk for din henvendelse! Du vil motta en bekreftelse på e-post.'
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 }
      );
    }

    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'En feil oppstod. Vennligst prøv igjen senere.' },
      { status: 500 }
    );
  }
}
