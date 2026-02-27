import { Router, Request, Response, NextFunction } from 'express';
import { auth, requireAdmin } from '../middleware/auth';
import * as userService from '../services/users';

const router = Router();

router.get('/', auth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string | undefined;
    const tier = req.query.tier as string | undefined;

    const result = await userService.listUsers(page, limit, { search, tier });

    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.params.id !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/tier', auth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tier } = req.body;

    if (!tier || !['free', 'basic', 'pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({ success: false, error: 'Valid tier is required' });
    }

    const user = await userService.updateUserTier(req.params.id, tier);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await userService.createAuditEntry({
      entityType: 'user',
      entityId: req.params.id,
      userId: req.user!.id,
      action: 'update_tier',
      changes: { tier },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/admin', auth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isAdmin boolean is required' });
    }

    const user = await userService.setAdminStatus(req.params.id, isAdmin);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await userService.createAuditEntry({
      entityType: 'user',
      entityId: req.params.id,
      userId: req.user!.id,
      action: 'update_admin_status',
      changes: { isAdmin },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', auth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    const deleted = await userService.deleteUser(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await userService.createAuditEntry({
      entityType: 'user',
      entityId: req.params.id,
      userId: req.user!.id,
      action: 'delete_user',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

router.get('/audit/log', auth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const result = await userService.getAuditLog(entityType, entityId, page, limit);

    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
