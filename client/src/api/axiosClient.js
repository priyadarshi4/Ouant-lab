import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("pql_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retry) {
      const refreshToken = localStorage.getItem("pql_refresh_token");
      if (!refreshToken) return Promise.reject(error);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, config });
        });
      }

      config._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${axiosClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem("pql_access_token", data.accessToken);
        queue.forEach(({ resolve, config: c }) => {
          c.headers.Authorization = `Bearer ${data.accessToken}`;
          resolve(axiosClient(c));
        });
        queue = [];
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosClient(config);
      } catch (refreshErr) {
        localStorage.removeItem("pql_access_token");
        localStorage.removeItem("pql_refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
