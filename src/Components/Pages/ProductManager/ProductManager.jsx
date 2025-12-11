// src/Components/Pages/ProductManager/ProductManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';
import './ProductManager.css';

const ProductManager = () => {
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'orders'
  const [pendingReviews, setPendingReviews] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
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
        // Fetch pending reviews
        const reviewsResponse = await API.get('/reviews/pending');
        setPendingReviews(reviewsResponse.data);

        // Fetch all orders (to show delivery management)
        const ordersResponse = await API.get('/orders/all');
        setPendingOrders(ordersResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        
        if (error.response?.status === 403) {
          alert('Access denied. Product Manager role required.');
          navigate('/');
        } else {
          setError(error.response?.data?.message || 'Failed to load data');
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleApproveReview = async (reviewId) => {
    try {
      await API.patch(`/reviews/${reviewId}/approve`);
      alert('Review approved successfully!');
      setPendingReviews(pendingReviews.filter(review => review._id !== reviewId));
    } catch (error) {
      console.error('Approve error:', error);
      alert(error.response?.data?.message || 'Failed to approve review');
    }
  };

  const handleRejectReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to reject and delete this review?')) {
      return;
    }

    try {
      await API.delete(`/reviews/${reviewId}`);
      alert('Review rejected and deleted');
      setPendingReviews(pendingReviews.filter(review => review._id !== reviewId));
    } catch (error) {
      console.error('Reject error:', error);
      alert(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status: newStatus });
      alert(`Order status updated to ${newStatus}`);
      
      // Refresh orders
      const ordersResponse = await API.get('/orders/all');
      setPendingOrders(ordersResponse.data);
    } catch (error) {
      console.error('Update status error:', error);
      alert(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return '#FFA500';
      case 'in-transit': return '#2196F3';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#f44336';
      default: return '#999';
    }
  };

  if (loading) {
    return (
      <div className="product-manager-page">
        <h1>Product Manager Dashboard</h1>
        <p>Loading...</p>
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

      {/* Tab Navigation */}
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Pending Reviews ({pendingReviews.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Order Management ({pendingOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})
        </button>
      </div>

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="tab-content">
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
                      onClick={() => handleApproveReview(review._id)}
                    >
                      ✓ Approve
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleRejectReview(review._id)}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="tab-content">
          <h2>Order Management</h2>
          
          {pendingOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length === 0 ? (
            <div className="no-pending">
              <p>✅ No pending orders. All orders are completed!</p>
            </div>
          ) : (
            <div className="orders-list">
              {pendingOrders
                .filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
                .map((order) => (
                  <div key={order._id} className="order-management-card">
                    <div className="order-header">
                      <div>
                        <h3>Order #{order._id.slice(-8)}</h3>
                        <p className="order-date">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <span 
                          className="order-status-badge"
                          style={{ 
                            background: getStatusColor(order.status),
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="order-details">
                      <h4>Items:</h4>
                      {order.orderItems.map((item, index) => (
                        <p key={index}>• {item.name} x {item.quantity}</p>
                      ))}
                      
                      <p><strong>Total:</strong> ${order.totalPrice.toFixed(2)}</p>
                      <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
                    </div>

                    <div className="order-actions">
                      {order.status === 'processing' && (
                        <button 
                          className="status-btn in-transit-btn"
                          onClick={() => handleUpdateOrderStatus(order._id, 'in-transit')}
                        >
                          📦 Mark as In Transit
                        </button>
                      )}
                      
                      {order.status === 'in-transit' && (
                        <button 
                          className="status-btn delivered-btn"
                          onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                        >
                          ✓ Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductManager;