import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://cipherapp-1.onrender.com';

export const connectChat = ({ token, userId, onPublic, onPrivate, onPresence, onReadReceipt }) => {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
    connectHeaders: { Authorization: `Bearer ${token}` },
    debug: () => {},
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe('/topic/public', (message) => onPublic(JSON.parse(message.body)));
      client.subscribe('/topic/presence', (message) => onPresence(JSON.parse(message.body)));
      client.subscribe('/user/queue/messages', (message) => onPrivate(JSON.parse(message.body)));
      client.subscribe('/user/queue/read-receipts', (message) => onReadReceipt(JSON.parse(message.body)));
      client.publish({
        destination: '/app/chat.addUser',
        body: JSON.stringify({ senderId: userId })
      });
    }
  });

  client.activate();
  return client;
};

export const sendPublicMessage = (client, payload) => {
  client.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
};

export const sendPrivateMessage = (client, payload) => {
  client.publish({ destination: '/app/chat.private', body: JSON.stringify(payload) });
};

export const sendReadReceipt = (client, messageId, senderEmail, receiverEmail) => {
  // Only send messageId - backend extracts user from JWT
  const payload = {
    id: messageId
  };
  console.log('📤 [SEND_RECEIPT] Publishing to /app/chat.read-receipt:', JSON.stringify(payload));
  client.publish({
    destination: '/app/chat.read-receipt',
    body: JSON.stringify(payload)
  });
  console.log('✅ [SEND_RECEIPT] Published successfully');
};

export const subscribeToReadReceipts = (client, onReadReceipt) => {
  return client.subscribe('/user/queue/read-receipts', (message) => {
    const receipt = JSON.parse(message.body);
    onReadReceipt(receipt);
  });
};

export const disconnectChat = (client, userId) => {
  if (client && client.connected) {
    client.publish({ destination: '/app/chat.disconnect', body: JSON.stringify({ senderId: userId }) });
  }
  if (client) {
    client.deactivate();
  }
};
