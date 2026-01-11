# Bug Reports - AO Comics E-Commerce Platform
## Based on CS 308 Requirements 11-18

---

## Bug Report #1: Revenue Chart Not Displaying Between Selected Date Range

**Bug ID:** BUG-001  
**Severity:** High  
**Priority:** High  
**Status:** Open  
**Reporter:** Sales Manager  
**Date Reported:** January 11, 2026  
**Component:** Sales Manager Dashboard / Revenue Analysis  
**Requirement:** CS 308 Requirement 11 (8% grade)

### Description
Sales Managers are unable to view the revenue and profit/loss chart between selected dates. When a date range is selected and "Generate Chart" is clicked, the chart component fails to render or shows "No data available" even when orders exist in that date range.

### CS 308 Requirement Reference
**Requirement 11:** "They shall calculate the revenue and loss/profit between given dates and view a chart of it. For loss and profit calculations, the product cost can default to 50% of the sale price for convenience, or it can be specified by the product manager when adding the product."

### Steps to Reproduce
1. Login as Sales Manager
2. Navigate to "Revenue Analysis" or "Sales Dashboard"
3. Select date range: Start Date = January 1, 2026, End Date = January 10, 2026
4. Click "Generate Chart" or "Calculate Revenue"
5. Observe the chart area - either blank or shows error
6. Check browser console for errors
7. Verify database has orders in this date range (orders exist)

### Expected Behavior
- Chart should display revenue and profit/loss data for the selected date range
- X-axis: Dates within the selected range
- Y-axis: Revenue/profit amounts in dollars
- Two lines/bars should be visible:
  - **Revenue** (total sales)
  - **Profit** (revenue - costs)
- Cost calculation: Either product.cost OR 50% of sale price as default
- Chart should be interactive (tooltips showing exact values)
- Display total revenue and total profit summary

**Example Chart:**
```
Revenue & Profit Analysis (Jan 1-10, 2026)

Revenue: $5,450.00
Costs: $2,725.00
Profit: $2,725.00

[Line Chart showing daily revenue and profit]
```

### Actual Behavior
- Chart container displays "No data available"
- OR chart component fails to render entirely
- OR JavaScript error in console: "Cannot read property 'map' of undefined"
- Revenue calculation may work but chart visualization fails
- Date filter may not be applied to database query

### Environment
- Backend: Node.js 20.x
- Frontend: React 18.2.0 with Recharts library
- Component: SalesManager.jsx, Revenue chart component
- Database: MongoDB

### Root Cause (Suspected)
Possible issues:
1. Date range query not filtering orders correctly
2. Chart library not receiving data in correct format
3. Profit calculation missing (not subtracting costs)
4. Frontend state not updating after API call
5. Product cost field missing from database

**Current Implementation (Suspected):**
```javascript
// Backend - Missing cost calculation
router.get('/revenue', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const orders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  const revenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  
  // ❌ Missing: Cost calculation and profit
  // ❌ Missing: Daily breakdown for chart
  
  res.json({ revenue });
});
```

### Suggested Fix

**Backend - Calculate revenue and profit with daily breakdown:**
```javascript
// backend/routes/salesManager.js
router.get('/revenue-chart', auth, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Verify user is sales_manager
  const user = await User.findById(req.user.id);
  if (user.role !== 'sales_manager') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  // Get all orders in date range
  const orders = await Order.find({
    createdAt: { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    },
    status: { $ne: 'cancelled' }  // Exclude cancelled orders
  }).populate('orderItems.product');
  
  // Calculate daily revenue and profit
  const dailyData = {};
  let totalRevenue = 0;
  let totalCost = 0;
  
  for (const order of orders) {
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    
    if (!dailyData[orderDate]) {
      dailyData[orderDate] = { revenue: 0, cost: 0, profit: 0 };
    }
    
    // Calculate order cost
    let orderCost = 0;
    for (const item of order.orderItems) {
      const product = item.product;
      // Use product cost if available, otherwise default to 50% of sale price
      const itemCost = product.cost || (item.price * 0.5);
      orderCost += itemCost * item.quantity;
    }
    
    dailyData[orderDate].revenue += order.totalPrice;
    dailyData[orderDate].cost += orderCost;
    dailyData[orderDate].profit = dailyData[orderDate].revenue - dailyData[orderDate].cost;
    
    totalRevenue += order.totalPrice;
    totalCost += orderCost;
  }
  
  // Convert to array format for chart
  const chartData = Object.keys(dailyData).sort().map(date => ({
    date,
    revenue: dailyData[date].revenue,
    cost: dailyData[date].cost,
    profit: dailyData[date].profit
  }));
  
  res.json({
    chartData,
    summary: {
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost
    }
  });
});
```

