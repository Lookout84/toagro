const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { check } = require('express-validator');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Користувач успішно зареєстрований
 */
router.post(
  '/register',
  [
    check('email', 'Невірний email').isEmail(),
    check('password', 'Пароль повинен містити мінімум 8 символів').isLength({ min: 8 }),
    check('firstName', "Ім'я обов'язкове").not().isEmpty(),
    check('lastName', 'Прізвище обов\'язкове').not().isEmpty()
  ],
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вхід в систему
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успішний вхід
 */
router.post(
  '/login',
  [
    check('email', 'Невірний email').isEmail(),
    check('password', 'Пароль обов\'язковий').exists()
  ],
  authController.login
);

module.exports = router;