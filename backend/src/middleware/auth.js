import cookieParser from 'cookie-parser';
import { verifyJwt } from '../utils/token.js';

export const initAuth = (app) => {
  app.use(cookieParser());
};

const extractToken = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const authHeader = req.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

export const requireAuth = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = verifyJwt(token);
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const payload = verifyJwt(token);
    req.user = { id: payload.id, role: payload.role };
  } catch (error) {
    console.warn('Optional auth failed:', error.message);
  }
  return next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  return next();
};