**Frontend - Render chart with Recharts:**
```javascript
// SalesManager.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const [chartData, setChartData] = useState([]);
const [summary, setSummary] = useState(null);

const fetchRevenueChart = async () => {
  const response = await API.get('/sales-manager/revenue-chart', {
    params: { startDate, endDate }
  });
  setChartData(response.data.chartData);
  setSummary(response.data.summary);
};

// In JSX:
<div className="chart-container">
  <h3>Revenue & Profit Analysis</h3>
  
  {summary && (
    <div className="summary-cards">
      <div className="card">
        <h4>Total Revenue</h4>
        <p>${summary.totalRevenue.toFixed(2)}</p>
      </div>
      <div className="card">
        <h4>Total Cost</h4>
        <p>${summary.totalCost.toFixed(2)}</p>
      </div>
      <div className="card">
        <h4>Total Profit</h4>
        <p>${summary.totalProfit.toFixed(2)}</p>
      </div>
    </div>
  )}
  
  <LineChart width={800} height={400} data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="revenue" stroke="#ff4141" name="Revenue" />
    <Line type="monotone" dataKey="profit" stroke="#4CAF50" name="Profit" />
  </LineChart>
</div>
```

### Testing Steps
1. Add product cost field to Product model (optional, defaults to 50%)
2. Create test orders across multiple dates
3. Login as Sales Manager
4. Select date range that includes test orders
5. Verify chart displays with correct data
6. Verify summary calculations are accurate
7. Test edge cases: no orders, single day, long date range

### Impact
**High - Affects 8% of Grade:**
- Core Sales Manager functionality missing
- Required feature per CS 308 Requirement 11
- Cannot track business performance
- Prevents financial analysis and decision-making

---

## Bug Report #2: Order Cancellation Allowed After Status Changed to "In-Transit"

**Bug ID:** BUG-002  
**Severity:** High  
**Priority:** Critical  
**Status:** Open  
**Reporter:** Product Manager  
**Date Reported:** January 11, 2026  
**Component:** Customer Orders / Order Cancellation  
**Requirement:** CS 308 Requirement 14 (8% grade)

### Description
Customers are able to cancel orders even after the status has been changed to "in-transit" or "delivered". According to CS 308 requirements, orders should only be cancellable when in "processing" status.

### CS 308 Requirement Reference
**Requirement 14:** "An order can only be cancelled if it is in 'processing' status; similarly, it can only be refunded if it is in 'delivered' status."

