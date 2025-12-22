// src/Components/Pages/SalesManager/SalesManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SalesManager.css';

function SalesManager() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get('http://localhost:5000/api/products');
    setProducts(res.data);
  };

  const applyDiscount = async () => {
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/sales/discount', {
      productIds: selectedProducts,
      discountPercentage: discount
    }, { headers: { Authorization: `Bearer ${token}` } });
    alert('Discount applied!');
    fetchProducts();
  };

  const getAnalytics = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:5000/api/sales/analytics?startDate=${startDate}&endDate=${endDate}`,
      { headers: { Authorization: `Bearer ${token}` } });
    setAnalytics(res.data);
  };

  const getInvoices = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:5000/api/sales/invoices?startDate=${startDate}&endDate=${endDate}`,
      { headers: { Authorization: `Bearer ${token}` } });
    setInvoices(res.data);
  };

  return (
    <div className="sales-manager">
      <h1>Sales Manager Dashboard</h1>

      {/* Discount Section */}
      <div className="section">
        <h2>Apply Discount</h2>
        <select multiple onChange={(e) => setSelectedProducts(Array.from(e.target.selectedOptions, opt => opt.value))}>
          {products.map(p => <option key={p._id} value={p._id}>{p.name} - ${p.price}</option>)}
        </select>
        <input type="number" placeholder="Discount %" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        <button onClick={applyDiscount}>Apply Discount</button>
      </div>

      {/* Analytics Section */}
      <div className="section">
        <h2>Revenue & Profit</h2>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={getAnalytics}>Get Analytics</button>
        {analytics && (
          <div className="analytics">
            <p>Revenue: ${analytics.revenue.toFixed(2)}</p>
            <p>Cost: ${analytics.cost.toFixed(2)}</p>
            <p>Profit: ${analytics.profit.toFixed(2)}</p>
            <p>Orders: {analytics.orderCount}</p>
          </div>
        )}
      </div>

      {/* Invoices Section */}
      <div className="section">
        <h2>View Invoices</h2>
        <button onClick={getInvoices}>Get Invoices</button>
        <div className="invoices">
          {invoices.map(inv => (
            <div key={inv._id} className="invoice">
              <p>Order #{inv._id.slice(-6)} - ${inv.totalPrice} - {inv.user.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SalesManager;
