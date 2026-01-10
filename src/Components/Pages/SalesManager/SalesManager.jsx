// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './SalesManager.css';
// // Chart components used for visualizing sales analytics
// import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// // SalesManager component responsible for managing discounts,
// // viewing sales analytics, and displaying invoices
// function SalesManager() {
//   const [products, setProducts] = useState([]);
//   const [selectedProducts, setSelectedProducts] = useState([]);
//   const [discount, setDiscount] = useState(0);
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [analytics, setAnalytics] = useState(null);
//   const [invoices, setInvoices] = useState([]);
//   const [detailedMetrics, setDetailedMetrics] = useState(null);

//   // Fetch product list once when the component mounts
//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   // Retrieves all products from the backend
//   const fetchProducts = async () => {
//     const res = await axios.get('http://localhost:5000/api/products');
//     setProducts(res.data);
//   };

//   // Applies a discount to the selected products
//   const applyDiscount = async () => {
//     const token = localStorage.getItem('token');
//     await axios.post('http://localhost:5000/api/sales/discount', {
//       productIds: selectedProducts,
//       discountPercentage: discount
//     }, { headers: { Authorization: `Bearer ${token}` } });
//     alert('Discount applied!');
//     fetchProducts();
//   };

//   // Removes discount from selected products and restores original prices
//   const removeDiscount = async () => {
//     const token = localStorage.getItem('token');
//     try {
//       await axios.post('http://localhost:5000/api/sales/undiscount', {
//         productIds: selectedProducts
//       }, { headers: { Authorization: `Bearer ${token}` } });
      
//       alert('Discounts disabled and prices restored!');
//       fetchProducts(); 
//     } catch (error) {
//       console.error('Error removing discount:', error);
//       alert('Failed to remove discount.');
//     }
//   };

//   // Fetches revenue, cost, and profit analytics for the given date range

//   const getAnalytics = async () => {
//     const token = localStorage.getItem('token');
//     const res = await axios.get(`http://localhost:5000/api/sales/analytics?startDate=${startDate}&endDate=${endDate}`,
//       { headers: { Authorization: `Bearer ${token}` } });
//     setAnalytics(res.data);
//   };

//   // Retrieves invoice data for the selected date range
//   const getInvoices = async () => {
//     const token = localStorage.getItem('token');
//     const res = await axios.get(`http://localhost:5000/api/sales/invoices?startDate=${startDate}&endDate=${endDate}`,
//       { headers: { Authorization: `Bearer ${token}` } });
//     setInvoices(res.data);
//   };
//   // Fetches detailed sales metrics used for charts and breakdown tables
//   const getDetailedMetrics = async () => {
//     const token = localStorage.getItem('token');
//     const res = await axios.get(`http://localhost:5000/api/sales/detailed-metrics?startDate=${startDate}&endDate=${endDate}`,
//       { headers: { Authorization: `Bearer ${token}` } });
//     setDetailedMetrics(res.data);
//   };

//   return (
//     <div className="sales-manager">
//       <h1>Sales Manager Dashboard</h1>

//       {}
//       <div className="section">
//         <h2>Apply Discount</h2>
//         <select multiple onChange={(e) => setSelectedProducts(Array.from(e.target.selectedOptions, opt => opt.value))}>
//           {products.map(p => (
//             <option key={p._id} value={p._id}>
//               {p.name} - ${p.price} {p.originalPrice && p.originalPrice !== p.price ? `(Original: $${p.originalPrice})` : ''}
//             </option>
//           ))}
//         </select>

//         <div className="discountRate">
//           <input type="number" placeholder="Discount %" value={discount} onChange={(e) => setDiscount(e.target.value)} />
//         </div>
        
        
//         <div className="button-group">
//           <button onClick={applyDiscount}>Apply Discount</button>
          
//           {}
//           <button onClick={removeDiscount} style={{ backgroundColor: '#6c757d', marginLeft: '10px' }}>
//             Disable Discount
//           </button>
//         </div>
//       </div>

