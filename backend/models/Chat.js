// backend/models/Chat.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatSchema = new mongoose.Schema({
  // Customer information
  customer: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: null
    },
    guestSessionId: {
      type: String,
      default: null
    }
  },

  // Support agent assigned to this chat
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Chat status
  status: {
    type: String,
    enum: ['waiting', 'active', 'closed'],
    default: 'waiting'
  },

  // Messages in the chat
  messages: [{
    sender: {
      type: String,
      enum: ['customer', 'agent', 'system'],
      required: true
    },
    senderName: {
      type: String,
      required: true
    },
    text: {
      type: String,
      default: ''
    },
    attachments: [{
      filename: String,
      path: String,
      mimetype: String,
      size: Number
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Customer context (for logged-in users)
  customerContext: {
    recentOrders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    wishlistCount: {
      type: Number,
      default: 0
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart'
    }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  }
});

// Pre-save middleware - removed 'next' parameter for async function
chatSchema.pre('save', async function() {
  // Generate session ID for guest users if not present
  if (!this.customer.userId && !this.customer.guestSessionId) {
    this.customer.guestSessionId = uuidv4();
  }
  
  // Update the updatedAt timestamp
  this.updatedAt = Date.now();
});

// Indexes for better query performance
chatSchema.index({ 'customer.userId': 1 });
chatSchema.index({ 'customer.guestSessionId': 1 });
chatSchema.index({ agent: 1 });
chatSchema.index({ status: 1 });
chatSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);