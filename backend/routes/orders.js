const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

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

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error while creating order' });
  }
});

module.exports = router;