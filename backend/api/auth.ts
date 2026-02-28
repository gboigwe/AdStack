import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import * as authService from '../services/auth';

const router = Router();

router.post('/wallet', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress, signature, and message are required',
      });
    }

    const result = await authService.authenticateWithWallet(walletAddress, signature, message);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const user = await authService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { email, displayName } = req.body;

    const user = await authService.updateProfile(userId, { email, displayName });

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-token', async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required',
    });
  }

  const decoded = authService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  return res.json({
    success: true,
    data: { valid: true, user: decoded },
  });
});

export default router;
