// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { encryptCreditCard, decryptCreditCard, maskCreditCard } = require('../utils/encryption');
const { sendOrderConfirmation } = require('../services/emailService');

// ✅ Import auth middleware
let auth;
try {
  const authModule = require('../middleware/auth');
  auth = authModule.auth || authModule.default || authModule;
} catch (error) {
  console.error('Auth middleware not found:', error);
  auth = (req, res, next) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
}

// ==================== CREATE ORDER ====================
// POST /orders
router.post('/', auth, async (req, res) => {
  try {
    const { orderItems, totalPrice, deliveryAddress, paymentInfo } = req.body;

    // Validate required fields
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    if (!paymentInfo || !paymentInfo.creditCardNumber || !paymentInfo.cardHolderName || !paymentInfo.expiryDate) {
      return res.status(400).json({ message: 'Payment information is required' });
    }

    // Validate credit card number format (basic validation)
    const cleanCardNumber = paymentInfo.creditCardNumber.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      return res.status(400).json({ message: 'Invalid credit card number' });
    }

    // ✅ Encrypt credit card number before saving
    const encryptedCardNumber = encryptCreditCard(paymentInfo.creditCardNumber);

    // Verify products exist and have enough stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      if (product.quantityInStock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.quantityInStock}` 
        });
      }
    }

    // Create order with encrypted credit card
    const order = new Order({
      user: req.user.id,
      orderItems,
      totalPrice,
      deliveryAddress,
      paymentInfo: {
        creditCardNumber: encryptedCardNumber, // ✅ Stored encrypted
        cardHolderName: paymentInfo.cardHolderName,
        expiryDate: paymentInfo.expiryDate
      }
    });

    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantityInStock: -item.quantity } }
      );
    }

    // Populate product details
    await order.populate('orderItems.product');

    // ✅ Send confirmation email
    try {
      const user = await User.findById(req.user.id);
      if (user && user.email) {
        const emailData = {
          orderId: order._id,
          orderItems: order.orderItems.map(item => ({
            name: item.product?.name || item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalPrice: order.totalPrice,
          deliveryAddress: order.deliveryAddress,
          createdAt: order.createdAt
        };

        const emailResult = await sendOrderConfirmation(user.email, emailData);
        
        if (emailResult.success) {
          console.log('✅ Order confirmation email sent to:', user.email);
        } else {
          console.error('⚠️ Failed to send email, but order was created');
        }
      }
    } catch (emailError) {
      // Don't fail the order if email fails
      console.error('Email error (order still created):', emailError);
    }

    res.status(201).json({ 
      message: 'Order created successfully', 
      order 
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ==================== GET USER'S ORDERS ====================
// GET /orders/my-orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('orderItems.product')
      .sort({ createdAt: -1 });

    // ✅ Mask credit card numbers before sending to client
    const ordersWithMaskedCards = orders.map(order => {
      const orderObj = order.toObject();
      
      if (orderObj.paymentInfo && orderObj.paymentInfo.creditCardNumber) {
        // Decrypt and then mask
        const decrypted = decryptCreditCard(orderObj.paymentInfo.creditCardNumber);
        orderObj.paymentInfo.creditCardNumber = maskCreditCard(decrypted);
      }
      
      return orderObj;
    });

    res.json({ orders: ordersWithMaskedCards });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ==================== GET SINGLE ORDER BY ID ====================
// GET /orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify user owns this order (or is admin/product_manager)
    const user = await User.findById(req.user.id);
    const isOwner = order.user._id.toString() === req.user.id;
    const isAuthorized = user.role === 'admin' || user.role === 'product_manager';

    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    const orderObj = order.toObject();
    
    // ✅ Mask credit card number
    if (orderObj.paymentInfo && orderObj.paymentInfo.creditCardNumber) {
      const decrypted = decryptCreditCard(orderObj.paymentInfo.creditCardNumber);
      orderObj.paymentInfo.creditCardNumber = maskCreditCard(decrypted);
    }

    res.json({ order: orderObj });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ==================== GET ALL ORDERS (ADMIN/PRODUCT MANAGER) ====================
// GET /orders
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin or product_manager
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'product_manager' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orders = await Order.find()
      .populate('orderItems.product')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // ✅ Mask credit card numbers
    const ordersWithMaskedCards = orders.map(order => {
      const orderObj = order.toObject();
      
      if (orderObj.paymentInfo && orderObj.paymentInfo.creditCardNumber) {
        const decrypted = decryptCreditCard(orderObj.paymentInfo.creditCardNumber);
        orderObj.paymentInfo.creditCardNumber = maskCreditCard(decrypted);
      }
      
      return orderObj;
    });

    res.json({ orders: ordersWithMaskedCards });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ==================== UPDATE ORDER STATUS (PRODUCT MANAGER) ====================
// PUT /orders/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    // Check if user is product_manager or admin
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'product_manager' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied. Only product managers can update order status.' });
    }

    const { status } = req.body;

    // Validate status
    const validStatuses = ['processing', 'in-transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id)
      .populate('orderItems.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update status
    order.status = status;

    // ✅ If order is being marked as delivered, set deliveryCompletedAt timestamp
    if (status === 'delivered' && !order.deliveryCompletedAt) {
      order.deliveryCompletedAt = new Date();
    }

    await order.save();

    res.json({ 
      message: 'Order status updated', 
      order 
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ==================== CANCEL ORDER ====================
// PUT /orders/:id/cancel
// CS 308 Requirement 14: Orders can only be cancelled if status is "processing"
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify user owns this order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    
    // ✅ CS 308 Requirement 14: Validate status - ONLY processing orders can be cancelled
    if (order.status !== 'processing') {
      return res.status(400).json({ 
        message: `Cannot cancel order. Order is already ${order.status}. Only orders with "processing" status can be cancelled.`,
        currentStatus: order.status
      });
    }
    
    // Update status to cancelled
    order.status = 'cancelled';
    await order.save();
    
    // Restore stock (add products back to inventory)
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { quantityInStock: item.quantity } }
      );
      console.log(`✅ Restored ${item.quantity} units of ${item.product.name} to stock`);
    }
    
    res.json({ 
      message: 'Order cancelled successfully. Stock has been restored.',
      order 
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;