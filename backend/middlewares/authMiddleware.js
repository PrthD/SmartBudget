import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('No auth token provided or invalid auth header');
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'supersecretkey'
    );
    req.userId = decoded.userId;
    next();
  } catch (err) {
    logger.warn('Invalid token: ' + err.message);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};
