const express = require('express');
const Order = require('../models/Order');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const orders = await Order.find({ deliveryDate: date }).populate('items.menuItem').sort({ createdAt: -1 });
    const kitchen = new Map();
    let revenue = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (order.status !== 'cancelado') {
          kitchen.set(item.itemName, (kitchen.get(item.itemName) || 0) + item.quantity);
          revenue += item.quantity * item.unitPrice;
        }
      });
    });

    res.json({
      date,
      summary: {
        totalOrders: orders.length,
        pending: orders.filter((order) => order.status === 'pendiente').length,
        confirmed: orders.filter((order) => order.status === 'confirmado').length,
        ready: orders.filter((order) => order.status === 'listo').length,
        revenue
      },
      kitchen: Array.from(kitchen.entries()).map(([name, quantity]) => ({ name, quantity })),
      orders
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
