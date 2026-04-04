import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserList from '../components/UserList';
import ChatRoom from '../components/ChatRoom';
import PrivateChat from '../components/PrivateChat';
import {
  fetchPrivateMessages,
  fetchPublicMessages,
  fetchUsers,
  markMessageAsRead
} from '../services/AuthService';
import {
  connectChat,
  disconnectChat,
  sendPrivateMessage,
  sendPublicMessage,
  sendReadReceipt
} from '../services/ChatService';

const Home = () => {
  const { user, token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [publicMessages, setPublicMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null); // 'public' or null
  const [client, setClient] = useState(null);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false
  );

  const [unreadMessages, setUnreadMessages] = useState({});

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const setup = async () => {
      const [allUsers, pub] = await Promise.all([fetchUsers(token), fetchPublicMessages(token)]);
      setUsers(allUsers);
      setPublicMessages(pub);
      
      // Fetch private messages for ALL users on initial load
      for (const otherUser of allUsers) {
        if (otherUser.id !== user.id) {
          try {
            const msgs = await fetchPrivateMessages(token, otherUser.id);
            const key = `${[user.id, otherUser.id].sort().join('|')}`;
            setPrivateMessages((prev) => ({
              ...prev,
              [key]: msgs
            }));
          } catch (err) {
            console.error(`Failed to fetch messages with user ${otherUser.id}:`, err);
          }
        }
      }
    };

    setup();

    const chatClient = connectChat({
      token,
      userId: user.id,
      onPublic: (message) => {
        setPublicMessages((prev) => {
          // Check if message with same ID already exists
          const existingIndex = prev.findIndex(m => m.id === message.id);
          
          if (existingIndex !== -1) {
            // Message exists - update it (handles read receipts)
            console.log('🔄 [PUBLIC] Updating existing message:', message.id, 'readAt:', message.readAt);
            const updated = [...prev];
            updated[existingIndex] = message;
            return updated;
          }
          
          // New message - append
          console.log('➕ [PUBLIC] Adding new message:', message.id);
          return [...prev, message];
        });
      },
      onPrivate: (message) => {
        console.log('📬 [PRIVATE] Private message received:', message.id, message.content); // DEBUG
        setPrivateMessages((prev) => {
          const key = `${[message.senderId, message.receiverId].sort().join('|')}`;
          const existing = prev[key] || [];
          
          // Check if message with same ID already exists
          const existingMessage = existing.find(m => m.id === message.id);
          
          if (existingMessage) {
            // UPDATE existing message (used for read receipts)
            console.log('🔄 [PRIVATE] Message exists, updating:', message.id, 'readAt:', message.readAt);
            const updated = existing.map((m) =>
              m.id === message.id ? message : m
            );
            return {
              ...prev,
              [key]: updated
            };
          }
          
          // ADD new message
          console.log('➕ [PRIVATE] New message, adding:', message.id);
          return {
            ...prev,
            [key]: [...existing, message]
          };
        });
        
        // Notify that this message needs to be marked as read if currently viewing
        if (!message.readAt) {
          setUnreadMessages((prev) => ({
            ...prev,
            [message.id]: message
          }));
        }
      },
      onPresence: (updatedUsers) => setUsers(updatedUsers),
      onReadReceipt: (receipt) => {
        console.log('📨 [RECEIPT] Read receipt arrived!', {
          messageId: receipt.id,
          senderId: receipt.senderId,
          receiverId: receipt.receiverId,
          readAt: receipt.readAt
        });
        
        // Check if it's a public message (no receiverId) or private message
        if (!receipt.receiverId) {
          // PUBLIC message read receipt
          console.log('📢 [RECEIPT] Public message read receipt for:', receipt.id);
          setPublicMessages((prev) => {
            return prev.map((msg) => {
              if (msg.id === receipt.id) {
                console.log('✅ [RECEIPT] Updated public message:', msg.id, '→ readAt:', receipt.readAt);
                return { ...msg, readAt: receipt.readAt };
              }
              return msg;
            });
          });
        } else {
          // PRIVATE message read receipt
          console.log('💬 [RECEIPT] Private message read receipt for:', receipt.id);
          setPrivateMessages((prev) => {
            // Calculate the conversation key for this receipt
            const receiptKey = `${[receipt.senderId, receipt.receiverId].sort().join('|')}`;
            console.log('🔑 [RECEIPT] Conversation key:', receiptKey);
            console.log('📍 [RECEIPT] Available conversations:', Object.keys(prev));
            
            // Only update if this conversation exists
            if (!prev[receiptKey]) {
              console.log('❌ [RECEIPT] Key not found! Looking for:', receiptKey);
              return prev;
            }
            
            // Create completely new array with updated message
            const updatedArray = prev[receiptKey].map((msg) => {
              if (msg.id === receipt.id) {
                console.log('✅ [RECEIPT] FOUND! Updating message:', msg.id, '→ readAt:', receipt.readAt);
                return { ...msg, readAt: receipt.readAt };
              }
              return msg;
            });
            
            console.log('📊 [RECEIPT] Updated messages:', updatedArray);
            
            // Return new state object
            return { ...prev, [receiptKey]: updatedArray };
          });
        }
      }
    });

    setClient(chatClient);

    return () => disconnectChat(chatClient, user.id);
  }, [token, user]);

  useEffect(() => {
    if (!selectedUser || !token) {
      return;
    }
    if (selectedUser.id === user.id) {
      return;
    }
    const key = `${[user.id, selectedUser.id].sort().join('|')}`;
    fetchPrivateMessages(token, selectedUser.id).then((msgs) => {
      setPrivateMessages((prev) => ({
        ...prev,
        [key]: msgs
      }));
      
      // Mark unread messages from this user as read and update state
      msgs.forEach(msg => {
        if (msg.senderId === selectedUser.id && !msg.readAt) {
          markMessageAsRead(token, msg.id).then((updatedMsg) => {
            // Send read receipt via WebSocket to notify sender IMMEDIATELY
            if (client && client.connected) {
              console.log('Client connected, sending read receipt for message:', updatedMsg.id); // DEBUG
              sendReadReceipt(client, updatedMsg.id);
            } else {
              console.log('Client NOT connected, cannot send read receipt. client:', !!client, 'connected:', client?.connected); // DEBUG
            }
            
            // Update state to reflect that message is now read
            setPrivateMessages((prev) => {
              const updatedMessages = (prev[key] || []).map((m) =>
                m.id === updatedMsg.id ? updatedMsg : m
              );
              return {
                ...prev,
                [key]: updatedMessages
              };
            });
          });
        }
      });
    });
    
    // Also process any real-time unread messages from this user
    Object.values(unreadMessages).forEach(msg => {
      if (msg.senderId === selectedUser.id && !msg.readAt) {
        markMessageAsRead(token, msg.id).then((updatedMsg) => {
          // Remove from unreadMessages
          setUnreadMessages((prev) => {
            const updated = { ...prev };
            delete updated[updatedMsg.id];
            return updated;
          });
          
          // Send read receipt via WebSocket to notify sender IMMEDIATELY
          if (client && client.connected) {
            console.log('Client connected, sending read receipt for message:', updatedMsg.id); // DEBUG
            sendReadReceipt(client, updatedMsg.id);
          } else {
            console.log('Client NOT connected, cannot send read receipt. client:', !!client, 'connected:', client?.connected); // DEBUG
          }
          
          // Update private messages to mark this message as read
          setPrivateMessages((prev) => {
            const updatedMessages = (prev[key] || []).map((m) =>
              m.id === updatedMsg.id ? updatedMsg : m
            );
            return {
              ...prev,
              [key]: updatedMessages
            };
          });
        });
      }
    });
  }, [selectedUser, token, user.id, unreadMessages, client]);

  const privateThread = useMemo(() => {
    if (!selectedUser) {
      return [];
    }
    const key = `${[user.id, selectedUser.id].sort().join('|')}`;
    return privateMessages[key] || [];
  }, [privateMessages, selectedUser, user.id]);

  // Calculate unread public messages count
  const publicUnreadCount = useMemo(() => {
    return publicMessages.filter(m => m.senderId !== user.id && (!m.readByUserIds || !m.readByUserIds.includes(user.id))).length;
  }, [publicMessages, user.id]);

  // Sort users: current user first, then by last message time (recent first)
  const sortedUsers = useMemo(() => {
    if (!user) return users;
    
    const currentUserObj = users.find(u => u.id === user.id);
    const otherUsers = users.filter(u => u.id !== user.id);
    
    // Calculate last message time and unread count for each user
    const usersWithLastMessageTime = otherUsers.map(u => {
      const key = `${[user.id, u.id].sort().join('|')}`;
      const messages = privateMessages[key] || [];
      const lastMessageTime = messages.length > 0 
        ? new Date(messages[messages.length - 1].timestamp).getTime()
        : 0;
      
      // Calculate unread messages from this user based on readAt field
      // A message is unread if it was sent by this user AND has no readAt timestamp
      const unreadCount = messages.filter(m => {
        return m.senderId === u.id && !m.readAt;
      }).length;
      
      return { ...u, lastMessageTime, unreadCount };
    });
    
    // Sort by last message time (recent first)
    usersWithLastMessageTime.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    
    // Put current user first, then sorted users
    return currentUserObj ? [currentUserObj, ...usersWithLastMessageTime] : usersWithLastMessageTime;
  }, [users, user, privateMessages]);

  if (!user) {
    return <div className="auth-page">Loading...</div>;
  }

  const isChatOpen = selectedChat === 'public' || !!selectedUser;

  const handleMessageVisible = async (message) => {
    // Determine if message is private or public based on receiverId
    const isPrivate = message.receiverId !== null && message.receiverId !== undefined;
    const isRead = isPrivate ? message.readAt : (message.readByUserIds?.length > 0);
    
    // Only mark as read if this is a message we received (not our own) and it's not already read
    if (message.senderId === user.id || isRead) {
      console.log('⏭️ Skipping:', message.senderId === user.id ? 'own message' : 'already read');
      return;
    }

    try {
      console.log('📱 [VISIBLE] Message became visible! Marking as read:', message.id, message.content);
      
      // Update based on message type (public vs private)
      let optimisticUpdate;
      if (isPrivate) {
        // For private messages: set readAt timestamp
        optimisticUpdate = { ...message, readAt: new Date().toISOString() };
      } else {
        // For public messages: add current user to readByUserIds
        optimisticUpdate = { 
          ...message, 
          readByUserIds: [...(message.readByUserIds || []), user.id].filter((id, idx, arr) => arr.indexOf(id) === idx) 
        };
      }
      
      // Update state to reflect read status IMMEDIATELY (optimistic update)
      if (selectedUser) {
        const key = `${[user.id, selectedUser.id].sort().join('|')}`;
        console.log('🔄 [VISIBLE] Optimistic update for private:', key, message.id);
        setPrivateMessages((prev) => ({
          ...prev,
          [key]: (prev[key] || []).map((m) =>
            m.id === message.id ? optimisticUpdate : m
          )
        }));
      } else if (selectedChat === 'public') {
        console.log('🔄 [VISIBLE] Optimistic update for public:', message.id);
        setPublicMessages((prev) =>
          prev.map((m) =>
            m.id === message.id ? optimisticUpdate : m
          )
        );
      }
      
      // Send read receipt via WebSocket IMMEDIATELY
      if (client && client.connected) {
        console.log('📤 [VISIBLE] Sending read receipt immediately for message:', message.id);
        sendReadReceipt(client, message.id);
      }
      
      // Then confirm with backend in the background
      const updatedMsg = await markMessageAsRead(token, message.id);
      console.log('✅ [VISIBLE] Backend confirmed read for:', updatedMsg.id, 'readAt:', updatedMsg.readAt);
      
    } catch (err) {
      console.error('❌ [VISIBLE] Error:', err);
    }
  };

  return (
    <div className={`layout ${isMobileView ? 'mobile-layout' : ''}`}>
      <aside className={isMobileView && isChatOpen ? 'mobile-hidden' : ''}>
        <div className="profile">
          <img src={user.picture || 'https://placehold.co/40'} alt={user.name} />
          <div>
            <strong>{user.name}</strong>
          </div>
          <button onClick={logout}>Logout</button>
        </div>
        
        <div style={{ padding: '0' }}>
          <h4 style={{ margin: '0 0 10px 0', padding: '15px 15px 0 15px', textTransform: 'uppercase' }}>Public Space</h4>
          <div style={{ padding: '0 15px 15px 15px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
            <button 
              onClick={() => {
                setSelectedChat('public');
                setSelectedUser(null);
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: selectedChat === 'public' ? '#5B6FDE' : 'transparent',
                color: selectedChat === 'public' ? 'white' : '#333',
                border: selectedChat === 'public' ? 'none' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>📢 Public Chat</span>
              {publicUnreadCount > 0 && (
                <span style={{
                  backgroundColor: selectedChat === 'public' ? 'rgba(255,255,255,0.3)' : '#FF6B6B',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {publicUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <UserList
          users={sortedUsers}
          currentId={user.id}
          selectedId={selectedUser?.id}
          onSelect={(selected) => {
            if (selected.id === user.id) return;
            setSelectedUser(selected);
            setSelectedChat(null);
          }}
        />
      </aside>
      <main className={isMobileView && !isChatOpen ? 'mobile-hidden' : ''}>
        {isMobileView && isChatOpen && (
          <button
            className="mobile-back-btn"
            onClick={() => {
              setSelectedChat(null);
              setSelectedUser(null);
            }}
          >
            ← Back to chats
          </button>
        )}
        {selectedChat === 'public' ? (
          <ChatRoom
            currentId={user.id}
            messages={publicMessages}
            onMessageVisible={handleMessageVisible}
            totalUsers={users.length}
            onSend={(content, replyToId) => {
              if (client && client.connected) {
                const payload = {
                  senderId: user.id,
                  content,
                  type: 'PUBLIC'
                };
                if (replyToId) {
                  payload.replyToId = replyToId;
                }
                sendPublicMessage(client, payload);
              } else {
                console.error('WebSocket not connected');
              }
            }}
          />
        ) : selectedUser ? (
          <PrivateChat
            currentId={user.id}
            selectedUser={selectedUser}
            messages={privateThread}
            onMessageVisible={handleMessageVisible}
            onSend={(content, replyToId) => {
              if (client && client.connected) {
                const payload = {
                  senderId: user.id,
                  receiverId: selectedUser.id,
                  content,
                  type: 'PRIVATE'
                };
                if (replyToId) {
                  payload.replyToId = replyToId;
                }
                sendPrivateMessage(client, payload);
              } else {
                console.error('WebSocket not connected');
              }
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#999' }}>
            <div>
              <h2>Select a chat to start messaging</h2>
              <p>Click on a user or public space to open conversation</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
