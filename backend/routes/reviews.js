// backend/routes/reviews.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Add review/rating (must have purchased and received product)
router.post('/', auth, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // Validate input
    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has purchased and received this product
    const order = await Order.findOne({
      user: req.user.id,
      'orderItems.product': productId,
      status: 'delivered'
    });

    if (!order) {
      return res.status(400).json({ 
        message: 'You can only review products you have purchased and received' 
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this product' 
      });
    }

    // Create review
    const review = new Review({
      product: productId,
      user: req.user.id,
      rating,
      comment,
      approved: false // Needs product manager approval
    });

    await review.save();

    res.status(201).json({
      message: 'Review submitted successfully. It will be visible after approval.',
      review
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error while creating review' });
  }
});

// Submit rating only (no approval needed - directly updates product)
router.post('/rating', auth, async (req, res) => {
  try {
    const { productId, rating } = req.body;

    // Validate input
    if (!productId || !rating) {
      return res.status(400).json({ message: 'Please provide productId and rating' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has purchased and received this product
    const order = await Order.findOne({
      user: req.user.id,
      'orderItems.product': productId,
      status: 'delivered'
    });

    if (!order) {
      return res.status(400).json({ 
        message: 'You can only rate products you have purchased and received' 
      });
    }

    // Check if user already reviewed (has rating)
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id
    });

    if (existingReview) {
      // Update existing rating
      existingReview.rating = rating;
      await existingReview.save();
    } else {
      // Create new review with rating only (no comment)
      const review = new Review({
        product: productId,
        user: req.user.id,
        rating,
        comment: 'Rating only', // Placeholder
        approved: true // Auto-approve rating-only
      });
      await review.save();
    }

    res.json({ message: 'Rating submitted successfully' });

  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Server error while submitting rating' });
  }
});

module.exports = router;