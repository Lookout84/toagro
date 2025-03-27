// const jwt = require('jsonwebtoken');
// const { validationResult } = require('express-validator');
// const User = require('../models/user.model');
// const config = require('../config/jwt');

// exports.register = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const { email, password, firstName, lastName, phone } = req.body;

//     const existingUser = await User.findOne({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const user = await User.create({
//       email,
//       password,
//       firstName,
//       lastName,
//       phone
//     });

//     const token = jwt.sign({ id: user.id }, config.secret, {
//       expiresIn: config.jwtExpiration
//     });

//     res.status(201).json({
//       id: user.id,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       role: user.role,
//       token
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.login = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ where: { email } });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const token = jwt.sign({ id: user.id }, config.secret, {
//       expiresIn: config.jwtExpiration
//     });

//     res.json({
//       id: user.id,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       role: user.role,
//       token
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

const jwt = require('jsonwebtoken');
const config = require('../config/jwt');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, firstName, lastName } = req.body;

    // Перевірка на існуючого користувача
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Користувач вже існує' });
    }

    // Створення нового користувача
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    // Генерація JWT токену
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.secret,
      { expiresIn: config.expiresIn }
    );

    res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      token
    });
  } catch (error) {
    console.error('Помилка реєстрації:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Пошук користувача
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Невірні облікові дані' });
    }

    // Перевірка паролю
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Невірні облікові дані' });
    }

    // Генерація JWT токену
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.secret,
      { expiresIn: config.expiresIn }
    );

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token
    });
  } catch (error) {
    console.error('Помилка входу:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};