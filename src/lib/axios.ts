import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor — log 401s. NextAuth handles redirects, we do NOT redirect here.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("[axios] 401 Unauthorized — session may have expired.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
