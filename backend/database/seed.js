/**
 * MongoDB Seed Data Script
 * Populates database with initial data
 */

require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const User = require('../models/User');
const Template = require('../models/Template');

const seedData = {
  users: [
    {
      name: 'Admin User',
      email: 'admin@zo-platform.com',
      password: 'admin123',
      role: 'admin'
    }
  ],
  templates: [
    {
      name: 'E-commerce Product Scraper',
      description: 'Extract product information from e-commerce websites',
      category: 'ecommerce',
      type: 'scrape',
      method: 'cheerio',
      isBuiltin: true,
      isPublic: true,
      config: {
        url: 'https://example.com/products',
        selectors: {
          title: '.product-title',
          price: '.product-price',
          image: '.product-image',
          description: '.product-description',
          rating: '.product-rating'
        },
        pagination: {
          enabled: true,
          type: 'page',
          maxPages: 10,
          selector: '.next-page'
        }
      },
      dataFields: [
        { name: 'title', selector: '.product-title', type: 'text', required: true },
        { name: 'price', selector: '.product-price', type: 'text', required: true },
        { name: 'image', selector: '.product-image', type: 'attribute', attribute: 'src' },
        { name: 'description', selector: '.product-description', type: 'text' },
        { name: 'rating', selector: '.product-rating', type: 'number' }
      ]
    },
    {
      name: 'News Article Scraper',
      description: 'Extract news articles from news websites',
      category: 'news',
      type: 'scrape',
      method: 'cheerio',
      isBuiltin: true,
      isPublic: true,
      config: {
        url: 'https://example.com/news',
        selectors: {
          headline: '.article-headline',
          summary: '.article-summary',
          author: '.article-author',
          date: '.article-date',
          link: '.article-link'
        }
      },
      dataFields: [
        { name: 'headline', selector: '.article-headline', type: 'text', required: true },
        { name: 'summary', selector: '.article-summary', type: 'text' },
        { name: 'author', selector: '.article-author', type: 'text' },
        { name: 'date', selector: '.article-date', type: 'text' },
        { name: 'link', selector: '.article-link', type: 'attribute', attribute: 'href' }
      ]
    },
    {
      name: 'Job Listing Scraper',
      description: 'Extract job postings from job boards',
      category: 'jobs',
      type: 'scrape',
      method: 'cheerio',
      isBuiltin: true,
      isPublic: true,
      config: {
        url: 'https://example.com/jobs',
        selectors: {
          title: '.job-title',
          company: '.company-name',
          location: '.job-location',
          salary: '.salary-range',
          description: '.job-description'
        }
      },
      dataFields: [
        { name: 'title', selector: '.job-title', type: 'text', required: true },
        { name: 'company', selector: '.company-name', type: 'text', required: true },
        { name: 'location', selector: '.job-location', type: 'text' },
        { name: 'salary', selector: '.salary-range', type: 'text' },
        { name: 'description', selector: '.job-description', type: 'text' }
      ]
    },
    {
      name: 'Real Estate Scraper',
      description: 'Extract property listings from real estate websites',
      category: 'real-estate',
      type: 'scrape',
      method: 'puppeteer',
      isBuiltin: true,
      isPublic: true,
      config: {
        url: 'https://example.com/properties',
        selectors: {
          address: '.property-address',
          price: '.property-price',
          bedrooms: '.bedrooms',
          bathrooms: '.bathrooms',
          area: '.property-area',
          image: '.property-image'
        }
      },
      dataFields: [
        { name: 'address', selector: '.property-address', type: 'text', required: true },
        { name: 'price', selector: '.property-price', type: 'text', required: true },
        { name: 'bedrooms', selector: '.bedrooms', type: 'number' },
        { name: 'bathrooms', selector: '.bathrooms', type: 'number' },
        { name: 'area', selector: '.property-area', type: 'text' },
        { name: 'image', selector: '.property-image', type: 'attribute', attribute: 'src' }
      ]
    },
    {
      name: 'Social Media Post Scraper',
      description: 'Extract posts from social media platforms',
      category: 'social-media',
      type: 'scrape',
      method: 'puppeteer',
      isBuiltin: true,
      isPublic: true,
      config: {
        url: 'https://example.com',
        selectors: {
          username: '.username',
          content: '.post-content',
          likes: '.like-count',
          comments: '.comment-count',
          timestamp: '.post-time'
        },
        proxy: {
          required: true,
          recommended: 'Use residential proxies'
        }
      },
      dataFields: [
        { name: 'username', selector: '.username', type: 'text', required: true },
        { name: 'content', selector: '.post-content', type: 'text', required: true },
        { name: 'likes', selector: '.like-count', type: 'number' },
        { name: 'comments', selector: '.comment-count', type: 'number' },
        { name: 'timestamp', selector: '.post-time', type: 'text' }
      ]
    }
  ]
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zo-platform');
    logger.info('Connected to MongoDB');

    // Clear existing data
    logger.info('Clearing existing data...');
    await User.deleteMany({ email: { $in: seedData.users.map(u => u.email) } });
    await Template.deleteMany({ isBuiltin: true });

    // Seed users
    logger.info('Seeding users...');
    for (const userData of seedData.users) {
      const user = new User(userData);
      await user.save();
      logger.info(`Created user: ${user.email}`);
    }

    // Seed templates
    logger.info('Seeding templates...');
    for (const templateData of seedData.templates) {
      const template = new Template(templateData);
      await template.save();
      logger.info(`Created template: ${template.name}`);
    }

    logger.info('Seeding completed successfully!');
    logger.info(`Created ${seedData.users.length} users`);
    logger.info(`Created ${seedData.templates.length} templates`);

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seed();

module.exports = seed;