import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

interface JWTPayload {
  userId: string;
  address: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  address?: string;
  role?: string;
}

export const authMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    // Allow connections in development mode without authentication
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
      logger.warn('Authentication bypassed in development mode');
      socket.userId = 'dev-user';
      socket.address = 'ST000000000000000000002AMW42H';
      socket.role = 'developer';
      return next();
    }

    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn(`Authentication failed: No token provided from ${socket.handshake.address}`);
      return next(new Error('Authentication error: No token provided'));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not configured');
      return next(new Error('Server configuration error'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    if (!decoded.userId || !decoded.address) {
      logger.warn('Invalid token payload: missing required fields');
      return next(new Error('Authentication error: Invalid token payload'));
    }

    // Attach user information to socket
    socket.userId = decoded.userId;
    socket.address = decoded.address;
    socket.role = decoded.role || 'user';

    logger.info(`User authenticated: ${decoded.userId} (${decoded.address})`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`JWT verification failed: ${error.message}`);
      return next(new Error('Authentication error: Invalid token'));
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT token expired');
      return next(new Error('Authentication error: Token expired'));
    }

    logger.error(`Authentication error: ${error}`);
    next(new Error('Authentication error'));
  }
};

export const generateToken = (userId: string, address: string, role: string = 'user'): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { userId, address, role },
    jwtSecret,
    { expiresIn: '24h' }
  );
};
