// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const { sendOrderConfirmation } = require('../services/emailService');
const { encryptCreditCard, decryptCreditCard, maskCreditCard } = require('../utils/encryption');

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

// Create a new order
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

    // Create invoice for this order
    try {
      const invoiceItems = order.orderItems.map(item => ({
        product: item.product._id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      }));

      const subtotal = invoiceItems.reduce((sum, it) => sum + it.total, 0);
      const tax = subtotal * 0.18; // 18% VAT
      const totalAmount = subtotal + tax;

      const user = await User.findById(req.user.id);

      const invoiceNumber = `INV-${order._id.toString().slice(-8)}`;

      const invoice = new Invoice({
        invoiceNumber,
        order: order._id,
        customer: req.user.id,
        customerInfo: {
          name: user ? user.name : '',
          email: user ? user.email : '',
          address: order.deliveryAddress || '',
          taxID: user && user.taxID ? user.taxID : ''
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

      // Send confirmation email asynchronously; do not block response on email success
      (async () => {
        try {
          const user = await User.findById(req.user.id);
          if (user && user.email) {
            await sendOrderConfirmation(user.email, {
              orderId: order._id,
              orderItems: order.orderItems.map(it => ({
                name: it.name,
                quantity: it.quantity,
                price: it.price
              })),
              totalPrice: totalAmount,
              deliveryAddress: order.deliveryAddress,
              createdAt: order.createdAt
            });
            console.log(`Invoice email queued for ${user.email}`);
          }
        } catch (emailErr) {
          console.error('Error sending order confirmation email:', emailErr);
        }
      })();

      res.status(201).json({ 
        message: 'Order created successfully', 
        order,
        invoice
      });
    } catch (invErr) {
      console.error('Invoice creation error:', invErr);
      // Still return order even if invoice creation fails
      res.status(201).json({ 
        message: 'Order created successfully (invoice creation failed)', 
        order,
        invoiceError: invErr.message
      });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get user's orders (with masked credit card)
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

// Get single order by ID (with masked credit card)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify user owns this order
    if (order.user._id.toString() !== req.user.id) {
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

// Admin/Product Manager: Get all orders
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

// Update order status
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

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('orderItems.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

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

module.exports = router;