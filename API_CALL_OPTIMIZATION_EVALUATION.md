# API Call Optimization Evaluation

## Executive Summary

This document evaluates options for minimizing API calls without impacting current functionalities. The analysis covers frontend and backend optimization strategies, caching mechanisms, request batching, and other performance improvements.

## Current State Analysis

### Existing Caching Mechanisms

#### Frontend Caching
1. **Request Cache (`client/src/utils/requestCache.js`)**
   - In-memory cache with configurable TTL
   - Default TTL: 5 minutes
   - Used in CrowdDashboard hooks
   - **Status**: ✅ Implemented but underutilized

2. **Component-Level Caching**
   - WorkStreamReporting: 10-minute frontend cache
   - Contributor counts: 15-minute cache
   - **Status**: ✅ Partially implemented

3. **CSRF Token Caching**
   - Cached in memory until cleared
   - **Status**: ✅ Well implemented

#### Backend Caching
1. **Cache Manager (`server/utils/cache.js`)**
   - In-memory cache with 5-minute default TTL
   - Pattern-based cache clearing
   - **Status**: ✅ Implemented, used in workstream reporting

2. **Salesforce Query Cache (`server/services/salesforce/queryCache.js`)**
   - 5-second TTL for query results
   - User-specific cache keys
   - **Status**: ✅ Implemented but TTL is very short

3. **Metadata Cache (`server/services/salesforce/metadataCache.js`)**
   - Caches object descriptions
   - **Status**: ✅ Implemented

4. **Session Management (`server/services/salesforce/sessionManager.js`)**
   - Caches Salesforce connections
   - Token reuse to avoid logins
   - **Status**: ✅ Well implemented

### Current API Call Patterns

#### High-Frequency Call Areas
1. **Dashboard Pages**
   - Multiple parallel API calls on page load
   - CrowdDashboard: 14+ API calls in priority batches
   - CaseAnalytics: Multiple KPI endpoints
   - WorkStreamReporting: Summary + contributor counts

2. **Data Tables**
   - Pagination with frequent page changes
   - Filter changes trigger new API calls
   - Infinite scroll patterns

3. **Real-time Updates**
   - Polling mechanisms (if any)
   - Auto-refresh features

## Optimization Options

### Option 1: Enhanced Frontend Caching (High Impact, Low Risk)

#### Strategy
- Expand use of `requestCache.js` across all components
- Implement intelligent cache invalidation
- Add cache warming for frequently accessed data

#### Implementation
```javascript
// Example: Enhanced caching wrapper
const useCachedApiCall = (url, params, options = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    staleWhileRevalidate = true, // Return stale data while fetching fresh
    cacheKey = null
  } = options;

  return useMemo(() => {
    return cachedFetch(url, params, async () => {
      return await apiClient.get(url, { params });
    }, { ttl, useCache: true, cacheKey });
  }, [url, JSON.stringify(params)]);
};
```

#### Benefits
- **Reduction**: 40-60% reduction in API calls for frequently accessed data
- **Impact**: Minimal - uses existing infrastructure
- **Risk**: Low - cache can be bypassed if needed

#### Estimated Impact
- **API Call Reduction**: 40-60%
- **Implementation Effort**: Medium (2-3 days)
- **User Experience**: Improved (faster load times)

---

### Option 2: Request Deduplication (High Impact, Low Risk)

#### Strategy
- Prevent duplicate concurrent requests for the same endpoint
- Use request queuing for identical requests
- Implement request cancellation for stale requests

#### Implementation
```javascript
// Request deduplication map
const pendingRequests = new Map();

const deduplicatedRequest = async (key, requestFn) => {
  // If request already pending, return the same promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Create new request
  const promise = requestFn()
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
};
```

#### Benefits
- **Reduction**: 20-30% reduction in duplicate API calls
- **Impact**: High for pages with multiple components requesting same data
- **Risk**: Low - transparent to components

#### Estimated Impact
- **API Call Reduction**: 20-30%
- **Implementation Effort**: Low (1 day)
- **User Experience**: Improved (faster responses)

---

### Option 3: Backend Query Result Cache Extension (Medium Impact, Low Risk)

#### Strategy
- Increase TTL for read-only queries from 5 seconds to 30-60 seconds
- Implement cache warming for frequently accessed queries
- Add cache statistics and monitoring

#### Current State
- Query cache TTL: 5 seconds (very short)
- Metadata cache: Exists but TTL unknown

