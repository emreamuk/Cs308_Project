// backend/seed.js
const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const products = [
  {
    name: "1776 (2025) #1",
    model: "MAR-1776-001",
    serialNumber: "MAR2025001",
    description: "An epic tale of America's founding with Marvel heroes",
    quantityInStock: 50,
    price: 14.99,
    warrantyStatus: "30-day return",
    distributorInfo: "Marvel Comics",
    category: "Marvel",
    imageUrl: "/assets/comic1.png",
    rating: 4.5,
    numReviews: 12
  },
  {
    name: "Captain America (2018)",
    model: "MAR-CA-2018",
    serialNumber: "MAR2018100",
    description: "A new era begins for Captain America",
    quantityInStock: 30,
    price: 12.99,
    warrantyStatus: "30-day return",
    distributorInfo: "Marvel Comics",
    category: "Marvel",
    imageUrl: "/assets/comic2.png",
    rating: 4.8,
    numReviews: 25
  },
  {
    name: "Spider-Man & Wolverine (2025) #6",
    model: "MAR-SW-006",
    serialNumber: "MAR2025006",
    description: "Horror on the train! Two heroes team up",
    quantityInStock: 10,
    price: 13.99,
    warrantyStatus: "30-day return",
    distributorInfo: "Marvel Comics",
    category: "Marvel",
    imageUrl: "assets/comic3.png",
    rating: 4.2,
    numReviews: 8
  }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert new products
    await Product.insertMany(products);
    console.log('Database seeded with products!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedDB();