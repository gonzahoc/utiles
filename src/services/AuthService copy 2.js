// src/services/AuthService.js
import axios from 'axios';

const API_URL = 'localhost:3001/api';

const login = (mail, pass) => {
  return axios.post(`${API_URL}/login`, { mail, pass });
};

export { login };
