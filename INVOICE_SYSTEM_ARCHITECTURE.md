# Invoice System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         INVOICE SYSTEM                          │
│                     AO Comics E-Commerce                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │◄────────┤   Backend    │◄────────┤   Database   │
│    React     │  HTTP   │   Node.js    │  Query  │   MongoDB    │
└──────────────┘         └──────────────┘         └──────────────┘
```

---

## Component Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                          FRONTEND                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │         SalesManager_claude.jsx                       │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  Date Filter Section                        │     │    │
│  │  │  - Start Date Input                          │     │    │
│  │  │  - End Date Input                            │     │    │
│  │  │  - "Get Invoices" Button                     │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  Invoice Statistics Cards                    │     │    │
│  │  │  - Total Invoices                            │     │    │
│  │  │  - Total Revenue                             │     │    │
│  │  │  - Total Tax                                 │     │    │
│  │  │  - Paid/Cancelled Count                      │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  Invoice Table                               │     │    │
│  │  │  ┌──────────────────────────────────────┐   │     │    │
│  │  │  │ Invoice# │ Date │ Customer │ Actions │   │     │    │
│  │  │  ├──────────────────────────────────────┤   │     │    │
│  │  │  │ INV-123  │ Jan 10│ John Doe │ [View] │   │     │    │
│  │  │  │ INV-124  │ Jan 10│ Jane Doe │ [View] │   │     │    │
│  │  │  └──────────────────────────────────────┘   │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  Modal: Invoice Detail                       │     │    │
│  │  │  ┌───────────────────────────────────────┐  │     │    │
│  │  │  │  InvoiceDetail_claude Component       │  │     │    │
│  │  │  │  - Header (Invoice #, Date, Status)   │  │     │    │
│  │  │  │  - Company Info                        │  │     │    │
│  │  │  │  - Customer Info                       │  │     │    │
│  │  │  │  - Items Table                         │  │     │    │
│  │  │  │  - Totals (Subtotal, Tax, Total)      │  │     │    │
│  │  │  │  - Actions (Print, PDF)                │  │     │    │
│  │  │  └───────────────────────────────────────┘  │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls (Axios)
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                          BACKEND                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │         server_claude.js                              │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  Route Mounting                              │     │    │
│  │  │  app.use('/api/invoices', invoiceRoutes)    │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            ▼                                    │
│  ┌───────────────────────────────────────────────────────┐    │
│  │         invoices_claude.js (Routes)                   │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  POST   /api/invoices                       │     │    │
│  │  │  GET    /api/invoices                       │     │    │
│  │  │  GET    /api/invoices/:id                   │     │    │
│  │  │  GET    /api/invoices/order/:orderId        │     │    │
│  │  │  PATCH  /api/invoices/:id/status            │     │    │
│  │  │  GET    /api/invoices/stats/summary         │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                            │                           │    │
│  │                 ┌──────────┴────────────┐             │    │
│  │                 ▼                       ▼             │    │
│  │  ┌────────────────────┐    ┌──────────────────────┐  │    │
│  │  │  Authentication    │    │  Authorization       │  │    │
│  │  │  Middleware        │    │  (Sales Manager)     │  │    │
│  │  └────────────────────┘    └──────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            ▼                                    │
│  ┌───────────────────────────────────────────────────────┐    │
│  │         Invoice_claude.js (Model)                     │    │
│  │  ┌─────────────────────────────────────────────┐     │    │
│  │  │  Mongoose Schema                             │     │    │
│  │  │  - invoiceNumber (auto-generated)            │     │    │
│  │  │  - order (ref)                               │     │    │
│  │  │  - customer (ref)                            │     │    │
│  │  │  - customerInfo (embedded)                   │     │    │
│  │  │  - items (array)                             │     │    │
│  │  │  - totals (subtotal, tax, total)             │     │    │
│  │  │  - status (enum)                             │     │    │
│  │  │  - timestamps                                │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                            │
                            │ Mongoose Query
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                         DATABASE                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │         MongoDB Collections                           │    │
│  │                                                        │    │
│  │  ┌──────────────────┐                                 │    │
│  │  │  invoices_claude │                                 │    │
│  │  │  ┌────────────┐  │                                 │    │
│  │  │  │ Invoice 1  │  │                                 │    │
│  │  │  │ Invoice 2  │  │                                 │    │
│  │  │  │ Invoice 3  │  │                                 │    │
│  │  │  │    ...     │  │                                 │    │
│  │  │  └────────────┘  │                                 │    │
│  │  └──────────────────┘                                 │    │
│  │           │                                            │    │
│  │           │ References                                 │    │
│  │           │                                            │    │
│  │  ┌────────┼──────────┬──────────────┐                 │    │
│  │  ▼        ▼          ▼              ▼                 │    │
│  │  orders  users    products                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 1. Create Invoice Flow

```
┌─────────────┐
│   Order     │ (Created by customer)
│  Created    │
└─────┬───────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  POST /api/invoices                             │
│  {                                              │
│    "orderId": "67a123..."                       │
│  }                                              │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Backend: invoices_claude.js                    │
│  1. Check if invoice exists                     │
│  2. Fetch order data                            │
│  3. Populate order items and user info          │
│  4. Calculate totals                            │
│     - Subtotal = sum of item totals             │
│     - Tax = subtotal * 0.18                     │
│     - Total = subtotal + tax                    │
│  5. Create invoice document                     │
│  6. Auto-generate invoice number                │
│  7. Save to database                            │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  MongoDB                                        │
│  Invoice saved in invoices_claude collection    │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Response                                       │
│  {                                              │
│    "message": "Invoice created successfully",   │
│    "invoice": { ... }                           │
│  }                                              │
└─────────────────────────────────────────────────┘
```

### 2. View Invoices Flow

```
┌─────────────┐
│ Sales Mgr   │ (Selects date range)
│ Dashboard   │
└─────┬───────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  GET /api/invoices?startDate=...&endDate=...    │
│  Authorization: Bearer <token>                  │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Backend: invoices_claude.js                    │
│  1. Verify authentication                       │
│  2. Check role = sales_manager                  │
│  3. Parse date range                            │
│  4. Query database with date filter             │
│  5. Populate customer and order refs            │
│  6. Sort by date (newest first)                 │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  MongoDB                                        │
│  Find invoices where:                           │
│    invoiceDate >= startDate AND                 │
│    invoiceDate <= endDate                       │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Response: Array of invoices                    │
│  [                                              │
│    { invoiceNumber, date, customer, total },    │
│    { invoiceNumber, date, customer, total },    │
│    ...                                          │
│  ]                                              │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Frontend: SalesManager_claude.jsx              │
│  1. Update invoices state                       │
│  2. Fetch statistics                            │
│  3. Render invoice table                        │
│  4. Display statistics cards                    │
└─────────────────────────────────────────────────┘
```

### 3. View Invoice Detail Flow

```
┌─────────────┐
│   User      │ (Clicks "View" button)
│   Clicks    │
└─────┬───────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  GET /api/invoices/:id                          │
│  Authorization: Bearer <token>                  │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Backend: invoices_claude.js                    │
│  1. Verify authentication                       │
│  2. Find invoice by ID                          │
│  3. Populate all references:                    │
│     - customer details                          │
│     - order details                             │
│     - product details                           │
│  4. Check authorization                         │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Response: Full invoice object                  │
│  {                                              │
│    invoiceNumber, date, status,                 │
│    customerInfo: { name, email, address },      │
│    items: [{ name, qty, price, total }],        │
│    subtotal, tax, totalAmount                   │
│  }                                              │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  Frontend: SalesManager_claude.jsx              │
│  1. Set selectedInvoice state                   │
│  2. Set showInvoiceDetail = true                │
│  3. Open modal                                  │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│  InvoiceDetail_claude Component                 │
│  Renders:                                       │
│  - Invoice header with number and status        │
│  - Company information                          │
│  - Customer billing information                 │
│  - Itemized list of products                    │
│  - Calculations (subtotal, tax, total)          │
│  - Print and PDF buttons                        │
└─────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Security Layers                        │
└──────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  Layer 1: Authentication                       │
│  ┌──────────────────────────────────────────┐  │
│  │  JWT Token Verification                  │  │
│  │  - Token in Authorization header         │  │
│  │  - Token signature validation            │  │
│  │  - Token expiration check                │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
                    ▼
