const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bluveriroll_jwt_secret_dev_key';

const signToken = (payload, options = {}) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    ...options
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  signToken,
  verifyToken
};

