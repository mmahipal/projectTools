/**
 * Batch API Endpoint
 * Allows multiple API calls to be batched into a single HTTP request
 * Reduces network overhead and improves performance
 * 
 * This is a simplified implementation that handles specific known endpoints.
 * Can be expanded to handle more endpoints as needed.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * POST /api/batch
 * Execute multiple API requests in a single batch
 * 
 * Request body:
 * {
 *   requests: [
 *     {
 *       method: 'GET',
 *       path: '/welcome/stats',
 *       params: {}
 *     },
 *     {
 *       method: 'GET',
 *       path: '/welcome/activity',
 *       params: {}
 *     }
 *   ]
 * }
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  try {
    const { requests } = req.body;
    
    // Validate request
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Requests array is required and must not be empty' 
      });
    }
    
    // Limit batch size to prevent abuse
    if (requests.length > 20) {
      return res.status(400).json({ 
        success: false,
        error: 'Maximum 20 requests per batch' 
      });
    }
    
    // Helper to call welcome route handlers
    const callWelcomeRoute = async (path, params) => {
      const welcomeRoutes = require('./welcome');
      const mockReq = {
        ...req,
        query: params || {},
        user: req.user
      };
      
      let responseData = null;
      let responseStatus = 200;
      
      const mockRes = {
        status: (code) => {
          responseStatus = code;
          return mockRes;
        },
        json: (data) => {
          responseData = data;
          return mockRes;
        }
      };
      
      // Route to appropriate handler
      if (path === '/stats') {
        const handler = welcomeRoutes.stack.find(layer => 
          layer.route && layer.route.path === '/stats' && layer.route.methods.get
        );
        if (handler) {
          await new Promise((resolve, reject) => {
            handler.route.stack[0].handle(mockReq, mockRes, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      } else if (path === '/activity') {
        const handler = welcomeRoutes.stack.find(layer => 
          layer.route && layer.route.path === '/activity' && layer.route.methods.get
        );
        if (handler) {
          await new Promise((resolve, reject) => {
            handler.route.stack[0].handle(mockReq, mockRes, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      } else if (path === '/system-status') {
        const handler = welcomeRoutes.stack.find(layer => 
          layer.route && layer.route.path === '/system-status' && layer.route.methods.get
        );
        if (handler) {
          await new Promise((resolve, reject) => {
            handler.route.stack[0].handle(mockReq, mockRes, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      } else if (path === '/recommendations') {
        const handler = welcomeRoutes.stack.find(layer => 
          layer.route && layer.route.path === '/recommendations' && layer.route.methods.get
        );
        if (handler) {
          await new Promise((resolve, reject) => {
            handler.route.stack[0].handle(mockReq, mockRes, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      } else {
        throw new Error(`Unknown welcome route: ${path}`);
      }
      
      return { status: responseStatus, data: responseData };
    };
    
    // Execute requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (reqConfig, index) => {
        try {
          const { method = 'GET', path, params = {} } = reqConfig;
          
          // Validate path
          if (!path || typeof path !== 'string') {
            throw new Error(`Invalid path for request ${index}`);
          }
          
          // Route to appropriate handler based on path prefix
          if (path.startsWith('/welcome/')) {
            const welcomePath = path.replace('/welcome', '');
            const result = await callWelcomeRoute(welcomePath, params);
            return {
              index,
              success: true,
              status: result.status,
              data: result.data
            };
          } else {
            // For now, only welcome routes are supported
            // Can be expanded to support other routes
            throw new Error(`Unsupported batch path: ${path}. Only /welcome/* routes are currently supported.`);
          }
        } catch (error) {
          return {
            index,
            success: false,
            status: 500,
            error: error.message || 'Unknown error'
          };
        }
      })
    );
    
    // Format results
    const formattedResults = results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          index: result.value?.index || -1,
          success: false,
          status: 500,
          error: result.reason?.message || 'Request failed'
        };
      }
    });
    
    res.json({
      success: true,
      results: formattedResults
    });
  } catch (error) {
    console.error('[Batch API] Error processing batch request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process batch request'
    });
  }
}));

module.exports = router;
