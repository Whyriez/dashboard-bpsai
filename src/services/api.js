const API_BASE_URL = "http://127.0.0.1:5001/api";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const apiFetch = async (endpoint, options = {}) => {
  let token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    // Jika token hangus (401), coba refresh
    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          // Jika refresh token tidak ada, langsung logout
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          return Promise.reject(new Error("Sesi tidak valid."));
        }

        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${refreshToken}` }
          });
          
          const refreshData = await refreshResponse.json();
          
          if (!refreshResponse.ok) throw new Error("Sesi berakhir.");

          const newAccessToken = refreshData.access_token;
          localStorage.setItem('access_token', newAccessToken);
          isRefreshing = false;
          processQueue(null, newAccessToken);

          // Ulangi request yang gagal dengan token baru
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers }).then(res => res.json());

        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // Jika sedang ada proses refresh lain, tunggu promise-nya selesai
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        }).then(newToken => {
            headers['Authorization'] = `Bearer ${newToken}`;
            return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers }).then(res => res.json());
        });
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Terjadi kesalahan pada server');
    }
    
    return response.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
};

export default apiFetch;