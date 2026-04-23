import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL;
console.log(BASE_URL, 'BASE_URL');

const axiosClient = axios.create({
  baseURL: `${BASE_URL}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

export default axiosClient;