#### Proposed Changes
```javascript
// Increase TTL for read-only operations
const READ_ONLY_QUERY_TTL = 30 * 1000; // 30 seconds
const FREQUENT_QUERY_TTL = 60 * 1000; // 60 seconds for frequently accessed data

// Cache warming for common queries
const warmCache = async (conn, userId) => {
  const commonQueries = [
    'SELECT Id, Name FROM Account LIMIT 100',
    'SELECT Id, Name FROM User WHERE IsActive = true LIMIT 200'
  ];
  
  for (const query of commonQueries) {
    await getCachedQuery(conn, query, userId, FREQUENT_QUERY_TTL);
  }
};
```

#### Benefits
- **Reduction**: 30-40% reduction in Salesforce API calls
- **Impact**: High for read-heavy operations
- **Risk**: Low - can be adjusted per endpoint

#### Estimated Impact
- **API Call Reduction**: 30-40% (Salesforce queries)
- **Implementation Effort**: Low (1 day)
- **User Experience**: Improved (faster responses)

---

### Option 4: Request Batching (High Impact, Medium Risk)

#### Strategy
- Batch multiple related API calls into single requests
- Implement batch endpoints for dashboard data
- Use GraphQL-like query batching

#### Implementation Example
```javascript
// Batch endpoint: /api/batch
// Request: { requests: [{ url: '/api/projects', method: 'GET' }, ...] }
// Response: { results: [{ status: 200, data: {...} }, ...] }

const batchApiCalls = async (requests) => {
  return await apiClient.post('/api/batch', { requests });
};

// Usage in dashboard
const fetchDashboardData = async () => {
  const requests = [
    { url: '/api/case-analytics/kpis', method: 'GET' },
    { url: '/api/case-analytics/daily-solved', method: 'GET' },
    { url: '/api/case-analytics/by-project', method: 'GET' }
  ];
  
  const results = await batchApiCalls(requests);
  // Process results...
};
```

#### Benefits
- **Reduction**: 50-70% reduction in HTTP overhead
- **Impact**: Very high for dashboard pages
- **Risk**: Medium - requires backend changes

#### Estimated Impact
- **API Call Reduction**: 50-70% (HTTP requests)
- **Implementation Effort**: High (5-7 days)
- **User Experience**: Significantly improved (faster page loads)

---

### Option 5: Debouncing and Throttling (Medium Impact, Low Risk)

#### Strategy
- Debounce filter changes (wait for user to stop typing/changing)
- Throttle auto-refresh mechanisms
- Implement smart polling (exponential backoff)

#### Implementation
```javascript
// Debounce filter changes
const debouncedFetch = useMemo(
  () => debounce((filters) => {
    fetchData(filters);
  }, 500), // Wait 500ms after last change
  []
);

// Throttle auto-refresh
const throttledRefresh = useMemo(
  () => throttle(() => {
    refreshData();
  }, 30000), // Max once per 30 seconds
  []
);
```

#### Benefits
- **Reduction**: 30-50% reduction in unnecessary API calls
- **Impact**: High for filter-heavy pages
- **Risk**: Low - improves UX by reducing flicker

#### Estimated Impact
- **API Call Reduction**: 30-50%
- **Implementation Effort**: Low (1-2 days)
- **User Experience**: Improved (less flicker, smoother interactions)

---

### Option 6: Pagination Optimization (Medium Impact, Low Risk)

#### Strategy
- Increase page sizes to reduce number of requests
- Implement cursor-based pagination instead of offset-based
- Cache paginated results

#### Current State
- Many endpoints use offset-based pagination
- Page sizes vary (50, 100, 1000)

#### Proposed Changes
```javascript
// Increase default page sizes
const DEFAULT_PAGE_SIZE = 200; // Instead of 50

// Cursor-based pagination
const fetchWithCursor = async (cursor = null) => {
  const params = cursor ? { cursor } : {};
  return await apiClient.get('/api/endpoint', { params });
};
```

#### Benefits
- **Reduction**: 20-30% reduction in pagination requests
- **Impact**: Medium for data-heavy pages
- **Risk**: Low - can be adjusted per endpoint

#### Estimated Impact
- **API Call Reduction**: 20-30%
- **Implementation Effort**: Medium (2-3 days)
- **User Experience**: Improved (fewer page loads)

---

### Option 7: Background Refresh Strategy (High Impact, Low Risk)

#### Strategy
- Return cached data immediately, refresh in background
- Implement stale-while-revalidate pattern
- Use service workers for offline caching (future)

#### Implementation
```javascript
const useStaleWhileRevalidate = (url, params) => {
  const [data, setData] = useState(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    // Return cached data immediately
    const cached = requestCache.get(url, params);
    if (cached) {
      setData(cached);
      setIsStale(cached.age > cached.ttl * 0.8);
    }

    // Fetch fresh data in background
    apiClient.get(url, { params })
      .then(response => {
        setData(response.data);
        setIsStale(false);
        requestCache.set(url, params, response.data);
      });
  }, [url, JSON.stringify(params)]);

  return { data, isStale };
};
```

