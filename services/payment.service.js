const crypto = require('crypto');
const axios = require('axios');

class PaymentService {
  constructor() {
    this.liqpayPublicKey = process.env.LIQPAY_PUBLIC_KEY;
    this.liqpayPrivateKey = process.env.LIQPAY_PRIVATE_KEY;
    this.fondyMerchantId = process.env.FONDY_MERCHANT_ID;
    this.fondySecretKey = process.env.FONDY_SECRET_KEY;
  }

  // LiqPay
  createLiqPayPayment(order) {
    const data = {
      public_key: this.liqpayPublicKey,
      version: '3',
      action: 'pay',
      amount: order.totalAmount,
      currency: 'UAH',
      description: `Payment for order #${order.id}`,
      order_id: order.id,
      result_url: `${process.env.APP_URL}/orders/${order.id}/status`,
      server_url: `${process.env.APP_URL}/api/v1/payments/liqpay/callback`
    };

    const dataBase64 = Buffer.from(JSON.stringify(data)).toString('base64');
    const signature = crypto
      .createHash('sha1')
      .update(this.liqpayPrivateKey + dataBase64 + this.liqpayPrivateKey)
      .digest('base64');

    return {
      data: dataBase64,
      signature
    };
  }

  verifyLiqPayCallback(data, signature) {
    const expectedSignature = crypto
      .createHash('sha1')
      .update(this.liqpayPrivateKey + data + this.liqpayPrivateKey)
      .digest('base64');
    
    return signature === expectedSignature;
  }

  // Fondy
  async createFondyPayment(order) {
    const orderData = {
      order_id: order.id,
      merchant_id: this.fondyMerchantId,
      order_desc: `Payment for order #${order.id}`,
      amount: order.totalAmount * 100, // Fondy expects amount in kopiykas
      currency: 'UAH',
      response_url: `${process.env.APP_URL}/orders/${order.id}/status`,
      server_callback_url: `${process.env.APP_URL}/api/v1/payments/fondy/callback`
    };

    const signature = this.generateFondySignature(orderData);

    try {
      const response = await axios.post('https://payment.albpay.io/api/checkout/url/', {
        request: {
          ...orderData,
          signature
        }
      });

      return response.data.response.checkout_url;
    } catch (error) {
      console.error('Fondy payment error:', error.response?.data || error.message);
      throw new Error('Payment gateway error');
    }
  }

  generateFondySignature(data) {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}|${data[key]}`)
      .join('|');
    
    return crypto
      .createHash('sha1')
      .update(this.fondySecretKey + '|' + signatureString)
      .digest('hex');
  }

  verifyFondyCallback(data) {
    const receivedSignature = data.signature;
    const verificationData = { ...data };
    delete verificationData.signature;
    
    const expectedSignature = this.generateFondySignature(verificationData);
    return receivedSignature === expectedSignature;
  }
}

module.exports = new PaymentService();