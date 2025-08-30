import swaggerJSDoc from 'swagger-jsdoc';

export const openapiSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Play‑Mate API',
      version: '1.0.0',
      description: 'OpenAPI specification for Play‑Mate backend',
    },
    servers: [
      { url: 'http://localhost:3000' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    'src/routes/**/*.ts',
    'src/controllers/**/*.ts',
    'src/routes/**/*.js',
    'src/controllers/**/*.js',
  ],
});

// Log the generated spec for debugging
console.log('OpenAPI Spec generated with paths:', Object.keys((openapiSpec as any).paths || {}));
