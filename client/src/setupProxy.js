const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const https = require('https');

// Create HTTP agent with extended timeout for bulk operations
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  timeout: 600000, // 10 minutes
  maxSockets: 50,
  maxFreeSockets: 10
});

module.exports = function(app) {
  // Get backend URL from environment variable or use proper defaults
  const getBackendUrl = () => {
    if (process.env.REACT_APP_BACKEND_URL) {
      return process.env.REACT_APP_BACKEND_URL;
    }
    // In production, default to ptools.appen.com (likely behind reverse proxy)
    // In development, use localhost
    if (process.env.NODE_ENV === 'production') {
      // In production, if behind reverse proxy, backend is on same hostname
      // Otherwise use environment variable or default to ptools.appen.com
      return process.env.REACT_APP_BACKEND_HOST 
        ? `https://${process.env.REACT_APP_BACKEND_HOST}`
        : 'https://ptools.appen.com';
    }
    return 'http://localhost:5000';
  };
  
  const backendUrl = getBackendUrl();
  
  // Enhanced proxy configuration with better error handling and timeout
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      agent: httpAgent, // Use custom agent with extended timeout
      // IMPORTANT: When using app.use('/api', ...), http-proxy-middleware DOES strip the matched path.
      // So /api/health becomes /health when forwarded to the backend.
      // We need to add /api prefix back: /health -> /api/health
      // The pathRewrite function receives the path AFTER the matched prefix is stripped.
      // So /api/auth/login becomes /auth/login, and we need to rewrite it to /api/auth/login
      pathRewrite: function (path, req) {
        // The path is stripped by app.use('/api', ...), so /api/health becomes /health
        // We need to add /api prefix back: /health -> /api/health
        
        // Safety check: if path already has /api, don't add it again
        if (path && path.startsWith('/api')) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Path already has /api prefix (unexpected):', path);
          }
          return path; // Already has /api, don't add it again
        }
        
        // Add /api prefix back
        return '/api' + (path || '');
      },
      // Timeout configuration - CRITICAL: These must be set correctly
      // The timeout option controls how long to wait for the target server to respond
      timeout: 600000, // 10 minutes - wait for target server response
      proxyTimeout: 600000, // 10 minutes - total proxy operation timeout
      // Note: socketTimeout is not a valid option for http-proxy-middleware
      // The agent timeout above handles socket-level timeouts
      logLevel: 'debug', // Enable debug logging to see what's being forwarded
      
      // Additional configuration to prevent timeouts
      xfwd: true, // Forward X-Forwarded-* headers
      secure: process.env.NODE_ENV === 'production', // Verify SSL in production
      followRedirects: true,
      onError: (err, req, res) => {
        console.error('Proxy error:', {
          message: err.message,
          code: err.code,
          url: req.url,
          method: req.method,
          syscall: err.syscall,
          address: err.address,
          port: err.port
        });
        
        // Send a proper JSON error response (not HTML)
        // Handle backend unavailability gracefully - don't crash frontend
        if (!res.headersSent) {
          // Check if it's a connection error (backend down/restarting)
          if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET') {
            res.status(503).json({
              error: 'Service Unavailable',
              message: 'Backend server is not available. It may be restarting. Please try again in a moment.',
              code: err.code,
              isBackendDown: true
            });
          } else {
            res.status(502).json({
              error: 'Bad Gateway',
              message: process.env.NODE_ENV === 'development'
                ? 'Unable to connect to backend server. Please ensure the server is running.'
                : 'Unable to connect to backend server. Please check your network connection or contact support.',
              code: err.code,
              details: process.env.NODE_ENV === 'development' ? {
                message: err.message,
                syscall: err.syscall,
                address: err.address,
                port: err.port
              } : undefined
            });
          }
        }
      },
      onProxyReq: (proxyReq, req, res) => {
        // CRITICAL: Set timeout on the actual HTTP request object
        // This must be done BEFORE the request is sent
        const isBulkImport = req.url && req.url.includes('bulk-import');
        
        if (isBulkImport) {
          // Set timeout on the proxy request socket
          if (proxyReq.socket) {
            proxyReq.socket.setTimeout(600000); // 10 minutes
            proxyReq.socket.setKeepAlive(true);
          }
          
          // Set timeout on the proxy request itself
          proxyReq.setTimeout(600000, () => {
            console.error('[Proxy] Proxy request timeout after 10 minutes');
            if (!res.headersSent) {
              res.status(504).json({
                error: 'Gateway Timeout',
                message: 'Proxy request timed out after 10 minutes'
              });
            }
          });
          
          // Set timeout on the response socket
          if (res.socket) {
            res.socket.setTimeout(600000); // 10 minutes
            res.socket.setKeepAlive(true);
          }
          
          // Set timeout on the response
          res.setTimeout(600000, () => {
            console.error('[Proxy] Response timeout after 10 minutes');
            if (!res.headersSent) {
              res.status(504).json({
                error: 'Gateway Timeout',
                message: 'Response timed out after 10 minutes'
              });
            }
          });
          
          if (process.env.NODE_ENV === 'development') {
            // Extended timeout for bulk-import request
            // Request details:
              url: req.url,
              method: req.method,
              contentLength: req.headers['content-length'],
              hasBody: !!req.body
            });
          }
        } else {
          // Default timeout for other requests
          proxyReq.setTimeout(600000);
          if (proxyReq.socket) {
            proxyReq.socket.setTimeout(600000);
          }
        }
        
        // Log proxy requests in development
        if (process.env.NODE_ENV === 'development') {
          // Proxying request
            method: req.method,
            url: req.url,
            target: backendUrl,
            timestamp: new Date().toISOString(),
            isBulkImport
          });
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // For bulk-import, set timeout on response socket
        if (req.url && req.url.includes('bulk-import')) {
          if (res.socket) {
            res.socket.setTimeout(600000); // 10 minutes
          }
        }
        
        // Log proxy responses in development
        if (process.env.NODE_ENV === 'development') {
          // Proxy response
            status: proxyRes.statusCode,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
          });
        }
      },
      onTimeout: (req, res) => {
        console.error('Proxy timeout:', {
          url: req.url,
          method: req.method
        });
        
        if (!res.headersSent) {
          res.status(504).json({
            error: 'Gateway Timeout',
            message: process.env.NODE_ENV === 'development'
              ? 'Backend server did not respond in time. Please ensure the server is running.'
              : 'Backend server did not respond in time. Please check your network connection or try again later.',
            url: req.url,
            method: req.method
          });
        }
      }
    })
  );
};
