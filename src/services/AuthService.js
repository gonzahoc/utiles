import axios from 'axios';

const API_URL = './api'; // URL del backend en el subdominio

const testAPI = (mail, pass) => {
  return axios.get(`${API_URL}`);//, { mail, pass }, { withCredentials: true });
};
const login = (mail, pass) => {
  return axios.post(`${API_URL}/login`, { mail, pass }, { withCredentials: true });
};

const register = (userData) => {
  return axios.post(`${API_URL}/register`, userData);
};

const submitForm = (formData) => {
  return axios.post(`${API_URL}/formulario`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Asegúrate de que 'login' esté exportado correctamente
export { login, register, submitForm, testAPI };
