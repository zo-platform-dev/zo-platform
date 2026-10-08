/**
 * MongoDB Migration Script
 * Handles database schema migrations
 */

require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const migrations = [
  {
    version: 1,
    name: 'initial_setup',
    up: async () => {
      await mongoose.connection.db.createCollection('users');
      await mongoose.connection.db.createCollection('tasks');
      await mongoose.connection.db.createCollection('templates');
      await mongoose.connection.db.createCollection('results');
      await mongoose.connection.db.createCollection('webhooks');

      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.db.collection('tasks').createIndex({ user: 1, status: 1 });
      await mongoose.connection.db.collection('tasks').createIndex({ createdAt: -1 });
      await mongoose.connection.db.collection('results').createIndex({ task: 1, version: -1 });
      await mongoose.connection.db.collection('templates').createIndex({ category: 1, type: 1 });

      logger.info('Migration 1: Initial setup completed');
    },
    down: async () => {
      await mongoose.connection.db.dropCollection('users');
      await mongoose.connection.db.dropCollection('tasks');
      await mongoose.connection.db.dropCollection('templates');
      await mongoose.connection.db.dropCollection('results');
      await mongoose.connection.db.dropCollection('webhooks');
    }
  },
  {
    version: 2,
    name: 'add_auto_refresh',
    up: async () => {
      await mongoose.connection.db.collection('tasks').updateMany(
        {},
        { $set: { 'autoRefresh': { enabled: false, interval: 'daily' } } }
      );
      logger.info('Migration 2: Added autoRefresh field to tasks');
    },
    down: async () => {
      await mongoose.connection.db.collection('tasks').updateMany(
        {},
        { $unset: { 'autoRefresh': 1 } }
      );
    }
  }
];

async function runMigrations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zo-platform');
    logger.info('Connected to MongoDB');

    const configCollection = mongoose.connection.db.collection('migration_config');
    let config = await configCollection.findOne({ _id: 'migrations' });

    if (!config) {
      await configCollection.insertOne({ _id: 'migrations', completed: [] });
      config = { completed: [] };
    }

    for (const migration of migrations) {
      if (!config.completed.includes(migration.version)) {
        logger.info(`Running migration ${migration.version}: ${migration.name}`);
        await migration.up();
        await configCollection.updateOne(
          { _id: 'migrations' },
          { $push: { completed: migration.version } }
        );
        logger.info(`Migration ${migration.version} completed`);
      } else {
        logger.info(`Migration ${migration.version} already completed, skipping`);
      }
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

async function rollback(steps = 1) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zo-platform');
    logger.info('Connected to MongoDB');

    const configCollection = mongoose.connection.db.collection('migration_config');
    const config = await configCollection.findOne({ _id: 'migrations' });

    if (!config || config.completed.length === 0) {
      logger.info('No migrations to rollback');
      process.exit(0);
    }

    const toRollback = config.completed.slice(-steps);

    for (const version of toRollback.reverse()) {
      const migration = migrations.find(m => m.version === version);
      if (migration) {
        logger.info(`Rolling back migration ${version}: ${migration.name}`);
        await migration.down();
        await configCollection.updateOne(
          { _id: 'migrations' },
          { $pull: { completed: version } }
        );
        logger.info(`Rollback ${version} completed`);
      }
    }

    logger.info('Rollback completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Rollback failed:', error);
    process.exit(1);
  }
}

// CLI handling
const args = process.argv.slice(2);
if (args.includes('rollback')) {
  const steps = parseInt(args[args.indexOf('rollback') + 1]) || 1;
  rollback(steps);
} else {
  runMigrations();
}

module.exports = { runMigrations, rollback };