### Steps to Reproduce
1. Login as Customer
2. Place an order (Order #12345)
3. Order status is "processing"
4. Product Manager changes status to "in-transit"
5. Customer navigates to Orders page
6. Click on Order #12345
7. "Cancel Order" button is still visible and clickable
8. Click "Cancel Order"
9. Order is successfully cancelled
10. Check database - order status changed to "cancelled"

### Expected Behavior
**Business Rule:** Orders can ONLY be cancelled if status = "processing"

- If order status = "processing": Show "Cancel Order" button
- If order status = "in-transit": Hide "Cancel Order" button OR show disabled with tooltip "Cannot cancel - order in transit"
- If order status = "delivered": Hide "Cancel Order" button, show "Return Product" button instead
- If order status = "cancelled": Hide all action buttons

**Validation:**
- Backend should reject cancellation request if status ≠ "processing"
- Return error: "Order cannot be cancelled. Current status: in-transit"

### Actual Behavior
- "Cancel Order" button visible regardless of status
- Backend accepts cancellation request without status validation
- Customer can cancel orders that are already shipped
- Product Manager cannot fulfill delivery because order was cancelled post-shipment
- Stock inconsistencies (product shipped but also back in stock)

### Environment
- Backend: Node.js 20.x
- Frontend: React 18.2.0
- Component: Orders.jsx, backend/routes/orders.js
- Database: MongoDB

### Root Cause
Missing status validation in both frontend and backend:

**Current Implementation:**
```javascript
// Backend - No status validation
router.delete('/:id/cancel', auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  // ❌ Missing: Status validation
  
  order.status = 'cancelled';
  await order.save();
  
  res.json({ message: 'Order cancelled' });
});
```

### Suggested Fix

**Backend - Add status validation:**
```javascript
// backend/routes/orders.js
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify user owns this order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // ✅ Validate status - ONLY processing orders can be cancelled
    if (order.status !== 'processing') {
      return res.status(400).json({ 
        message: `Cannot cancel order. Order is already ${order.status}.`,
        currentStatus: order.status
      });
    }
    
    // Update status to cancelled
    order.status = 'cancelled';
    await order.save();
    
    // Restore stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { quantityInStock: item.quantity } }
      );
    }
    
    res.json({ 
      message: 'Order cancelled successfully',
      order 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
```

**Frontend - Conditional button rendering:**
```javascript
// Orders.jsx or OrderDetails.jsx
const canCancelOrder = (order) => {
  return order.status === 'processing';
};

const canReturnOrder = (order) => {
  return order.status === 'delivered';
};

// In JSX:
{canCancelOrder(order) && (
  <button onClick={() => handleCancelOrder(order._id)} className="cancel-btn">
    Cancel Order
  </button>
)}

{!canCancelOrder(order) && order.status === 'in-transit' && (
  <button disabled className="cancel-btn-disabled" title="Cannot cancel - order in transit">
    Cancel Order
  </button>
)}

{canReturnOrder(order) && (
  <button onClick={() => handleReturnOrder(order._id)} className="return-btn">
    Return Product
  </button>
)}
```

### Testing Steps
1. Create order as customer (status: processing)
2. Verify "Cancel Order" button is visible and works
3. Change status to "in-transit" as Product Manager
4. Refresh Orders page as customer
5. Verify "Cancel Order" button is hidden/disabled
6. Attempt to cancel via API - should return 400 error
7. Test all statuses: processing, in-transit, delivered, cancelled

### Impact
**Critical Business Impact:**
- Violates CS 308 Requirement 14 (8% grade deduction)
- Financial loss (products shipped but refunded)
- Inventory inconsistency (stock count incorrect)
- Delivery confusion (cancelled orders still being delivered)
- Customer service issues

### Related Test Cases
- Test Case 1: Cancel processing order ✓ Should work
- Test Case 2: Cancel in-transit order ✗ Should fail
- Test Case 3: Cancel delivered order ✗ Should fail  
- Test Case 4: Return delivered order ✓ Should work (different feature)

---

## Bug Report #3: Support Agent Chat Does Not Show Customer Context When Logged In

**Bug ID:** BUG-003  
**Severity:** High  
**Priority:** High  
**Status:** Open  
**Reporter:** Support Agent  
**Date Reported:** January 11, 2026  
**Component:** Support Agent Dashboard / Live Chat System  
**Requirement:** CS 308 Requirement 13 (13% grade)

### Description
When a logged-in customer initiates a support chat, the support agent's interface does not display the customer's profile information, cart contents, or order history. The chat system works for communication but lacks the contextual customer information required by CS 308 Requirement 13.

### CS 308 Requirement Reference
**Requirement 13:** "If logged in, their profile, cart contents, and order history shall be automatically linked to the chat for context... They should be able to access relevant customer details (previous orders, delivery status, wish list items) if the customer is logged in."

### Steps to Reproduce
1. **As Customer (Logged In):**
   - Login as customer (email: john@test.com)
   - Add 3 items to cart
   - Have 2 previous orders in history
   - Click "Chat with Support" button
   - Send message: "I need help with my order"

2. **As Support Agent:**
   - Login as support agent
   - See new chat notification from john@test.com
   - Claim the conversation
   - View chat interface
   - Look for customer context panel/section
   - **Observe:** No customer information displayed

### Expected Behavior
When support agent opens a chat with a logged-in customer, the interface should display:

**Customer Context Panel:**
```
┌─────────────────────────────────┐
│ Customer Information            │
├─────────────────────────────────┤
│ Name: John Doe                  │
│ Email: john@test.com            │
│ Customer ID: #12345             │
│ Member Since: Jan 2025          │
├─────────────────────────────────┤
│ Current Cart (3 items)          │
│ - Batman Year One ($14.99)      │
│ - Superman: Red Son ($16.99)    │
│ - Watchmen ($19.99)             │
│ Cart Total: $51.97              │
├─────────────────────────────────┤
│ Recent Orders (2)               │
│ Order #89432 - Delivered        │
│   Date: Jan 5, 2026             │
│   Total: $45.99                 │
│                                 │
│ Order #87621 - In Transit       │
│   Date: Jan 8, 2026             │
│   Total: $32.50                 │
├─────────────────────────────────┤
│ Wishlist (5 items)              │
│ - The Dark Knight Returns       │
│ - V for Vendetta                │
│ ...                             │
└─────────────────────────────────┘
```

### Actual Behavior
- Chat conversation displays correctly
- Messages are sent/received in real-time
- **Customer context panel is EMPTY or missing**
- Agent cannot see cart contents
- Agent cannot see order history
- Agent has no context about customer's situation
- Agent must manually ask for all details

**Current UI:**
```
┌─────────────────────────────────┐
│ Chat with john@test.com         │
├─────────────────────────────────┤
│ [Chat messages appear here]     │
│                                 │
│ Customer: I need help with my   │
│ order                           │
│                                 │
│ Agent: Can you provide your     │
│ order number?                   │
│                                 │
│ [No customer context visible]   │
└─────────────────────────────────┘
```

### Environment
- Backend: Node.js 20.x with Socket.io
- Frontend: React 18.2.0
- Component: SupportAgent.jsx, backend/routes/chat.js
- Database: MongoDB

### Root Cause
The chat system creates conversations but doesn't fetch or link customer data:

**Current Implementation (Suspected):**
```javascript
// Backend - chat.js
socket.on('join-chat', async (data) => {
  const { userId, message } = data;
  
  const chat = new Chat({
    user: userId,
    messages: [{ sender: 'customer', text: message }]
  });
  
  await chat.save();
  
  // ❌ Missing: Fetch customer profile, cart, orders, wishlist
  
  io.emit('new-chat', chat);
});
```

### Suggested Fix

**Backend - Fetch customer context:**
```javascript
// backend/routes/chat.js or socket handler
socket.on('join-chat', async (data) => {
  const { userId, message } = data;
  
  // Create chat
  const chat = new Chat({
    user: userId,
    messages: [{ sender: 'customer', text: message }],
    status: 'active'
  });
  
  await chat.save();
  
  // ✅ Fetch customer context if user is logged in
  let customerContext = null;
  
  if (userId) {
    const user = await User.findById(userId)
      .populate('wishlist')
      .select('name email createdAt homeAddress');
    
    // Get cart
    const cart = await Cart.findOne({ user: userId })
      .populate('items.product');
    
    // Get recent orders (last 5)
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('orderItems.product');
    
    customerContext = {
      profile: {
        name: user.name,
        email: user.email,
        customerId: user._id,
        memberSince: user.createdAt,
        address: user.homeAddress
      },
      cart: cart ? {
        items: cart.items.map(item => ({
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        total: cart.items.reduce((sum, item) => 
          sum + (item.product.price * item.quantity), 0)
      } : null,
      orders: orders.map(order => ({
        orderId: order._id,
        status: order.status,
        date: order.createdAt,
        total: order.totalPrice,
        items: order.orderItems.length
      })),
      wishlist: user.wishlist.map(product => ({
        name: product.name,
        price: product.price
      }))
    };
  }
  
  // Emit to support agents with context
  io.to('support-agents').emit('new-chat', {
    chat,
    customerContext  // ✅ Include context
  });
});
```

**Frontend - Display customer context:**
```javascript
// SupportAgent.jsx
const CustomerContextPanel = ({ context }) => {
  if (!context) {
    return <div className="no-context">Guest user - no context available</div>;
  }
  
  return (
    <div className="customer-context-panel">
      {/* Profile Section */}
      <div className="context-section">
        <h4>👤 Customer Information</h4>
        <p><strong>Name:</strong> {context.profile.name}</p>
        <p><strong>Email:</strong> {context.profile.email}</p>
        <p><strong>ID:</strong> #{context.profile.customerId.slice(-8)}</p>
        <p><strong>Member Since:</strong> {new Date(context.profile.memberSince).toLocaleDateString()}</p>
      </div>
      
      {/* Cart Section */}
      {context.cart && context.cart.items.length > 0 && (
        <div className="context-section">
          <h4>🛒 Current Cart ({context.cart.items.length} items)</h4>
          {context.cart.items.map((item, idx) => (
            <div key={idx} className="cart-item">
              <span>{item.name}</span>
              <span>${item.price} x {item.quantity}</span>
            </div>
          ))}
          <p className="cart-total"><strong>Total: ${context.cart.total.toFixed(2)}</strong></p>
        </div>
      )}
      
      {/* Orders Section */}
      {context.orders && context.orders.length > 0 && (
        <div className="context-section">
          <h4>📦 Recent Orders ({context.orders.length})</h4>
          {context.orders.map((order, idx) => (
            <div key={idx} className="order-item">
              <p><strong>Order #{order.orderId.slice(-8)}</strong></p>
              <p>Status: <span className={`status-${order.status}`}>{order.status}</span></p>
              <p>Date: {new Date(order.date).toLocaleDateString()}</p>
              <p>Total: ${order.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Wishlist Section */}
      {context.wishlist && context.wishlist.length > 0 && (
        <div className="context-section">
          <h4>❤️ Wishlist ({context.wishlist.length} items)</h4>
          {context.wishlist.slice(0, 5).map((item, idx) => (
            <div key={idx} className="wishlist-item">
              <span>{item.name}</span>
              <span>${item.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// In main component:
<div className="chat-layout">
  <div className="chat-messages">
    {/* Chat messages */}
  </div>
  <div className="customer-sidebar">
    <CustomerContextPanel context={selectedChat.customerContext} />
  </div>
</div>
```

### Testing Steps
1. Create test customer with cart items and order history
2. Login as customer and initiate chat
3. Login as support agent in different browser
4. Claim the chat conversation
5. Verify customer context panel displays all information:
   - Profile details ✓
   - Cart contents ✓
   - Order history ✓
   - Wishlist items ✓
6. Test with guest user - should show "no context available"

### Impact
**High - Affects 13% of Grade:**
- Core requirement of support chat system (Requirement 13)
- Poor support agent experience
- Longer resolution times (agent must ask for details)
- Customer frustration (repeating information)
- Competitive disadvantage (inferior support)

---

## Bug Report #4: Refund Amount Incorrect When Product Was Purchased During Discount

**Bug ID:** BUG-004  
**Severity:** High  
**Priority:** High  
**Status:** Open  
**Reporter:** Sales Manager  
**Date Reported:** January 11, 2026  
**Component:** Product Returns / Refund Processing  
**Requirement:** CS 308 Requirement 16 (8% grade)

### Description
When a customer returns a product that was purchased during a discount campaign, the system refunds the full (original) price instead of the discounted price that was actually paid. This violates CS 308 Requirement 16 which states that the refunded amount should be "the same as the time of its purchase, with the discount applied."

### CS 308 Requirement Reference
**Requirement 16:** "Moreover, if the product was bought during a discount campaign and the customer chooses to return the product after the campaign ends, the refunded amount will be the same as the time of its purchase, with the discount applied."

### Steps to Reproduce
1. **Setup Discount:**
   - Login as Sales Manager
   - Set 30% discount on "Batman Year One" (Original: $19.99, Discounted: $13.99)
   
2. **Customer Purchase:**
   - Login as Customer
   - Purchase "Batman Year One" for $13.99 (discounted price)
   - Order total: $13.99
   - Payment processed successfully
   
3. **Discount Campaign Ends:**
   - Sales Manager removes discount
   - Product price returns to $19.99
   
4. **Customer Returns Product:**
   - Customer navigates to order history
   - Order status: "delivered"
   - Product delivered 10 days ago (within 30-day window)
   - Click "Return Product" for "Batman Year One"
   - Submit return request
   
5. **Sales Manager Approves Return:**
   - Login as Sales Manager
   - View refund requests
   - Approve return for "Batman Year One"
   - Check refund amount: Shows $19.99 (WRONG!)
   - Customer receives refund: $19.99
   
6. **Verify:**
   - Customer paid $13.99 but received $19.99 refund
   - Company lost $6.00 on this transaction

### Expected Behavior
**Business Rule:** Refund = Price paid at time of purchase (including any discounts)

- System should store the **actual price paid** in the order record
- When calculating refund, use `orderItem.pricePaid` NOT `product.currentPrice`
- Refund amount = Original purchase price (even if discount has ended)

**Example:**
```
Order Details:
- Product: Batman Year One
- Original Price: $19.99
- Discount: 30% OFF
- Price Paid: $13.99
- Date: Jan 1, 2026

Return Request (Jan 11, 2026):
- Current Product Price: $19.99 (discount ended)
- Refund Amount: $13.99 ← (Price paid, not current price)
```

### Actual Behavior
- Refund calculates using current product price
- Ignores historical purchase price
- Refunds more than customer paid (if discount ended)
- OR refunds less than customer paid (if new discount applied)
- Financial inconsistency

**Current Calculation:**
```javascript
// ❌ WRONG - Uses current product price
const refundAmount = product.price * quantity;
```

**Should be:**
```javascript
// ✅ CORRECT - Uses price paid at purchase
const refundAmount = orderItem.pricePaid * quantity;
```

### Environment
- Backend: Node.js 20.x
- Component: Return/Refund processing route
- Database: MongoDB

### Root Cause
Order schema doesn't store the actual price paid per item, or refund logic uses current product price instead of historical price.

**Current Order Schema (Missing field):**
```javascript
orderItems: [{
  product: ObjectId,
  name: String,
  quantity: Number,
  price: Number  // ❌ Ambiguous - is this original or discounted?
}]
```

### Suggested Fix

**Step 1: Ensure Order stores price paid:**
```javascript
// Order model already has this, but verify it's being used:
orderItems: [{
  product: { type: ObjectId, ref: 'Product' },
  name: String,
  quantity: Number,
  price: Number,  // This should be the ACTUAL PRICE PAID (including discount)
  originalPrice: Number,  // Optional: Store original price for reference
  discountApplied: Number  // Optional: Store discount percentage
}]
```

**Step 2: Calculate refund using stored price:**
```javascript
// backend/routes/returns.js
router.put('/approve-refund/:returnId', auth, async (req, res) => {
  try {
    // Verify user is sales_manager
    const user = await User.findById(req.user.id);
    if (user.role !== 'sales_manager') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const returnRequest = await ReturnRequest.findById(req.params.returnId)
      .populate('order')
      .populate('customer');
    
    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }
    
    // Get the order item
    const order = returnRequest.order;
    const orderItem = order.orderItems.find(
      item => item.product.toString() === returnRequest.product.toString()
    );
    
    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }
    
    // ✅ Calculate refund using PRICE PAID at time of purchase
    const refundAmount = orderItem.price * orderItem.quantity;
    
    // Update return request
    returnRequest.status = 'approved';
    returnRequest.refundAmount = refundAmount;
    await returnRequest.save();
    
    // Restore product to stock
    await Product.findByIdAndUpdate(
      returnRequest.product,
      { $inc: { quantityInStock: orderItem.quantity } }
    );
    
    // Process refund (mock - in reality would integrate with payment processor)
    // await processRefundToCustomer(returnRequest.customer.email, refundAmount);
    
    // Send email notification
    await emailService.sendRefundApprovalEmail(
      returnRequest.customer.email,
      {
        productName: orderItem.name,
        refundAmount: refundAmount,
        originalPrice: orderItem.originalPrice || orderItem.price,
        discountApplied: orderItem.discountApplied || 0
      }
    );
    
    res.json({ 
      message: 'Refund approved',
      refundAmount: refundAmount,
      returnRequest 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
```

**Step 3: Verify order creation stores correct price:**
```javascript
// backend/routes/orders.js - When creating order
router.post('/', auth, async (req, res) => {
  // ... existing code ...
  
  const orderItems = req.body.orderItems.map(item => ({
    product: item.product,
    name: item.name,
    quantity: item.quantity,
    price: item.price,  // ✅ This should be the discounted price from cart
    originalPrice: item.originalPrice,  // Store original for reference
    discountApplied: item.discountPercentage || 0
  }));
  
  // ... rest of order creation ...
});
```

### Testing Steps
**Test Case 1: Product bought WITH discount, returned AFTER discount ends**
1. Set 30% discount on product ($20 → $14)
2. Customer purchases for $14
3. Remove discount (price back to $20)
4. Customer returns product
5. ✅ Verify refund = $14 (not $20)

**Test Case 2: Product bought WITHOUT discount, returned DURING discount**
1. Product price = $20 (no discount)
2. Customer purchases for $20
3. Set 25% discount ($20 → $15)
4. Customer returns product
5. ✅ Verify refund = $20 (not $15)

**Test Case 3: Product bought WITH discount, returned DURING SAME discount**
1. Set 40% discount ($25 → $15)
2. Customer purchases for $15
3. Customer returns product (discount still active)
4. ✅ Verify refund = $15

**Test Case 4: Multiple quantities with discount**
1. Product: $10 with 50% discount = $5
2. Customer buys quantity = 3 for $15 total
3. Customer returns all 3
4. ✅ Verify refund = $15 (not $30)

### Impact
**High Financial and Compliance Impact:**
- Affects CS 308 Requirement 16 (8% grade)
- Financial loss (over-refunding customers)
- OR customer complaints (under-refunding customers)
- Accounting inconsistencies
- Potential legal issues (consumer protection laws)

### Priority Justification
**High Priority:**
- Explicitly defined in requirements
- Financial impact on business
- Customer trust and satisfaction
- Data integrity in accounting

---

## Bug Report #5: Credit Card Information Stored in Plain Text

**Bug ID:** BUG-005  
**Severity:** Critical  
**Priority:** Critical  
**Status:** Open  
**Reporter:** Security Audit Team  
**Date Reported:** January 11, 2026  
**Component:** Payment Processing / Data Security  
**Requirement:** CS 308 Requirement 17 (2% grade)

### Description
Credit card numbers are being stored in the database in plain text (unencrypted), violating CS 308 Requirement 17 which explicitly states that "sensitive information should be kept encrypted" including "credit card information."

### CS 308 Requirement Reference
**Requirement 17:** "Whatever your method of information storage (databases, XML files, etc.) is, sensitive information should be kept encrypted so that it's not easily compromised. Note that sensitive information includes the following at the very least: user passwords, credit card information, invoices, and user accounts."

### Steps to Reproduce
1. Place an order as customer with credit card info:
   - Card: 4111 1111 1111 1111
   - CVV: 123
   - Expiry: 12/27
   
2. Order created successfully

3. Check MongoDB database directly:
   ```javascript
   db.orders.findOne({ user: ObjectId("...") })
   ```
   
4. Observe `paymentInfo` field:
   ```json
   {
     "paymentInfo": {
       "creditCardNumber": "4111111111111111",  // ❌ PLAIN TEXT!
       "cardHolderName": "John Doe",
       "expiryDate": "12/27"
     }
   }
   ```

5. Credit card stored in plain text - Security violation

### Expected Behavior
**Security Best Practice (Required by CS 308):**

1. **Encryption:** Credit card numbers must be encrypted before storage
2. **Storage:** Only encrypted data in database
3. **Decryption:** Only decrypt when necessary for authorized operations
4. **Display:** Show masked version to users (e.g., **** **** **** 1111)
5. **CVV:** Never store CVV (PCI-DSS compliance)

**Expected Database Entry:**
```json
{
  "paymentInfo": {
    "creditCardNumber": "a7f3d9e8b2c1...4f8a",  // ✅ Encrypted hex string
    "cardHolderName": "John Doe",  // OK to store
    "expiryDate": "12/27"  // OK to store
  }
}
```

**Expected Display to User:**
```
Payment Method: **** **** **** 1111
Cardholder: John Doe
Expires: 12/27
```

### Actual Behavior
- Full credit card number stored in plain text
- Anyone with database access can see all card numbers
- Violates PCI-DSS compliance
- Violates CS 308 security requirements
- Major security vulnerability

### Environment
- Backend: Node.js 20.x
- Database: MongoDB
- Payment Component: Checkout.jsx, Order model

### Security Risk Assessment
**Risk Level: CRITICAL**

**Threats:**
1. **Database Breach:** Hackers gain access to database → All credit cards exposed
2. **Insider Threat:** Employee with DB access → Can steal credit cards
3. **Backup Exposure:** Database backups stolen → Cards compromised
4. **Logs Exposure:** Cards might appear in error logs
5. **Compliance Violation:** PCI-DSS, GDPR violations → Legal consequences

**Impact:**
- Identity theft
- Financial fraud
- Legal liability
- Reputation damage
- Fines and penalties
- Loss of customer trust

### Suggested Fix

**Step 1: Create encryption utility**
```javascript
// backend/utils/encryption.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

// Encrypt credit card number
const encryptCreditCard = (cardNumber) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(cardNumber);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Return IV + encrypted data as hex string
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Decrypt credit card number
const decryptCreditCard = (encryptedData) => {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
};

// Mask credit card for display
const maskCreditCard = (cardNumber) => {
  const last4 = cardNumber.slice(-4);
  return `**** **** **** ${last4}`;
};

module.exports = {
  encryptCreditCard,
  decryptCreditCard,
  maskCreditCard
};
```

**Step 2: Add encryption key to .env**
```bash
# Generate 32-byte random key
ENCRYPTION_KEY=7f8e9a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f
```

**Step 3: Encrypt before saving to database**
```javascript
// backend/routes/orders.js
const { encryptCreditCard } = require('../utils/encryption');

router.post('/', auth, async (req, res) => {
  const { paymentInfo, ...orderData } = req.body;
  
  // ✅ Encrypt credit card before saving
  const encryptedCard = encryptCreditCard(paymentInfo.creditCardNumber);
  
  const order = new Order({
    ...orderData,
    paymentInfo: {
      creditCardNumber: encryptedCard,  // ✅ Encrypted
      cardHolderName: paymentInfo.cardHolderName,
      expiryDate: paymentInfo.expiryDate
      // ✅ CVV NOT stored (security best practice)
    }
  });
  
  await order.save();
  res.json({ message: 'Order created', order });
});
```

**Step 4: Decrypt and mask when displaying**
```javascript
// backend/routes/orders.js
const { decryptCreditCard, maskCreditCard } = require('../utils/encryption');

router.get('/my-orders', auth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id });
  
  // ✅ Decrypt then mask before sending to client
  const ordersWithMaskedCards = orders.map(order => {
    const orderObj = order.toObject();
    
    if (orderObj.paymentInfo?.creditCardNumber) {
      const decrypted = decryptCreditCard(orderObj.paymentInfo.creditCardNumber);
      orderObj.paymentInfo.creditCardNumber = maskCreditCard(decrypted);
    }
    
    return orderObj;
  });
  
  res.json({ orders: ordersWithMaskedCards });
});
```

**Step 5: Update Order model (schema unchanged, but document the requirement)**
```javascript
// backend/models/Order.js
const orderSchema = new mongoose.Schema({
  // ... existing fields ...
  paymentInfo: {
    creditCardNumber: {
      type: String,
      required: true
      // NOTE: This should ALWAYS be encrypted before storage
      // Use encryptCreditCard() utility before saving
    },
    cardHolderName: String,
    expiryDate: String
    // CVV should NEVER be stored
  }
});
```

### Testing Steps
1. **Test Encryption:**
   - Place order with test card: 4111 1111 1111 1111
   - Check database: Verify encrypted (hex string, not readable)
   - Verify format: `[IV]:[encrypted_data]`

2. **Test Decryption:**
   - Retrieve order via API
   - Verify card displayed as: **** **** **** 1111
   - Verify last 4 digits correct

3. **Test Security:**
   - Try to decrypt without key → Should fail
   - Change encryption key → Old data can't be decrypted
   - Check logs → No plain text cards in logs

4. **Test CVV:**
   - Verify CVV never saved to database
   - Verify CVV only used for payment processing
   - Verify CVV not in API responses

### Migration Plan
**For Existing Data:**
```javascript
// migration-script.js
const { encryptCreditCard } = require('./utils/encryption');

async function migrateExistingOrders() {
  const orders = await Order.find({ 'paymentInfo.creditCardNumber': { $exists: true } });
  
  for (const order of orders) {
    const plainCard = order.paymentInfo.creditCardNumber;
    
    // Check if already encrypted (basic check)
    if (!plainCard.includes(':')) {
      // Not encrypted yet - encrypt it
      const encrypted = encryptCreditCard(plainCard);
      order.paymentInfo.creditCardNumber = encrypted;
      await order.save();
      console.log(`Encrypted card for order ${order._id}`);
    }
  }
  
  console.log('Migration complete');
}

migrateExistingOrders();
```

### Impact
**CRITICAL - SECURITY BREACH:**
- Violates CS 308 Requirement 17 (2% grade deduction)
- **PCI-DSS violation** (payment card industry standards)
- **GDPR violation** (if serving EU customers)
- Legal liability for data breach
- Potential fines: $5,000-$500,000+ per violation
- Reputation damage
- Loss of customer trust
- Possible criminal charges

### Compliance Requirements
**PCI-DSS Requirements:**
- Requirement 3.4: Render PAN unreadable (encryption required)
- Requirement 3.2: Do not store sensitive authentication data (CVV)
- Requirement 3.5: Document and implement procedures to protect keys

**CS 308 Requirements:**
- Requirement 17: Encrypt sensitive information including credit cards

### Recommendations
1. **Immediate:** Implement encryption for all new orders
2. **Urgent:** Migrate existing plain text cards to encrypted format
3. **Critical:** Never log credit card numbers
4. **Essential:** Implement key rotation policy
5. **Required:** Regular security audits

---

## Summary Table

| Bug ID  | Severity | Priority | Component              | Requirement | Grade Impact |
|---------|----------|----------|------------------------|-------------|--------------|
| BUG-001 | High     | High     | Revenue Chart          | Req 11      | 8%           |
| BUG-002 | High     | Critical | Order Cancellation     | Req 14      | 8%           |
| BUG-003 | High     | High     | Support Chat Context   | Req 13      | 13%          |
| BUG-004 | High     | High     | Refund Calculation     | Req 16      | 8%           |
| BUG-005 | Critical | Critical | Credit Card Encryption | Req 17      | 2% + Legal   |

**Total Grade Impact:** 39% + Security/Legal Issues

---

**Last Updated:** January 11, 2026  
**Source:** CS 308 Project Requirements (Requirements 11-18)  
**QA Team:** AO Comics Security & Testing Department
