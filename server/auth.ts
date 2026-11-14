/**
 * Authentication and authorization middleware for Neighborhood Help Exchange
 */

import { Request, Response, NextFunction } from 'express';
import { db, hashPassword, User } from './db.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = db.getUserByToken(token);

  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid token. Please sign in again.' });
    return;
  }

  if (user.status === 'blocked') {
    res.status(403).json({ error: 'Your account has been suspended by community moderation.' });
    return;
  }

  if (user.status === 'deactivated') {
    res.status(403).json({ error: 'Your account is deactivated. Please contact support.' });
    return;
  }

  req.user = user;
  req.token = token;
  next();
}

/**
 * Strict Administrator-only authorization middleware
 * Verifies session token and strictly enforces user.role === 'admin'
 */
export function adminAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in as an administrator.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = db.getUserByToken(token);

  if (!user) {
    res.status(401).json({ error: 'Administrator session expired or invalid. Please sign in again.' });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({ error: 'Administrator account is not in active standing.' });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Access denied. Administrator privileges required.' });
    return;
  }

  req.user = user;
  req.token = token;
  next();
}

// Optional auth middleware: sets req.user if token provided, but doesn't block if anonymous
export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = db.getUserByToken(token);
    if (user && user.status === 'active') {
      req.user = user;
      req.token = token;
    }
  }
  next();
}

// Helper to verify user login credentials
export function verifyCredentials(email: string, passwordAttempt: string): User | null {
  const user = db.findUserByEmail(email);
  if (!user) return null;

  const attemptedHash = hashPassword(passwordAttempt, user.salt);
  if (attemptedHash === user.passwordHash) {
    return user;
  }
  return null;
}
