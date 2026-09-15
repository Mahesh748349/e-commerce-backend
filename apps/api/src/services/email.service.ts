import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      });
    }
  }

  async sendOtpEmail(toEmail: string, otp: string, recipientName?: string): Promise<boolean> {
    const displayName = recipientName ? recipientName.trim() : "Valued Customer";

    // ALWAYS print high-visibility log for development & instant local testing
    console.log("\n=======================================================");
    console.log(`🔐 [ShopSwift Auth] EMAIL OTP VERIFICATION CODE`);
    console.log(`👉 Recipient: ${toEmail} (${displayName})`);
    console.log(`👉 6-Digit OTP: >>> ${otp} <<<`);
    console.log(`⏱️ Valid for: 10 minutes`);
    console.log("=======================================================\n");

    logger.info("auth.email_otp.generated", {
      email: toEmail,
      otp,
      smtpConfigured: Boolean(this.transporter)
    });

    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: toEmail,
        subject: `${otp} is your ShopSwift verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #131921 0%, #232f3e 100%); padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px;">ShopSwift</h1>
              <p style="color: #febd69; margin: 4px 0 0 0; font-size: 13px; font-weight: bold;">Account Verification</p>
            </div>
            <div style="padding: 32px 24px;">
              <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${displayName}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 24px 0;">
                Thank you for joining ShopSwift. To complete your account registration and verify your email address, please enter the one-time password (OTP) below:
              </p>
              <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${otp}</span>
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                This code is valid for <strong>10 minutes</strong>. If you did not request this code, please safely ignore this email.
              </p>
            </div>
            <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                © ${new Date().getFullYear()} ShopSwift E-Commerce. All rights reserved.
              </p>
            </div>
          </div>
        `
      });
      return true;
    } catch (error) {
      logger.error("auth.email_otp.send_failed", { email: toEmail, error });
      return false;
    }
  }
}

export const emailService = new EmailService();
