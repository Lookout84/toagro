const { validationResult } = require('express-validator');
const Product = require('../models/product.model');
const Review = require('../models/review.model');
const User = require('../models/user.model');
const notificationService = require('../services/notification.service');

exports.getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where: { status: 'pending' },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset
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

exports.moderateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { action, reason } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const product = await Product.findByPk(productId, {
      include: [User]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (action === 'approve') {
      await product.update({ status: 'approved' });
      
      await notificationService.createNotification(
        product.userId,
        'Ваше оголошення схвалено',
        `Ваше оголошення "${product.title}" було схвалено модератором та опубліковано на платформі.`,
        'success'
      );
    } else {
      await product.update({ status: 'rejected' });
      
      await notificationService.createNotification(
        product.userId,
        'Ваше оголошення відхилено',
        `Ваше оголошення "${product.title}" було відхилено модератором.${reason ? ` Причина: ${reason}` : ''}`,
        'error'
      );
    }

    res.json({ message: `Product ${action}d successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReportedContent = async (req, res) => {
  try {
    // Тут можна додати логіку для отримання скарг на контент
    // Наприклад, якщо у вас є модель Report
    res.json({ message: 'Reported content endpoint' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};