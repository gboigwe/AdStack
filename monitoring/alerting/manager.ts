import axios from 'axios';
import { createLogger } from '../logging/logger';

const logger = createLogger({ service: 'alert-manager' });

type AlertSeverity = 'info' | 'warning' | 'critical';
type AlertChannel = 'slack' | 'pagerduty' | 'email' | 'webhook';

interface Alert {
  name: string;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, any>;
  timestamp?: string;
}

interface AlertConfig {
  slack?: {
    webhookUrl: string;
    defaultChannel: string;
    criticalChannel?: string;
  };
  pagerduty?: {
    routingKey: string;
  };
  webhook?: {
    url: string;
    secret?: string;
  };
  escalation: {
    info: AlertChannel[];
    warning: AlertChannel[];
    critical: AlertChannel[];
  };
}

export class AlertManager {
  private config: AlertConfig;

  constructor(config: AlertConfig) {
    this.config = config;
  }

  async send(alert: Alert): Promise<void> {
    const channels = this.config.escalation[alert.severity] || ['slack'];
    const timestamp = alert.timestamp || new Date().toISOString();

    logger.info('Sending alert', {
      name: alert.name,
      severity: alert.severity,
      channels,
    });

    const results = await Promise.allSettled(
      channels.map((channel) => this.dispatch(channel, { ...alert, timestamp }))
    );

    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        logger.error('Failed to send alert', {
          channel: channels[i],
          error: result.reason?.message,
          alertName: alert.name,
        });
      }
    }
  }

  private async dispatch(channel: AlertChannel, alert: Alert & { timestamp: string }): Promise<void> {
    switch (channel) {
      case 'slack':
        await this.sendSlack(alert);
        break;
      case 'pagerduty':
        await this.sendPagerDuty(alert);
        break;
      case 'webhook':
        await this.sendWebhook(alert);
        break;
      default:
        logger.warn('Unknown alert channel', { channel });
    }
  }

  private async sendSlack(alert: Alert & { timestamp: string }): Promise<void> {
    if (!this.config.slack?.webhookUrl) return;

    const color = alert.severity === 'critical' ? '#dc3545' :
                  alert.severity === 'warning' ? '#ffc107' : '#17a2b8';

    const channel = alert.severity === 'critical' && this.config.slack.criticalChannel
      ? this.config.slack.criticalChannel
      : this.config.slack.defaultChannel;

    await axios.post(this.config.slack.webhookUrl, {
      channel,
      attachments: [{
        color,
        title: `[${alert.severity.toUpperCase()}] ${alert.name}`,
        text: alert.message,
        fields: alert.details ? Object.entries(alert.details).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true,
        })) : [],
        ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
      }],
    }, { timeout: 10000 });
  }

  private async sendPagerDuty(alert: Alert & { timestamp: string }): Promise<void> {
    if (!this.config.pagerduty?.routingKey) return;

    const severity = alert.severity === 'critical' ? 'critical' : 'warning';

    await axios.post('https://events.pagerduty.com/v2/enqueue', {
      routing_key: this.config.pagerduty.routingKey,
      event_action: 'trigger',
      payload: {
        summary: `[AdStack] ${alert.name}: ${alert.message}`,
        severity,
        source: 'adstack-monitoring',
        timestamp: alert.timestamp,
        custom_details: alert.details,
      },
    }, { timeout: 10000 });
  }

  private async sendWebhook(alert: Alert & { timestamp: string }): Promise<void> {
    if (!this.config.webhook?.url) return;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.webhook.secret) {
      const crypto = await import('crypto');
      const payload = JSON.stringify(alert);
      const signature = crypto.createHmac('sha256', this.config.webhook.secret)
        .update(payload)
        .digest('hex');
      headers['x-signature'] = signature;
    }

    await axios.post(this.config.webhook.url, alert, { headers, timeout: 10000 });
  }
}
