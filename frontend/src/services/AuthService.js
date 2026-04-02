import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://cipherapp-1.onrender.com';

export const fetchMe = async (token) => {
  const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const fetchUsers = async (token) => {
  const res = await axios.get(`${BACKEND_URL}/api/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const fetchPublicMessages = async (token) => {
  const res = await axios.get(`${BACKEND_URL}/api/messages/public`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const fetchPrivateMessages = async (token, userId) => {
  const res = await axios.get(`${BACKEND_URL}/api/messages/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const markMessageAsRead = async (token, messageId) => {
  try {
    console.log('Calling markMessageAsRead API for message:', messageId); // DEBUG
    const res = await axios.post(`${BACKEND_URL}/api/messages/${messageId}/mark-as-read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('markMessageAsRead response:', res.data); // DEBUG
    return res.data; // Return the updated message from backend
  } catch (e) {
    console.error('Failed to mark message as read:', e.message);
    throw e;
  }
};

export const googleLoginUrl = `${BACKEND_URL}/oauth2/authorization/google`;
