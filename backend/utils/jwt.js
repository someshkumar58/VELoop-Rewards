const jwt = require('jsonwebtoken');

/**
 * Generates a signed JSON Web Token (JWT) for an authenticated user.
 * 
 * @param {Object} user - User document or payload object
 * @returns {string} - Signed JWT string
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables (.env)');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      role: user.role || 'user'
    },
    secret,
    { expiresIn }
  );
};

/**
 * Verifies a JSON Web Token and decodes its payload.
 * 
 * @param {string} token - Bearer JWT string
 * @returns {Object} - Decoded payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables (.env)');
  }

  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken
};