//       {}
//       <div className="section">
//         <h2>Revenue & Profit</h2>
//         <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
//         <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
//         <button onClick={getAnalytics}>Get Analytics</button>
//         {analytics && (
//           <div className="analytics">
//             <p><strong>Revenue:</strong> ${analytics.revenue.toFixed(2)}</p>
//             <p><strong>Cost:</strong> ${analytics.cost.toFixed(2)}</p>
//             <p><strong>Profit:</strong> ${analytics.profit.toFixed(2)}</p>
//             <p><strong>Orders:</strong> {analytics.orderCount}</p>
//             <p><strong>Average Order Value:</strong> ${analytics.averageOrderValue.toFixed(2)}</p>
//             <p><strong>Profit Margin:</strong> {((analytics.profit / analytics.revenue) * 100).toFixed(1)}%</p>
//           </div>
//         )}
//       </div>

//       {}
//       <div className="section">
//         <h2>Detailed Sales Metrics</h2>
//         <button onClick={getDetailedMetrics}>Get Detailed Metrics</button>

//         {detailedMetrics && (
//           <div className="detailed-metrics">

//             {}
//             <div className="metrics-summary" style={{marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '5px'}}>
//               <h3>Summary</h3>
//               <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px'}}>
//                 <div><strong>Total Items Sold:</strong> {detailedMetrics.totalItemsSold}</div>
//                 <div><strong>Total Orders:</strong> {detailedMetrics.totalOrders}</div>
//                 <div><strong>Successful Orders:</strong> {detailedMetrics.successfulOrders}</div>
//                 <div><strong>Cancelled Orders:</strong> {detailedMetrics.cancelledOrders}</div>
//                 <div><strong>Cancellation Rate:</strong> {detailedMetrics.cancellationRate}%</div>
//               </div>
//             </div>

//             {}
//             <div className="top-products" style={{marginBottom: '30px'}}>
//               <h3>Top 5 Selling Products</h3>
//               {detailedMetrics.topProducts.length > 0 ? (
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={detailedMetrics.topProducts}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" />
//                     <YAxis />
//                     <Tooltip />
//                     <Legend />
//                     <Bar dataKey="quantitySold" fill="#3498db" name="Quantity Sold" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <p>No products sold in this period</p>
//               )}
//             </div>

//             {}
//             <div className="category-breakdown" style={{marginBottom: '30px'}}>
//               <h3>Revenue by Category</h3>
//               {detailedMetrics.categoryBreakdown.length > 0 ? (
//                 <ResponsiveContainer width="100%" height={300}>
//                   <PieChart>
//                     <Pie
//                       data={detailedMetrics.categoryBreakdown}
//                       dataKey="revenue"
//                       nameKey="category"
//                       cx="50%"
//                       cy="50%"
//                       outerRadius={100}
//                       label={(entry) => `${entry.category}: $${entry.revenue.toFixed(0)}`}
//                     >
//                       {detailedMetrics.categoryBreakdown.map((entry, index) => {
//                         const colors = ['#ff4141', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#e74c3c'];
//                         return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
//                       })}
//                     </Pie>
//                     <Tooltip />
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <p>No category data available</p>
//               )}
//             </div>

//             {}
//             <div className="top-products-table" style={{marginBottom: '20px'}}>
//               <h3>Top Products Details</h3>
//               {detailedMetrics.topProducts.length > 0 && (
//                 <table style={{width: '100%', borderCollapse: 'collapse'}}>
//                   <thead>
//                     <tr style={{background: '#ff4141', color: 'white'}}>
//                       <th style={{padding: '10px', textAlign: 'left'}}>Product</th>
//                       <th style={{padding: '10px', textAlign: 'left'}}>Category</th>
//                       <th style={{padding: '10px', textAlign: 'right'}}>Qty Sold</th>
//                       <th style={{padding: '10px', textAlign: 'right'}}>Revenue</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {detailedMetrics.topProducts.map((product, idx) => (
//                       <tr key={idx} style={{borderBottom: '1px solid #ddd'}}>
//                         <td style={{padding: '10px'}}>{product.name}</td>
//                         <td style={{padding: '10px'}}>{product.category}</td>
//                         <td style={{padding: '10px', textAlign: 'right'}}>{product.quantitySold}</td>
//                         <td style={{padding: '10px', textAlign: 'right'}}>${product.revenue.toFixed(2)}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>

