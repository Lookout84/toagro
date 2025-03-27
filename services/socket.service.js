// const WebSocket = require('ws');
// const wss = new WebSocket.Server({ noServer: true });
// const User = require('../models/user.model');

// const clients = new Map();

// wss.on('connection', (ws, request) => {
//   const userId = request.user.id;
//   clients.set(userId, ws);
  
//   // Оновлення socketId у користувача
//   User.update({ socketId: userId }, { where: { id: userId } });

//   ws.on('close', () => {
//     clients.delete(userId);
//   });
// });

// function sendToUser(userId, type, data) {
//   const client = clients.get(userId);
//   if (client && client.readyState === WebSocket.OPEN) {
//     client.send(JSON.stringify({ type, data }));
//   }
// }

// module.exports = {
//   wss,
//   sendToUser
// };

const { sendToUser } = require('./server');

// Додаткові функції для роботи з WebSocket
const broadcastToAll = (type, data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }));
    }
  });
};

const getOnlineUsers = () => {
  return Array.from(clients.keys());
};

module.exports = {
  sendToUser,
  broadcastToAll,
  getOnlineUsers
};