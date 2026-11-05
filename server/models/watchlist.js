'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Watchlist extends Model {
    static associate(models) {
      if (models && models.User) {
        Watchlist.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user'
        });
      }
    }
  }

  Watchlist.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      animeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'Anime ID is required' }
        }
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: 'Title is required' },
          notEmpty: { msg: 'Title cannot be empty' }
        }
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Plan to Watch'
      },
      score: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      currentEpisode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      totalEpisodes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      genres: {
        type: DataTypes.STRING,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Watchlist',
      tableName: 'Watchlists'
    }
  );

  return Watchlist;
};

