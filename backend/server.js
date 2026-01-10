// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const http = require('http');
// const socketIo = require('socket.io');
// const connectDB = require('./config/db');
// const initializeChatSocket = require('./socket/chatSocket');

// const app = express();
// const server = http.createServer(app);

// //Socket.io configuration
// const io = socketIo(server, {
//   cors: {
//     origin: 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//     credentials: true
//   }
// });

// connectDB();

// app.use(cors({
//   origin: 'http://localhost:3000',
//   credentials: true
// }));

// app.use(express.json());

// //Serve static files for chat attachments
// app.use('/uploads', express.static('uploads'));

// // ROUTES
// const authRoutes = require('./routes/auth');
// const productRoutes = require('./routes/products');
// const orderRoutes = require('./routes/orders');
// const reviewRoutes = require('./routes/reviews');
// const salesManagerRoutes = require('./routes/salesManager');
// const wishlistRoutes = require('./routes/wishlist');
// const chatRoutes = require('./routes/chat');

// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/sales', salesManagerRoutes);
// app.use('/api/wishlist', wishlistRoutes);
// app.use('/api/chat', chatRoutes);

// app.get('/api/test', (req, res) => {
//   res.json({ message: 'Backend is working!' });
// });

// //Initialize chat socket
// initializeChatSocket(io);

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const initializeChatSocket = require('./socket/chatSocket');

const app = express();
const server = http.createServer(app);

//Socket.io configuration
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

connectDB();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

//Serve static files for chat attachments
app.use('/uploads', express.static('uploads'));

// ROUTES
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const salesManagerRoutes = require('./routes/salesManager');
const wishlistRoutes = require('./routes/wishlist');
const chatRoutes = require('./routes/chat');
const invoiceRoutes = require('./routes/invoices'); // NEW: Invoice routes

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/sales', salesManagerRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/invoices', invoiceRoutes); // NEW: Invoice API endpoint

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

//Initialize chat socket
initializeChatSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
