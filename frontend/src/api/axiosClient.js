import axios from 'axios';
import { auth } from '../services/firebase.js';

// Normalize base URL to prevent duplicate '/api/api' pathing if env contains '/api'
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const baseURL = rawBaseUrl.replace(/\/api\/?$/, '');

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach Firebase ID token
axiosClient.interceptors.request.use(
  async (config) => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;
