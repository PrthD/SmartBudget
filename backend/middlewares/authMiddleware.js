import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

export const requireAuth = async (req, res, next) => {
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

    const user = await User.findById(req.userId);
    if (!user) {
      logger.warn('User does not exist for token provided');
      return res.status(401).json({ error: 'User no longer exists' });
    }

    next();
  } catch (err) {
    logger.warn('Invalid token: ' + err.message);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};
