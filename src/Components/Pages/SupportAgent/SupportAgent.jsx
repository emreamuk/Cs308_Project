
// src/Components/Pages/SupportAgent/SupportAgent.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import API from '../../../services/api';
import './SupportAgent.css';

const SupportAgent = () => {
  const [queueChats, setQueueChats] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentName, setAgentName] = useState('');
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchQueue = useCallback(async () => {
    try {
      const response = await API.get('/chat/queue');
      setQueueChats(response.data.chats || []);
    } catch (error) {
      console.error('Fetch queue error:', error);
      setQueueChats([]);
    }
  }, []);

  const fetchActiveChats = useCallback(async () => {
    try {
      const response = await API.get('/chat/my-active-chats');
      setActiveChats(response.data.chats || []);
    } catch (error) {
      console.error('Fetch active chats error:', error);
      setActiveChats([]);
    }
  }, []);

  const initializeSocket = useCallback(() => {
    // Disconnect existing socket to prevent duplicates
    if (socketRef.current) {
      socketRef.current.off();
      socketRef.current.disconnect();
    }

    socketRef.current = io('http://localhost:5000/chat', {
      transports: ['websocket']
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Agent socket connected');
    });

    socketRef.current.on('message:received', (data) => {
      // Update messages if this is the selected chat
      setSelectedChat(currentChat => {
        if (currentChat && data.chatId === currentChat._id) {
          setMessages(prev => {
            // Prevent duplicates
            const isDuplicate = prev.some(msg => {
              const msgTime = msg.timestamp?.toString();
              const newTime = data.message.timestamp?.toString();
              const msgText = msg.text || msg.message;
              const newText = data.message.text || data.message.message;
              
              return msgTime === newTime && msgText === newText;
            });
            
            if (isDuplicate) {
              console.log('🚫 Duplicate message prevented');
              return prev;
            }
            
            return [...prev, data.message];
          });
        }
        return currentChat;
      });

      // Mark chat as having new message
      setActiveChats(prev => prev.map(chat =>
        chat._id === data.chatId
          ? { ...chat, hasNewMessage: true }
          : chat
      ));
    });

    socketRef.current.on('typing:status', (data) => {
      setSelectedChat(currentChat => {
        if (currentChat && data.chatId === currentChat._id) {
          setIsTyping(data.isTyping);
        }
        return currentChat;
      });
    });

    socketRef.current.on('customer:joined', (data) => {
      console.log('Customer joined:', data);
    });
  }, []);

  useEffect(() => {
    // Check if user is support agent
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'support_agent') {
      alert('Access denied. Support Agent role required.');
      navigate('/');
      return;
    }

    setAgentName(user.name);

    // Initialize
    fetchQueue();
    fetchActiveChats();
    initializeSocket();

    // Refresh queue every 30 seconds
    const interval = setInterval(fetchQueue, 30000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        console.log('🔌 Agent socket disconnected on cleanup');
      }
    };
  }, [navigate, fetchQueue, fetchActiveChats, initializeSocket]);

  const handleClaimChat = async (chatId) => {
    try {
      const response = await API.post(`/chat/${chatId}/claim`);
      
      // Remove from queue
      setQueueChats(prev => prev.filter(chat => chat._id !== chatId));
      
      // Add to active chats
      setActiveChats(prev => [...prev, response.data.chat]);
      
      // Select it
      handleSelectChat(response.data.chat);
      
      alert('Chat claimed successfully!');
    } catch (error) {
      console.error('Claim error:', error);
      alert(error.response?.data?.message || 'Failed to claim chat');
    }
  };

  const handleSelectChat = async (chat) => {
    try {
      // Set selected chat and messages from existing chat data
      setSelectedChat(chat);
      setMessages(chat.messages || []);

      // Join socket room
      const token = localStorage.getItem('token');
      socketRef.current.emit('agent:join', {
        chatId: chat._id,
        token
      });

      // Mark as no new messages
      setActiveChats(prev => prev.map(c =>
        c._id === chat._id ? { ...c, hasNewMessage: false } : c
      ));
    } catch (error) {
      console.error('Select chat error:', error);
      alert('Failed to load chat');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || !selectedChat) return;

    socketRef.current.emit('message:send', {
      chatId: selectedChat._id,
      message: inputMessage,
      senderName: agentName
    });

    setInputMessage('');
    
    // Stop typing
    socketRef.current.emit('typing:stop', { chatId: selectedChat._id });
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);

    if (!typingTimeoutRef.current) {
      socketRef.current?.emit('typing:start', {
        chatId: selectedChat._id,
        userName: agentName
      });
    }

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { chatId: selectedChat._id });
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await API.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      socketRef.current.emit('message:send', {
        chatId: selectedChat._id,
        message: `Sent a file: ${file.name}`,
        senderName: agentName,
        attachments: [response.data]
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    }
  };

  const handleCloseChat = async () => {
    if (!selectedChat) return;

    if (!window.confirm('Close this chat?')) return;

    try {
      await API.post(`/chat/${selectedChat._id}/close`);
      
      // Remove from active chats
      setActiveChats(prev => prev.filter(chat => chat._id !== selectedChat._id));
      
      setSelectedChat(null);
      setMessages([]);
      
      alert('Chat closed');
    } catch (error) {
      console.error('Close chat error:', error);
      alert('Failed to close chat');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="support-agent-page">
      <h1>Support Agent Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Welcome, {agentName}
      </p>

      <div className="support-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          {/* Queue */}
          <div className="queue-section">
            <h3>
              Waiting Queue
              {queueChats.length > 0 && (
                <span className="queue-badge">{queueChats.length}</span>
              )}
            </h3>

            {queueChats.length === 0 ? (
              <p className="no-chats-message">No chats waiting</p>
            ) : (
              queueChats.map(chat => (
                <div key={chat._id} className="queue-item">
                  <div className="queue-item-name">{chat.customerName}</div>
                  <div className="queue-item-message">
                    {chat.customerEmail || 'Guest'}
                  </div>
                  <div className="queue-item-time">
                    Waiting since {formatDate(chat.createdAt)}
                  </div>
                  <button
                    className="claim-btn"
                    onClick={() => handleClaimChat(chat._id)}
                  >
                    Claim Chat
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Active Chats */}
          <div className="active-chats-section">
            <h3>My Active Chats ({activeChats.length})</h3>

            {activeChats.length === 0 ? (
              <p className="no-chats-message">No active chats</p>
            ) : (
              activeChats.map(chat => (
                <div
                  key={chat._id}
                  className={`active-chat-item ${selectedChat?._id === chat._id ? 'selected' : ''}`}
                  onClick={() => handleSelectChat(chat)}
                >
                  <div className="chat-item-name">
                    {chat.customer?.name || 'Unknown'}
                    {chat.hasNewMessage && <span style={{ color: '#ff4141', marginLeft: '5px' }}>●</span>}
                  </div>
                  <div className="chat-item-preview">
                    {chat.customer?.email || 'Guest user'}
                  </div>
                  <div className="chat-item-time">
                    {formatDate(chat.updatedAt || chat.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main-area">
          {!selectedChat ? (
            <div className="no-chat-selected">
              Select a chat to start helping
            </div>
          ) : (
            <>
              {/* Customer Info */}
              <div className="customer-info-panel">
                <div className="customer-info-header">
                  <div className="customer-details">
                    <h3>{selectedChat.customerName}</h3>
                    <p className="customer-email">
                      {selectedChat.customerEmail || 'Guest user'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {selectedChat.customer && (
                      <span className="customer-badge">Logged In</span>
                    )}
                    <button
                      className="close-chat-btn-agent"
                      onClick={handleCloseChat}
                    >
                      Close Chat
                    </button>
                  </div>
                </div>

                {/* Customer Context (if logged in) */}
                {selectedChat.customerContext && (
                  <div className="customer-context">
                    {selectedChat.customerContext.recentOrders?.length > 0 && (
                      <div className="context-item">
                        <div className="context-label">Recent Orders</div>
                        <div className="context-value">
                          {selectedChat.customerContext.recentOrders.length} orders
                        </div>
                      </div>
                    )}
                    {selectedChat.customerContext.wishlistCount > 0 && (
                      <div className="context-item">
                        <div className="context-label">Wishlist</div>
                        <div className="context-value">
                          {selectedChat.customerContext.wishlistCount} items
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="agent-chat-messages">
                {messages.map((msg, index) => (
                  msg.sender === 'system' ? (
                    <div key={index} style={{ textAlign: 'center', margin: '10px 0', fontSize: '12px', color: '#999' }}>
                      {msg.text || msg.message}
                    </div>
                  ) : (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                      <div className="message-bubble">
                        <div className="message-sender">{msg.senderName}</div>
                        <p className="message-text">{msg.text || msg.message}</p>
                        
                        {msg.attachments && msg.attachments.map((att, i) => (
                          <div key={i} className="message-attachment">
                            {att.type === 'image' ? (
                              <img src={`http://localhost:5000${att.url}`} alt={att.filename} />
                            ) : (
                              <a href={`http://localhost:5000${att.url}`} target="_blank" rel="noopener noreferrer">
                                📎 {att.filename}
                              </a>
                            )}
                          </div>
                        ))}
                        
                        <div className="message-time">{formatTime(msg.timestamp)}</div>
                      </div>
                    </div>
                  )
                ))}
                
                {isTyping && (
                  <div className="chat-message customer">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="agent-chat-input-area">
                <form className="chat-input-form" onSubmit={handleSendMessage}>
                  <div className="chat-input-wrapper">
                    <textarea
                      className="chat-input"
                      placeholder="Type a message..."
                      value={inputMessage}
                      onChange={handleTyping}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      rows="1"
                    />
                    <button
                      type="button"
                      className="attach-btn"
                      onClick={() => fileInputRef.current.click()}
                    >
                      📎
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,video/*"
                    />
                  </div>
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={!inputMessage.trim()}
                  >
                    ➤
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportAgent;
