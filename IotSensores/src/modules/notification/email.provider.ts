import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../../config/index.js';
import { logger } from '../../shared/logger/index.js';
import { Notification } from './notification.entity.js';

export interface INotificationProvider {
  send(notification: Notification): Promise<void>;
}

export class EmailProvider implements INotificationProvider {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    }
    return this.transporter;
  }

  async send(notification: Notification): Promise<void> {
    if (!config.smtp.host || !config.smtp.user) {
      logger.warn({ recipient: notification.recipient }, 'SMTP not configured, skipping email');
      return;
    }

    try {
      const transporter = this.getTransporter();

      await transporter.sendMail({
        from: config.smtp.from,
        to: notification.recipient,
        subject: notification.subject,
        html: notification.body,
      });

      logger.info(
        { recipient: notification.recipient, subject: notification.subject },
        'Email sent successfully'
      );
    } catch (error) {
      logger.error({ error, recipient: notification.recipient }, 'Failed to send email');
      throw error;
    }
  }

  async verify(): Promise<boolean> {
    if (!config.smtp.host || !config.smtp.user) {
      return false;
    }

    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
