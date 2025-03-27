const { validationResult } = require('express-validator');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const emailService = require('../services/email.service');
const paymentService = require('../services/payment.service');

exports.addToCart = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const product = await Product.findByPk(productId);
    if (!product || product.status !== 'approved') {
      return res.status(404).json({ message: 'Product not available' });
    }

    const [cartItem, created] = await Cart.findOrCreate({
      where: { userId, productId },
      defaults: { quantity }
    });

    if (!created) {
      cartItem.quantity += quantity;
      await cartItem.save();
    }

    res.json(cartItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{
        model: Product,
        where: { status: 'approved' },
        required: true
      }]
    });

    res.json(cartItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user.id;
    const { paymentMethod, shippingAddress, contactPhone } = req.body;

    // Отримання товарів з кошика
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [Product]
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Розрахунок загальної суми
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.Product.price * item.quantity);
    }, 0);

    // Створення замовлення
    const order = await Order.create({
      userId,
      paymentMethod,
      totalAmount,
      shippingAddress,
      contactPhone,
      status: paymentMethod === 'cash' ? 'pending' : 'paid'
    });

    // Додавання товарів до замовлення
    const orderItems = await Promise.all(cartItems.map(async (item) => {
      const orderItem = await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.Product.price
      });

      // Оновлення статусу товару
      if (item.Product.quantity) {
        await Product.update(
          { quantity: item.Product.quantity - item.quantity },
          { where: { id: item.productId } }
        );
      }

      return orderItem;
    }));

    // Очищення кошика
    await Cart.destroy({ where: { userId } });

    // Відправка email підтвердження
    const user = await User.findByPk(userId);
    await emailService.sendOrderConfirmation(user.email, order, orderItems);

    // Якщо це онлайн-оплата, повертаємо дані для платежу
    if (paymentMethod === 'liqpay' || paymentMethod === 'fondy') {
      const paymentData = paymentMethod === 'liqpay' 
        ? paymentService.createLiqPayPayment(order)
        : { checkoutUrl: await paymentService.createFondyPayment(order) };

      return res.json({ order, paymentData });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where: { userId },
      include: [{
        model: Product,
        through: { attributes: ['quantity', 'price'] }
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      orders: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};