const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io'); // Import Socket.IO
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chatroutes');
const app = express();
const cors = require('cors');

app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/chatapp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  socket.on('sendMessage', async ({ groupId, content }) => {
    const Chat = require('./models/Chat');
    try {
      const group = await Chat.findById(groupId);
      if (!group) throw new Error('Group not found');

      const message = {
        sender: 'You', 
        content,
        timestamp: new Date(),
        isOwn: true
      };

      group.messages.push(message);
      group.lastMessage = content;
      await group.save();

      io.to(groupId).emit('newMessage', message); 
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Apply chat routes
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));