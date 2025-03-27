const { validationResult } = require('express-validator');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const uploadService = require('../services/upload.service');

exports.createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (user.role !== 'seller' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Only sellers can create products' });
    }

    const { title, description, price, year, condition, mileage, power, location, category, brand } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await Promise.all(req.files.map(file => uploadService.uploadImage(file)));
    }

    const product = await Product.create({
      title,
      description,
      price,
      year,
      condition,
      mileage,
      power,
      location,
      category,
      brand,
      images,
      userId
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.getProducts = async (req, res) => {
//   try {
//     const { category, brand, minPrice, maxPrice, condition, search, page = 1, limit = 20 } = req.query;
    
//     const where = { status: 'approved' };
//     const offset = (page - 1) * limit;

//     if (category) where.category = category;
//     if (brand) where.brand = brand;
//     if (condition) where.condition = condition;
//     if (minPrice || maxPrice) {
//       where.price = {};
//       if (minPrice) where.price[Sequelize.Op.gte] = minPrice;
//       if (maxPrice) where.price[Sequelize.Op.lte] = maxPrice;
//     }
    
//     if (search) {
//       where[Sequelize.Op.or] = [
//         { title: { [Sequelize.Op.iLike]: `%${search}%` } },
//         { description: { [Sequelize.Op.iLike]: `%${search}%` } }
//       ];
//     }

//     const { count, rows } = await Product.findAndCountAll({
//       where,
//       limit: parseInt(limit),
//       offset,
//       order: [['createdAt', 'DESC']],
//       include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'phone'] }]
//     });

//     res.json({
//       total: count,
//       page: parseInt(page),
//       pages: Math.ceil(count / limit),
//       products: rows
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
exports.getProducts = async (req, res) => {
    try {
      const { 
        category, 
        brand, 
        minPrice, 
        maxPrice, 
        condition, 
        search, 
        minYear, 
        maxYear,
        minPower,
        maxPower,
        location,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        page = 1, 
        limit = 20 
      } = req.query;
      
      const where = { status: 'approved' };
      const offset = (page - 1) * limit;
      const order = [[sortBy, sortOrder.toUpperCase()]];
  
      // Базові фільтри
      if (category) where.category = category;
      if (brand) where.brand = brand;
      if (condition) where.condition = condition;
      if (location) where.location = { [Op.iLike]: `%${location}%` };
  
      // Фільтри по ціні
      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = minPrice;
        if (maxPrice) where.price[Op.lte] = maxPrice;
      }
      
      // Фільтри по роках
      if (minYear || maxYear) {
        where.year = {};
        if (minYear) where.year[Op.gte] = minYear;
        if (maxYear) where.year[Op.lte] = maxYear;
      }
      
      // Фільтри по потужності
      if (minPower || maxPower) {
        where.power = {};
        if (minPower) where.power[Op.gte] = minPower;
        if (maxPower) where.power[Op.lte] = maxPower;
      }
      
      // Пошук за текстом
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { brand: { [Op.iLike]: `%${search}%` } }
        ];
      }
  
      const { count, rows } = await Product.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order,
        include: [{ 
          model: User, 
          attributes: ['id', 'firstName', 'lastName', 'phone'] 
        }]
      });
  
      res.json({
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        products: rows
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };