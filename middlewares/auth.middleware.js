// const jwt = require('jsonwebtoken');
// const config = require('../config/jwt');
// const User = require('../models/user.model');

// module.exports = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (!token) {
//       return res.status(401).json({ message: 'No token, authorization denied' });
//     }

//     const decoded = jwt.verify(token, config.secret);
//     const user = await User.findByPk(decoded.id);

//     if (!user) {
//       return res.status(401).json({ message: 'Token is not valid' });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error(error);
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };

const jwt = require('jsonwebtoken');
const config = require('../config/jwt');
const User = require('../models/user.model');

module.exports = async (req, res, next) => {
  try {
    // Отримання токену з заголовка
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Необхідна аутентифікація' });
    }

    // Верифікація токену
    const decoded = jwt.verify(token, config.secret);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Користувача не знайдено' });
    }

    // Додавання користувача до запиту
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Помилка аутентифікації:', error);
    res.status(401).json({ message: 'Невірний токен' });
  }
};