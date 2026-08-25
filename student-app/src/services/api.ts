import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nova_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.includes("/auth/");
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("nova_token");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;