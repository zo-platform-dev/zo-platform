const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number()
    .default(5000),

  MONGODB_URI: Joi.string()
    .required()
    .description('MongoDB connection string is required'),

  REDIS_HOST: Joi.string()
    .default('localhost'),

  REDIS_PORT: Joi.number()
    .default(6379),

  REDIS_PASSWORD: Joi.string()
    .allow('')
    .default(''),

  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT_SECRET must be at least 32 characters'),

  API_KEY_SECRET: Joi.string()
    .min(32)
    .required()
    .description('API_KEY_SECRET must be at least 32 characters'),

  FRONTEND_URL: Joi.string()
    .uri()
    .allow('')
    .default('http://localhost:3000'),

  MAX_CONCURRENT_TASKS: Joi.number()
    .default(5),

  RATE_LIMIT_WINDOW: Joi.number()
    .default(15),

  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .default(500),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info')
}).unknown(true);

function validateEnv() {
  const { error, value: validatedEnv } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join('\n');
    throw new Error(`❌ Environment validation failed:\n${errorMessages}\n\nPlease check your .env file`);
  }

  return validatedEnv;
}

module.exports = { validateEnv };