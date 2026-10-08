const express = require('express');
const { body, param, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
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
    const user = await User.findById(req.user._id).select('apiKeys name email');

    res.json({
      apiKeys: user.apiKeys || []
    });
  } catch (error) {
    logger.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

router.post('/', auth, [
  body('name').trim().notEmpty()
], validateRequest, async (req, res) => {
  try {
    const apiKey = `zo_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    const user = await User.findById(req.user._id);

    user.apiKeys.push({
      key: hashedKey,
      name: req.body.name,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
    });

    await user.save();

    res.status(201).json({
      message: 'API key created successfully',
      apiKey,
      name: req.body.name,
      createdAt: new Date(),
      expiresAt: user.apiKeys[user.apiKeys.length - 1].expiresAt
    });
  } catch (error) {
    logger.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

router.delete('/:keyId', auth, [
  param('keyId').notEmpty()
], validateRequest, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const initialLength = user.apiKeys.length;
    user.apiKeys = user.apiKeys.filter((key, index) => index.toString() !== req.params.keyId);

    if (user.apiKeys.length === initialLength) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await user.save();

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    logger.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

router.put('/:keyId/rotate', auth, [
  param('keyId').notEmpty()
], validateRequest, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (req.params.keyId >= user.apiKeys.length) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const apiKey = `zo_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    user.apiKeys[req.params.keyId].key = hashedKey;
    user.apiKeys[req.params.keyId].lastUsed = undefined;

    await user.save();

    res.json({
      message: 'API key rotated successfully',
      apiKey,
      name: user.apiKeys[req.params.keyId].name
    });
  } catch (error) {
    logger.error('Rotate API key error:', error);
    res.status(500).json({ error: 'Failed to rotate API key' });
  }
});

module.exports = router;