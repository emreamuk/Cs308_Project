// src/Components/Pages/Checkout/Checkout.jsx
import React, { useState, useContext } from 'react';
import { CartContext } from '../../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';  // ← ADD THIS
import './Checkout.css';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useContext(CartContext);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');  // ← ADD THIS
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to place order');
      navigate('/login');
      return;
    }

    if (!address.trim()) {
      alert('Please enter delivery address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare order items
      const orderItems = cartItems.map(item => ({
        product: item._id,
        quantity: item.qty,
        price: item.price
      }));

      // Send order to backend
      const response = await API.post('/orders', {
        orderItems,
        totalPrice: getCartTotal(),
        deliveryAddress: address
      });

      // Success!
      alert(`Order #${response.data.order._id.slice(-8)} placed successfully!`);
      clearCart();
      navigate('/orders');  // Redirect to orders page
      
    } catch (err) {
      console.error('Order error:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <p>Your cart is empty!</p>
        <button onClick={() => navigate('/')}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {error && (  // ← ADD ERROR DISPLAY
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div className="checkout-layout">
        <div className="order-summary">
          <h2>Order Summary</h2>
          {cartItems.map(item => (
            <div key={item._id} className="summary-item">
              <span>{item.name} x {item.qty}</span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-total">
            <strong>Total:</strong>
            <strong>${getCartTotal().toFixed(2)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <h2>Delivery Information</h2>
          <label>Delivery Address</label>
          <textarea
            placeholder="Enter your full delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            rows="4"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;