import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/config';

interface EmailOptions {
  to: string;
  subject?: string;
  template: string;
  data: Record<string, string | number | Date>;
}

interface RawEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const emailConfig = config.email;

    if (emailConfig.provider === 'sendgrid') {
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: emailConfig.apiKey,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: emailConfig.host || 'localhost',
        port: emailConfig.port || 587,
        secure: emailConfig.secure || false,
        auth: emailConfig.user
          ? {
              user: emailConfig.user,
              pass: emailConfig.password,
            }
          : undefined,
      });
    }
  }

  return transporter;
}

const templateCache = new Map<string, string>();

function loadTemplate(templateName: string): string {
  const cached = templateCache.get(templateName);
  if (cached) return cached;

  const templatePath = path.resolve(__dirname, '..', 'templates', 'emails', `${templateName}.html`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templateName}`);
  }

  const content = fs.readFileSync(templatePath, 'utf-8');
  templateCache.set(templateName, content);
  return content;
}

function renderTemplate(template: string, data: Record<string, string | number | Date>): string {
  let rendered = template;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const stringValue = value instanceof Date ? value.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) : String(value);
    rendered = rendered.replace(placeholder, stringValue);
  }

  return rendered;
}

const subjectMap: Record<string, string> = {
  'subscription-created': 'Welcome to AdStack - Subscription Confirmed',
  'subscription-canceled': 'Your AdStack Subscription Has Been Canceled',
  'subscription-cancel-scheduled': 'Your AdStack Subscription Will Cancel at Period End',
  'plan-changed': 'Your AdStack Plan Has Been Updated',
  'payment-failed': 'Action Required: Payment Failed',
  'renewal-reminder': 'Your AdStack Subscription Renews Soon',
  'usage-limit-warning': 'Usage Limit Warning - Action Recommended',
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const template = loadTemplate(options.template);
    const html = renderTemplate(template, options.data);
    const subject = options.subject || subjectMap[options.template] || 'AdStack Notification';
    const fromAddress = config.email.from || 'noreply@adstack.io';

    const mailOptions = {
      from: fromAddress,
      to: options.to,
      subject,
      html,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    console.log(`Email sent: ${options.template} -> ${options.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', (error as Error).message);
    return false;
  }
}

export async function sendRawEmail(options: RawEmailOptions): Promise<boolean> {
  try {
    const fromAddress = config.email.from || 'noreply@adstack.io';

    const mailOptions = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const transport = getTransporter();
    await transport.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send raw email:', (error as Error).message);
    return false;
  }
}

export function clearTemplateCache(): void {
  templateCache.clear();
}
