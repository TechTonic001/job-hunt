import axios from 'axios';
import { auth } from '../services/firebase';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to inject Firebase ID token as Bearer token
axiosClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error retrieving Firebase ID token:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error propagation
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosClient;
