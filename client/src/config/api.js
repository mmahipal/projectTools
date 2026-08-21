import axios from 'axios';

// In development, use relative URL to go through proxy (avoids CORS)
// In production, use full URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : '/api');

// Backend health check with retry logic
let backendHealthCheckPromise = null;
let lastHealthCheck = null;
const HEALTH_CHECK_CACHE_MS = 5000; // Cache health check for 5 seconds

const checkBackendHealthWithCache = async () => {
  const now = Date.now();
  
  // Return cached result if available and recent
  if (lastHealthCheck && (now - lastHealthCheck.timestamp) < HEALTH_CHECK_CACHE_MS) {
    return lastHealthCheck.isHealthy;
  }
  
  // If a health check is already in progress, wait for it
  if (backendHealthCheckPromise) {
    return backendHealthCheckPromise;
  }
  
  // Start new health check
  backendHealthCheckPromise = (async () => {
    try {
      // Health check endpoint - use relative path to go through proxy
      const healthUrl = process.env.NODE_ENV === 'production' ? '/api/health' : '/api/health';
      const response = await axios.get(healthUrl, {
        timeout: 3000,
        validateStatus: (status) => status === 200
      });
      lastHealthCheck = { isHealthy: true, timestamp: now };
      return true;
    } catch (error) {
      lastHealthCheck = { isHealthy: false, timestamp: now };
      return false;
    } finally {
      backendHealthCheckPromise = null;
    }
  })();
  
  return backendHealthCheckPromise;
};

// Request deduplication - prevent duplicate concurrent requests
const pendingRequests = new Map();

/**
 * Generate a unique key for a request based on method, URL, and params
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} params - Request parameters
 * @param {object} data - Request body data
 * @returns {string} Unique request key
 */
const generateRequestKey = (method, url, params = {}, data = null) => {
  // Sort params for consistent key generation
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  // Include data in key for POST/PUT/PATCH requests
  const dataStr = data ? JSON.stringify(data) : '';
  
  return `${method.toUpperCase()}:${url}:${sortedParams}:${dataStr}`;
};

/**
 * Deduplicate requests - if a request with the same key is already pending, return that promise
 * @param {string} key - Request key
 * @param {Function} requestFn - Function that makes the actual request
 * @returns {Promise} The pending request promise or a new one
 */
const deduplicateRequest = (key, requestFn) => {
  // If request already pending, return the same promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  // Create new request promise
  const promise = requestFn()
    .finally(() => {
      // Clean up after request completes (success or failure)
      pendingRequests.delete(key);
    });
  
  // Store the promise
  pendingRequests.set(key, promise);
  
  return promise;
};

// CSRF token management
let csrfToken = null;
let csrfTokenPromise = null;

// Function to clear CSRF token cache (called after login)
export const clearCsrfTokenCache = () => {
  csrfToken = null;
  csrfTokenPromise = null;
};

const getCsrfToken = async () => {
  // Return cached token if available
  if (csrfToken) {
    return csrfToken;
  }
  
  // If a token fetch is already in progress, wait for it
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }
  
  // Fetch new CSRF token
  csrfTokenPromise = (async () => {
    try {
      // Use the proxy path - the proxy will forward /api/* to the backend
      const response = await axios.get('/api/csrf-token', {
        baseURL: '', // Use empty baseURL to use relative path (goes through proxy)
        timeout: 5000,
        withCredentials: false // Don't send credentials for CSRF token fetch
      });
      if (response.data && response.data.csrfToken) {
        csrfToken = response.data.csrfToken;
        return csrfToken;
      } else if (response.data && response.data.success && response.data.csrfToken) {
        csrfToken = response.data.csrfToken;
        return csrfToken;
      } else {
        console.warn('CSRF token response missing token:', response.data);
        return null;
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
      // Return null if token fetch fails (will retry on next request)
      return null;
    } finally {
      csrfTokenPromise = null;
    }
  })();
  
  return csrfTokenPromise;
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Remove withCredentials to avoid CORS issues - server CORS is configured correctly
  // withCredentials: true,
  timeout: 120000, // 120 second timeout (increased for Salesforce API calls, especially KPIs)
});

