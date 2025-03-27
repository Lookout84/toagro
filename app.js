const express = require('express');
const app = express();
const setupSwagger = require('./config/swagger');

// Інші middleware...
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Підключення Swagger
setupSwagger(app);

// Інші маршрути...