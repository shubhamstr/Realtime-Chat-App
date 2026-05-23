import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

export default axiosClient;
