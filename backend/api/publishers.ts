import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import * as publisherService from '../services/publishers';

const router = Router();

router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, category, search, page, limit } = req.query;
    const result = await publisherService.listPublishers({
      status: status as string,
      category: category as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/mine', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publisher = await publisherService.getPublisherByUserId(req.user!.id);
    if (!publisher) {
      return res.status(404).json({ error: 'Not Found', message: 'No publisher profile found' });
    }
    res.json({ publisher });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publisher = await publisherService.getPublisherById(req.params.id);
    if (!publisher) {
      return res.status(404).json({ error: 'Not Found', message: 'Publisher not found' });
    }
    res.json({ publisher });
  } catch (error) {
    next(error);
  }
});

router.post('/register', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, domain, category, adSlots } = req.body;

    if (!name || !domain || !category) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name, domain, and category are required',
      });
    }

    const publisher = await publisherService.registerPublisher({
      userId: req.user!.id,
      name,
      domain,
      category,
      adSlots,
    });

    res.status(201).json({ publisher });
  } catch (error: any) {
    if (error.message === 'Domain already registered') {
      return res.status(409).json({ error: 'Conflict', message: error.message });
    }
    next(error);
  }
});

router.post('/:id/verify', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { method } = req.body;
    const result = await publisherService.verifyPublisher(req.params.id, method || 'dns');
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Publisher not found') {
      return res.status(404).json({ error: 'Not Found', message: error.message });
    }
    next(error);
  }
});

router.put('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publisher = await publisherService.getPublisherById(req.params.id);
    if (!publisher) {
      return res.status(404).json({ error: 'Not Found', message: 'Publisher not found' });
    }
    if (publisher.user_id !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'Not authorized' });
    }

    const updated = await publisherService.updatePublisher(req.params.id, req.body);
    res.json({ publisher: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/stats', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await publisherService.getPublisherStats(req.params.id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/suspend', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Bad Request', message: 'Suspension reason is required' });
    }

    await publisherService.suspendPublisher(req.params.id, reason);
    res.json({ message: 'Publisher suspended' });
  } catch (error) {
    next(error);
  }
});

export default router;
