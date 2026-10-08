const express = require('express');
const authRoutes = require('./auth');
const tasksRoutes = require('./tasks');
const templatesRoutes = require('./templates');
const apiKeysRoutes = require('./api-keys');
const monitoringRoutes = require('./monitoring');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tasks', tasksRoutes);
router.use('/templates', templatesRoutes);
router.use('/api-keys', apiKeysRoutes);
router.use('/monitoring', monitoringRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ZO Platform API',
    version: '1.0.0'
  });
});

module.exports = router;