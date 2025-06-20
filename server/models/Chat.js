// models/Chat.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
  isOwn: Boolean,
});

const groupSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['group', 'direct'] },
  members: [String],
  lastMessage: String,
  timestamp: { type: Date, default: Date.now },
  unread: { type: Number, default: 0 },
  messages: [messageSchema],
});

module.exports = mongoose.model('Chat', groupSchema);