// src/Components/Pages/SalesManager/SalesManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SalesManager.css';
// ✅ ADDED: Import chart components
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SalesManager() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  // ✅ ADDED: State for detailed metrics
  const [detailedMetrics, setDetailedMetrics] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get('http://localhost:5000/api/products');
    setProducts(res.data);
  };

  // Function to apply discount (Point 1 - existing logic)
  const applyDiscount = async () => {
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/sales/discount', {
      productIds: selectedProducts,
      discountPercentage: discount
    }, { headers: { Authorization: `Bearer ${token}` } });
    alert('Discount applied!');
    fetchProducts();
  };

  //Added function to remove discounts and restore original prices
  const removeDiscount = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:5000/api/sales/undiscount', {
        productIds: selectedProducts
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert('Discounts disabled and prices restored!');
      fetchProducts(); // Refresh the list to see updated prices
    } catch (error) {
      console.error('Error removing discount:', error);
      alert('Failed to remove discount.');
    }
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

  // ✅ ADDED: Function to fetch detailed metrics
  const getDetailedMetrics = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`http://localhost:5000/api/sales/detailed-metrics?startDate=${startDate}&endDate=${endDate}`,
      { headers: { Authorization: `Bearer ${token}` } });
    setDetailedMetrics(res.data);
  };

  return (
    <div className="sales-manager">
      <h1>Sales Manager Dashboard</h1>

      {/* Discount Section */}
      <div className="section">
        <h2>Apply Discount</h2>
        <select multiple onChange={(e) => setSelectedProducts(Array.from(e.target.selectedOptions, opt => opt.value))}>
          {products.map(p => (
            /* CHANGE 2: Displaying current price and original price side-by-side if originalPrice exists */
            <option key={p._id} value={p._id}>
              {p.name} - ${p.price} {p.originalPrice && p.originalPrice !== p.price ? `(Original: $${p.originalPrice})` : ''}
            </option>
          ))}
        </select>

        <div className="discountRate">
          <input type="number" placeholder="Discount %" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>
        
        
        <div className="button-group">
          <button onClick={applyDiscount}>Apply Discount</button>
          
          {/* CHANGE 1 (UI): Added button to trigger the removeDiscount function */}
          <button onClick={removeDiscount} style={{ backgroundColor: '#6c757d', marginLeft: '10px' }}>
            Disable Discount
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="section">
        <h2>Revenue & Profit</h2>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={getAnalytics}>Get Analytics</button>
        {analytics && (
          <div className="analytics">
            <p><strong>Revenue:</strong> ${analytics.revenue.toFixed(2)}</p>
            <p><strong>Cost:</strong> ${analytics.cost.toFixed(2)}</p>
            <p><strong>Profit:</strong> ${analytics.profit.toFixed(2)}</p>
            <p><strong>Orders:</strong> {analytics.orderCount}</p>
            <p><strong>Average Order Value:</strong> ${analytics.averageOrderValue.toFixed(2)}</p>
            <p><strong>Profit Margin:</strong> {((analytics.profit / analytics.revenue) * 100).toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* ✅ NEW: Detailed Metrics Section with Charts */}
      <div className="section">
        <h2>Detailed Sales Metrics</h2>
        <button onClick={getDetailedMetrics}>Get Detailed Metrics</button>

        {detailedMetrics && (
          <div className="detailed-metrics">

            {/* Summary Stats */}
            <div className="metrics-summary" style={{marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '5px'}}>
              <h3>Summary</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px'}}>
                <div><strong>Total Items Sold:</strong> {detailedMetrics.totalItemsSold}</div>
                <div><strong>Total Orders:</strong> {detailedMetrics.totalOrders}</div>
                <div><strong>Successful Orders:</strong> {detailedMetrics.successfulOrders}</div>
                <div><strong>Cancelled Orders:</strong> {detailedMetrics.cancelledOrders}</div>
                <div><strong>Cancellation Rate:</strong> {detailedMetrics.cancellationRate}%</div>
              </div>
            </div>

            {/* Top Selling Products - Bar Chart */}
            <div className="top-products" style={{marginBottom: '30px'}}>
              <h3>Top 5 Selling Products</h3>
              {detailedMetrics.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={detailedMetrics.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantitySold" fill="#3498db" name="Quantity Sold" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>No products sold in this period</p>
              )}
            </div>

            {/* Revenue by Category - Pie Chart */}
            <div className="category-breakdown" style={{marginBottom: '30px'}}>
              <h3>Revenue by Category</h3>
              {detailedMetrics.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={detailedMetrics.categoryBreakdown}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.category}: $${entry.revenue.toFixed(0)}`}
                    >
                      {detailedMetrics.categoryBreakdown.map((entry, index) => {
                        const colors = ['#ff4141', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#e74c3c'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p>No category data available</p>
              )}
            </div>

            {/* Top Products Table */}
            <div className="top-products-table" style={{marginBottom: '20px'}}>
              <h3>Top Products Details</h3>
              {detailedMetrics.topProducts.length > 0 && (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{background: '#ff4141', color: 'white'}}>
                      <th style={{padding: '10px', textAlign: 'left'}}>Product</th>
                      <th style={{padding: '10px', textAlign: 'left'}}>Category</th>
                      <th style={{padding: '10px', textAlign: 'right'}}>Qty Sold</th>
                      <th style={{padding: '10px', textAlign: 'right'}}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedMetrics.topProducts.map((product, idx) => (
                      <tr key={idx} style={{borderBottom: '1px solid #ddd'}}>
                        <td style={{padding: '10px'}}>{product.name}</td>
                        <td style={{padding: '10px'}}>{product.category}</td>
                        <td style={{padding: '10px', textAlign: 'right'}}>{product.quantitySold}</td>
                        <td style={{padding: '10px', textAlign: 'right'}}>${product.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Category Revenue Table */}
            <div className="category-table">
              <h3>Category Revenue Breakdown</h3>
              {detailedMetrics.categoryBreakdown.length > 0 && (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{background: '#27ae60', color: 'white'}}>
                      <th style={{padding: '10px', textAlign: 'left'}}>Category</th>
                      <th style={{padding: '10px', textAlign: 'right'}}>Revenue</th>
                      <th style={{padding: '10px', textAlign: 'right'}}>% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedMetrics.categoryBreakdown.map((cat, idx) => {
                      const totalRevenue = detailedMetrics.categoryBreakdown.reduce((sum, c) => sum + c.revenue, 0);
                      const percentage = ((cat.revenue / totalRevenue) * 100).toFixed(1);
                      return (
                        <tr key={idx} style={{borderBottom: '1px solid #ddd'}}>
                          <td style={{padding: '10px'}}>{cat.category}</td>
                          <td style={{padding: '10px', textAlign: 'right'}}>${cat.revenue.toFixed(2)}</td>
                          <td style={{padding: '10px', textAlign: 'right'}}>{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

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