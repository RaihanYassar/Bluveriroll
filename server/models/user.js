'use strict';
const { Model } = require('sequelize');
const { hashPassword } = require('../helpers/bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Associations will be defined as Watchlist and WatchHistory models are introduced
    }

    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Username is required' },
          notEmpty: { msg: 'Username cannot be empty' }
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Email is already registered'
        },
        validate: {
          notNull: { msg: 'Email is required' },
          notEmpty: { msg: 'Email cannot be empty' },
          isEmail: { msg: 'Invalid email format' }
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {
          msg: 'Google account is already linked'
        }
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      hooks: {
        beforeCreate: (user) => {
          if (user.password) {
            user.password = hashPassword(user.password);
          }
        },
        beforeUpdate: (user) => {
          if (user.changed('password') && user.password) {
            user.password = hashPassword(user.password);
          }
        }
      }
    }
  );

  return User;
};