import {BindingScope, injectable} from '@loopback/core';
import {config} from '@lotto/shared';
import {Resend} from 'resend';

@injectable({scope: BindingScope.SINGLETON})
export class EmailService {
  private readonly resend: Resend | null;
  private readonly FROM_EMAIL: string;
  private readonly APP_NAME: string;

  constructor() {
    this.FROM_EMAIL = config.email.fromEmail;
    this.APP_NAME = config.email.appName;

    if (config.email.resendApiKey) {
      this.resend = new Resend(config.email.resendApiKey);
    } else {
      this.resend = null;
      console.warn(
        '⚠️  WARNING: RESEND_API_KEY not set. Email sending will be simulated (logged to console). Add RESEND_API_KEY to .env for production.',
      );
    }
  }

  /**
   * Send OTP verification code email
   */
  async sendOTPEmail(email: string, code: string): Promise<void> {
    if (!this.resend) {
      // Development mode - log to console
      console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
      console.log('║  📧  [DEV MODE] OTP Verification Code                             ║');
      console.log('╠═══════════════════════════════════════════════════════════════════╣');
      console.log(`║  To: ${email.padEnd(58)}║`);
      console.log('╠═══════════════════════════════════════════════════════════════════╣');
      console.log('║                                                                   ║');
      console.log(`║     🔐 Your verification code:  ${code}                          ║`);
      console.log('║                                                                   ║');
      console.log('║  ⏱  Code expires in 10 minutes                                   ║');
      console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
      return;
    }

    const {data, error} = await this.resend.emails.send({
      from: `${this.APP_NAME} <${this.FROM_EMAIL}>`,
      to: [email],
      subject: `Your ${this.APP_NAME} login verification code`,
      html: this.generateOTPEmailHTML(code),
    });

    if (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    console.log(`✅ OTP email sent to ${email}`, data);
  }

  /**
   * Generate HTML for OTP email
   */
  private generateOTPEmailHTML(code: string): string {
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
              text-align: center;
            }
            .code-container {
              background: #f8f9fa;
              border: 2px dashed #dee2e6;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
            }
            .code {
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 8px;
              color: #0070f3;
              font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
            }
            .footer {
              border-top: 1px solid #eee;
              padding-top: 20px;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
              text-align: center;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 6px;
              padding: 12px;
              margin-top: 20px;
              font-size: 13px;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.APP_NAME}</h1>
            </div>

            <div class="content">
              <h2>Your verification code</h2>
              <p>Enter this code to sign in to your account:</p>

              <div class="code-container">
                <div class="code">${code}</div>
              </div>

              <p style="color: #666; font-size: 14px;">
                ⏱ This code expires in <strong>10 minutes</strong>
              </p>
            </div>

            <div class="footer">
              <p>If you didn't request this code, you can safely ignore this email.</p>
              <div class="warning">
                ⚠️ Never share this code with anyone. ${this.APP_NAME} will never ask for your code.
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
