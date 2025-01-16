import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { generateToken } from '../utils/authUtils.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 */
router.post('/register', async (req, res) => {
  logger.info('POST /api/users/register - Creating a new user');
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'A user with that email already exists.' });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    logger.info(`New user created: ${newUser._id}`);

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
      token,
    });
  } catch (err) {
    logger.error('Error in user registration:', err.message);
    return res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * @route   POST /api/users/login
 * @desc    Log in an existing user
 */
router.post('/login', async (req, res) => {
  logger.info('POST /api/users/login - Logging in user');
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    logger.info(`User logged in: ${user._id}`);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    logger.error('Error in user login:', err.message);
    return res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * @route   GET /api/users/me
 * @desc    Get the logged-in user's details
 */
router.get('/me', requireAuth, async (req, res) => {
  logger.info('GET /api/users/me - Fetching user details');
  try {
    if (!req.userId) {
      logger.warn('req.userId is missing (middleware might not have set it)');
      return res.status(401).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.userId).select(
      'name email isFirstTimeLogin'
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    logger.error('Error fetching user details:', err.message);
    return res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * @route   PATCH /api/users/me
 * @desc    Update the logged-in user's details (e.g., isFirstTimeLogin)
 */
router.patch('/me', requireAuth, async (req, res) => {
  logger.info('PATCH /api/users/me - Updating user details');
  try {
    if (!req.userId) {
      logger.warn('req.userId is missing (middleware might not have set it)');
      return res.status(401).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (typeof req.body.isFirstTimeLogin !== 'undefined') {
      user.isFirstTimeLogin = req.body.isFirstTimeLogin;
    }

    await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isFirstTimeLogin: user.isFirstTimeLogin,
      },
    });
  } catch (err) {
    logger.error('Error updating user details:', err.message);
    return res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