┌────────────────────────────────────────────────┐
│  Layer 2: Authorization (Role Check)           │
│  ┌──────────────────────────────────────────┐  │
│  │  checkRole('sales_manager')              │  │
│  │  - Extract role from token payload       │  │
│  │  - Compare with required role            │  │
│  │  - Reject if unauthorized                │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
                    ▼
┌────────────────────────────────────────────────┐
│  Layer 3: Data Access Control                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Check Ownership                         │  │
│  │  - Sales Manager: access all            │  │
│  │  - Customer: only own invoices          │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
                    ▼
┌────────────────────────────────────────────────┐
│  Layer 4: Input Validation                     │
│  ┌──────────────────────────────────────────┐  │
│  │  Validate Request Data                   │  │
│  │  - Check required fields                 │  │
│  │  - Validate data types                   │  │
│  │  - Sanitize inputs                       │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
                    ▼
┌────────────────────────────────────────────────┐
│  Layer 5: Database Security                    │
│  ┌──────────────────────────────────────────┐  │
│  │  Mongoose Validation                     │  │
│  │  - Schema validation                     │  │
│  │  - Required fields enforcement           │  │
│  │  - Unique constraints                    │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## State Management

```
┌──────────────────────────────────────────────────────────┐
│         SalesManager_claude Component State              │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Local State (useState)                                 │
│                                                          │
│  products: []              ← Product list               │
│  selectedProducts: []      ← Selected for discount      │
│  discount: 0               ← Discount percentage        │
│  startDate: ''             ← Filter start date          │
│  endDate: ''               ← Filter end date            │
│  analytics: null           ← Revenue/profit data        │
│  detailedMetrics: null     ← Charts data                │
│  invoices: []              ← Invoice list               │
│  invoiceStats: null        ← Invoice statistics         │
│  selectedInvoice: null     ← Currently viewed invoice   │
│  showInvoiceDetail: false  ← Modal visibility           │
└─────────────────────────────────────────────────────────┘
                            │
                            │ State Updates
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Component Re-render Triggers                           │
│                                                          │
│  1. fetchProducts() → updates products                  │
│  2. getAnalytics() → updates analytics                  │
│  3. getInvoices() → updates invoices & invoiceStats     │
│  4. viewInvoiceDetail() → updates selectedInvoice       │
│  5. Date changes → updates startDate/endDate            │
└─────────────────────────────────────────────────────────┘
```

