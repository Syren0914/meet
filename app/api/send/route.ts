import { EmailTemplate } from '@/components/email-template';
import { Resend } from 'resend';

const resend = new Resend('re_d4iQSeL4_HccyEgLjYdaL82TNznFHyQ5c');

export async function GET() {
  return Response.json({ message: "This endpoint only accepts POST requests" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, roomUrl, roomId, firstName } = body;
    
    console.log('Starting email send...', { email, roomUrl, roomId, firstName });
    
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email],
      subject: 'Meeting Invite - Join Your Video Call',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Meeting Invite</h1>
          <p>Hello ${firstName || 'there'}!</p>
          <p>You've been invited to join a video meeting.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Meeting Details</h2>
            <p><strong>Room ID:</strong> ${roomId}</p>
            <p><strong>Meeting Link:</strong> <a href="${roomUrl}" style="color: #007bff; text-decoration: none;">${roomUrl}</a></p>
          </div>
          <p>Click the link above to join the meeting. No sign-in required - just enter your username and you're ready to go!</p>
          <p>Best regards,<br>Your Meeting Host</p>
        </div>
      `,
    });

    console.log('Resend response:', { data, error });

    if (error) {
      console.error('Resend error:', error);
      return Response.json({ error }, { status: 500 });
    }

    console.log('Email sent successfully:', data);
    return Response.json(data);
  } catch (error) {
    console.error('Caught error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}