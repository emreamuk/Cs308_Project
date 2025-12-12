// src/Components/Pages/ProductDetail/ProductDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../../services/api';
import { CartContext } from '../../../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

useEffect(() => {
  const fetchData = async () => {
    try {
      const productResponse = await API.get(`/products/${id}`);
      setProduct(productResponse.data);
      
      const reviewsResponse = await API.get(`/reviews/product/${id}`);
      setReviews(reviewsResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Product not found');
      setLoading(false);
    }
  };

  fetchData();
}, [id]);

  const handleAddToCart = () => {
    const success = addToCart(product); // CHANGED: Capture return value
    
    if (success) { // CHANGED: Only show success if it worked
      alert(`${product.name} added to cart!`);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to submit a review');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setReviewError('');

    try {
      await API.post('/reviews', {
        productId: id,
        rating,
        comment
      });

      alert('Review submitted! It will be visible after approval by product manager.');
      setRating(5);
      setComment('');
    } catch (error) {
      setReviewError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRating = async (ratingValue) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to rate this product');
      navigate('/login');
      return;
    }

    try {
      await API.post('/reviews/rating', {
        productId: id,
        rating: ratingValue
      });

      alert('Rating submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  if (loading) return <div className="product-detail-page"><h2>Loading...</h2></div>;
  if (error) return <div className="product-detail-page"><h2>{error}</h2></div>;
  if (!product) return <div className="product-detail-page"><h2>Product not found</h2></div>;

  return (
    <div className="product-detail-page">
      <button onClick={() => navigate(-1)} className="back-btn">← Back</button>

      <div className="product-detail-container">
        {/* Product Info */}
        <div className="product-image-section">
          <img src={product.imageUrl} alt={product.name} />
        </div>

        <div className="product-info-section">
          <h1>{product.name}</h1>
          <p className="product-category">{product.category}</p>
          
          <div className="product-rating">
            <span className="stars">{'⭐'.repeat(Math.round(product.rating))}</span>
            <span className="rating-text">
              {product.rating.toFixed(1)} ({product.numReviews} ratings)
            </span>
          </div>

          <p className="product-description">{product.description}</p>

          <div className="product-details">
            <p><strong>Model:</strong> {product.model}</p>
            <p><strong>Serial Number:</strong> {product.serialNumber}</p>
            <p><strong>Distributor:</strong> {product.distributorInfo}</p>
            <p><strong>Warranty:</strong> {product.warrantyStatus}</p>
          </div>

          <div className="product-price-section">
            <h2 className="price">${product.price}</h2>
            <p className={`stock ${product.quantityInStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
              {product.quantityInStock > 0 
                ? `${product.quantityInStock} in stock` 
                : 'Out of Stock'}
            </p>
          </div>

          <button 
            className="add-to-cart-btn"
            disabled={product.quantityInStock === 0}
            onClick={handleAddToCart}
          >
            {product.quantityInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Quick Rating */}
      <div className="quick-rating-section">
        <h3>Rate this product:</h3>
        <div className="star-buttons">
          {[1, 2, 3, 4, 5].map(star => (
            <button 
              key={star}
              onClick={() => handleQuickRating(star)}
              className="star-btn"
            >
              {'⭐'.repeat(star)}
            </button>
          ))}
        </div>
      </div>

      {/* Review Form */}
      <div className="review-form-section">
        <h3>Write a Review</h3>
        {reviewError && <p className="error-message">{reviewError}</p>}
        
        <form onSubmit={handleSubmitReview}>
          <div className="form-group">
            <label>Rating:</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
              <option value="4">⭐⭐⭐⭐ (4 stars)</option>
              <option value="3">⭐⭐⭐ (3 stars)</option>
              <option value="2">⭐⭐ (2 stars)</option>
              <option value="1">⭐ (1 star)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Your Review:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows="5"
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="submit-review-btn">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="reviews-section">
        <h3>Customer Reviews ({reviews.length})</h3>
        
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <span className="reviewer-name">{review.user.name}</span>
                  <span className="review-rating">{'⭐'.repeat(review.rating)}</span>
                </div>
                <p className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;