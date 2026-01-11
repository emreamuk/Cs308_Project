# Invoice Integration Guide

## Quick Start: Auto-Create Invoices on Order Placement

This guide shows how to automatically create invoices when customers place orders.

---

## Step 1: Update Order Routes

Create a new file `backend/routes/orders_claude.js` (copy from `orders.js`):

### Add this code after the order is saved (around line 65):

```javascript
// ... existing order creation code ...
const order = new Order({
  user: req.user.id,
  orderItems: validatedItems,
  totalPrice,
  deliveryAddress,
  status: 'processing'
});

await order.save();

// ✅ NEW: AUTO-CREATE INVOICE
try {
  const Invoice = require('../models/Invoice_claude');
  const user = await User.findById(req.user.id);

  // Calculate invoice items
  const invoiceItems = validatedItems.map(item => ({
    product: item.product,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    total: item.quantity * item.price
  }));

  // Calculate totals
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.18; // 18% VAT (adjust as needed)
  const totalAmount = subtotal + tax;

  // Create invoice
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
    discount: 0,
    tax,
    totalAmount,
    invoiceDate: order.createdAt,
    status: 'paid',
    notes: ''
  });

  await invoice.save();
  console.log(`✅ Invoice created: ${invoice.invoiceNumber}`);

} catch (invoiceError) {
  // Don't fail the order if invoice creation fails
  console.error('⚠️ Invoice creation failed (order still created):', invoiceError);
}

// ... continue with email sending and response ...
```

---

## Step 2: Update Server Configuration

In `backend/server_claude.js`, update the orders route:

```javascript
// Change this line:
const orderRoutes = require('./routes/orders');

// To this:
const orderRoutes = require('./routes/orders_claude');
```

---

## Step 3: Test the Integration

### 1. Start the server
```bash
cd backend
node server_claude.js
```

### 2. Place a test order
- Log in as a customer
- Add items to cart
- Complete checkout
- Watch console for: `✅ Invoice created: INV-...`

### 3. View the invoice
- Log in as Sales Manager
- Go to Sales Manager dashboard
- Select date range (today's date)
- Click "Get Invoices"
- You should see the invoice for the order you just placed

---

## Alternative: Manual Invoice Creation

If you prefer to create invoices manually (not automatically), use this API call:

### Using Postman/Insomnia:

```http
POST http://localhost:5000/api/invoices
Authorization: Bearer <sales_manager_token>
Content-Type: application/json

{
  "orderId": "67a1234567890abcdef12345"
}
```

### Using curl:

```bash
curl -X POST http://localhost:5000/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "67a1234567890abcdef12345"}'
```

### Using the Frontend (create a utility function):

```javascript
// In a utility file or service
import API from '../services/api';

export const createInvoiceForOrder = async (orderId) => {
  try {
    const response = await API.post('/invoices', { orderId });
    console.log('Invoice created:', response.data.invoice.invoiceNumber);
    return response.data.invoice;
  } catch (error) {
    console.error('Failed to create invoice:', error);
    throw error;
  }
};

// Usage in a component:
import { createInvoiceForOrder } from '../utils/invoiceUtils';

// After order is placed:
const handleOrderPlaced = async (order) => {
  try {
    await createInvoiceForOrder(order._id);
    alert('Order placed and invoice created!');
  } catch (error) {
    // Order is still created, invoice creation failed
    alert('Order placed but invoice creation failed');
  }
};
```

---

## Invoice Number Format

Invoices are automatically assigned unique numbers in this format:

```
INV-{timestamp}-{sequential_number}
```

Example: `INV-1736547820123-1`

- `1736547820123` = Current timestamp
- `1` = Sequential number (1st invoice, 2nd invoice, etc.)

This ensures:
- ✅ Uniqueness
- ✅ Chronological ordering
- ✅ Easy identification
- ✅ No collisions

---

## Tax Calculation

Current implementation uses **18% VAT** (Turkish standard rate):

```javascript
const tax = subtotal * 0.18;
```

### To customize tax rate:

#### Option 1: Fixed rate for all products
```javascript
const TAX_RATE = 0.20; // 20%
const tax = subtotal * TAX_RATE;
```

#### Option 2: Per-product tax rates
```javascript
// Add taxRate to Product model
const invoiceItems = validatedItems.map(item => {
  const product = await Product.findById(item.product);
  return {
    product: item.product,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    total: item.quantity * item.price,
    taxRate: product.taxRate || 0.18
  };
});

// Calculate tax per item
const tax = invoiceItems.reduce((sum, item) => {
  return sum + (item.total * item.taxRate);
}, 0);
```

#### Option 3: No tax
```javascript
const tax = 0;
```

---

## Discount Handling

If you apply discounts in the order:

```javascript
// In order creation:
const orderTotal = 100.00;
const discountAmount = 10.00;
const finalTotal = orderTotal - discountAmount;

// In invoice creation:
const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
const discount = discountAmount; // Pass discount from order
const tax = (subtotal - discount) * 0.18; // Tax after discount
const totalAmount = subtotal - discount + tax;

const invoice = new Invoice({
  // ... other fields ...
  subtotal,
  discount,
  tax,
  totalAmount
});
```

---

## Error Handling

### Best Practices:

1. **Always wrap invoice creation in try-catch**
   - Don't let invoice errors fail the order
   - Log errors for debugging
   - Notify admins of failures

2. **Check for duplicate invoices**
   - The API already checks this
   - Returns existing invoice if found

3. **Validate order status**
   - Only create invoices for paid/processing orders
   - Don't create for cancelled orders

### Example with better error handling:

```javascript
try {
  // Check if invoice already exists
  const existingInvoice = await Invoice.findOne({ order: order._id });
  if (existingInvoice) {
    console.log(`📄 Invoice already exists: ${existingInvoice.invoiceNumber}`);
    return;
  }

  // Check order status
  if (order.status === 'cancelled') {
    console.log('⚠️ Order is cancelled, skipping invoice creation');
    return;
  }

  // Create invoice
  const invoice = new Invoice({...});
  await invoice.save();

  console.log(`✅ Invoice created: ${invoice.invoiceNumber}`);

  // Optional: Send invoice email
  // await sendInvoiceEmail(user.email, invoice);

} catch (error) {
  console.error('❌ Invoice creation failed:', error.message);

  // Optional: Log to error tracking service
  // errorTracker.log('invoice_creation_failed', { orderId: order._id, error });

  // Continue without failing the order
}
```

---

## Email Integration (Optional)

To email invoices to customers:

### 1. Create email template

```javascript
// backend/services/emailService.js

const sendInvoiceEmail = async (email, invoice) => {
  const transporter = nodemailer.createTransporter({...});

  const mailOptions = {
    from: 'noreply@aocomics.com',
    to: email,
    subject: `Invoice ${invoice.invoiceNumber} - AO Comics`,
    html: `
      <h2>Thank you for your purchase!</h2>
      <p>Your invoice number: <strong>${invoice.invoiceNumber}</strong></p>
      <p>Total Amount: <strong>$${invoice.totalAmount.toFixed(2)}</strong></p>
      <p>View your invoice at: <a href="http://localhost:3000/invoices/${invoice._id}">Click here</a></p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOrderConfirmation, sendInvoiceEmail };
