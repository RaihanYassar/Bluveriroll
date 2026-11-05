const { verifyToken } = require('../helpers/jwt');
const { User, Watchlist } = require('../models');

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

const watchlistAuthorization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Watchlist.findByPk(id);

    if (!item) {
      throw { name: 'NotFound', status: 404, message: 'Watchlist item not found' };
    }

    if (item.userId !== req.user.id) {
      throw { name: 'Forbidden', status: 403, message: 'You are not authorized to modify this watchlist item' };
    }

    req.watchlistItem = item;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authentication,
  watchlistAuthorization
};

