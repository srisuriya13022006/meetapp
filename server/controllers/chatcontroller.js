// controllers/chatController.js
const Chat = require('../models/Chat');

exports.getGroups = async (req, res) => {
  try {
    const groups = await Chat.find();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups', error });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Chat.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group.messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { groupId, content } = req.body;
    const group = await Chat.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const message = {
      sender: req.user?.username || 'You', // Assuming authentication middleware sets req.user
      content,
      timestamp: new Date(),
      isOwn: true,
    };

    group.messages.push(message);
    group.lastMessage = content;
    group.timestamp = message.timestamp;
    await group.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const newGroup = new Chat({
      name,
      type: 'group',
      members: ['You', ...members],
      lastMessage: 'Group created',
      messages: [{
        sender: 'System',
        content: `Welcome to ${name}! Group created with ${members.join(', ')}`,
        timestamp: new Date(),
        isOwn: false,
      }],
    });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ message: 'Error creating group', error });
  }
};