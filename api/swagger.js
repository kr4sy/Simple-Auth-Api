const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Praktyki API',
      version: '1.0.0',
      description: 'Dokumentacja API, praktyki',
    },
    servers: [
      {
        url: 'https://test1.sysmo.pl/api',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

fs.writeFileSync('swagger-debug.json', JSON.stringify(swaggerSpec, null, 2));
console.log('Swagger spec keys:', Object.keys(swaggerSpec));
console.log('Swagger spec:', JSON.stringify(swaggerSpec, null, 2));

module.exports = swaggerSpec;