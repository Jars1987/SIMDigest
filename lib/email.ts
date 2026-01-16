import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Default banner image URL - can be overridden via env var
const DEFAULT_BANNER_URL = 'https://raw.githubusercontent.com/solana-foundation/solana-improvement-documents/main/.github/assets/simd-banner.png';

interface SendNewsletterEmailParams {
  to: string;
  subject: string;
  content: string;
  unsubscribeToken?: string;
  bannerUrl?: string;
}

/**
 * Convert markdown tables to HTML tables
 */
function convertMarkdownTables(content: string): string {
  const lines = content.split('\n');
  let result: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a table row (starts and ends with |)
    if (line.startsWith('|') && line.endsWith('|')) {
      // Check if next line is separator (|---|---|)
      const nextLine = lines[i + 1]?.trim() || '';
      const isSeparator = /^\|[\s-:|]+\|$/.test(line);

      if (isSeparator) {
        // Skip separator line
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableRows = [];
      }

      tableRows.push(line);
    } else {
      // Not a table row
      if (inTable) {
        // End of table, convert to HTML
        result.push(convertTableToHtml(tableRows));
        inTable = false;
        tableRows = [];
      }
      result.push(lines[i]);
    }
  }

  // Handle table at end of content
  if (inTable && tableRows.length > 0) {
    result.push(convertTableToHtml(tableRows));
  }

  return result.join('\n');
}

// Medal colors for rankings
const RANK_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: '#FFD700', text: '#6B5900', border: '#DAA520' }, // Gold
  2: { bg: '#E8E8E8', text: '#4A4A4A', border: '#C0C0C0' }, // Silver
  3: { bg: '#CD7F32', text: '#FFFFFF', border: '#A0522D' }, // Bronze
};
const DEFAULT_RANK_COLOR = { bg: '#6B7280', text: '#FFFFFF', border: '#4B5563' }; // Gray for 4th+

// Convert number to ordinal (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function convertTableToHtml(rows: string[]): string {
  if (rows.length === 0) return '';

  // Get headers from first row
  const headers = rows[0].split('|').filter(cell => cell.trim() !== '').map(h => h.trim());
  const dataRows = rows.slice(1);

  // Create a card-style list instead of a traditional table
  let html = '<div style="margin: 16px 0;">';

  dataRows.forEach((row, idx) => {
    const cells = row.split('|').filter(cell => cell.trim() !== '');
    const isEven = idx % 2 === 0;

    html += `<div style="padding: 8px 12px; margin: 4px 0; background-color: ${isEven ? '#f8f9fa' : '#ffffff'}; border-radius: 6px; border-left: 2px solid #2a2a4e;">`;

    cells.forEach((cell, cellIdx) => {
      const value = cell.trim();
      const header = headers[cellIdx] || '';

      // First cell (usually rank) - medal colors based on position with ordinal format
      if (cellIdx === 0 && /^\d+$/.test(value)) {
        const rankNum = parseInt(value, 10);
        const colors = RANK_COLORS[rankNum] || DEFAULT_RANK_COLOR;
        const ordinal = getOrdinal(rankNum);
        html += `<span style="display: inline-block; min-width: 28px; padding: 2px 6px; text-align: center; background-color: ${colors.bg}; color: ${colors.text}; border-radius: 10px; font-weight: bold; font-size: 10px; margin-right: 8px; border: 1px solid ${colors.border};">${ordinal}</span>`;
      }
      // Second cell (usually name/SIMD) - main content
      else if (cellIdx === 1) {
        html += `<strong style="color: #1a1a1a; font-size: 12px;">${value}</strong>`;
      }
      // Third cell (usually count) - badge style
      else if (cellIdx === 2) {
        html += `<span style="float: right; background-color: #e8e8f0; color: #1a1a2e; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600;">${value} ${header.toLowerCase()}</span>`;
      }
      // Any other cells
      else {
        html += `<span style="color: #666; margin-left: 6px; font-size: 11px;">${value}</span>`;
      }
    });

    html += '</div>';
  });

  html += '</div>';
  return html;
}

/**
 * Convert markdown content to HTML for email
 * Exported so it can be used for preview
 */
