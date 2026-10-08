const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Result = require('../models/Result');
const { auth } = require('../middleware/auth');
const { addTask, getJobStatus, cancelJob } = require('../queue/queue');
const monitoringService = require('../services/monitoringService');
const logger = require('../utils/logger');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('metadata.template', 'name category'),
      Task.countDocuments(filter)
    ]);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentTasks = await Task.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name status createdAt result.itemCount');

    const result = {
      total: 0,
      byStatus: {},
      recentTasks
    };

    stats.forEach(s => {
      result.byStatus[s._id] = s.count;
      result.total += s.count;
    });

    res.json(result);
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.post('/', auth, [
  body('name').trim().notEmpty(),
  body('type').isIn(['scrape', 'api', 'automation', 'custom']),
  body('method').optional().isIn(['puppeteer', 'playwright', 'cheerio', 'axios']),
  body('config').isObject()
], validateRequest, async (req, res) => {
  try {
    const taskData = {
      user: req.user._id,
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      method: req.body.method || 'cheerio',
      config: req.body.config,
      schedule: req.body.schedule || { enabled: false },
      priority: req.body.priority || 'normal',
      retry: req.body.retry || { enabled: true, maxAttempts: 3 },
      metadata: req.body.metadata || {},
      notifications: req.body.notifications || {}
    };

    const task = await Task.create(taskData);

    await addTask({
      taskId: task._id.toString(),
      userId: req.user._id.toString(),
      priority: task.priority
    });

    task.status = 'queued';
    await task.save();

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    logger.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/:id', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('metadata.template', 'name description');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    logger.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.put('/:id', auth, [
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty(),
  body('schedule').optional().isObject()
], validateRequest, async (req, res) => {
  try {
    const updates = {};
    const allowedFields = ['name', 'description', 'config', 'schedule', 'priority', 'retry', 'notifications', 'metadata'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updates },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    logger.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.post('/:id/run', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await addTask({
      taskId: task._id.toString(),
      userId: req.user._id.toString(),
      priority: 'urgent'
    });

    task.status = 'queued';
    task.retry.attempts = 0;
    await task.save();

    res.json({ message: 'Task queued for execution', task });
  } catch (error) {
    logger.error('Run task error:', error);
    res.status(500).json({ error: 'Failed to run task' });
  }
});

router.delete('/:id', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Result.deleteMany({ task: req.params.id });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

router.get('/:id/results', auth, [
  param('id').isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validateRequest, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [results, total] = await Promise.all([
      Result.find({ task: req.params.id })
        .sort({ version: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Result.countDocuments({ task: req.params.id })
    ]);

    res.json({
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Get task statistics
router.get('/:id/stats', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const monitoringStats = monitoringService.getTaskStats(req.params.id);

    res.json({
      task: {
        id: task._id,
        status: task.status,
        createdAt: task.createdAt
      },
      stats: task.stats || {},
      monitoring: monitoringStats || {}
    });
  } catch (error) {
    logger.error('Error fetching task stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pause task
router.post('/:id/pause', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.status = 'paused';
    await task.save();

    res.json({ message: 'Task paused', task });
  } catch (error) {
    logger.error('Error pausing task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume task
router.post('/:id/resume', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status === 'paused') {
      task.status = 'pending';
      await task.save();

      await addTask({
        taskId: task._id.toString(),
        userId: req.user._id.toString(),
        priority: task.priority
      });
    }

    res.json({ message: 'Task resumed', task });
  } catch (error) {
    logger.error('Error resuming task:', error);
    res.status(500).json({ error: error.message });
  }
});

// System health check
router.get('/system/health', auth, async (req, res) => {
  try {
    const systemStats = monitoringService.getSystemStats();

    res.json({
      status: 'healthy',
      ...systemStats
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;