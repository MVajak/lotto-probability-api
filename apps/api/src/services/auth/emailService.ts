import {BindingScope, inject, injectable} from '@loopback/core';
import type {LoggerService} from '@lotto/core';
import {config} from '@lotto/shared';
import {Resend} from 'resend';

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
      .logo-text {
        font-size: 24px;
        font-weight: 600;
        color: #b45309;
        text-align: center;
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
          <div class="logo-text">${this.APP_NAME}</div>
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
