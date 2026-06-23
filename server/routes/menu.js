const express = require('express');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const items = await MenuItem.find().sort({ active: -1, category: 1, name: 1 }).lean();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const item = await MenuItem.create({
      name: req.body.name,
      category: req.body.category || 'Principal',
      price: Number(req.body.price || 0),
      color: req.body.color || '#2563eb',
      availableDays: req.body.availableDays || []
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
