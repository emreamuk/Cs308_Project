// backend/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  orderItems: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalPrice: { 
    type: Number, 
    required: true 
  },
  deliveryAddress: { 
    type: String, 
    required: true 
  },
  // Encrypted credit card information
  paymentInfo: {
    creditCardNumber: {
      type: String, // Stored as encrypted string
      required: true
    },
    cardHolderName: {
      type: String,
      required: true
    },
    expiryDate: {
      type: String, // Format: MM/YY
      required: true
    }
    // Note: CVV is NEVER stored (even encrypted) for security compliance
  },
  status: { 
    type: String, 
    default: 'processing',
    enum: ['processing', 'in-transit', 'delivered', 'cancelled']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Order', orderSchema);