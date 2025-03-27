const app = require('./app');
const sequelize = require('./config/db');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('./config/jwt');
const User = require('./models/user.model');

const PORT = process.env.PORT || 5000;

// Створення HTTP сервера
const server = http.createServer(app);

// Налаштування WebSocket сервера
const wss = new WebSocket.Server({ noServer: true });

// Мапа для зберігання підключених клієнтів
const clients = new Map();

wss.on('connection', (ws, request, user) => {
  // Зберігаємо з'єднання користувача
  clients.set(user.id, ws);
  
  // Оновлюємо socketId у користувача
  User.update({ socketId: user.id }, { where: { id: user.id } })
    .catch(error => console.error('Error updating user socketId:', error));

  // Обробка повідомлень від клієнта
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Received message:', parsedMessage);
      
      // Тут можна додати обробку різних типів повідомлень
      // Наприклад, для чату між користувачами
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Обробка закриття з'єднання
  ws.on('close', () => {
    clients.delete(user.id);
    console.log(`Client ${user.id} disconnected`);
  });

  // Відправляємо привітальне повідомлення
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'WebSocket connection established successfully',
    userId: user.id
  }));
});

// Оновлення HTTP сервера для підтримки WebSocket
server.on('upgrade', async (request, socket, head) => {
  try {
    // Перевірка автентифікації через JWT токен
    const token = request.headers['sec-websocket-protocol']?.split(', ')[1];
    
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Верифікація токена
    const decoded = jwt.verify(token, config.secret);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Якщо автентифікація успішна - приймаємо з'єднання
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, user);
    });
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});

// Функція для відправки повідомлень конкретному користувачу
function sendToUser(userId, type, data) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type, data }));
  }
}

// Експортуємо функцію для використання в інших модулях
module.exports = {
  sendToUser
};

// Запуск сервера
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database connected');
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });