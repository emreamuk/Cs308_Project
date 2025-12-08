// src/Components/Pages/ProductManager/ProductManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';
import './ProductManager.css';

const ProductManager = () => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

useEffect(() => {
  const fetchPendingReviews = async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'product_manager') {
        alert('Access denied. Product Manager role required.');
        navigate('/');
        return;
      }
    }

    try {
      const response = await API.get('/reviews/pending');
      setPendingReviews(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch pending reviews error:', error);
      setError('Failed to load pending reviews');
      setLoading(false);
    }
  };

  fetchPendingReviews();
}, [navigate]);

  const handleApprove = async (reviewId) => {
    try {
      await API.patch(`/reviews/${reviewId}/approve`);
      alert('Review approved successfully!');
      
      // Remove from list
      setPendingReviews(pendingReviews.filter(review => review._id !== reviewId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    if (!window.confirm('Are you sure you want to reject and delete this review?')) {
      return;
    }

    try {
      await API.delete(`/reviews/${reviewId}`);
      alert('Review rejected and deleted');
      
      // Remove from list
      setPendingReviews(pendingReviews.filter(review => review._id !== reviewId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="product-manager-page">
        <h1>Product Manager Dashboard</h1>
        <p>Loading pending reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-manager-page">
        <h1>Product Manager Dashboard</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="product-manager-page">
      <h1>Product Manager Dashboard</h1>
      <h2>Pending Reviews ({pendingReviews.length})</h2>

      {pendingReviews.length === 0 ? (
        <div className="no-pending">
          <p>✅ No pending reviews. All caught up!</p>
        </div>
      ) : (
        <div className="pending-reviews-list">
          {pendingReviews.map((review) => (
            <div key={review._id} className="review-approval-card">
              <div className="review-header">
                <div>
                  <h3>{review.product.name}</h3>
                  <p className="reviewer">By: {review.user.name}</p>
                  <p className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="review-rating">
                  {'⭐'.repeat(review.rating)}
                </div>
              </div>

              <div className="review-content">
                <p>{review.comment}</p>
              </div>

              <div className="review-actions">
                <button 
                  className="approve-btn"
                  onClick={() => handleApprove(review._id)}
                >
                  ✓ Approve
                </button>
                <button 
                  className="reject-btn"
                  onClick={() => handleReject(review._id)}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductManager;