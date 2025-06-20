import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Users, Search, MoreVertical, Phone, Video, Smile, Paperclip } from 'lucide-react';
import io from 'socket.io-client';
import '../styles/chat.css';

// Initialize Socket.IO outside the component
const socket = io('http://localhost:5000');

export default function Chat() {
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeGroup, setActiveGroup] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const availableUsers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/chat/groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      console.log('Fetched groups data:', data);
      setGroups(data);
      if (data.length > 0) setActiveGroup(data[0].id || data[0]._id?.toString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (groupId) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:5000/api/chat/groups/${groupId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(prev => ({ ...prev, [groupId]: data }));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (activeGroup) {
      socket.emit('joinGroup', activeGroup);
      socket.on('newMessage', (message) => {
        setMessages(prev => ({
          ...prev,
          [activeGroup]: [...(prev[activeGroup] || []), message],
        }));
      });
      socket.on('error', (error) => {
        setError(error.message);
      });
      return () => {
        socket.off('newMessage');
        socket.off('error');
      };
    }
  }, [activeGroup]);

  useEffect(() => {
    if (activeGroup) fetchMessages(activeGroup);
  }, [activeGroup]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setError(null);
      console.log('Sending message to groupId:', activeGroup);
      socket.emit('sendMessage', { groupId: activeGroup, content: newMessage });
      setNewMessage('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) return;

    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, members: selectedMembers }),
      });
      if (!response.ok) throw new Error('Failed to create group');
      const newGroup = await response.json();
      setGroups(prev => [...prev, newGroup]);
      setNewGroupName('');
      setSelectedMembers([]);
      setShowCreateGroup(false);
      setActiveGroup(newGroup.id || newGroup._id?.toString());
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeGroupData = groups.find(g => (g.id && g.id === activeGroup) || (g._id && g._id.toString() === activeGroup));
  const currentMessages = messages[activeGroup] || [];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="header-content">
            <h1 className="header-title">Chat</h1>
            <button onClick={() => setShowCreateGroup(true)} className="create-group-btn">
              <Plus className="icon" />
            </button>
          </div>
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="groups-list">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div
                key={group.id || group._id}
                onClick={() => setActiveGroup(group.id || group._id?.toString())}
                className={`group-item ${activeGroup === (group.id || group._id?.toString()) ? 'group-item-active' : ''}`}
              >
                <div className="group-item-content">
                  <div className="group-icon-container">
                    {group.type === 'group' ? (
                      <Users className="group-icon" />
                    ) : (
                      <span className="direct-icon">{group.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="group-details">
                    <div className="group-details-header">
                      <h3 className="group-name">{group.name}</h3>
                      <span className="group-timestamp">{group.timestamp}</span>
                    </div>
                    <p className="group-last-message">{group.lastMessage}</p>
                    <p className="group-members">{group.members.length} members</p>
                  </div>
                  {group.unread > 0 && <div className="unread-badge">{group.unread}</div>}
                </div>
              </div>
            ))
          ) : (
            <div>No groups available</div>
          )}
        </div>
      </div>

      <div className="chat-area">
        {activeGroupData && (
          <>
            <div className="chat-header">
              <div className="chat-header-content">
                <div className="chat-icon-container">
                  {activeGroupData.type === 'group' ? (
                    <Users className="chat-icon" />
                  ) : (
                    <span className="direct-icon">{activeGroupData.name.charAt(0)}</span>
                  )}
                </div>
                <div className="chat-details">
                  <h2 className="chat-title">{activeGroupData.name}</h2>
                  <p className="chat-members">{activeGroupData.members.join(', ')}</p>
                </div>
                <div className="chat-actions">
                  <button className="action-btn"><Phone className="icon" /></button>
                  <button className="action-btn"><Video className="icon" /></button>
                  <button className="action-btn"><MoreVertical className="icon" /></button>
                </div>
              </div>
            </div>
            <div className="messages-container">
              {currentMessages.map((message) => (
                <div key={message.id} className={`message ${message.isOwn ? 'message-own' : 'message-other'}`}>
                  <div className="message-content">
                    {!message.isOwn && (
                      <div className="message-sender-icon">
                        <span className="sender-initial">{message.sender.charAt(0)}</span>
                      </div>
                    )}
                    <div className={`message-bubble ${message.isOwn ? 'bubble-own' : message.sender === 'System' ? 'bubble-system' : 'bubble-other'}`}>
                      {!message.isOwn && message.sender !== 'System' && (
                        <p className="message-sender">{message.sender}</p>
                      )}
                      <p className="message-text">{message.content}</p>
                      <p className="message-timestamp">{message.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input-container">
              <div className="input-wrapper">
                <button type="button" className="input-action-btn"><Paperclip className="icon" /></button>
                <div className="input-field-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
                    placeholder="Type a message..."
                    className="message-input"
                  />
                  <button type="button" className="emoji-btn"><Smile className="icon" /></button>
                </div>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="send-btn"
                >
                  <Send className="icon" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showCreateGroup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Create New Group</h3>
            <div className="form-group">
              <label className="form-label">Group Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Add Members</label>
              <div className="members-list">
                {availableUsers.map((user) => (
                  <label key={user} className="member-item">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMembers(prev => [...prev, user]);
                        else setSelectedMembers(prev => prev.filter(m => m !== user));
                      }}
                      className="member-checkbox"
                    />
                    <span className="member-name">{user}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroupName('');
                  setSelectedMembers([]);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedMembers.length === 0}
                className="create-btn"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}