#### Benefits
- **Reduction**: 0% (still makes calls, but improves perceived performance)
- **Impact**: High for user experience
- **Risk**: Low - transparent to users

#### Estimated Impact
- **API Call Reduction**: 0% (but improves UX)
- **Implementation Effort**: Medium (2-3 days)
- **User Experience**: Significantly improved (instant load, fresh data)

---

### Option 8: Smart Cache Invalidation (Medium Impact, Low Risk)

#### Strategy
- Invalidate cache only when data actually changes
- Use ETags or version numbers for cache validation
- Implement partial cache updates

#### Implementation
```javascript
// ETag-based cache validation
const fetchWithETag = async (url, params, lastETag) => {
  const headers = lastETag ? { 'If-None-Match': lastETag } : {};
  const response = await apiClient.get(url, { params, headers });
  
  if (response.status === 304) {
    // Not modified - use cache
    return requestCache.get(url, params);
  }
  
  // Update cache with new ETag
  requestCache.set(url, params, response.data, response.headers.etag);
  return response.data;
};
```

#### Benefits
- **Reduction**: 20-40% reduction in unnecessary data transfer
- **Impact**: Medium for frequently accessed data
- **Risk**: Low - falls back to full fetch if ETag not supported

#### Estimated Impact
- **API Call Reduction**: 20-40% (data transfer)
- **Implementation Effort**: Medium (3-4 days)
- **User Experience**: Improved (faster responses)

---

## Recommended Implementation Plan

### Phase 1: Quick Wins (1-2 weeks)
1. ✅ **Request Deduplication** (Option 2)
   - High impact, low effort
   - Immediate 20-30% reduction

2. ✅ **Debouncing/Throttling** (Option 5)
   - High impact, low effort
   - 30-50% reduction in filter-related calls

3. ✅ **Query Cache TTL Extension** (Option 3)
   - Medium impact, low effort
   - 30-40% reduction in Salesforce queries

### Phase 2: Medium-Term (2-4 weeks)
4. ✅ **Enhanced Frontend Caching** (Option 1)
   - High impact, medium effort
   - 40-60% reduction in API calls

5. ✅ **Background Refresh** (Option 7)
   - High impact, medium effort
   - Improves UX significantly

6. ✅ **Pagination Optimization** (Option 6)
   - Medium impact, medium effort
   - 20-30% reduction

### Phase 3: Long-Term (1-2 months)
7. ✅ **Request Batching** (Option 4)
   - Very high impact, high effort
   - 50-70% reduction in HTTP requests

8. ✅ **Smart Cache Invalidation** (Option 8)
   - Medium impact, medium effort
   - 20-40% reduction in data transfer

## Expected Overall Impact

### Combined Reduction Estimates
- **Phase 1**: 40-50% reduction in API calls
- **Phase 2**: Additional 30-40% reduction (cumulative: 60-70%)
- **Phase 3**: Additional 20-30% reduction (cumulative: 70-80%)

### Total Estimated Reduction
**70-80% reduction in API calls** without impacting functionality

## Risk Assessment

### Low Risk Options
- Request Deduplication
- Debouncing/Throttling
- Query Cache TTL Extension
- Enhanced Frontend Caching

### Medium Risk Options
- Request Batching (requires backend changes)
- Background Refresh (complexity in state management)
- Pagination Optimization (may affect memory usage)

### Mitigation Strategies
1. Feature flags for all optimizations
2. Gradual rollout per component
3. Monitoring and metrics collection
4. Easy rollback mechanisms

## Monitoring and Metrics

### Key Metrics to Track
1. **API Call Count** (per endpoint, per user, per time period)
2. **Cache Hit Rate** (frontend and backend)
3. **Response Times** (cached vs uncached)
4. **Error Rates** (to ensure optimizations don't break functionality)
5. **User Experience Metrics** (page load times, interaction responsiveness)

### Implementation
```javascript
// API call tracking
const trackApiCall = (endpoint, method, cached, duration) => {
  analytics.track('api_call', {
    endpoint,
    method,
    cached,
    duration,
    timestamp: Date.now()
  });
};
```

## Conclusion

The recommended approach is a phased implementation starting with quick wins that provide immediate benefits, followed by medium-term optimizations, and finally long-term architectural improvements. This approach minimizes risk while maximizing impact.

**Priority Order:**
1. Request Deduplication
2. Debouncing/Throttling
3. Query Cache TTL Extension
4. Enhanced Frontend Caching
5. Background Refresh
6. Pagination Optimization
7. Request Batching
8. Smart Cache Invalidation