// Request interceptor to add auth token and CSRF token
// Also automatically converts GET requests with GPC parameters to POST to avoid 414 errors
apiClient.interceptors.request.use(
  async (config) => {
    // TEST: Verify interceptor is running (remove after debugging)
    if (config.url?.includes('/workstream/')) {
    }
    
    const originalMethod = config.method?.toUpperCase();
    const originalUrl = config.url;
    
    // CRITICAL: ALWAYS remove GPC parameters from workstream endpoints FIRST
    // Workstream management is excluded from GPC filtering
    const isWorkstreamEndpoint = originalUrl?.includes('/workstream/');
    
    if (isWorkstreamEndpoint) {
      // Check for GPC parameters in multiple places
      const hasGpcInUrl = originalUrl?.includes('gpc_accounts=') || originalUrl?.includes('gpc_projects=');
      const hasGpcInParams = config.params?.gpc_accounts || config.params?.gpc_projects;
      const hasGpcInData = config.data && typeof config.data === 'object' && (config.data.gpc_accounts || config.data.gpc_projects);
      
      if (hasGpcInUrl || hasGpcInParams || hasGpcInData) {
        console.warn('[API Client] ⚠️ REMOVING GPC PARAMETERS FROM WORKSTREAM ENDPOINT');
        
        // Remove from URL query string
        if (hasGpcInUrl && originalUrl?.includes('?')) {
          const urlParts = originalUrl.split('?');
          const baseUrl = urlParts[0];
          const queryString = urlParts[1] || '';
          
          if (queryString) {
            const params = new URLSearchParams(queryString);
            params.delete('gpc_accounts');
            params.delete('gpc_projects');
            const cleanQueryString = params.toString();
            config.url = cleanQueryString ? `${baseUrl}?${cleanQueryString}` : baseUrl;
          } else {
            config.url = baseUrl;
          }
        }
        
        // Remove from config.params
        if (hasGpcInParams && config.params) {
          delete config.params.gpc_accounts;
          delete config.params.gpc_projects;
        }
        
        // Remove from config.data
        if (hasGpcInData && config.data && typeof config.data === 'object') {
          delete config.data.gpc_accounts;
          delete config.data.gpc_projects;
        }
      }
    }
    
    
    // PERMANENT FIX: Convert GET requests with GPC parameters to POST to avoid 414 URI Too Long errors
    // This happens at the proxy/server level before the request reaches our Express server
    // (Only for non-workstream endpoints)
    if (!isWorkstreamEndpoint && originalMethod === 'GET' && originalUrl) {
      const hasGpcParams = originalUrl.includes('gpc_accounts=') || originalUrl.includes('gpc_projects=');
      
      if (hasGpcParams) {
        // Converting GET request with GPC parameters to POST
        
        // Parse query string from URL
        const urlParts = originalUrl.split('?');
        const baseUrl = urlParts[0];
        const queryString = urlParts[1] || '';
        
        // Parse query parameters
        const params = new URLSearchParams(queryString);
        const bodyParams = {};
        
        // Extract all parameters
        params.forEach((value, key) => {
          bodyParams[key] = value;
        });
        
        // Change method to POST
        config.method = 'POST';
        config.url = baseUrl; // Remove query string from URL
        config.data = bodyParams; // Put parameters in request body
        
        // Converted GET request with GPC parameters to POST
      }
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for state-changing requests (POST, PUT, DELETE, PATCH)
    // Skip CSRF for auth endpoints and GET requests
    if (!config.url?.includes('/auth/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
      try {
        const csrf = await getCsrfToken();
        if (csrf) {
          config.headers['X-CSRF-Token'] = csrf;
        }
      } catch (error) {
        console.warn('Failed to get CSRF token for request:', error);
      }
    }
    
    // Request details logging removed for production
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Use the cached health check function
const checkBackendHealth = checkBackendHealthWithCache;

// Export health check function for use in other modules
export { checkBackendHealth };

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 504 Gateway Timeout errors
    if (error.response?.status === 504 || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      const url = error.config?.url || '';
      console.error('Backend connection error:', {
        status: error.response?.status,
        code: error.code,
        message: error.message,
        url: url
      });
      
      // Provide more helpful error message based on environment
      const isDevelopment = process.env.NODE_ENV === 'development';
      const errorMsg = isDevelopment 
        ? 'Backend server is not responding. Please ensure the server is running.'
        : 'Unable to connect to the server. Please check your network connection or contact support if the issue persists.';
      
      error.message = errorMsg;
      error.isBackendDown = true;
      error.userMessage = errorMsg;
    }
    
    // Handle 404 errors - check if backend is ready
    if (error.response?.status === 404) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/');
      
      // For auth endpoints, check if backend is ready
      if (isAuthEndpoint) {
        const isHealthy = await checkBackendHealth();
        if (!isHealthy) {
          const isDevelopment = process.env.NODE_ENV === 'development';
          const errorMsg = isDevelopment
            ? 'Backend server is not responding. Please ensure the server is running.'
            : 'Unable to connect to the server. Please check your network connection or contact support if the issue persists.';
          console.error('Backend is not responding:', errorMsg);
          error.message = errorMsg;
          error.isBackendDown = true;
        } else {
          console.error('404 on auth endpoint - route may not be registered:', url);
          error.message = `Route not found: ${url}. Please check that the backend server has restarted and routes are registered.`;
        }
      }
    }
    
    // Handle network errors (server not running, CORS blocked, etc.)
    if (!error.response) {
      const url = error.config?.url || '';
      const baseURL = error.config?.baseURL || API_BASE_URL;
      const fullURL = `${baseURL}${url}`;
      
      console.error('Network error - request did not reach server:', {
        url: url,
        fullURL: fullURL,
        baseURL: baseURL,
        message: error.message,
        code: error.code,
        name: error.name
      });
      
      // Check if it's a CORS error
      if (error.message && (
        error.message.includes('CORS') || 
        error.message.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ERR_BLOCKED_BY_CLIENT'
      )) {
        console.error('CORS or network blocking detected. Check:');
        console.error('1. Server is running and accessible');
        console.error('2. CORS is configured correctly on server');
        console.error('3. Browser is not blocking the request');
        console.error('4. Request URL:', fullURL);
      }
      
      const isAuthEndpoint = url.includes('/auth/');
      
      // For login/verify endpoints, provide helpful error message
      if (isAuthEndpoint && (url.includes('/login') || url.includes('/verify'))) {
        // Don't show error toast for network errors on login - let the component handle it
        // The error will be caught in the login function and shown there
      }
      
      return Promise.reject(error);
    }
    
    // Handle CSRF token errors - refresh token and retry
    if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
      // Clear cached CSRF token and retry once
      csrfToken = null;
      const originalRequest = error.config;
      
      // Only retry if we haven't already retried
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newCsrfToken = await getCsrfToken();
          if (newCsrfToken && originalRequest.headers) {
            originalRequest.headers['X-CSRF-Token'] = newCsrfToken;
            return apiClient(originalRequest);
          }
        } catch (csrfError) {
          console.error('Failed to refresh CSRF token:', csrfError);
        }
      }
    }
    
    if (error.response?.status === 401) {
      // Check if this is a Salesforce endpoint error (invalid Salesforce credentials)
      // vs an auth endpoint error (invalid user token)
      const url = error.config?.url || '';
      const isSalesforceEndpoint = url.includes('/salesforce/');
      const isAuthEndpoint = url.includes('/auth/');
      
      // Only redirect to login if it's an auth endpoint error (user token invalid)
      // Salesforce 401 errors should not redirect - they're just invalid Salesforce credentials
      if (isAuthEndpoint && !isSalesforceEndpoint) {
        // Token expired or invalid - redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // For Salesforce endpoints, just return the error without redirecting
    }
    return Promise.reject(error);
  }
);

