import { query, queryOne } from '../lib/database';
import { config } from '../config/config';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';

interface AuthResult {
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  token: string;
  expiresIn: string;
}

export async function authenticateWithWallet(
  walletAddress: string,
  signature: string,
  message: string
): Promise<AuthResult> {
  let user = await queryOne<User>(
    'SELECT * FROM users WHERE wallet_address = $1',
    [walletAddress]
  );

  if (!user) {
    const id = uuidv4();
    user = await queryOne<User>(
      `INSERT INTO users (id, wallet_address, tier, is_admin, is_verified, created_at, updated_at)
       VALUES ($1, $2, 'free', false, false, NOW(), NOW())
       RETURNING *`,
      [id, walletAddress]
    );
  }

  if (!user) {
    throw new Error('Failed to create user');
  }

  await query(
    'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
    [user.id]
  );

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      email: user.email,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      tier: user.tier,
      lastLoginAt: new Date(),
    },
    token,
    expiresIn: config.auth.jwtExpiration,
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);
}

export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);
}

export async function updateProfile(
  userId: string,
  updates: { email?: string; displayName?: string }
): Promise<User | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }

  if (updates.displayName !== undefined) {
    fields.push(`display_name = $${paramIndex++}`);
    values.push(updates.displayName);
  }

  if (fields.length === 0) return getUserById(userId);

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  return queryOne<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
}

export async function verifyUser(userId: string): Promise<boolean> {
  const result = await query(
    'UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1',
    [userId]
  );
  return (result.rowCount ?? 0) > 0;
}

function generateToken(user: User): string {
  const payload = {
    id: user.id,
    walletAddress: user.walletAddress,
    email: user.email,
    isAdmin: user.isAdmin,
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiration,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): { id: string; walletAddress: string; email?: string; isAdmin: boolean } | null {
  try {
    return jwt.verify(token, config.auth.jwtSecret) as {
      id: string;
      walletAddress: string;
      email?: string;
      isAdmin: boolean;
    };
  } catch {
    return null;
  }
}
