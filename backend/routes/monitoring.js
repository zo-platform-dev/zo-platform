const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticate } = require('../middleware/auth');

// Get system stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Task stats
    const totalTasks = await Task.countDocuments({ user: req.user._id });
    const runningTasks = await Task.countDocuments({
      user: req.user._id,
      status: 'running'
    });
    const completedTasks = await Task.countDocuments({
      user: req.user._id,
      status: 'completed',
      completedAt: { $gte: last24h }
    });
    const failedTasks = await Task.countDocuments({
      user: req.user._id,
      status: 'failed',
      updatedAt: { $gte: last24h }
    });

    // Performance stats
    const recentCompleted = await Task.find({
      user: req.user._id,
      status: 'completed',
      completedAt: { $gte: last24h }
    }).limit(100);

    let avgDuration = 0;
    if (recentCompleted.length > 0) {
      const totalDuration = recentCompleted.reduce((sum, task) => {
        if (task.startedAt && task.completedAt) {
          return sum + (task.completedAt - task.startedAt);
        }
        return sum;
      }, 0);
      avgDuration = Math.round(totalDuration / recentCompleted.length / 1000);
    }

    const totalRecent = completedTasks + failedTasks;
    const successRate = totalRecent > 0
      ? Math.round((completedTasks / totalRecent) * 100)
      : 100;

    // Resource stats
    const resources = {
      browsers: runningTasks,
      proxies: 0,
      queueSize: runningTasks
    };

    res.json({
      tasks: {
        total: totalTasks,
        running: runningTasks,
        completed: completedTasks,
        failed: failedTasks
      },
      performance: {
        avgDuration,
        successRate
      },
      resources
    });
  } catch (error) {
    console.error('Monitoring stats error:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring stats' });
  }
});

module.exports = router;