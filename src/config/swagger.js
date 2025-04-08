import swaggerJSDoc from 'swagger-jsdoc';

const DisableTryItOutPlugin = () => {
  return {
    statePlugins: {
      spec: {
        wrapSelectors: {
          allowTryItOutFor: () => () => false,
        },
      },
    },
  };
};

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    plugins: [DisableTryItOutPlugin],
  },
};

const swaggerDocOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Reltime Ecosystem APIs',
      version: '1.0.0',
      description: 'API documentation of blockchain backend created for Reltime Mobile Application',
    },
    host: 'localhost:3000',
    basePath: '/api',
  },
  apis: ['src/controllers/*.js'],
};

const swaggerDoc = swaggerJSDoc(swaggerDocOptions);

module.exports = {
  swaggerDoc,
  swaggerOptions,
};
