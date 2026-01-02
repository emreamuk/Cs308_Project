const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');
// Import email notification service
const { notifyWishlistUsers } = require('../utils/emailService');


// Apply discount to products AND send email notifications

router.post('/discount', auth, checkRole('sales_manager'), async (req, res) => {
  try {
    const { productIds, discountPercentage } = req.body;

    const updatedProducts = [];
    // Track email notification results
    const emailResults = {
      totalProducts: 0,
      totalEmailsSent: 0,
      totalEmailsFailed: 0,
      details: []
    };

    for (let id of productIds) {
      const product = await Product.findById(id);
      if (product) {
        // Apply discount
        product.originalPrice = product.originalPrice || product.price;
        product.price = Math.round(product.originalPrice * (1 - discountPercentage / 100) * 100) / 100;
        product.discount = discountPercentage;
        await product.save();
        updatedProducts.push(product);

        // Find users who have this product in wishlist
        const usersWithProductInWishlist = await User.find({
          wishlist: id
        }).select('name email');

        if (usersWithProductInWishlist.length > 0) {
          // Send email notifications
          const result = await notifyWishlistUsers(product, usersWithProductInWishlist);

          emailResults.totalProducts++;
          emailResults.totalEmailsSent += result.sent;
          emailResults.totalEmailsFailed += result.failed;
          emailResults.details.push({
            productName: product.name,
            usersNotified: usersWithProductInWishlist.length,
            emailsSent: result.sent,
            emailsFailed: result.failed
          });
        }
      }
    }

    res.json({
      message: 'Discount applied successfully',
      products: updatedProducts,
      // Include email notification results in response
      emailNotifications: emailResults
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ message: 'Error applying discount' });
  }
});


// Remove discount from products

router.post('/undiscount', auth, checkRole('sales_manager'), async (req, res) => {
  try {
    const { productIds } = req.body;
    const updatedProducts = [];

    for (let id of productIds) {
      const product = await Product.findById(id);

      if (product && product.originalPrice) {
        product.price = product.originalPrice;
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
        const itemCost = (item.price * 0.5) * item.quantity;
        cost += itemCost;
      });
    });

    const profit = revenue - cost;


    // Include orderCount and averageOrderValue in response
    res.json({
      revenue,
      cost,
      profit,
      orderCount: orders.length,
      averageOrderValue: orders.length > 0 ? revenue / orders.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating analytics' });
  }


});

// ============================================
// GET /api/sales/detailed-metrics
// Get detailed sales metrics (top products, categories, etc.)
// ============================================
router.get('/detailed-metrics', auth, checkRole('sales_manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get all orders (both successful and cancelled for comparison)
    const allOrders = await Order.find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('orderItems.product');

    const successfulOrders = allOrders.filter(order => order.status !== 'cancelled');
    const cancelledOrders = allOrders.filter(order => order.status === 'cancelled');

    // 1. Aggregate product sales
    const productStats = {};
    let totalItemsSold = 0;

    successfulOrders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.product) {
          const productId = item.product._id.toString();
          totalItemsSold += item.quantity;

          if (!productStats[productId]) {
            productStats[productId] = {
              name: item.product.name,
              category: item.product.category,
              quantitySold: 0,
              revenue: 0
            };
          }

          productStats[productId].quantitySold += item.quantity;
          productStats[productId].revenue += item.price * item.quantity;
        }
      });
    });

    // 2. Top 5 selling products by quantity
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // 3. Revenue by category
    const categoryRevenue = {};
    Object.values(productStats).forEach(product => {
      if (!categoryRevenue[product.category]) {
        categoryRevenue[product.category] = 0;
      }
      categoryRevenue[product.category] += product.revenue;
    });

    // Convert to array and sort
    const categoryBreakdown = Object.entries(categoryRevenue)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // 4. Cancellation metrics
    const cancellationRate = allOrders.length > 0
      ? (cancelledOrders.length / allOrders.length) * 100
      : 0;

    res.json({
      topProducts,
      categoryBreakdown,
      totalItemsSold,
      totalOrders: allOrders.length,
      successfulOrders: successfulOrders.length,
      cancelledOrders: cancelledOrders.length,
      cancellationRate: cancellationRate.toFixed(1)
    });
  } catch (error) {
    console.error('Error calculating detailed metrics:', error);
    res.status(500).json({ message: 'Error calculating detailed metrics' });
  }
});

// Export the router

module.exports = router;