//             {}
//             <div className="category-table">
//               <h3>Category Revenue Breakdown</h3>
//               {detailedMetrics.categoryBreakdown.length > 0 && (
//                 <table style={{width: '100%', borderCollapse: 'collapse'}}>
//                   <thead>
//                     <tr style={{background: '#27ae60', color: 'white'}}>
//                       <th style={{padding: '10px', textAlign: 'left'}}>Category</th>
//                       <th style={{padding: '10px', textAlign: 'right'}}>Revenue</th>
//                       <th style={{padding: '10px', textAlign: 'right'}}>% of Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {detailedMetrics.categoryBreakdown.map((cat, idx) => {
//                       const totalRevenue = detailedMetrics.categoryBreakdown.reduce((sum, c) => sum + c.revenue, 0);
//                       const percentage = ((cat.revenue / totalRevenue) * 100).toFixed(1);
//                       return (
//                         <tr key={idx} style={{borderBottom: '1px solid #ddd'}}>
//                           <td style={{padding: '10px'}}>{cat.category}</td>
//                           <td style={{padding: '10px', textAlign: 'right'}}>${cat.revenue.toFixed(2)}</td>
//                           <td style={{padding: '10px', textAlign: 'right'}}>{percentage}%</td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
//             </div>

//           </div>
//         )}
//       </div>

