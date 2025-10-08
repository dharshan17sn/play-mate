import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { ResponseBuilder } from '../utils/response';
import { asyncErrorHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Create a reusable transporter using existing env like otpService does
const isGmailProvider =
  process.env.SMTP_PROVIDER === 'gmail' ||
  (!process.env.SMTP_HOST && (process.env.SMTP_USER || '').toLowerCase().includes('@gmail.com'));

const hasSmtpConfig = Boolean(
  (isGmailProvider && process.env.SMTP_USER && process.env.SMTP_PASS) ||
  (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && (process.env.SMTP_FROM || process.env.SMTP_USER))
);

const transporter = hasSmtpConfig
  ? isGmailProvider
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST as string,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
  : null;

export const ContactController = {
  submit: asyncErrorHandler(async (req: Request, res: Response) => {
    const { name, email, subject, message, gameIdea } = req.body as {
      name: string; email: string; subject: string; message: string; gameIdea?: string;
    };

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json(
        ResponseBuilder.validationError('Missing required fields', [
          { field: 'name', message: !name ? 'Name is required' : undefined },
          { field: 'email', message: !email ? 'Email is required' : undefined },
          { field: 'subject', message: !subject ? 'Subject is required' : undefined },
          { field: 'message', message: !message ? 'Message is required' : undefined },
        ].filter(Boolean) as any)
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json(
        ResponseBuilder.validationError('Invalid email address', [
          { field: 'email', message: 'Please enter a valid email' }
        ])
      );
    }

    const toAddress = process.env.SMTP_TO || process.env.SMTP_USER;
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: fromAddress,
      to: toAddress,
      replyTo: email,
      subject: `[Play-Mate Contact] ${subject}`,
      text: `New contact submission\n\nName: ${name}\nEmail: ${email}\nGame idea: ${gameIdea || '-'}\n\nMessage:\n${message}`,
      html: `<div>
        <h3>New contact submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Game idea:</strong> ${gameIdea || '-'}</p>
        <hr />
        <p>${(message || '').replace(/\n/g, '<br/>')}</p>
      </div>`,
    } as nodemailer.SendMailOptions;

    if (!transporter) {
      logger.warn('SMTP not fully configured; cannot send contact email');
      return res.status(500).json(
        ResponseBuilder.error('Email service not configured on server')
      );
    }

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json(
        ResponseBuilder.success({}, 'Your message has been sent successfully')
      );
    } catch (err) {
      logger.error('Failed to send contact email', err);
      return res.status(500).json(
        ResponseBuilder.error('Failed to send your message, please try again later')
      );
    }
  })
};


