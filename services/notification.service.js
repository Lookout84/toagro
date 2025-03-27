const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const emailService = require('./email.service');
const socketService = require('./socket.service');

class NotificationService {
  async createNotification(userId, title, message, type = 'info', metadata = null) {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      metadata
    });

    // Відправка через WebSocket
    const user = await User.findByPk(userId);
    if (user && user.socketId) {
      socketService.sendToUser(user.socketId, 'notification', notification);
    }

    // Відправка email для важливих сповіщень
    if (type === 'order' || type === 'warning') {
      await emailService.sendNotificationEmail(user.email, title, message);
    }

    return notification;
  }

  async getUserNotifications(userId, { page = 1, limit = 10, unreadOnly = false }) {
    const offset = (page - 1) * limit;
    const where = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    return {
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
      notifications: rows
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await notification.update({ isRead: true });
  }

  async markAllAsRead(userId) {
    return await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
  }
}

module.exports = new NotificationService();