```

### 2. Call in order creation

```javascript
const { sendOrderConfirmation, sendInvoiceEmail } = require('../services/emailService');

// After invoice creation:
try {
  await sendInvoiceEmail(user.email, invoice);
  console.log(`📧 Invoice email sent to ${user.email}`);
} catch (emailError) {
  console.error('Email failed:', emailError);
}
```

---

## Customer Invoice View (Optional)

To let customers view their own invoices:

### 1. Create route

```javascript
// In App.js
import InvoiceDetail_claude from './Components/Pages/Invoice/InvoiceDetail_claude';

<Route path="/my-invoices/:invoiceId" element={<CustomerInvoiceView />} />
```

### 2. Create component

```javascript
// src/Components/Pages/CustomerInvoiceView.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API from '../../services/api';
import InvoiceDetail_claude from './Invoice/InvoiceDetail_claude';

const CustomerInvoiceView = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      const response = await API.get(`/invoices/${invoiceId}`);
      setInvoice(response.data);
    };
    fetchInvoice();
  }, [invoiceId]);

  if (!invoice) return <div>Loading...</div>;

  return <InvoiceDetail_claude invoice={invoice} />;
};

export default CustomerInvoiceView;
```

---

## Summary Checklist

To integrate invoices with orders:

- [ ] Create `backend/routes/orders_claude.js` with invoice creation code
- [ ] Update `backend/server_claude.js` to use new orders route
- [ ] Start server with `node server_claude.js`
- [ ] Test by placing an order
- [ ] Verify invoice appears in Sales Manager dashboard
- [ ] Test print/PDF functionality
- [ ] (Optional) Add email notifications
- [ ] (Optional) Add customer invoice view

---

## Quick Test Commands

```bash
# 1. Start backend
cd backend
node server_claude.js

# 2. In another terminal, start frontend
cd ..
npm start

# 3. Test the flow:
# - Place an order as customer
# - Log in as sales_manager
# - Go to /sales-manager-claude
# - Select today's date range
# - Click "Get Invoices"
# - Click "View" on the invoice
# - Test print functionality
```

---

That's it! You now have a complete, integrated invoice system. 🎉
