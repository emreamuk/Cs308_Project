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

    // Update product rating (only approved reviews count)
    await updateProductRating(productId);

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

    // Update product rating immediately
    await updateProductRating(productId);

    res.json({ message: 'Rating submitted successfully' });

  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Server error while submitting rating' });
  }
});

// Get reviews for a product (only approved reviews with comments)
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ 
      product: req.params.productId,
      approved: true,
      comment: { $ne: 'Rating only' } // Exclude rating-only reviews
    })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
});

// Get all pending reviews (for product manager)
router.get('/pending', auth, async (req, res) => {
  try {
    // TODO: Add role check for product manager
    const reviews = await Review.find({ 
      approved: false,
      comment: { $ne: 'Rating only' }
    })
    .populate('user', 'name')
    .populate('product', 'name')
    .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
});

// Approve review (product manager only)
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    // TODO: Add role check for product manager
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.approved = true;
    await review.save();

    // Update product rating
    await updateProductRating(review.product);

    res.json({ message: 'Review approved', review });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({ message: 'Server error while approving review' });
  }
});

// Reject/Delete review (product manager only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // TODO: Add role check for product manager
    
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const productId = review.product;
    await review.deleteOne();

    // Update product rating after deletion
    await updateProductRating(productId);

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error while deleting review' });
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    // Get all approved reviews for this product
    const reviews = await Review.find({ 
      product: productId,
      approved: true
    });

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        numReviews: 0
      });
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;

    // Update product
    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      numReviews: reviews.length
    });

  } catch (error) {
    console.error('Update product rating error:', error);
  }
}

module.exports = router;