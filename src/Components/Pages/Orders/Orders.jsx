// src/Components/Pages/Orders/Orders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [eligibleItems, setEligibleItems] = useState([]);
  const [refundForm, setRefundForm] = useState({
    productId: '',
    quantity: 1,
    reason: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await API.get('/orders/my-orders');
        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Fetch orders error:', error);
        setError('Failed to load orders');
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);  // ← FIXED: Added navigate dependency

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await API.post(`/orders/${orderId}/cancel`);
      alert('Order cancelled successfully');

      // Refetch orders to update the list
      const response = await API.get('/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleRequestRefund = async (order) => {
    try {
      const response = await API.get(`/refunds/eligible-products/${order._id}`);

      if (response.data.eligibleItems.length === 0) {
        alert('No eligible items for refund in this order');
        return;
      }

      setSelectedOrder(response.data.order);
      setEligibleItems(response.data.eligibleItems);
      setRefundForm({
        productId: response.data.eligibleItems[0].product._id,
        quantity: 1,
        reason: ''
      });
      setShowRefundModal(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to check eligibility');
    }
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();

    if (!refundForm.reason.trim()) {
      alert('Please provide a reason for the refund');
      return;
    }

    try {
      await API.post('/refunds/request', {
        orderId: selectedOrder._id,
        productId: refundForm.productId,
        quantity: refundForm.quantity,
        reason: refundForm.reason
      });

      alert('Refund request submitted successfully! We will review it soon.');
      setShowRefundModal(false);
      setRefundForm({ productId: '', quantity: 1, reason: '' });

      // Refetch orders
      const response = await API.get('/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit refund request');
    }
  };

  const canRequestRefund = (order) => {
    if (order.status !== 'delivered') return false;
    if (!order.deliveryCompletedAt) return false;

    const daysSinceDelivery = Math.floor(
      (Date.now() - new Date(order.deliveryCompletedAt)) / (1000 * 60 * 60 * 24)
    );

    return daysSinceDelivery <= 30;
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
      <div className="orders-page">
        <h1>My Orders</h1>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <h1>My Orders</h1>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
          <button onClick={() => navigate('/')}>Start Shopping</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
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
                    className="order-status"
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

              <div className="order-items">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.name} x {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <strong>Total: ${order.totalPrice.toFixed(2)}</strong>
                </div>
                <div className="order-address">
                  <small>Delivery to: {order.deliveryAddress}</small>
                  {order.deliveryCompletedAt && (
                    <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                      Delivered on: {new Date(order.deliveryCompletedAt).toLocaleDateString()}
                    </small>
                  )}
                </div>
                <div className="order-actions">
                  {order.status === 'processing' && (
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelOrder(order._id)}
                    >
                      Cancel Order
                    </button>
                  )}
                  {canRequestRefund(order) && (
                    <button
                      className="refund-btn"
                      onClick={() => handleRequestRefund(order)}
                    >
                      Request Refund
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Request Refund</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              You can return products within 30 days of delivery
            </p>

            <form onSubmit={handleSubmitRefund}>
              <div className="form-group">
                <label>Select Product:</label>
                <select
                  value={refundForm.productId}
                  onChange={(e) => {
                    const selectedItem = eligibleItems.find(
                      item => item.product._id === e.target.value
                    );
                    setRefundForm({
                      ...refundForm,
                      productId: e.target.value,
                      quantity: 1
                    });
                  }}
                  required
                >
                  {eligibleItems.map((item) => (
                    <option key={item.product._id} value={item.product._id}>
                      {item.product.name} (Available: {item.availableForRefund})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={
                    eligibleItems.find(item => item.product._id === refundForm.productId)
                      ?.availableForRefund || 1
                  }
                  value={refundForm.quantity}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, quantity: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Reason for Refund:</label>
                <textarea
                  rows="4"
                  placeholder="Please explain why you want to return this product..."
                  value={refundForm.reason}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, reason: e.target.value })
                  }
                  required
                />
              </div>

              <div className="refund-amount">
                <strong>Refund Amount: </strong>
                $
                {(
                  (eligibleItems.find(item => item.product._id === refundForm.productId)
                    ?.price || 0) * refundForm.quantity
                ).toFixed(2)}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  Submit Refund Request
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowRefundModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;