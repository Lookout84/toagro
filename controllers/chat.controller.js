exports.sendMessage = async (req, res) => {
    try {
      const { receiverId, text } = req.body;
      const senderId = req.user.id;
  
      // Зберігаємо повідомлення в БД
      const message = await ChatMessage.create({
        senderId,
        receiverId,
        text
      });
  
      // Відправляємо повідомлення через WebSocket
      sendToUser(receiverId, 'chat', {
        id: message.id,
        senderId,
        text,
        createdAt: message.createdAt
      });
  
      res.status(201).json(message);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };