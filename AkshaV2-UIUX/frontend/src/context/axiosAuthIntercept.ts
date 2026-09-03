import axios from "axios";

axios.interceptors.request.use(
  (config) => {
    const token = process.env.REACT_APP_DEFAULT_JWT_TOKEN;
    if (token) {
      config.headers
        ? (config.headers.Authorization = `Bearer ${token}`)
        : (config.headers = { Authorization: `Bearer ${token}` });
    }
    // console.log("Axios intercept", config.url, config.headers);
    return config;
  },
  (error) => {
    console.error("Axios intercept error", error);
    return Promise.reject(error);
  }
);

export default axios;
