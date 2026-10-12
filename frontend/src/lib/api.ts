import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const api = axios.create({
  // Use the backend URL configured for your environment.
  // For local development, the backend runs on HTTP port 5000.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Must match the key used by AuthContext.tsx.
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.error(
        "Authentication failed. The backend rejected the request.",
        error.response?.data
      );

      // Clear the session because the server rejected the token.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // Redirect only if the current page is not already the login page.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;