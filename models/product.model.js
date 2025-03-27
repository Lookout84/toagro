const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  condition: {
    type: DataTypes.ENUM('new', 'used'),
    defaultValue: 'used'
  },
  mileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  power: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'sold'),
    defaultValue: 'pending'
  },
  category: {
    type: DataTypes.ENUM('tractor', 'combine', 'equipment', 'parts'),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
});

module.exports = Product;