---

## File Dependencies

```
┌─────────────────────────────────────────────────────┐
│              Backend Dependencies                   │
└─────────────────────────────────────────────────────┘

server_claude.js
    ├── requires: express
    ├── requires: ./routes/invoices_claude
    └── requires: ./config/db

invoices_claude.js (routes)
    ├── requires: express
    ├── requires: ../models/Invoice_claude
    ├── requires: ../models/Order
    ├── requires: ../models/User
    ├── requires: ../middleware/auth
    └── requires: ../middleware/roleAuth

Invoice_claude.js (model)
    └── requires: mongoose

┌─────────────────────────────────────────────────────┐
│              Frontend Dependencies                  │
└─────────────────────────────────────────────────────┘

SalesManager_claude.jsx
    ├── requires: react
    ├── requires: axios
    ├── requires: recharts (Bar, Pie charts)
    ├── requires: ./SalesManager_claude.css
    └── requires: ../Invoice/InvoiceDetail_claude

InvoiceDetail_claude.jsx
    ├── requires: react
    └── requires: ./InvoiceDetail_claude.css
```

---

## API Request/Response Examples

### Example 1: Create Invoice

**Request:**
```http
POST /api/invoices HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "orderId": "67a1234567890abcdef12345"
}
```

**Response:**
```json
{
  "message": "Invoice created successfully",
  "invoice": {
    "_id": "67a9876543210fedcba98765",
    "invoiceNumber": "INV-1736547820123-1",
    "order": "67a1234567890abcdef12345",
    "customer": "67a1111111111111111111111",
    "customerInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "address": "123 Main St, Istanbul",
      "taxID": ""
    },
    "items": [
      {
        "product": "67a2222222222222222222222",
        "name": "Product 1",
        "quantity": 2,
        "price": 29.99,
        "total": 59.98
      }
    ],
    "subtotal": 59.98,
    "discount": 0,
    "tax": 10.80,
    "totalAmount": 70.78,
    "invoiceDate": "2024-01-10T12:00:00.000Z",
    "status": "paid",
    "createdAt": "2024-01-10T12:00:00.000Z",
    "updatedAt": "2024-01-10T12:00:00.000Z"
  }
}
```

### Example 2: Get Invoices

**Request:**
```http
GET /api/invoices?startDate=2024-01-01&endDate=2024-01-31 HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
[
  {
    "_id": "67a9876543210fedcba98765",
    "invoiceNumber": "INV-1736547820123-1",
    "customer": {
      "_id": "67a1111111111111111111111",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "items": [...],
    "subtotal": 59.98,
    "tax": 10.80,
    "totalAmount": 70.78,
    "invoiceDate": "2024-01-10T12:00:00.000Z",
    "status": "paid"
  },
  ...
]
```

---

## Performance Considerations

```
┌──────────────────────────────────────────────────────┐
│              Optimization Strategies                 │
└──────────────────────────────────────────────────────┘

1. Database Queries
   ├── Indexes on: invoiceDate, customer, order
   ├── Populate only necessary fields
   ├── Use select() to limit returned fields
   └── Pagination for large result sets (future)

2. Frontend Performance
   ├── useState for local state (not global)
   ├── Conditional rendering (only show what's needed)
   ├── Modal lazy loading
   └── CSS optimizations (print media queries)

3. API Efficiency
   ├── Single endpoint for date range filtering
   ├── Combined statistics query
   ├── Reuse existing authentication middleware
   └── Error handling without redundant queries

4. Caching (Future Enhancement)
   ├── Cache invoice statistics
   ├── Cache frequently accessed invoices
   └── Invalidate on create/update
```

---

This architecture provides a **scalable, maintainable, and secure** invoice management system! 🎯
