const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZO Platform API',
      version: '1.0.0',
      description: `
# ZO Platform - Web Scraping & Automation API

A powerful self-hosted web scraping and automation platform similar to Apify.

## Authentication

All API endpoints require authentication via API key or JWT token.

### Using API Key
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Using JWT Token
\`\`\`
Authorization: Bearer YOUR_JWT_TOKEN
\`\`\`

## Rate Limiting

- 100 requests per 15 minutes for authenticated requests
- 20 requests per 15 minutes for unauthenticated requests

## Webhooks

Subscribe to real-time notifications for task events using webhooks.
      `,
      contact: {
        name: 'ZO Platform Support',
        email: 'support@zo-platform.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['scrape', 'api', 'automation', 'custom'] },
            method: { type: 'string', enum: ['puppeteer', 'playwright', 'cheerio', 'axios'] },
            status: { type: 'string', enum: ['pending', 'queued', 'running', 'completed', 'failed'] },
            config: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                selectors: { type: 'object' },
                proxy: { type: 'object' }
              }
            },
            schedule: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                cron: { type: 'string' }
              }
            },
            result: {
              type: 'object',
              properties: {
                itemCount: { type: 'number' },
                data: { type: 'object' },
                error: { type: 'string' }
              }
            }
          }
        },
        Result: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            task: { type: 'string' },
            data: { type: 'object' },
            metadata: {
              type: 'object',
              properties: {
                totalItems: { type: 'number' },
                method: { type: 'string' },
                duration: { type: 'number' }
              }
            }
          }
        },
        Template: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            type: { type: 'string' },
            config: { type: 'object' },
            dataFields: { type: 'array' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] },
      { apiKeyAuth: [] }
    ]
  },
  apis: ['./routes/*.js']
};

const spec = swaggerJsdoc(options);

const setup = swaggerUi.serve;
const serve = swaggerUi.setup(spec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
  `,
  customSiteTitle: 'ZO Platform API Docs'
});

module.exports = { setup, serve };