import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Navn må være minst 2 tegn'),
  email: z.string().email('Ugyldig e-postadresse'),
  message: z.string().min(10, 'Meldingen må være minst 10 tegn'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = contactSchema.parse(body);

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Barteløpet Kontaktskjema <onboarding@resend.dev>',
        to: ['berglie.stian@gmail.com'],
        reply_to: validatedData.email,
        subject: `Kontaktskjema: ${validatedData.name}`,
        html: `
          <h2>Ny melding fra kontaktskjemaet</h2>
          <p><strong>Fra:</strong> ${validatedData.name}</p>
          <p><strong>E-post:</strong> ${validatedData.email}</p>
          <p><strong>Melding:</strong></p>
          <p>${validatedData.message.replace(/\n/g, '<br>')}</p>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);

      // Fallback: Log to console if email fails
      console.log('Contact form submission:', validatedData);

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
        message: 'Takk for din henvendelse! Vi kommer tilbake til deg så snart som mulig.'
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.errors },
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
