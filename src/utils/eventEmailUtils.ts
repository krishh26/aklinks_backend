import nodemailer from 'nodemailer';

interface EventRegistrationData {
  name?: string;
  email?: string;
  phone?: string;
  participants?: string | number;
  experience?: string;
  specialRequests?: string;
  age?: string | number;
  gender?: string;
  attendedBefore?: string;
  readyFor2026?: string;
  // Optional workshop details (can be set via env or defaults)
  workshopName?: string;
  eventName?: string;
  date?: string;
  time?: string;
  venue?: string;
  venueLink?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Create transporter for event emails using separate SMTP configuration
 * Uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables
 */
const createEventTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      'Event email configuration is incomplete. Please check your SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS).'
    );
  }

  const port = parseInt(smtpPort);
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: smtpHost,
    port: port,
    secure: isSecure, // use true for port 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false, // bypass self-signed cert issues
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
    logger: process.env.NODE_ENV === 'development', // Enable logger in development
  });
};

/**
 * Send event registration confirmation email to user
 * @param userEmail - User's email address
 * @param eventData - Event registration data object
 * @param ticketId - Unique ticket ID for the registration
 */
export const sendEventRegistrationEmail = async (
  userEmail: string,
  eventData: EventRegistrationData,
  ticketId: string
): Promise<void> => {
  // Extract only participant name (dynamic field)
  const participantName = eventData.name || 'Participant';
  
  // Static workshop details
  const workshopName = 'Tie-Dye Workshop';
  const date = '11-01-2026';
  const time = '2 to 5 PM';
  const venue = 'White Valley Cafe & Multi-cuisine Restaurant';
  const venueLink = 'https://maps.app.goo.gl/soKjcw33rw2zMvqX7';
  const contactEmail = 'hello@artverse.co.in';

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
      <div style="margin-bottom: 30px;">
        <p style="font-size: 16px; line-height: 1.8; color: #333;">
          Hello <strong>${participantName}</strong>,
        </p>
        <p style="font-size: 16px; line-height: 1.8; color: #333;">
          Thank you for booking your ticket for the <strong><em>Tie-Dye Workshop</em></strong> with <strong><em>ArtVerse</em></strong> 🎨✨
        </p>
        <p style="font-size: 16px; line-height: 1.8; color: #333;">
          We're excited to have you join us for this creative experience.
        </p>
      </div>

      <div style="margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px; margin-bottom: 20px;">📅 Workshop Details</h3>
        <p style="font-size: 15px; line-height: 1.8; color: #333; margin: 8px 0;">
          <strong><em>Date:</em></strong> <em>11-01-2026</em>
        </p>
        <p style="font-size: 15px; line-height: 1.8; color: #333; margin: 8px 0;">
          <strong><em>Time:</em></strong> <em>3 to 5 PM</em>
        </p>
        <p style="font-size: 15px; line-height: 1.8; color: #333; margin: 8px 0;">
          <strong><em>Venue:</em></strong> <em>White Valley Cafe & Multi-cuisine Restaurant</em> <a href="https://maps.app.goo.gl/soKjcw33rw2zMvqX7" style="color: #6a5af9; text-decoration: none;">https://maps.app.goo.gl/soKjcw33rw2zMvqX7</a>
        </p>
        <p style="font-size: 15px; line-height: 1.8; color: #333; margin: 8px 0;">
          <strong><em>Ticket ID:</em></strong> <em>${ticketId}</em>
        </p>
      </div>

      <div style="margin: 30px 0;">
        <p style="font-size: 16px; line-height: 1.8; color: #333;">
          Your seat has been successfully confirmed. Please keep this email for reference and bring your ticket (digital or printed) on the day of the workshop.
        </p>
        <p style="font-size: 16px; line-height: 1.8; color: #333;">
          Get ready to explore creativity, culture, and hands-on learning with fellow art enthusiasts. If you have any questions or need assistance, feel free to reach out to us at <strong><em><a href="mailto:hello@artverse.co.in" style="color: #6a5af9; text-decoration: none;">hello@artverse.co.in</a></em></strong>.
        </p>
        <p style="font-size: 16px; line-height: 1.8; color: #333; margin-top: 20px;">
          We can't wait to see you there!
        </p>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 15px; line-height: 1.8; color: #333;">
          Warm regards,<br>
          <strong><em>Team ArtVerse</em></strong>
        </p>
      </div>
    </div>
  `;

  const text = `
Hello ${participantName},

Thank you for booking your ticket for the Tie-Dye Workshop with ArtVerse 🎨✨
We're excited to have you join us for this creative experience.

📅 Workshop Details

Date: 11-01-2026
Time: 3 to 5 PM
Venue: White Valley Cafe & Multi-cuisine Restaurant https://maps.app.goo.gl/soKjcw33rw2zMvqX7
Ticket ID: ${ticketId}

Your seat has been successfully confirmed. Please keep this email for reference and bring your ticket (digital or printed) on the day of the workshop.

Get ready to explore creativity, culture, and hands-on learning with fellow art enthusiasts. If you have any questions or need assistance, feel free to reach out to us at hello@artverse.co.in.

We can't wait to see you there!

Warm regards,
Team ArtVerse
  `;

  try {
    const transporter = createEventTransporter();
    
    // Verify connection before sending
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError: any) {
      console.error('SMTP connection verification failed:', verifyError);
      throw new Error(
        `SMTP connection failed: ${verifyError.message || 'Unable to connect to SMTP server. Please check SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS configuration.'}`
      );
    }

    const mailOptions = {
      from: `"ArtVerse" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Ticket Confirmation - ${workshopName}`,
      text: text,
      html: html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Event registration email sent successfully to ${userEmail}`);
  } catch (error: any) {
    console.error('Error sending event registration email:', error);
    
    // Provide more specific error messages
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      throw new Error(
        `SMTP connection timeout or refused. Please check your SMTP settings (SMTP_HOST: ${process.env.SMTP_HOST}, SMTP_PORT: ${process.env.SMTP_PORT || '587'}). Error: ${error.message}`
      );
    } else if (error.code === 'EAUTH') {
      throw new Error(
        `SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS credentials.`
      );
    } else {
      throw new Error(
        `Failed to send event registration email: ${error.message || 'Unknown error'}`
      );
    }
  }
};

