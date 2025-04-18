import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { generateToken, generateRefreshToken } from '../utils/authUtils.js';
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

    const accessToken = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
      token: accessToken,
      refreshToken,
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

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`User logged in: ${user._id}`);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
      },
      token: accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error('Error in user login:', err.message);
    return res.status(500).json({ error: 'Server Error' });
  }
});

/**
 * @route   POST /api/users/refresh
 * @desc    Refreshes the access token using a valid refresh token
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refreshsecretkey'
    );
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    return res.status(200).json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
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
      'name email isFirstTimeLogin profilePhoto'
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
 * @desc    Update the logged-in user's details
 */
router.patch('/me', requireAuth, async (req, res) => {
  logger.info('PATCH /api/users/me - Updating user details');
  try {
    if (!req.userId) {
      logger.warn('req.userId is missing (middleware might not have set it)');
      return res.status(401).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, email, password, profilePhoto, isFirstTimeLogin } = req.body;

    if (
      profilePhoto &&
      Buffer.byteLength(profilePhoto, 'utf-8') > 10 * 1024 * 1024
    ) {
      return res
        .status(413)
        .json({ error: 'Profile photo is too large. Maximum size is 10MB.' });
    }

    if (typeof name === 'string' && name.trim() !== '') {
      user.name = name.trim();
    }
    if (typeof email === 'string' && email.trim() !== '') {
      user.email = email.trim();
    }

    if (typeof password === 'string' && password.trim() !== '') {
      user.password = password;
    }

    if (typeof profilePhoto !== 'undefined') {
      user.profilePhoto = profilePhoto;
    }

    if (typeof isFirstTimeLogin === 'boolean') {
      user.isFirstTimeLogin = isFirstTimeLogin;
    }

    await user.save();

    const { password: _, ...updatedUserData } = user.toObject();
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUserData,
    });
  } catch (err) {
    logger.error('Error updating user details:', err.message);
    return res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
