import axios from 'axios';

// Use your machine's IP + backend port
const API_URL = 'http://192.168.1.6:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
