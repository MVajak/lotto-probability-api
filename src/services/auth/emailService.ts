import {BindingScope, inject, injectable} from '@loopback/core';
import fetch from 'node-fetch';

@injectable({scope: BindingScope.SINGLETON})
export class EmailService {
  private readonly RESEND_API_KEY: string;
  private readonly FROM_EMAIL: string = 'noreply@yourdomain.com'; // TODO: Change this!
  private readonly APP_NAME: string = 'LottoProbability';

  constructor(
    @inject('email.resendApiKey', {optional: true})
    resendApiKey?: string,
  ) {
    this.RESEND_API_KEY = resendApiKey || process.env.RESEND_API_KEY || '';

    if (!this.RESEND_API_KEY) {
      console.warn(
        '⚠️  WARNING: RESEND_API_KEY not set. Email sending will be simulated (logged to console). Add RESEND_API_KEY to .env for production.',
      );
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
    if (!this.RESEND_API_KEY) {
      // Development mode - log to console
      console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
      console.log('║  📧  [DEV MODE] Magic Link Email                                 ║');
      console.log('╠═══════════════════════════════════════════════════════════════════╣');
      console.log(`║  To: ${email.padEnd(58)}║`);
      console.log('╠═══════════════════════════════════════════════════════════════════╣');
      console.log('║  🔗 VERIFY LINK (click or copy to test):                         ║');
      console.log('║                                                                   ║');
      console.log(`║  ${magicLinkUrl.padEnd(63)}║`);
      console.log('║                                                                   ║');
      console.log('║  ⏱  Link expires in 15 minutes                                   ║');
      console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: this.FROM_EMAIL,
          to: email,
          subject: `Log in to ${this.APP_NAME}`,
          html: this.generateMagicLinkEmailHTML(magicLinkUrl),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Email sending failed: ${response.statusText} - ${errorData}`);
      }

      console.log(`✅ Magic link email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send magic link email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML for magic link email
   */
  private generateMagicLinkEmailHTML(magicLinkUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 2px solid #f0f0f0;
            }
            h1 {
              color: #0070f3;
              font-size: 24px;
              margin: 0;
            }
            .content {
              padding: 30px 0;
            }
            .button {
              display: inline-block;
              background: #0070f3;
              color: white !important;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              font-size: 16px;
              margin: 20px 0;
            }
            .button:hover {
              background: #0051cc;
            }
            .footer {
              border-top: 1px solid #eee;
              padding-top: 20px;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .url-fallback {
              background: #f8f8f8;
              padding: 12px;
              border-radius: 4px;
              word-break: break-all;
              font-size: 12px;
              color: #666;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.APP_NAME}</h1>
            </div>

            <div class="content">
              <h2>Log in to your account</h2>
              <p>Click the button below to securely log in to your ${this.APP_NAME} account:</p>

              <div style="text-align: center;">
                <a href="${magicLinkUrl}" class="button">Log in to ${this.APP_NAME}</a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                ⏱ This link will expire in <strong>15 minutes</strong>.
              </p>

              <p style="color: #666; font-size: 14px;">
                If you didn't request this email, you can safely ignore it. No account will be created.
              </p>
            </div>

            <div class="footer">
              <p><strong>Having trouble with the button?</strong></p>
              <p>Copy and paste this URL into your browser:</p>
              <div class="url-fallback">
                ${magicLinkUrl}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send welcome email (when user first signs up)
   */
  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const name = firstName || email.split('@')[0];
    console.log(`📧 Welcome email would be sent to ${name} (${email})`);
    // TODO: Implement welcome email with Resend
  }
}
