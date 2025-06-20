const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');

router.get('/groups', async (req, res) => {
  try {
    const groups = await Chat.find().select('name type members lastMessage timestamp unread _id');
    res.json(groups.map(group => ({ ...group.toObject(), id: group._id }))); // Explicitly map _id to id
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups', error });
  }
});

router.get('/groups/:groupId/messages', async (req, res) => {
  try {
    const group = await Chat.findById(req.params.groupId).select('messages');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group.messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
});

module.exports = router;