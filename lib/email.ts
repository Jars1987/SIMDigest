import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface SendNewsletterEmailParams {
  to: string;
  subject: string;
  content: string;
  unsubscribeToken?: string;
}

export async function sendNewsletterEmail({
  to,
  subject,
  content,
  unsubscribeToken
}: SendNewsletterEmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not configured');
    return false;
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error('❌ SENDGRID_FROM_EMAIL not configured');
    return false;
  }

  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const fromName = process.env.SENDGRID_FROM_NAME || 'SIMD Digest';

    // Build unsubscribe URL if token provided
    const unsubscribeUrl = unsubscribeToken
      ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://simd-digest.vercel.app'}/unsubscribe?token=${unsubscribeToken}`
      : null;

    // Convert markdown-style content to basic HTML
    const htmlContent = content
      .replace(/^# (.+)$/gm, '<h1 style="font-size: 24px; font-weight: bold; margin: 20px 0 10px 0; color: #1a1a1a;">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; color: #2a2a2a;">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 style="font-size: 18px; font-weight: bold; margin: 14px 0 7px 0; color: #3a3a3a;">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #9945FF; text-decoration: underline;">$1</a>')
      .replace(/\n\n/g, '</p><p style="margin: 10px 0; line-height: 1.6; color: #4a4a4a;">')
      .replace(/\n/g, '<br>');

    const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #9945FF; font-size: 28px; margin: 0;">SIMD Digest</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Solana Improvement Document Updates</p>
            </div>

            <div style="border-top: 2px solid #9945FF; padding-top: 30px;">
              <p style="margin: 10px 0; line-height: 1.6; color: #4a4a4a;">
                ${htmlContent}
              </p>
            </div>

            ${unsubscribeUrl ? `
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  You're receiving this because you subscribed to SIMD Digest updates.<br>
                  <a href="${unsubscribeUrl}" style="color: #9945FF; text-decoration: underline;">Unsubscribe</a>
                </p>
              </div>
            ` : ''}

            <div style="margin-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} SIMD Digest. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      text: content, // Plain text fallback
      html: finalHtml,
    };

    await sgMail.send(msg);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}:`, error?.response?.body || error);
    return false;
  }
}

export async function sendVerificationEmail(
  to: string,
  verificationToken: string
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not configured');
    return false;
  }

  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://simd-digest.vercel.app'}/verify?token=${verificationToken}`;

  const content = `
Thank you for subscribing to SIMD Digest!

Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't subscribe to SIMD Digest, you can safely ignore this email.

---
SIMD Digest - Stay updated on Solana Improvement Documents
  `.trim();

  return sendNewsletterEmail({
    to,
    subject: 'Verify your SIMD Digest subscription',
    content,
  });
}
