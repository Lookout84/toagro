const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const authMiddleware = require('../middlewares/auth.middleware');
const Order = require('../models/order.model');

router.post('/liqpay/create', authMiddleware, async (req, res) => {
  try {
    const order = await Order.create({
      ...req.body,
      userId: req.user.id,
      status: 'pending'
    });

    const paymentData = paymentService.createLiqPayPayment(order);
    res.json(paymentData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment creation failed' });
  }
});

router.post('/fondy/create', authMiddleware, async (req, res) => {
  try {
    const order = await Order.create({
      ...req.body,
      userId: req.user.id,
      status: 'pending'
    });

    const checkoutUrl = await paymentService.createFondyPayment(order);
    res.json({ checkoutUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment creation failed' });
  }
});

router.post('/liqpay/callback', async (req, res) => {
  try {
    const { data, signature } = req.body;
    
    if (!paymentService.verifyLiqPayCallback(data, signature)) {
      return res.status(400).json({ status: 'invalid signature' });
    }

    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
    const order = await Order.findByPk(decodedData.order_id);
    
    if (!order) {
      return res.status(404).json({ status: 'order not found' });
    }

    if (decodedData.status === 'success') {
      order.status = 'paid';
      await order.save();
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error' });
  }
});

router.post('/fondy/callback', async (req, res) => {
  try {
    const { response } = req.body;
    
    if (!paymentService.verifyFondyCallback(response)) {
      return res.status(400).json({ status: 'invalid signature' });
    }

    const order = await Order.findByPk(response.order_id);
    
    if (!order) {
      return res.status(404).json({ status: 'order not found' });
    }

    if (response.order_status === 'approved') {
      order.status = 'paid';
      await order.save();
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error' });
  }
});

module.exports = router;