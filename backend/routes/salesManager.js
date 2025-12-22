// backend/routes/salesManager.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');

// Apply discount to products
router.post('/discount', auth, checkRole('sales_manager'), async (req, res) => {
  try {
    const { productIds, discountPercentage } = req.body;

    const updatedProducts = [];
    for (let id of productIds) {
      const product = await Product.findById(id);
      if (product) {
        product.originalPrice = product.originalPrice || product.price;
        product.price = product.originalPrice * (1 - discountPercentage / 100);
        await product.save();
        updatedProducts.push(product);
      }
    }

    res.json({ message: 'Discount applied', products: updatedProducts });
  } catch (error) {
    res.status(500).json({ message: 'Error applying discount' });
  }
});

// Get invoices by date range
router.get('/invoices', auth, checkRole('sales_manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const orders = await Order.find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('user', 'name email').populate('orderItems.product');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Calculate revenue and profit
router.get('/analytics', auth, checkRole('sales_manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const orders = await Order.find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: { $ne: 'cancelled' }
    }).populate('orderItems.product');

    let revenue = 0;
    let cost = 0;

    orders.forEach(order => {
      revenue += order.totalPrice;
      order.orderItems.forEach(item => {
        const itemCost = (item.price * 0.5) * item.quantity; // Default 50% cost
        cost += itemCost;
      });
    });

    const profit = revenue - cost;

    res.json({ revenue, cost, profit, orderCount: orders.length });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating analytics' });
  }
});

module.exports = router;
