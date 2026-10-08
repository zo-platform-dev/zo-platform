const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Template = require('../models/Template');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');
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
    const { category, type, search, page = 1, limit = 20 } = req.query;

    const filter = {
      $or: [
        { isPublic: true },
        { author: req.user._id }
      ]
    };

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (search) {
      filter.$text = { $search: search };
    }

    const [templates, total] = await Promise.all([
      Template.find(filter)
        .sort({ 'usage.timesUsed': -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('author', 'name email'),
      Template.countDocuments(filter)
    ]);

    res.json({
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/builtin', async (req, res) => {
  try {
    const templates = await Template.find({ isBuiltin: true, isPublic: true })
      .select('name description category type method config dataFields')
      .sort({ category: 1, name: 1 });

    res.json({ templates });
  } catch (error) {
    logger.error('Get builtin templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Template.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ categories });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/:id', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      $or: [
        { isPublic: true },
        { author: req.user._id }
      ]
    }).populate('author', 'name email');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    logger.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

router.post('/', auth, [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('category').isIn(['social-media', 'e-commerce', 'news', 'jobs', 'real-estate', 'travel', 'finance', 'general']),
  body('type').isIn(['scrape', 'api', 'automation'])
], validateRequest, async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      author: req.user._id,
      isPublic: req.body.isPublic || false,
      isBuiltin: false
    };

    const template = await Template.create(templateData);

    template.usage.timesUsed = 0;
    await template.save();

    res.status(201).json({ template });
  } catch (error) {
    logger.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.post('/:id/use', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const task = await Task.create({
      user: req.user._id,
      name: req.body.name || `Task from ${template.name}`,
      type: template.type,
      method: template.method,
      config: {
        url: template.config.url,
        selectors: template.config.selectors,
        proxy: template.config.proxy,
        headers: template.config.headers,
        userAgent: template.config.userAgent,
        waitFor: template.config.waitFor,
        timeout: template.config.timeout
      },
      metadata: {
        template: template._id,
        ...req.body.metadata
      },
      schedule: { enabled: false }
    });

    template.usage.timesUsed += 1;
    await template.save();

    res.status(201).json({
      message: 'Task created from template',
      task
    });
  } catch (error) {
    logger.error('Use template error:', error);
    res.status(500).json({ error: 'Failed to use template' });
  }
});

router.put('/:id', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found or unauthorized' });
    }

    const updates = {};
    const allowedFields = ['name', 'description', 'category', 'config', 'dataFields', 'transformations', 'isPublic'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(template, updates);
    await template.save();

    res.json({ template });
  } catch (error) {
    logger.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

router.delete('/:id', auth, [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
      isBuiltin: false
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found or cannot be deleted' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    logger.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;