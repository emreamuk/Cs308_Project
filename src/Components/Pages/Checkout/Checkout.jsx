// src/Components/Pages/Checkout/Checkout.jsx
import React, { useState, useContext } from 'react';
import { CartContext } from '../../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, getCartTotal } = useContext(CartContext);
  const [address, setAddress] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
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

    // Prepare order data and go to payment
    const orderData = {
      items: cartItems.map(item => ({
        id: item._id,
        name: item.name,
        price: item.price,
        qty: item.qty
      })),
      total: getCartTotal(),
      address: address
    };

    // Navigate to payment page with order data
    navigate('/payment', { state: { orderData } });
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
          <button type="submit">
            Proceed to Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;