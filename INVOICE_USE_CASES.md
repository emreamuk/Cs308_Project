# Invoice System - Use Cases & Examples

## Table of Contents
1. [Sales Manager Use Cases](#sales-manager-use-cases)
2. [Customer Use Cases](#customer-use-cases)
3. [Admin/Developer Use Cases](#admindeveloper-use-cases)
4. [Code Examples](#code-examples)
5. [Testing Scenarios](#testing-scenarios)

---

## Sales Manager Use Cases

### Use Case 1: Daily Invoice Review
**Actor:** Sales Manager
**Goal:** Review all invoices created today

**Steps:**
1. Log in as Sales Manager
2. Navigate to `/sales-manager-claude`
3. Set both start and end date to today
4. Click "Get Invoices"
5. Review statistics:
   - Total invoices created today
   - Revenue generated today
   - Tax collected today
6. Browse invoice list
7. Click "View" on any invoice to see details

**Expected Result:**
- Dashboard shows all invoices from today
- Statistics cards display accurate counts and totals
- Invoice table lists all today's invoices
- Can view, print, or save any invoice as PDF

---

### Use Case 2: Monthly Sales Report
**Actor:** Sales Manager
**Goal:** Generate monthly sales report with all invoices

**Steps:**
1. Log in as Sales Manager
2. Navigate to Sales Manager dashboard
3. Select first day of month as start date (e.g., 2024-01-01)
4. Select last day of month as end date (e.g., 2024-01-31)
5. Click "Get Invoices"
6. Review monthly statistics
7. Export specific invoices as needed

**Example Data:**
```
Start Date: 2024-01-01
End Date: 2024-01-31

Statistics:
- Total Invoices: 150
- Total Revenue: $15,750.00
- Total Tax: $2,835.00
- Paid Invoices: 145
- Cancelled: 5
```

**Actions:**
- Print high-value invoices
- Export data for accounting
- Identify trends

---

### Use Case 3: Customer Invoice Lookup
**Actor:** Sales Manager
**Goal:** Find and print a specific customer's invoice

**Steps:**
1. Log in as Sales Manager
2. Navigate to dashboard
3. Select appropriate date range (when customer made purchase)
4. Click "Get Invoices"
5. Use browser search (Ctrl+F) to find customer name or email
6. Click "View" on the invoice
7. Review details
8. Click "Print Invoice"
9. Choose "Save as PDF"
10. Send to customer via email

---

### Use Case 4: Weekly Revenue Analysis
**Actor:** Sales Manager
**Goal:** Analyze weekly sales performance

**Steps:**
1. Select Monday as start date
2. Select Sunday as end date
3. Get invoices and statistics
4. Compare with previous weeks
5. Identify trends:
   - Which days have most sales?
   - What's the average order value?
   - How much tax collected?

**Example Analysis:**
```
Week: Jan 8-14, 2024

Monday: 15 invoices, $1,250
Tuesday: 12 invoices, $980
Wednesday: 18 invoices, $1,450
Thursday: 20 invoices, $1,600
Friday: 25 invoices, $2,100
Saturday: 30 invoices, $2,500
Sunday: 22 invoices, $1,850

Total: 142 invoices, $11,730
Average per day: ~$1,675
Best day: Saturday
```

---

### Use Case 5: Invoice Verification
**Actor:** Sales Manager
**Goal:** Verify invoice details match order

**Steps:**
1. Customer reports invoice discrepancy
2. Log in as Sales Manager
3. Search for invoice by date or customer
4. Click "View" on the invoice
5. Verify:
   - Items match order
   - Quantities are correct
   - Prices are accurate
   - Tax calculated correctly
   - Total is correct
6. Cross-reference with order in system
7. Report findings to customer

---

## Customer Use Cases

### Use Case 6: View Personal Invoice (Future Enhancement)
**Actor:** Customer
**Goal:** View invoice for recent purchase

**Steps:**
1. Log in as customer
2. Navigate to "My Orders"
3. Click on order
4. Click "View Invoice" button
5. Review invoice details
6. Print or download PDF for records

**Note:** This requires creating a customer-facing invoice view page.

---

### Use Case 7: Request Invoice Copy
**Actor:** Customer
**Goal:** Get PDF copy of old invoice

**Current Process:**
1. Customer contacts support
2. Support agent logs in as Sales Manager
3. Sales Manager finds invoice
4. Exports PDF
5. Emails to customer

**Future Enhancement:**
- Customer can download directly from order history

---

## Admin/Developer Use Cases

### Use Case 8: Manual Invoice Creation
**Actor:** Developer/Admin
**Goal:** Create invoice for existing order via API

**Using Postman:**
```
1. Get Sales Manager JWT token:
   POST http://localhost:5000/api/auth/login
   Body: {
     "email": "salesmanager@aocomics.com",
     "password": "password123"
   }

2. Copy token from response

3. Create invoice:
   POST http://localhost:5000/api/invoices
   Headers:
     Authorization: Bearer <token>
   Body: {
     "orderId": "67a1234567890abcdef12345"
   }

4. Check response for invoice number
```

---

### Use Case 9: Bulk Invoice Creation
**Actor:** Developer
**Goal:** Create invoices for all orders without invoices

**Script Example:**
```javascript
const axios = require('axios');

async function createInvoicesForOrders() {
  const token = 'YOUR_SALES_MANAGER_TOKEN';

  // Get all orders
  const ordersRes = await axios.get('http://localhost:5000/api/orders/all', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const orders = ordersRes.data;

  for (const order of orders) {
    try {
      // Try to create invoice
      const invoiceRes = await axios.post(
        'http://localhost:5000/api/invoices',
        { orderId: order._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`✅ Invoice created for order ${order._id}: ${invoiceRes.data.invoice.invoiceNumber}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`⚠️ Invoice already exists for order ${order._id}`);
      } else {
        console.error(`❌ Failed for order ${order._id}:`, error.message);
      }
    }
  }

  console.log('Bulk invoice creation complete!');
}

