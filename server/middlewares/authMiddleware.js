const { verifyToken } = require('../helpers/jwt');
const { User } = require('../models');

const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      throw { name: 'Unauthorized', status: 401, message: 'Please login first' };
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      throw { name: 'Unauthorized', status: 401, message: 'Invalid authorization token format' };
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      throw { name: 'Unauthorized', status: 401, message: 'Invalid or expired authentication token' };
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
      throw { name: 'Unauthorized', status: 401, message: 'User not found or token invalid' };
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      googleId: user.googleId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authentication
};
