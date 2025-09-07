import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { config } from '../config';

dotenv.config();

interface OtpRecord {
  code: string;
  expiresAt: number;
}

class InMemoryOtpStore {
  private store = new Map<string, OtpRecord>();

  set(email: string, record: OtpRecord) {
    this.store.set(email.toLowerCase(), record);
  }

  get(email: string): OtpRecord | undefined {
    return this.store.get(email.toLowerCase());
  }

  delete(email: string) {
    this.store.delete(email.toLowerCase());
  }
}

const otpStore = new InMemoryOtpStore();

const isGmailProvider =
  process.env.SMTP_PROVIDER === 'gmail' ||
  (!process.env.SMTP_HOST && (process.env.SMTP_USER || '').toLowerCase().includes('@gmail.com'));

const hasSmtpConfig = Boolean(
  (isGmailProvider && process.env.SMTP_USER && process.env.SMTP_PASS) ||
  (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM)
);

const transporter = hasSmtpConfig
  ? isGmailProvider
    ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Use Gmail App Password
      },
    })
    : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export class OtpService {
  static generateOtp(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  static async sendRegistrationOtp(email: string): Promise<void> {
    const code = this.generateOtp(6);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email, { code, expiresAt });

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: 'Your Registration OTP Code',
      text: `Your OTP code is ${code}. It expires in 10 minutes.`,
    } as nodemailer.SendMailOptions;

    if (!transporter) {
      // Dev fallback: no SMTP configured
      logger.warn('SMTP not configured; logging OTP to console (dev fallback)');
      logger.info(`Registration OTP for ${email}: ${code}`);
      return;
    }

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Registration OTP sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send OTP to ${email}:`, error);
      if (config.nodeEnv !== 'production') {
        // Dev fallback: still expose OTP in logs so developers can proceed
        logger.warn('Email send failed; using dev fallback to log OTP');
        logger.info(`Registration OTP for ${email}: ${code}`);
        return;
      }
      throw new Error('Failed to send OTP email');
    }
  }

  static verifyOtp(email: string, code: string): boolean {
    const record = otpStore.get(email);
    console.log("record", record);
    if (!record) return false;
    const isExpired = Date.now() > record.expiresAt;
    const isMatch = record.code === code;
    return !isExpired && isMatch;
  }

  static invalidateOtp(email: string): void {
    otpStore.delete(email);
  }
}

