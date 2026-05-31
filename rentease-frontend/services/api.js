import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && window.localStorage) {
    const token = localStorage.getItem("re_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("re_token");
      localStorage.removeItem("role");
      localStorage.removeItem("re_role");
      localStorage.removeItem("re_username");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
