const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const http = require('http');
const orderRoutes = require('./routes/order.routes');
const { initWebSocketServer } = require('./websocket/wsServer');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error(err));

// Routes
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.send('Ordering Service is running');
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket Init
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