createInvoicesForOrders();
```

---

### Use Case 10: Database Query
**Actor:** Developer
**Goal:** Query invoices directly from MongoDB

**MongoDB Shell:**
```javascript
// Connect to database
use aocomics_db

// Find all invoices
db.invoices_claudes.find()

// Find invoices by date range
db.invoices_claudes.find({
  invoiceDate: {
    $gte: ISODate("2024-01-01"),
    $lte: ISODate("2024-01-31")
  }
})

// Find invoices by customer
db.invoices_claudes.find({
  "customerInfo.email": "john@example.com"
})

// Get invoice statistics
db.invoices_claudes.aggregate([
  {
    $match: {
      invoiceDate: {
        $gte: ISODate("2024-01-01"),
        $lte: ISODate("2024-01-31")
      }
    }
  },
  {
    $group: {
      _id: null,
      totalInvoices: { $sum: 1 },
      totalRevenue: { $sum: "$totalAmount" },
      totalTax: { $sum: "$tax" }
    }
  }
])

// Find high-value invoices
db.invoices_claudes.find({
  totalAmount: { $gt: 1000 }
}).sort({ totalAmount: -1 })
```

---

## Code Examples

### Example 1: Auto-Create Invoice on Order

**In `backend/routes/orders_claude.js`:**
```javascript
// After order is saved
const order = new Order({...});
await order.save();

// Auto-create invoice
const Invoice = require('../models/Invoice_claude');
const user = await User.findById(req.user.id);

const invoiceItems = validatedItems.map(item => ({
  product: item.product,
  name: item.name,
  quantity: item.quantity,
  price: item.price,
  total: item.quantity * item.price
}));

const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
const tax = subtotal * 0.18;

const invoice = new Invoice({
  order: order._id,
  customer: req.user.id,
  customerInfo: {
    name: user.name,
    email: user.email,
    address: deliveryAddress,
    taxID: user.taxID || ''
  },
  items: invoiceItems,
  subtotal,
  tax,
  totalAmount: subtotal + tax,
  status: 'paid'
});

await invoice.save();
console.log(`✅ Invoice created: ${invoice.invoiceNumber}`);
```

---

### Example 2: Reusable Invoice Component

**In any React component:**
```javascript
import InvoiceDetail_claude from './Components/Pages/Invoice/InvoiceDetail_claude';

function MyComponent() {
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    // Fetch invoice
    const fetchInvoice = async () => {
      const res = await API.get(`/invoices/${invoiceId}`);
      setInvoice(res.data);
    };
    fetchInvoice();
  }, [invoiceId]);

  if (!invoice) return <div>Loading...</div>;

  return (
    <div>
      <h1>Invoice Details</h1>
      <InvoiceDetail_claude
        invoice={invoice}
        showActions={true}
        onPrint={() => window.print()}
        onDownloadPDF={() => {
          alert('Use Print > Save as PDF');
          window.print();
        }}
      />
    </div>
  );
}
```

---

### Example 3: Custom Invoice Statistics

**Create custom endpoint:**
```javascript
// In backend/routes/invoices_claude.js

router.get('/stats/custom', auth, checkRole('sales_manager'), async (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query;

    let query = {};
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }
    if (customerId) {
      query.customer = customerId;
    }

    const invoices = await Invoice.find(query);

    // Custom statistics
    const stats = {
      count: invoices.length,
      totalRevenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      avgInvoiceValue: invoices.length > 0
        ? invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / invoices.length
        : 0,
      highestInvoice: Math.max(...invoices.map(inv => inv.totalAmount), 0),
      lowestInvoice: Math.min(...invoices.map(inv => inv.totalAmount), 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Custom stats error:', error);
    res.status(500).json({ message: 'Error calculating statistics' });
  }
});
```

---

### Example 4: Email Invoice to Customer

**Create email utility:**
```javascript
// backend/utils/emailInvoice.js
const nodemailer = require('nodemailer');

