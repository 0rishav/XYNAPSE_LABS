import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { navigateTo } from "../utils/navigateHelper";
import { useAuthStore } from "../store/useAuthStore";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// 1. Main Instance (Saari protected calls ke liye)
const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Plain Instance (Sirf Refresh Token call ke liye - taaki interceptor loop na bane)
const plainAxios = axios.create({
  baseURL,
  withCredentials: true,
});

// --- REFRESH LOGIC STATE ---
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// --- AUTH PAGE HELPER ---
const isAuthPage = () => {
  if (typeof window === "undefined") return false;
  const p = (window.location?.pathname || "").toLowerCase();
  const authPaths = [
    "/login",
    "/signup",
    "/verification",
    "/forgot-password",
    "/otp",
    "/session-expired",
  ];
  return authPaths.some((ap) => p === ap || p.startsWith(`${ap}/`));
};

// --- INTERCEPTOR: RESPONSE ---
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Network error ya no response
    if (!error.response) return Promise.reject(error);

    const status = error.response.status;
    const url = String(originalRequest.url || "").toLowerCase();

    const isAuthEndpoint =
      url.includes("/auth/refresh-token") ||
      url.includes("/auth/login") ||
      url.includes("/auth/logout");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await plainAxios.post("/auth/refresh-token");

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        useAuthStore.getState().logout();

        if (!isAuthPage()) {
          navigateTo("/login", { replace: true });
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export { plainAxios };
export default api;
