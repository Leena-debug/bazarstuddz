import axios from 'axios';

const API_URL = 'http://192.168.1.73:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response success:', response.status);
    return response;
  },
  (error) => {
    console.log('API Error:', error.message);
    return Promise.reject(error);
  }
);

export default api;