exports.sendNotification = async (req, res) => {
    try {
      const { userId, title, message, type = 'info' } = req.body;
      
      // Зберігаємо сповіщення в БД
      const notification = await Notification.create({
        userId,
        title,
        message,
        type
      });
  
      // Відправляємо через WebSocket
      sendToUser(userId, 'notification', {
        id: notification.id,
        title,
        message,
        type,
        createdAt: notification.createdAt
      });
  
      res.status(201).json(notification);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };