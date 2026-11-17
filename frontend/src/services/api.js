import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Send the login cookie to the backend and let the browser store the new one.
  withCredentials: true,
});

export default api;
