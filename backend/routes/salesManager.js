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
        product.price = Math.round(product.originalPrice * (1 - discountPercentage / 100) * 100) / 100;
        product.discount= discountPercentage
        await product.save();
        updatedProducts.push(product);
      }
    }

    res.json({ message: 'Discount applied', products: updatedProducts });
  } catch (error) {
    res.status(500).json({ message: 'Error applying discount' });
  }
});

//Remove discount to products
router.post('/undiscount', auth, checkRole('sales_manager'), async (req, res) => {
  try {
    const { productIds } = req.body;
    const updatedProducts = [];

    for (let id of productIds) {
      const product = await Product.findById(id);

      if (product && product.originalPrice) {
        // Restore the price from originalPrice
        product.price = product.originalPrice;
        
        // Reset discount tracking fields
        product.discountApplied = 0;
        
        await product.save();
        updatedProducts.push(product);
      }
    }

    res.status(200).json({ 
      success: true,
      message: 'Discounts removed and original prices restored.', 
      count: updatedProducts.length 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error while removing discounts.',
      error: error.message 
    });
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
