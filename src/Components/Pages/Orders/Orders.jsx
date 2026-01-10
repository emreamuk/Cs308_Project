// src/Components/Pages/Orders/Orders.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const response = await API.get('/orders/my-orders');
      console.log('Orders response:', response.data);
      
      // Handle both response formats
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
      } else {
        console.error('Unexpected response format:', response.data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      if (error.response?.status === 401) {
        alert('Please login to view orders');
        navigate('/login');
      } else {
        alert('Failed to load orders');
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'processing': 'status-processing',
      'in-transit': 'status-transit',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-processing';
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <h1>My Orders</h1>
          <div className="loading-message">Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1>My Orders</h1>

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet.</p>
            <button onClick={() => navigate('/products')} className="shop-now-btn">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                {/* Order Header */}
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order._id?.slice(-8) || 'N/A'}</h3>
                    <p className="order-date">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="order-items">
                  {order.orderItems && order.orderItems.map((item, index) => (
                    <div key={index} className="order-item">
                      {item.product?.imageUrl && (
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name || item.name}
                          className="order-item-image"
                        />
                      )}
                      <div className="order-item-details">
                        <h4>{item.product?.name || item.name}</h4>
                        <p className="item-quantity">Quantity: {item.quantity}</p>
                        <p className="item-price">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="order-footer">
                  <div className="order-address">
                    <strong>Delivery Address:</strong>
                    <p>{order.deliveryAddress}</p>
                  </div>
                  
                  {/* Payment Info with Masked Card */}
                  {order.paymentInfo && (
                    <div className="order-payment">
                      <strong>Payment:</strong>
                      <p>💳 {order.paymentInfo.creditCardNumber || 'Card ending in ****'}</p>
                      <p>{order.paymentInfo.cardHolderName}</p>
                    </div>
                  )}

                  <div className="order-total">
                    <strong>Total:</strong>
                    <span className="total-amount">${order.totalPrice?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;