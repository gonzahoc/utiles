// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://stipa.org.ar:3001:3001/api';

const login = (mail, pass) => {
  return axios.post(`${API_URL}/login`, { mail, pass });
};

export { login };