export function convertMarkdownToHtml(content: string): string {
  // First handle tables (before other replacements mess with the structure)
  let html = convertMarkdownTables(content);

  // Handle horizontal rules
  html = html.replace(/^---+$/gm, '<hr style="border: none; border-top: 2px solid #e0e0e0; margin: 28px 0;">');

  // Handle headers
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size: 24px; font-weight: bold; margin: 24px 0 12px 0; color: #1a1a1a;">$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 20px; font-weight: bold; margin: 20px 0 10px 0; color: #2a2a2a;">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 17px; font-weight: bold; margin: 16px 0 8px 0; color: #3a3a3a;">$1</h3>');

  // Handle bold FIRST (before italic, to avoid **text** becoming *<em>text</em>*)
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');

  // Handle italic - only match single asterisks that aren't part of ** or list markers
  // Use word boundaries to be more careful
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');

  // Handle links
  html = html.replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2" style="color: #9945FF; text-decoration: underline;">$1</a>');

  // Handle list items - various formats
  // Format: "- * **Name** text" (double marker) -> blockquote style for contributor mentions
  html = html.replace(/^-\s+\*\s+<strong>([^<]+)<\/strong>\s+(.+)$/gm,
    '<div style="margin: 8px 0; padding: 10px 15px; background-color: #f8f9fa; border-left: 3px solid #2a2a4e; border-radius: 4px;"><strong style="color: #2a2a4e;">$1</strong> <span style="color: #1a1a1a;">$2</span></div>');

  // Format: "- **Name** text" -> blockquote style for contributor mentions (bold already converted)
  html = html.replace(/^[\*\-]\s+<strong>([^<]+)<\/strong>\s+(.+)$/gm,
    '<div style="margin: 8px 0; padding: 10px 15px; background-color: #f8f9fa; border-left: 3px solid #2a2a4e; border-radius: 4px;"><strong style="color: #2a2a4e;">$1</strong> <span style="color: #1a1a1a;">$2</span></div>');

  // Regular list items (unordered) - "- text" or "* text"
  html = html.replace(/^[\*\-]\s+(?!\*)(.+)$/gm, '<li style="margin: 6px 0; color: #1a1a1a; line-height: 1.6;">$1</li>');

  // Wrap consecutive list items in ul
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => {
    return `<ul style="margin: 12px 0; padding-left: 24px; list-style-type: disc;">${match}</ul>`;
  });

  // Handle paragraphs (double newlines) - ensure text color is explicitly black
  html = html.replace(/\n\n/g, '</p><p style="margin: 14px 0; line-height: 1.7; color: #1a1a1a;">');

  // Handle single newlines (convert to <br> except after block elements)
  html = html.replace(/\n(?!<)/g, '<br>');

  return html;
}

/**
 * Generate the full HTML email template
 * Exported so it can be used for preview
 */
export function generateEmailHtml(
  content: string,
  options: {
    unsubscribeUrl?: string | null;
    bannerUrl?: string | null;
  } = {}
): string {
  const { unsubscribeUrl, bannerUrl } = options;
  const effectiveBannerUrl = bannerUrl || process.env.NEWSLETTER_BANNER_URL || DEFAULT_BANNER_URL;
  const htmlContent = convertMarkdownToHtml(content);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
          <!-- Banner Image -->
          ${effectiveBannerUrl ? `
            <div style="width: 100%; background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);">
              <img src="${effectiveBannerUrl}" alt="SIMD Digest" style="width: 100%; height: auto; display: block;" onerror="this.style.display='none'">
            </div>
          ` : ''}

          <!-- Header -->
          <div style="text-align: center; padding: 30px 30px 20px 30px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
            <h1 style="color: #9945FF; font-size: 32px; margin: 0; font-weight: 700;">SIMD Digest</h1>
            <p style="color: #a0a0a0; margin: 8px 0 0 0; font-size: 14px;">Solana Improvement Document Updates</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="margin: 12px 0; line-height: 1.7; color: #1a1a1a;">
              ${htmlContent}
            </p>
          </div>

          <!-- Footer -->
          ${unsubscribeUrl ? `
            <div style="padding: 20px 30px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                You're receiving this because you subscribed to SIMD Digest updates.<br>
                <a href="${unsubscribeUrl}" style="color: #9945FF; text-decoration: underline;">Unsubscribe</a>
              </p>
            </div>
          ` : ''}

          <div style="padding: 15px 30px; background-color: #1a1a2e; text-align: center;">
            <p style="color: #666; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} SIMD Digest. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendNewsletterEmail({
  to,
  subject,
  content,
  unsubscribeToken,
  bannerUrl
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

    const finalHtml = generateEmailHtml(content, { unsubscribeUrl, bannerUrl });

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
