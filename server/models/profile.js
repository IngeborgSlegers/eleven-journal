const { DataTypes } = require('sequelize')
const db = require('../db');

const Profile = db.define('profile', {
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  userName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  phoneNumber: {
    type:DataTypes.STRING,
    allowNull: false,
    min: 10,
    max: 10
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = Profile;