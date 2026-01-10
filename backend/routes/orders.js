// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');
const { sendOrderConfirmation } = require('../services/emailService');

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const { orderItems, totalPrice, deliveryAddress } = req.body;

    // Validate input
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    if (!deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    // Check stock and prepare order items
    const validatedItems = [];
    
    for (let item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ 
          message: `Product not found: ${item.product}` 
        });
      }

      if (product.quantityInStock < item.quantity) {
        return res.status(400).json({ 
          message: `Not enough stock for ${product.name}. Only ${product.quantityInStock} available.` 
        });
      }

      // Reduce stock
      product.quantityInStock -= item.quantity;
      await product.save();

      // Add to validated items
      validatedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.price
      });
    }

    // Create order
    const order = new Order({
      user: req.user.id,
      orderItems: validatedItems,
      totalPrice,
      deliveryAddress,
      status: 'processing'
    });

    await order.save();

    // CREATE INVOICE FOR THE ORDER
    try {
      const user = await User.findById(req.user.id);

      // Calculate invoice items with totals
      const invoiceItems = validatedItems.map(item => ({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      }));

      // Calculate subtotal
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);

      // Calculate tax (18% VAT)
      const tax = subtotal * 0.18;

      // Total amount
      const totalAmount = subtotal + tax;

      // Generate invoice number
      const invoiceCount = await Invoice.countDocuments();
      const invoiceNumber = `INV-${Date.now()}-${invoiceCount + 1}`;

      // Create invoice
      const invoice = new Invoice({
        invoiceNumber,
        order: order._id,
        customer: req.user.id,
        customerInfo: {
          name: user.name,
          email: user.email,
          address: deliveryAddress,
          taxID: user.taxID || ''
        },
        items: invoiceItems,
        subtotal,
        discount: 0,
        tax,
        totalAmount,
        invoiceDate: order.createdAt,
        status: 'paid'
      });

      await invoice.save();
      console.log(`✅ Invoice created for order ${order._id}`);
    } catch (invoiceError) {
      console.error('Invoice creation failed, but order was created:', invoiceError);
    }

    // SEND EMAIL NOTIFICATION
    try {
      const user = await User.findById(req.user.id);

      if (user && user.email) {
        await sendOrderConfirmation(user.email, {
          orderId: order._id,
          orderItems: validatedItems,
          totalPrice,
          deliveryAddress,
          createdAt: order.createdAt
        });

        console.log(`📧 Order confirmation email sent to ${user.email}`);
      }
    } catch (emailError) {
      // Don't fail the order if email fails
      console.error('Email sending failed, but order was created:', emailError);
    }

    res.status(201).json({
      message: 'Order placed successfully. Confirmation email sent!',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error while creating order',
      error: error.message
    });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('orderItems.product')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// Get all orders (for product manager) - ADD THIS NEW ROUTE
router.get('/all', auth, checkRole('product_manager'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('orderItems.product')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user (or user is admin)
    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error while fetching order' });
  }
});

// Update order status (for product manager/admin)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['processing', 'in-transit', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error while updating order' });
  }
});

// Cancel order (only if status is 'processing')
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Can only cancel if processing
    if (order.status !== 'processing') {
      return res.status(400).json({ 
        message: 'Can only cancel orders that are in processing status' 
      });
    }

    // Restore stock
    for (let item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantityInStock += item.quantity;
        await product.save();
      }
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error while cancelling order' });
  }
});

module.exports = router;