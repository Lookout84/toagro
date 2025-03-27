const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ToAgro Marketplace API',
      version: '1.0.0',
      description: 'API для торгівельної платформи сільськогосподарської техніки',
      contact: {
        name: 'Підтримка API',
        email: 'support@toagro.ua'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Локальний сервер розробки'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password', minLength: 8 },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            role: { 
              type: 'string',
              enum: ['client', 'seller', 'admin'],
              default: 'client'
            }
          }
        },
        Product: {
          type: 'object',
          required: ['title', 'description', 'price', 'category', 'brand'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'float' },
            year: { type: 'integer' },
            condition: { type: 'string', enum: ['new', 'used'] },
            category: { 
              type: 'string',
              enum: ['tractor', 'combine', 'equipment', 'parts']
            },
            brand: { type: 'string' },
            images: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', 
    swaggerUi.serve, 
    swaggerUi.setup(specs, {
      explorer: true,
      customSiteTitle: 'AgroTech API Документація',
      customCss: '.swagger-ui .topbar { background-color: #4CAF50; }'
    })
  );
};