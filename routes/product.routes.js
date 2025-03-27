const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const upload = require('../services/upload.service').upload;
const { check } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Управління продуктами
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Створити новий продукт
 *     description: Доступ тільки для продавців та адміністраторів
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - category
 *               - brand
 *             properties:
 *               title:
 *                 type: string
 *                 example: Трактор John Deere 8330
 *               description:
 *                 type: string
 *                 example: Потужний трактор 2018 року випуску
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 85000
 *               year:
 *                 type: integer
 *                 example: 2018
 *               condition:
 *                 type: string
 *                 enum: [new, used]
 *                 example: used
 *               category:
 *                 type: string
 *                 enum: [tractor, combine, equipment, parts]
 *                 example: tractor
 *               brand:
 *                 type: string
 *                 example: John Deere
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Продукт успішно створено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Невірні вхідні дані
 *       401:
 *         description: Не авторизовано
 *       403:
 *         description: Доступ заборонено
 *       500:
 *         description: Помилка сервера
 */
router.post(
  '/',
  authMiddleware, // Перевірка JWT токена
  roleMiddleware(['seller', 'admin']), // Перевірка ролі
  upload.array('images', 10), // Завантаження до 10 зображень
  [
    // Валідація вхідних даних
    check('title', 'Назва обов\'язкова').not().isEmpty(),
    check('description', 'Опис обов\'язковий').not().isEmpty(),
    check('price', 'Ціна повинна бути числом більше 0').isFloat({ gt: 0 }),
    check('year', 'Рік випуску обов\'язковий').isInt({ min: 1900, max: new Date().getFullYear() }),
    check('condition', 'Стан повинен бути new або used').isIn(['new', 'used']),
    check('category', 'Невірна категорія').isIn(['tractor', 'combine', 'equipment', 'parts']),
    check('brand', 'Бренд обов\'язковий').not().isEmpty()
  ],
  productController.createProduct
);

module.exports = router;