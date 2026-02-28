import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import * as analyticsService from '../services/analytics';

const router = Router();

router.get('/summary', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const startDate = (req.query.startDate as string) || new Date(Date.now() - 30 * 86400000).toISOString();
    const endDate = (req.query.endDate as string) || new Date().toISOString();
    const campaignId = req.query.campaignId as string | undefined;

    const summary = await analyticsService.getSummary(userId, {
      startDate,
      endDate,
      campaignId,
    });

    return res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

router.get('/timeseries', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const startDate = (req.query.startDate as string) || new Date(Date.now() - 30 * 86400000).toISOString();
    const endDate = (req.query.endDate as string) || new Date().toISOString();
    const campaignId = req.query.campaignId as string | undefined;
    const granularity = (req.query.granularity as string) || 'day';

    const series = await analyticsService.getTimeSeries(userId, {
      startDate,
      endDate,
      campaignId,
      granularity: granularity as 'hour' | 'day' | 'week' | 'month',
    });

    return res.json({ success: true, data: series });
  } catch (error) {
    next(error);
  }
});

router.get('/top-campaigns', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const metric = (req.query.metric as string) || 'impressions';
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const campaigns = await analyticsService.getTopCampaigns(
      userId,
      metric as 'impressions' | 'clicks' | 'conversions' | 'spend',
      limit
    );

    return res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
});

router.get('/usage', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const period = (req.query.period as string) || 'current';

    const usage = await analyticsService.getUsageBreakdown(userId, period);

    return res.json({ success: true, data: usage });
  } catch (error) {
    next(error);
  }
});

export default router;
