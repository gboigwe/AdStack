import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import * as webhookService from '../services/webhooks';
import { logger } from '../lib/logger';

const router = Router();

router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  const isValid = webhookService.verifyStripeSignature(req.body, signature);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const event = JSON.parse(req.body.toString());

    switch (event.type) {
      case 'payment_intent.succeeded':
        logger.info(`Payment succeeded: ${event.data.object.id}`);
        break;

      case 'payment_intent.payment_failed':
        logger.warn(`Payment failed: ${event.data.object.id}`);
        break;

      case 'customer.subscription.updated':
        logger.info(`Subscription updated: ${event.data.object.id}`);
        break;

      case 'customer.subscription.deleted':
        logger.info(`Subscription deleted: ${event.data.object.id}`);
        break;

      case 'invoice.payment_succeeded':
        logger.info(`Invoice paid: ${event.data.object.id}`);
        break;

      case 'invoice.payment_failed':
        logger.warn(`Invoice payment failed: ${event.data.object.id}`);
        break;

      default:
        logger.info(`Unhandled Stripe event: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/stacks', async (req: Request, res: Response) => {
  try {
    const event = req.body;

    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }

    logger.info(`Stacks webhook: ${event.type}`);

    switch (event.type) {
      case 'transaction.confirmed':
        await webhookService.dispatchEvent('blockchain.transaction.confirmed', event.payload);
        break;

      case 'contract.event':
        await webhookService.dispatchEvent('blockchain.contract.event', event.payload);
        break;

      default:
        logger.info(`Unhandled Stacks event: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error('Stacks webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const webhooks = await webhookService.listWebhooks(userId);

    return res.json({ success: true, data: webhooks });
  } catch (error) {
    next(error);
  }
});

router.post('/register', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { url, events } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      return res.status(400).json({ success: false, error: 'url and events array are required' });
    }

    const webhook = await webhookService.registerWebhook(userId, url, events);

    return res.status(201).json({ success: true, data: webhook });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const deleted = await webhookService.deleteWebhook(userId, req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    return res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