async function emailInvoice(invoice, customerEmail) {
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const emailHtml = `
    <h2>Invoice ${invoice.invoiceNumber}</h2>
    <p>Dear ${invoice.customerInfo.name},</p>
    <p>Thank you for your purchase! Please find your invoice details below:</p>
    <table border="1" style="border-collapse: collapse; width: 100%;">
      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      ${invoice.items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td>$${item.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </table>
    <p><strong>Subtotal:</strong> $${invoice.subtotal.toFixed(2)}</p>
    <p><strong>Tax:</strong> $${invoice.tax.toFixed(2)}</p>
    <p><strong>Total:</strong> $${invoice.totalAmount.toFixed(2)}</p>
    <p>View full invoice: <a href="http://localhost:3000/invoices/${invoice._id}">Click here</a></p>
  `;

  await transporter.sendMail({
    from: 'noreply@aocomics.com',
    to: customerEmail,
    subject: `Invoice ${invoice.invoiceNumber} - AO Comics`,
    html: emailHtml
  });
}

module.exports = { emailInvoice };
```

**Usage:**
```javascript
const { emailInvoice } = require('../utils/emailInvoice');

// After creating invoice
try {
  await emailInvoice(invoice, user.email);
  console.log('📧 Invoice emailed successfully');
} catch (error) {
  console.error('Email failed:', error);
}
```

---

## Testing Scenarios

### Scenario 1: Basic Flow Test
```
1. Start backend: node backend/server_claude.js
2. Start frontend: npm start
3. Create test order as customer
4. Create invoice via Postman/API
5. Log in as Sales Manager
6. View invoices for today
7. Verify invoice appears
8. Click "View" on invoice
9. Verify all details correct
10. Test print functionality
```

### Scenario 2: Date Range Test
```
Test Cases:
1. Same start and end date → Should show invoices from that day only
2. Wide date range (1 year) → Should show all invoices in range
3. Future dates → Should return empty array
4. Invalid date format → Should handle gracefully
5. No dates provided → Should return all invoices (or error)
```

### Scenario 3: Authorization Test
```
Test Cases:
1. No token → 401 Unauthorized
2. Invalid token → 401 Unauthorized
3. Expired token → 401 Unauthorized
4. Customer role → 403 Forbidden (for sales endpoints)
5. Sales Manager role → 200 Success
6. Product Manager role → 403 Forbidden
```

### Scenario 4: Data Validation Test
```
Test Cases:
1. Create invoice with invalid orderId → 404 Not Found
2. Create duplicate invoice → 400 Bad Request (invoice exists)
3. Create invoice for cancelled order → Should succeed (or add validation)
4. Get invoice with invalid ID → 404 Not Found
5. Update status with invalid status → 400 Bad Request
```

### Scenario 5: Edge Cases
```
Test Cases:
1. Order with 0 items → Should fail (order validation)
2. Order with negative price → Should fail (order validation)
3. Invoice with empty items → Should fail (schema validation)
4. Very large order (100+ items) → Should handle gracefully
5. Special characters in customer name → Should escape properly
```

---

## Performance Testing

### Load Test Example
```javascript
// Using artillery or similar tool
// artillery.yml

config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10  # 10 requests per second

scenarios:
  - name: Get Invoices
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'salesmanager@aocomics.com'
            password: 'password123'
          capture:
            - json: '$.token'
              as: 'token'
      - get:
          url: '/api/invoices?startDate=2024-01-01&endDate=2024-12-31'
          headers:
            Authorization: 'Bearer {{ token }}'
```

Run: `artillery run artillery.yml`

---

## Troubleshooting Guide

### Issue: Invoice not appearing
**Possible Causes:**
1. Date range doesn't include invoice date
2. Invoice wasn't created successfully
3. Database connection issue

**Debug Steps:**
```javascript
// Check if invoice exists
db.invoices_claudes.find({ order: ObjectId("ORDER_ID") })

// Check invoice date
db.invoices_claudes.find({}).sort({ invoiceDate: -1 }).limit(5)

// Check server logs
console.log('Invoice date:', invoice.invoiceDate);
console.log('Query range:', startDate, endDate);
```

---

### Issue: Calculation mismatch
**Verify:**
1. Subtotal = sum of all item totals
2. Tax = subtotal * 0.18
3. Total = subtotal + tax (- discount if applicable)

**Debug:**
```javascript
console.log('Items:', items);
console.log('Subtotal:', subtotal);
console.log('Tax rate:', 0.18);
console.log('Tax amount:', tax);
console.log('Total:', totalAmount);
```

---

This comprehensive guide covers all major use cases and examples for the invoice system! 🎯
