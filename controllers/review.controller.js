const { validationResult } = require('express-validator');
const Review = require('../models/review.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');

exports.createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Перевірка чи користувач купував цей товар
    const hasPurchased = await Order.findOne({
      where: {
        userId,
        productId,
        status: 'delivered'
      }
    });

    if (!hasPurchased && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only review purchased products' });
    }

    // Перевірка чи вже залишав відгук
    const existingReview = await Review.findOne({
      where: { userId, productId }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      rating,
      comment,
      userId,
      productId,
      isVerified: req.user.role === 'admin'
    });

    // Оновлення середнього рейтингу товару
    await updateProductRating(productId);

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

async function updateProductRating(productId) {
  const reviews = await Review.findAll({
    where: { productId, isVerified: true }
  });

  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Product.update(
      { averageRating: parseFloat(averageRating.toFixed(1)) },
      { where: { id: productId } }
    );
  }
}

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { productId, isVerified: true },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'avatarUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      reviews: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (action === 'approve') {
      await review.update({ isVerified: true });
      await updateProductRating(review.productId);
    } else {
      await review.destroy();
    }

    res.json({ message: `Review ${action}d successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};