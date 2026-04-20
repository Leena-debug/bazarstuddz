import axios from 'axios';

// IMPORTANT: Replace with your computer's IP address from ipconfig
// DO NOT use localhost or 127.0.0.1 (they won't work on your phone)
const API_URL = 'http://192.168.1.70:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;