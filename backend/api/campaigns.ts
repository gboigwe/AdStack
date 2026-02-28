import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import * as campaignService from '../services/campaigns';

const router = Router();

router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await campaignService.listCampaigns(userId, page, limit, { status: status as any, search });

    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (campaign.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, description, budget, dailyBudget, startDate, endDate, targetingRules } = req.body;

    if (!name || !budget || !startDate) {
      return res.status(400).json({
        success: false,
        error: 'name, budget, and startDate are required',
      });
    }

    const campaign = await campaignService.createCampaign({
      userId,
      name,
      description,
      budget,
      dailyBudget,
      startDate,
      endDate,
      targetingRules,
    });

    return res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, description, budget, dailyBudget, endDate, targetingRules } = req.body;

    const campaign = await campaignService.updateCampaign(req.params.id, userId, {
      name,
      description,
      budget,
      dailyBudget,
      endDate,
      targetingRules,
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    return res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'status is required' });
    }

    const campaign = await campaignService.updateCampaignStatus(req.params.id, userId, status);

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    return res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/stats', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await campaignService.getCampaignStats(req.params.id);

    if (!stats) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    return res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const deleted = await campaignService.deleteCampaign(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    return res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