//       {}
//       <div className="section">
//         <h2>View Invoices</h2>
//         <button onClick={getInvoices}>Get Invoices</button>
//         <div className="invoices">
//           {invoices.map(inv => (
//             <div key={inv._id} className="invoice">
//               <p>Order #{inv._id.slice(-6)} - ${inv.totalPrice} - {inv.user.email}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default SalesManager;
import React, { useState, useEffect } from 'react';
import API from '../../../services/api';
import './SalesManager.css';
import InvoiceDetail from '../Invoice/InvoiceDetail';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SalesManager() {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [detailedMetrics, setDetailedMetrics] = useState(null);
  const [invoiceStats, setInvoiceStats] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products');
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to load products. Please check if the backend server is running.');
    }
  };

  const applyDiscount = async () => {
    await API.post('/sales/discount', {
      productIds: selectedProducts,
      discountPercentage: discount
    });
    alert('Discount applied!');
    fetchProducts();
  };

  const removeDiscount = async () => {
    try {
      await API.post('/sales/undiscount', {
        productIds: selectedProducts
      });

      alert('Discounts disabled and prices restored!');
      fetchProducts();
    } catch (error) {
      console.error('Error removing discount:', error);
      alert('Failed to remove discount.');
    }
  };

  const getAnalytics = async () => {
    const res = await API.get(`/sales/analytics?startDate=${startDate}&endDate=${endDate}`);
    setAnalytics(res.data);
  };

  // Enhanced invoice fetching with statistics
  const getInvoices = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      // Fetch invoices
      const invoicesRes = await API.get(
        `/invoices?startDate=${startDate}&endDate=${endDate}`
      );
      setInvoices(invoicesRes.data);

      // Fetch invoice statistics
      const statsRes = await API.get(
        `/invoices/stats/summary?startDate=${startDate}&endDate=${endDate}`
      );
      setInvoiceStats(statsRes.data);

    } catch (error) {
      console.error('Error fetching invoices:', error);
      alert('Failed to fetch invoices. Make sure you are using server.js');
    }
  };

  const getDetailedMetrics = async () => {
    const res = await API.get(`/sales/detailed-metrics?startDate=${startDate}&endDate=${endDate}`);
    setDetailedMetrics(res.data);
  };

  const viewInvoiceDetail = async (invoiceId) => {
    try {
      const res = await API.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(res.data);
      setShowInvoiceDetail(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      alert('Failed to fetch invoice details');
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('Use your browser\'s Print > Save as PDF option');
    window.print();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="sales-manager-claude">
      <h1>Sales Manager Dashboard</h1>

      {/* Apply Discount Section */}
      <div className="section">
        <h2>Apply Discount</h2>
        <select multiple onChange={(e) => setSelectedProducts(Array.from(e.target.selectedOptions, opt => opt.value))}>
          {products.map(p => (
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
          <button onClick={removeDiscount} className="btn-secondary">
            Disable Discount
          </button>
        </div>
      </div>

      {/* Date Range Filter Section */}
      <div className="section date-filter-section">
        <h2>Select Date Range</h2>
        <div className="date-inputs">
          <div className="date-input-group">
            <label>Start Date:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="date-input-group">
            <label>End Date:</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Revenue & Profit Section */}
      <div className="section">
        <h2>Revenue & Profit</h2>
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

      {/* Detailed Sales Metrics Section */}
      <div className="section">
        <h2>Detailed Sales Metrics</h2>
        <button onClick={getDetailedMetrics}>Get Detailed Metrics</button>

        {detailedMetrics && (
          <div className="detailed-metrics">
            <div className="metrics-summary">
              <h3>Summary</h3>
              <div className="summary-grid">
                <div><strong>Total Items Sold:</strong> {detailedMetrics.totalItemsSold}</div>
                <div><strong>Total Orders:</strong> {detailedMetrics.totalOrders}</div>
                <div><strong>Successful Orders:</strong> {detailedMetrics.successfulOrders}</div>
                <div><strong>Cancelled Orders:</strong> {detailedMetrics.cancelledOrders}</div>
                <div><strong>Cancellation Rate:</strong> {detailedMetrics.cancellationRate}%</div>
              </div>
            </div>

            <div className="top-products">
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

            <div className="category-breakdown">
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
          </div>
        )}
      </div>

      {/* Enhanced Invoice Management Section */}
      <div className="section invoice-section">
        <h2>Invoice Management</h2>
        <button onClick={getInvoices} className="btn-primary">Get Invoices</button>

        {/* Invoice Statistics */}
        {invoiceStats && (
          <div className="invoice-stats">
            <h3>Invoice Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Invoices</span>
                <span className="stat-value">{invoiceStats.totalInvoices}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-value">${invoiceStats.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Tax</span>
                <span className="stat-value">${invoiceStats.totalTax.toFixed(2)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Paid Invoices</span>
                <span className="stat-value">{invoiceStats.paidInvoices}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Cancelled</span>
                <span className="stat-value">{invoiceStats.cancelledInvoices}</span>
              </div>
            </div>
          </div>
        )}

        {/* Invoice List */}
        {invoices.length > 0 && (
          <div className="invoices-list">
            <h3>Invoices ({invoices.length})</h3>
            <div className="invoice-table-container">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice._id}>
                      <td className="invoice-number">{invoice.invoiceNumber}</td>
                      <td>{formatDate(invoice.invoiceDate)}</td>
                      <td>
                        <div className="customer-info">
                          <div>{invoice.customer?.name || 'N/A'}</div>
                          <small>{invoice.customer?.email || 'N/A'}</small>
                        </div>
                      </td>
                      <td>{invoice.items.length}</td>
                      <td className="amount">${invoice.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${invoice.status}`}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => viewInvoiceDetail(invoice._id)}
                          className="btn-view"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {invoices.length === 0 && invoiceStats && (
          <p className="no-data">No invoices found for the selected date range.</p>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceDetail && selectedInvoice && (
        <div className="modal-overlay no-print" onClick={() => setShowInvoiceDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowInvoiceDetail(false)}
            >
              ×
            </button>
            <InvoiceDetail
              invoice={selectedInvoice}
              showActions={true}
              onPrint={handlePrintInvoice}
              onDownloadPDF={handleDownloadPDF}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesManager;
