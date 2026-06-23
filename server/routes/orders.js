const express = require('express');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

const router = express.Router();
const statuses = ['pendiente', 'confirmado', 'listo', 'entregado', 'cancelado'];

router.get('/', async (req, res, next) => {
  try {
    const query = {};
    if (req.query.date) query.deliveryDate = req.query.date;
    if (req.query.from || req.query.to) {
      query.deliveryDate = {};
      if (req.query.from) query.deliveryDate.$gte = req.query.from;
      if (req.query.to) query.deliveryDate.$lte = req.query.to;
    }

    const orders = await Order.find(query)
      .populate('items.menuItem')
      .sort({ deliveryDate: 1, createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    const menuIds = requestedItems.map((item) => item.menuItem).filter(Boolean);
    const menuItems = await MenuItem.find({ _id: { $in: menuIds } });
    const menuById = new Map(menuItems.map((item) => [String(item._id), item]));

    const items = requestedItems
      .map((requested) => {
        const menuItem = menuById.get(String(requested.menuItem));
        const quantity = Math.max(0, Number(requested.quantity || 0));
        if (!menuItem || quantity < 1) return null;
        return {
          menuItem: menuItem._id,
          itemName: menuItem.name,
          quantity,
          unitPrice: menuItem.price
        };
      })
      .filter(Boolean);

    const order = await Order.create({
      customerName: req.body.customerName,
      phone: req.body.phone || '',
      source: req.body.source || 'whatsapp',
      socialUser: req.body.socialUser || '',
      deliveryDate: req.body.deliveryDate,
      notes: req.body.notes || '',
      items
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const status = statuses.includes(req.body.status) ? req.body.status : 'pendiente';
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.patch('/:orderId/items/:itemId/move', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    const item = order?.items.id(req.params.itemId);
    if (!order || !item) return res.status(404).json({ error: 'Pedido o item no encontrado' });

    if (req.body.deliveryDate) order.deliveryDate = String(req.body.deliveryDate).slice(0, 10);
    if (req.body.menuItem) {
      const menuItem = await MenuItem.findById(req.body.menuItem);
      if (menuItem) {
        item.menuItem = menuItem._id;
        item.itemName = menuItem.name;
        item.unitPrice = menuItem.price;
      }
    }

    await order.save();
    return res.json(order);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
