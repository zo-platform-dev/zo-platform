// MongoDB initialization script for Docker
// This runs when MongoDB container first starts

db = db.getSiblingDB('zo-platform');

// Create collections
db.createCollection('users');
db.createCollection('tasks');
db.createCollection('templates');
db.createCollection('results');
db.createCollection('webhooks');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.tasks.createIndex({ user: 1, status: 1 });
db.tasks.createIndex({ createdAt: -1 });
db.tasks.createIndex({ 'schedule.cron': 1, 'schedule.enabled': 1 });
db.results.createIndex({ task: 1, version: -1 });
db.results.createIndex({ createdAt: -1 });
db.templates.createIndex({ category: 1, type: 1 });
db.templates.createIndex({ name: 'text', description: 'text' });
db.webhooks.createIndex({ user: 1 });

print('MongoDB initialization completed for zo-platform database');