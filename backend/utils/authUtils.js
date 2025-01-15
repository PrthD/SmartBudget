import jwt from 'jsonwebtoken';

/**
 * Generate a JWT for a user
 * @param {Object} user - Mongoose user doc { _id, email, ... }
 * @returns {string} Signed JWT token
 */
export const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'supersecretkey',
    { expiresIn: '7d' }
  );
};
