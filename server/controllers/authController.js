const { Op } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const { comparePassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');

class AuthController {
  static async register(req, res, next) {
    try {
      const { username, email, password, avatarUrl } = req.body;

      if (!username || !email || !password) {
        throw {
          name: 'BadRequest',
          status: 400,
          message: 'Username, email, and password are required'
        };
      }

      const user = await User.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        avatarUrl
      });

      res.status(201).json({
        statusCode: 201,
        message: 'User registered successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw {
          name: 'BadRequest',
          status: 400,
          message: 'Email and password are required'
        };
      }

      const user = await User.findOne({
        where: { email: email.trim().toLowerCase() }
      });

      if (!user) {
        throw {
          name: 'Unauthorized',
          status: 401,
          message: 'Invalid email or password'
        };
      }

      if (!user.password) {
        throw {
          name: 'Unauthorized',
          status: 401,
          message: 'This account was registered using Google Sign-In. Please sign in with Google.'
        };
      }

      const isPasswordValid = comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw {
          name: 'Unauthorized',
          status: 401,
          message: 'Invalid email or password'
        };
      }

      const access_token = signToken({
        id: user.id,
        email: user.email,
        username: user.username
      });

      res.status(200).json({
        statusCode: 200,
        message: 'Login successful',
        access_token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const googleToken = req.body.idToken || req.body.credential || req.body.token;
      if (!googleToken) {
        throw {
          name: 'BadRequest',
          status: 400,
          message: 'Google OAuth token is required'
        };
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw {
          name: 'InternalServerError',
          status: 500,
          message: 'GOOGLE_CLIENT_ID is not configured on the server'
        };
      }

      let payload;
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: googleToken,
          audience: clientId
        });
        payload = ticket.getPayload();
      } catch (verifyError) {
        throw {
          name: 'Unauthorized',
          status: 401,
          message: 'Invalid or expired Google ID token'
        };
      }

      if (!payload || !payload.email_verified) {
        throw {
          name: 'Unauthorized',
          status: 401,
          message: 'Google email is not verified'
        };
      }

      const googleId = payload.sub;
      const normalizedEmail = payload.email.trim().toLowerCase();
      const displayName = payload.name ? payload.name.trim() : normalizedEmail.split('@')[0];
      const avatarUrl = payload.picture || null;

      let user = await User.findOne({
        where: {
          [Op.or]: [
            { googleId },
            { email: normalizedEmail }
          ]
        }
      });

      if (user) {
        if (user.googleId && user.googleId !== googleId) {
          throw {
            name: 'Conflict',
            status: 409,
            message: 'Account is already linked to a different Google ID'
          };
        }

        if (!user.googleId) {
          user.googleId = googleId;
          user.avatarUrl = user.avatarUrl || avatarUrl;
          await user.save();
        }
      } else {
        user = await User.create({
          username: displayName,
          email: normalizedEmail,
          password: null,
          googleId,
          avatarUrl
        });
      }

      const access_token = signToken({
        id: user.id,
        email: user.email,
        username: user.username
      });

      res.status(200).json({
        statusCode: 200,
        message: 'Google login successful',
        access_token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          googleId: user.googleId,
          avatarUrl: user.avatarUrl
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      res.status(200).json({
        statusCode: 200,
        message: 'User profile retrieved successfully',
        user: req.user
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;

