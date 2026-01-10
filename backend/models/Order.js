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
    price: { type: Number, required: true },
    refunded: { type: Boolean, default: false },
    refundedQuantity: { type: Number, default: 0 }
  }],
  totalPrice: { 
    type: Number, 
    required: true 
  },
  deliveryAddress: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    default: 'processing',
    enum: ['processing', 'in-transit', 'delivered', 'cancelled']
  },
  deliveryCompleted: {
    type: Boolean,
    default: false
  },
  deliveryCompletedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);