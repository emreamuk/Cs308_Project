// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  taxID: String,
  homeAddress: String,
  role: { type: String, default: 'customer' }, // customer, sales_manager, product_manager, support_agent
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);