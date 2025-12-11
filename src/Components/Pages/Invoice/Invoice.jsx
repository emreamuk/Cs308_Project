// src/Components/Pages/Invoice/Invoice.jsx
import React, { useEffect, useContext, useRef } from 'react'; // ✅ Add useRef
import { useLocation, useNavigate } from 'react-router-dom';
import { CartContext } from '../../../context/CartContext';
import API from '../../../services/api';
import './Invoice.css';

const Invoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);
  const { orderData, paymentDetails } = location.state || {};
  
  // ✅ ADD THIS - Prevent duplicate submissions
  const orderSubmitted = useRef(false);

  useEffect(() => {
    // ✅ CHECK if already submitted
    if (orderSubmitted.current) {
      console.log('Order already submitted, skipping...');
      return;
    }

    const submitOrder = async () => {
      if (!orderData) return;

      try {
        // ✅ MARK as submitted BEFORE API call
        orderSubmitted.current = true;

        const orderItems = orderData.items.map(item => ({
          product: item.id,
          quantity: item.qty,
          price: item.price
        }));

        console.log('Submitting order with items:', orderItems); // ✅ Debug log

        const response = await API.post('/orders', {
          orderItems,
          totalPrice: orderData.total,
          deliveryAddress: orderData.address
        });

        console.log('✅ Order created successfully:', response.data);
        
        // Clear cart after successful order
        clearCart();
        
      } catch (error) {
        console.error('❌ Order submission error:', error);
        // ✅ Reset flag if order failed
        orderSubmitted.current = false;
        alert('Order was paid but there was an error saving it. Please contact support.');
      }
    };

    submitOrder();
  }, []); // ✅ Empty dependency array - only run once

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('Please use Print > Save as PDF in your browser');
    window.print();
  };

  if (!orderData) {
    return (
      <div className="invoice-page">
        <h2>No invoice data found</h2>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const invoiceNumber = 'INV-' + Date.now().toString().slice(-8);
  const invoiceDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="invoice-page">
      <div className="invoice-container">
        <div className="invoice-header">
          <h1>INVOICE</h1>
          <div className="invoice-info">
            <p><strong>Invoice #:</strong> {invoiceNumber}</p>
            <p><strong>Date:</strong> {invoiceDate}</p>
            <p><strong>Payment Status:</strong> <span className="paid-badge">PAID</span></p>
          </div>
        </div>

        <div className="company-info">
          <h2>AO Comics</h2>
          <p>123 Comic Street</p>
          <p>Istanbul, Turkey</p>
          <p>contact@aocomics.com</p>
        </div>

        <div className="customer-info">
          <h3>Deliver To:</h3>
          <p>{orderData.address}</p>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.qty}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-total">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>${orderData.total.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Shipping:</span>
            <span>FREE</span>
          </div>
          <div className="total-row grand-total">
            <span><strong>Total Paid:</strong></span>
            <span><strong>${orderData.total.toFixed(2)}</strong></span>
          </div>
        </div>

        <div className="payment-method">
          <p><strong>Payment Method:</strong> Credit Card ({paymentDetails?.cardNumber})</p>
          <p><strong>Cardholder:</strong> {paymentDetails?.cardName}</p>
        </div>

        <div className="invoice-footer">
          <p>Thank you for your purchase!</p>
          <p>For questions, contact us at support@aocomics.com</p>
        </div>

        <div className="invoice-actions no-print">
          <button onClick={handlePrint}>Print Invoice</button>
          <button onClick={handleDownloadPDF}>Download PDF</button>
          <button onClick={() => navigate('/orders')}>View My Orders</button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;