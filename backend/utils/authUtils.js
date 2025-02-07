import jwt from 'jsonwebtoken';

/**
 * Generates a JWT access token for a user.
 *
 * @param {Object} user - A Mongoose user document (must include _id).
 * @returns {string} A signed JWT access token valid for 7 days.
 */
export const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'supersecretkey',
    { expiresIn: '7d' }
  );
};

/**
 * Generates a JWT refresh token for a user.
 *
 * @param {Object} user - A Mongoose user document (must include _id).
 * @returns {string} A signed JWT refresh token valid for 30 days.
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || 'refreshsecretkey',
    { expiresIn: '30d' }
  );
};
