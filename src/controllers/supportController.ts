import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Support from '../models/Support';
import { sendEmail } from '../utils/emailUtils';

export const createSupport = async (req: any, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ status: 'error', errors: errors.array() });
            return;
        }

        const { name, subject, email, message, consent } = req.body;
        const userId = (req as any).user?._id || null;

        const support = await Support.create({ name, subject, email, message, consent, userId });

        // Build a simple HTML email
        const html = `
<div style="background-color:#f4f6fb; padding:30px 0; font-family:Arial, Helvetica, sans-serif;">
  <div style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,0.08); overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #6a5af9, #7b7bff); padding:20px 28px;">
      <h2 style="margin:0; color:#ffffff; font-size:20px;">
        📩 New Support Message
      </h2>
      <p style="margin:6px 0 0; color:#e0e0ff; font-size:13px;">
        A new message has been submitted via the contact form
      </p>
    </div>

    <!-- Body -->
    <div style="padding:28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#333;">
        <tr>
          <td style="padding:8px 0; width:120px; color:#666;"><strong>Name</strong></td>
          <td style="padding:8px 0;">${name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#666;"><strong>Email</strong></td>
          <td style="padding:8px 0;">
            <a href="mailto:${email}" style="color:#6a5af9; text-decoration:none;">
              ${email}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#666;"><strong>Subject</strong></td>
          <td style="padding:8px 0;">${subject}</td>
        </tr>
      </table>

      <!-- Message Box -->
<div style="margin-top:12px;">
  <p style="margin:0 0 4px; color:#666; font-weight:bold; font-size:13px;">
    Message
  </p>
  <div style="background:#f7f8fc; border:1px solid #e6e8f0; border-radius:6px; padding:10px; color:#444;">
    <p style="margin:0; white-space:pre-wrap; line-height:1.4; font-size:13px;">
      ${message}
    </p>
  </div>
</div>

      <!-- Consent -->
      <p style="margin-top:20px; font-size:12px; color:#777;">
        <strong>Consent to store contact:</strong> ${consent ? 'Yes' : 'No'}
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#fafbff; padding:14px 28px; border-top:1px solid #eee;">
      <p style="margin:0; font-size:12px; color:#999;">
        This message was securely stored in the <strong>AKLinks Support</strong> collection.
      </p>
    </div>

  </div>
</div>
`;


        const to = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || '';
        const subjectLine = `AKLinks Support: ${subject}`;

        if (to) {
            try {
                await sendEmail({ to, subject: subjectLine, html });
            } catch (emailError) {
                console.error('Support email error:', emailError);
                // Do not fail the request if email fails; we still stored the support message
            }
        }

        res.status(201).json({ status: 'success', message: 'Support message submitted', data: support });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message || 'Failed to submit support message' });
    }
};

// Admin: get all support messages
export const getAllSupport = async (req: Request, res: Response): Promise<void> => {
    try {
        const items = await Support.find().sort({ createdAt: -1 }).select('-__v');
        res.status(200).json({ status: 'success', data: items });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message || 'Failed to fetch support messages' });
    }
};
