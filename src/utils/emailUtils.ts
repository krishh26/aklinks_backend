import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const createTransporter = () => {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailHost || !emailPort || !emailUser || !emailPass) {
    throw new Error('Email configuration is incomplete. Please check your environment variables.');
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: parseInt(emailPort),
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();
    console.log("options.to",options.to)
    const mailOptions = {
      from: `"AKLinks Support" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You have requested a password reset for your AKLinks account.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 1 hour. If you didn't request this password reset, 
        please ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        This email was sent by AKLinks. Please do not reply to this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request - AKLinks',
    html,
  });
};
