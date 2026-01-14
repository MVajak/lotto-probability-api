import {BindingScope, inject, injectable} from '@loopback/core';
import type {LoggerService} from '@lotto/core';
import {config} from '@lotto/shared';
import {Resend} from 'resend';

// Logo as base64 (embedded to avoid external dependencies)
const LOGO_BASE64 =
  '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';

@injectable({scope: BindingScope.SINGLETON})
export class EmailService {
  private readonly resend: Resend | null;
  private readonly FROM_EMAIL: string;
  private readonly APP_NAME: string;

  constructor(
    @inject('services.LoggerService')
    private loggerService: LoggerService,
  ) {
    this.FROM_EMAIL = config.email.fromEmail;
    this.APP_NAME = config.email.appName;

    if (config.email.resendApiKey) {
      this.resend = new Resend(config.email.resendApiKey);
    } else {
      this.resend = null;
      this.loggerService.log(
        'WARNING: RESEND_API_KEY not set. Email sending will be simulated (logged to console). Add RESEND_API_KEY to .env for production.',
      );
    }
  }

  /**
   * Send OTP verification code email
   */
  async sendOTPEmail(email: string, code: string): Promise<void> {
    if (!this.resend) {
      // Development mode - log to console
      this.loggerService.log(`[DEV MODE] OTP for ${email}: ${code} (expires in 10 minutes)`);
      return;
    }

    const {data, error} = await this.resend.emails.send({
      from: `${this.APP_NAME} <${this.FROM_EMAIL}>`,
      to: [email],
      subject: `Your ${this.APP_NAME} login verification code`,
      html: this.generateOTPEmailHTML(code),
    });

    if (error) {
      this.loggerService.log(`Failed to send OTP email: ${error.message}`);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    this.loggerService.log(`OTP email sent to ${email}`);
  }

  /**
   * Generate HTML for OTP email
   */
  private generateOTPEmailHTML(code: string): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.5;
        color: #09090b;
        margin: 0;
        padding: 0;
        background-color: #f4f4f5;
      }
      .wrapper {
        padding: 40px 20px;
      }
      .container {
        max-width: 480px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 16px;
        border: 1px solid #e4e4e7;
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        padding: 32px 24px;
        text-align: center;
        border-bottom: 1px solid #e4e4e7;
      }
      .logo-container {
        display: inline-block;
      }
      .logo-container table {
        margin: 0 auto;
      }
      .logo-img {
        height: 36px;
        width: auto;
        vertical-align: middle;
      }
      .logo-text {
        font-size: 24px;
        font-weight: 600;
        color: #b45309;
        padding-left: 12px;
        vertical-align: middle;
      }
      .content {
        padding: 32px 24px;
        text-align: center;
      }
      .title {
        font-size: 20px;
        font-weight: 500;
        color: #09090b;
        margin: 0 0 8px 0;
      }
      .subtitle {
        font-size: 14px;
        color: #71717a;
        margin: 0 0 24px 0;
      }
      .code-container {
        background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
        border: 2px solid #fcd34d;
        border-radius: 12px;
        padding: 24px 16px;
        margin: 0 0 24px 0;
      }
      .code {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 6px;
        color: #b45309;
        font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
        margin: 0;
      }
      .expiry {
        display: inline-block;
        background: #f4f4f5;
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 13px;
        color: #71717a;
      }
      .expiry strong {
        color: #09090b;
      }
      .footer {
        background: #fafafa;
        border-top: 1px solid #e4e4e7;
        padding: 24px;
        text-align: center;
      }
      .footer-text {
        font-size: 13px;
        color: #71717a;
        margin: 0 0 16px 0;
      }
      .warning {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 8px;
        padding: 12px 16px;
        font-size: 12px;
        color: #9a3412;
        text-align: left;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <table><tr>
              <td><img src="data:image/png;base64,${LOGO_BASE64}" alt="${this.APP_NAME}" class="logo-img"></td>
              <td class="logo-text">${this.APP_NAME}</td>
            </tr></table>
          </div>
        </div>

        <div class="content">
          <h2 class="title">Your verification code</h2>
          <p class="subtitle">Enter this code to sign in to your account</p>

          <div class="code-container">
            <p class="code">${code}</p>
          </div>

          <span class="expiry">Expires in <strong>10 minutes</strong></span>
        </div>

        <div class="footer">
          <p class="footer-text">
            If you didn't request this code, you can safely ignore this email.
          </p>
          <div class="warning">
            <strong>Security tip:</strong> Never share this code with anyone. ${this.APP_NAME} will never ask for your code.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
  }

  /**
   * Send welcome email (when user first signs up)
   */
  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const name = firstName || email.split('@')[0];
    this.loggerService.log(`Welcome email would be sent to ${name} (${email})`);
    // TODO: Implement welcome email with Resend
  }
}