// Wrap apiClient methods to add request deduplication
// This prevents duplicate concurrent requests for the same endpoint/params
const originalGet = apiClient.get.bind(apiClient);
const originalPost = apiClient.post.bind(apiClient);
const originalPut = apiClient.put.bind(apiClient);
const originalPatch = apiClient.patch.bind(apiClient);
const originalDelete = apiClient.delete.bind(apiClient);

// Override GET method to add deduplication
apiClient.get = function(url, config = {}) {
  const method = 'GET';
  const params = config.params || {};
  const requestKey = generateRequestKey(method, url, params, null);
  
  return deduplicateRequest(requestKey, () => {
    return originalGet(url, config);
  });
};

// Override POST method to add deduplication (for idempotent POSTs)
apiClient.post = function(url, data, config = {}) {
  const method = 'POST';
  const params = config.params || {};
  const requestKey = generateRequestKey(method, url, params, data);
  
  // Only deduplicate if explicitly marked as idempotent
  // Most POSTs should not be deduplicated (they're mutations)
  if (config._deduplicate === true) {
    return deduplicateRequest(requestKey, () => {
      return originalPost(url, data, config);
    });
  }
  
  return originalPost(url, data, config);
};

// Keep PUT, PATCH, DELETE as-is (they're mutations, shouldn't be deduplicated)
apiClient.put = originalPut;
apiClient.patch = originalPatch;
apiClient.delete = originalDelete;

export default apiClient;
export { getCsrfToken };




