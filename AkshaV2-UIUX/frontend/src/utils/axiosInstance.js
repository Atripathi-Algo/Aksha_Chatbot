import axios from 'axios';

console.log('Using base URL:', process.env.REACT_APP_AUTHENCTICATE_USER);

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_AUTHENCTICATE_USER, // Use the new base URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
