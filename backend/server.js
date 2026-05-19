const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ✅ Import notification controller to set Socket.io instance
const notificationController = require('./controllers/notificationController');
notificationController.setIo(io);

// Routes
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cartRoutes = require("./routes/cartRoutes"); 
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require('./routes/notificationRoutes');
const sellerRatingRoutes = require('./routes/sellerRatingRoutes');
const exchangeRoutes = require('./routes/exchangeRoutes');



// ✅ All routes

app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", productRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", cartRoutes);
app.use("/api", reviewRoutes);
app.use('/api', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller-ratings', sellerRatingRoutes);
app.use('/api', exchangeRoutes);


app.get("/", (req, res) => {
  res.json({ message: "Backend is working ✅" });
});

// ========== SOCKET.IO ==========
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  // User joins their personal room for notifications
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined room user_${userId}`);
  });

  // Handle sending messages with notification
  socket.on('send_message', async (data) => {
    console.log('📩 MESSAGE RECEIVED:', data);
    const { sender_id, receiver_id, message } = data;
    
    try {
      // Save message to database
      const query = `INSERT INTO messages (sender_id, receiver_id, message, created_at) 
                     VALUES ($1, $2, $3, NOW()) RETURNING *`;
      const result = await db.query(query, [sender_id, receiver_id, message]);
      const newMessage = result.rows[0];
      
      // Send real-time message to receiver
      io.to(`user_${receiver_id}`).emit('receive_message', newMessage);
      socket.emit('message_sent', newMessage);
      
      // Get sender name for notification
      const senderQuery = `SELECT fullname FROM users WHERE id = $1`;
      const senderResult = await db.query(senderQuery, [sender_id]);
      const senderName = senderResult.rows[0]?.fullname || 'Someone';
      
      // Create notification for the receiver
      await notificationController.createNotification(
        receiver_id,
        'message',
        'New Message',
        `${senderName} sent you a message`,
        { 
          message_id: newMessage.id, 
          sender_id: sender_id, 
          sender_name: senderName 
        }
      );
      
      console.log('✅ Message saved and notification sent');
    } catch (err) {
      console.error('❌ Error saving message:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`💬 Socket.io ready`);
  console.log(`🔔 Notification system active`);
});