# API Call Reduction Plan - Comprehensive Evaluation & Implementation Strategy

## Executive Summary

This document provides a detailed analysis and actionable plan to reduce API calls by **60-75%** without impacting functionality or performance. The plan includes specific code locations, implementation steps, and prioritized recommendations.

**Target Reduction:** 60-75% reduction in API calls  
**Implementation Timeline:** 4-6 weeks (phased approach)  
**Risk Level:** Low to Medium (with proper testing)

---

## Current State Analysis

### 1. High-Frequency API Call Patterns Identified

#### A. Dashboard Pages with Multiple Parallel Calls

**CaseAnalyticsDashboard** (`client/src/pages/CaseAnalyticsDashboard.js`)
- **Up to 13 API calls** per tab load
- Daily Snapshot tab: 1 KPI + 4 + 9 = **14 calls**
- Cases Backlog tab: 1 KPI + 5 = **6 calls**
- Agent Performance tab: 1 KPI + 4 = **5 calls**
- **Optimization Opportunity:** Batch endpoint, tab-level lazy loading, caching

**Welcome Page** (`client/src/pages/Welcome.js`)
- **4 API calls** on load: `/welcome/stats`, `/welcome/activity`, `/welcome/system-status`, `/welcome/recommendations`
- **Auto-refresh every 30 seconds** (even when tab is hidden)
- **Optimization Opportunity:** Single batch endpoint, visibility-aware polling

**Dashboard** (`client/src/pages/Dashboard.js`)
- **1 API call** to `/dashboard/stats`
- **Auto-refresh every 10 seconds** (very aggressive)
- **Optimization Opportunity:** Increase polling interval, visibility-aware polling

#### B. Polling/Refresh Mechanisms

| Component | Interval | Issue | Optimization |
|-----------|----------|-------|--------------|
| Dashboard | 10 seconds | Too frequent, runs when hidden | Increase to 30-60s, visibility-aware |
| Welcome | 30 seconds | Runs when tab hidden | Visibility-aware polling |
| PerformanceMonitor | 2 seconds | Very aggressive | Increase to 5-10s |

#### C. Query Cache TTL Issues

**Backend Query Cache** (`server/services/salesforce/queryCache.js`)
- **Current TTL: 5 seconds** (very short)
- Many queries could use 30-60 second TTL
- **Impact:** Frequent cache misses for read-only queries

#### D. Underutilized Caching

**Frontend Request Cache** (`client/src/utils/requestCache.js`)
- ✅ Implemented but underutilized
- Default TTL: 5 minutes (good)
- **Opportunity:** Expand to all dashboard pages

**Backend Cache Manager** (`server/utils/cache.js`)
- ✅ Implemented but limited usage
- **Opportunity:** Expand to more endpoints

---

## Optimization Strategies & Implementation Plan

### Phase 1: Quick Wins (Week 1-2) - 30-40% Reduction

#### 1.1 Request Deduplication (High Impact, Low Effort)

**Problem:** Multiple components may request the same data simultaneously  
**Solution:** Implement request deduplication in API client

**Implementation:**
```javascript
// client/src/config/api.js
const pendingRequests = new Map();

const deduplicateRequest = (key, requestFn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = requestFn()
    .finally(() => {
      pendingRequests.delete(key);
    });
  
  pendingRequests.set(key, promise);
  return promise;
};

// Modify apiClient interceptor to use deduplication
apiClient.interceptors.request.use(async (config) => {
  // ... existing code ...
  
  // For GET requests, add deduplication
  if (config.method?.toUpperCase() === 'GET') {
    const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
    config.deduplicationKey = requestKey;
  }
  
  return config;
});
```

**Files to Modify:**
- `client/src/config/api.js`

**Estimated Impact:** 20-30% reduction in duplicate calls  
**Effort:** 1 day

---

#### 1.2 Increase Polling Intervals & Add Visibility Awareness (High Impact, Low Effort)

**Problem:** Aggressive polling even when tab is hidden

**Implementation:**
```javascript
// client/src/hooks/useVisibilityAwarePolling.js (NEW FILE)
import { useEffect, useRef } from 'react';

export const useVisibilityAwarePolling = (callback, interval, options = {}) => {
  const { enabled = true, pauseWhenHidden = true } = options;
  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const poll = () => {
      if (!pauseWhenHidden || !document.hidden) {
        callbackRef.current();
      }
    };
    
    // Poll immediately
    poll();
    
    // Then poll at interval
    intervalRef.current = setInterval(poll, interval);
    
    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden && pauseWhenHidden) {
        // Tab became visible, poll immediately
        poll();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, pauseWhenHidden]);
};
```

**Files to Modify:**
- `client/src/pages/Dashboard.js` - Change 10s to 60s, use new hook
- `client/src/pages/Welcome.js` - Change 30s to 120s, use new hook
- `client/src/components/PerformanceMonitor/PerformanceMonitor.js` - Change 2s to 10s

**Estimated Impact:** 50-70% reduction in polling calls  
**Effort:** 1 day

---

#### 1.3 Extend Backend Query Cache TTL (High Impact, Low Effort)

**Problem:** 5-second TTL is too short for read-only queries

**Implementation:**
```javascript
// server/services/salesforce/queryCache.js

// Add different TTLs based on query type
const getQueryTTL = (query, userId) => {
  // Metadata queries - cache longer (5 minutes)
  if (query.includes('FROM Metadata') || query.includes('DESCRIBE')) {
    return 5 * 60 * 1000;
  }
  
  // Read-only list queries - 60 seconds
  if (query.match(/SELECT\s+.*\s+FROM\s+\w+\s+WHERE/i) && 
      !query.includes('UPDATE') && !query.includes('DELETE')) {
    return 60 * 1000;
  }
  
  // Aggregation queries (COUNT, SUM, etc.) - 30 seconds
  if (query.match(/(COUNT|SUM|AVG|MAX|MIN)\s*\(/i)) {
    return 30 * 1000;
  }
  
  // Default: 15 seconds (increased from 5)
  return 15 * 1000;
};

// Modify getCachedQuery to use dynamic TTL
const getCachedQuery = async (conn, query, userId = null, ttlMs = null) => {
  const effectiveTTL = ttlMs || getQueryTTL(query, userId);
  // ... rest of implementation
};
```

**Files to Modify:**
- `server/services/salesforce/queryCache.js`

**Estimated Impact:** 40-50% reduction in Salesforce API calls  
**Effort:** 0.5 days

---

#### 1.4 Expand Frontend Caching Usage (Medium Impact, Low Effort)

**Problem:** Request cache underutilized across the application

**Implementation:**
```javascript
// client/src/pages/CaseAnalyticsDashboard.js
import { cachedFetch } from '../utils/requestCache';

// Replace direct apiClient calls with cachedFetch
const fetchAllData = useCallback(async (filtersToUse = null, timeRangeToUse = null) => {
  // ... existing code ...
  
  // Use cached fetch for KPIs (cache for 2 minutes)
  const kpiResponse = await cachedFetch(
    '/case-analytics/kpis',
    activeFilters,
    async () => apiClient.get('/case-analytics/kpis', { params: activeFilters, timeout: 120000 }),
    { ttl: 2 * 60 * 1000, useCache: true }
  );
  
  // Similar for other endpoints...
}, [activeTab, filters, timeRange]);
```

**Files to Modify:**
- `client/src/pages/CaseAnalyticsDashboard.js`
- `client/src/pages/Welcome.js`
- `client/src/pages/Dashboard.js`
- `client/src/pages/WorkStreamReporting.js`

**Estimated Impact:** 30-40% reduction in repeated calls  
**Effort:** 2 days

---

### Phase 2: Medium-Term Optimizations (Week 3-4) - Additional 20-30% Reduction

#### 2.1 Implement Batch API Endpoints (High Impact, Medium Effort)

**Problem:** Multiple separate API calls for related data

**Implementation:**

**Backend:**
```javascript
// server/routes/batch.js (NEW FILE)
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.post('/batch', authenticate, async (req, res) => {
  try {
    const { requests } = req.body;
    
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: 'Requests array required' });
    }
    
    // Limit batch size
    if (requests.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 requests per batch' });
    }
    
    // Execute requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (reqConfig) => {
        try {
          // Import route handlers dynamically
          const routeModule = require(`./${reqConfig.route}`);
          const handler = routeModule[reqConfig.handler] || routeModule.default;
          
          // Create mock req/res objects
          const mockReq = {
            ...req,
            query: reqConfig.params || {},
            body: reqConfig.body || {},
            params: reqConfig.routeParams || {}
          };
          
          const mockRes = {
            status: (code) => ({
              json: (data) => ({ status: code, data })
            }),
            json: (data) => ({ status: 200, data })
          };
          
          const result = await handler(mockReq, mockRes);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })
    );
    
    res.json({
      success: true,
      results: results.map((result, index) => ({
        index,
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**Frontend:**
```javascript
// client/src/utils/batchApi.js (NEW FILE)
import apiClient from '../config/api';

export const batchApiCalls = async (requests) => {
  const response = await apiClient.post('/batch', { requests });
  return response.data.results;
};

// Usage example:
const fetchDashboardData = async () => {
  const requests = [
    { route: 'welcome', handler: 'getStats', params: {} },
    { route: 'welcome', handler: 'getActivity', params: {} },
    { route: 'welcome', handler: 'getSystemStatus', params: {} },
    { route: 'welcome', handler: 'getRecommendations', params: {} }
  ];
  
  const results = await batchApiCalls(requests);
  // Process results...
};
```

**Files to Create:**
- `server/routes/batch.js`
- `client/src/utils/batchApi.js`

**Files to Modify:**
- `client/src/pages/Welcome.js` - Use batch endpoint
- `client/src/pages/CaseAnalyticsDashboard.js` - Use batch for tab data

**Estimated Impact:** 50-70% reduction in HTTP requests (not API calls, but network overhead)  
**Effort:** 3-4 days

---

#### 2.2 Enhanced Lazy Loading for Tabs (Medium Impact, Medium Effort)

**Problem:** All tab data loaded even when not viewed

**Current State:** Some lazy loading exists but can be improved

**Implementation:**
```javascript
// client/src/pages/CaseAnalyticsDashboard.js

// Only load data when tab is actually viewed
useEffect(() => {
  if (activeTab && !loadedTabs.has(activeTab)) {
    // Mark as loading
    setLoadedTabs(prev => new Set([...prev, activeTab]));
    
    // Fetch data for this tab only
    fetchTabData(activeTab).catch(error => {
      // On error, remove from loaded tabs to allow retry
      setLoadedTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(activeTab);
        return newSet;
      });
    });
  }
}, [activeTab, loadedTabs, fetchTabData]);
```

**Files to Modify:**
- `client/src/pages/CaseAnalyticsDashboard.js` - Already has lazy loading, enhance it

**Estimated Impact:** 40-60% reduction for users who don't view all tabs  
**Effort:** 1-2 days

---

#### 2.3 Stale-While-Revalidate Pattern (High Impact, Medium Effort)

**Problem:** Users wait for fresh data even when cached data exists

**Solution:** Return cached data immediately, refresh in background

**Implementation:**
```javascript
// client/src/utils/staleWhileRevalidate.js (NEW FILE)
import { cachedFetch } from './requestCache';

export const staleWhileRevalidate = async (url, params, fetchFn, options = {}) => {
  const { ttl = 5 * 60 * 1000, staleThreshold = 0.8 } = options;
  
  // Check cache
  const cached = requestCache.get(url, params);
  const isStale = cached && (Date.now() - cached.cachedAt) > (ttl * staleThreshold);
  
  // Return cached data immediately if available
  if (cached && !isStale) {
    // Refresh in background (don't await)
    fetchFn().then(response => {
      requestCache.set(url, params, response, ttl);
    }).catch(() => {
      // Silently fail background refresh
    });
    
    return cached;
  }
  
  // If stale or no cache, fetch fresh data
  return await cachedFetch(url, params, fetchFn, { ttl, useCache: true });
};
```

**Files to Create:**
- `client/src/utils/staleWhileRevalidate.js`

**Files to Modify:**
- `client/src/pages/Dashboard.js` - Use for stats
- `client/src/pages/CaseAnalyticsDashboard.js` - Use for KPIs

**Estimated Impact:** 0% reduction in calls, but significantly improved UX  
**Effort:** 2 days

---

### Phase 3: Advanced Optimizations (Week 5-6) - Additional 10-15% Reduction

#### 3.1 Increase Batch Sizes for Bulk Operations (Medium Impact, Low Effort)

**Problem:** Small batch sizes require more API calls

**Current State:**
- Update operations: 200 records per batch ✅ (good)
- Bulk import: 50 records per batch (could be increased)

**Implementation:**
```javascript
// server/routes/updateObjectFields/update.js
// Increase batch size from 200 to 500 for large updates
const BATCH_SIZE = req.body.batchSize || 500; // Increased from 200

// server/routes/clientToolAccount.js
// Increase bulk import batch size from 50 to 100
const { records, batchSize = 100 } = req.body; // Increased from 50
```

**Files to Modify:**
- `server/routes/updateObjectFields/update.js`
- `server/routes/clientToolAccount.js`
- `server/routes/updateObjectFields/mapping.js`

**Estimated Impact:** 20-30% reduction in bulk operation calls  
**Effort:** 0.5 days

---

#### 3.2 Smart Cache Invalidation (Medium Impact, Medium Effort)

**Problem:** Cache invalidated too aggressively

**Solution:** Invalidate only when data actually changes

**Implementation:**
```javascript
// server/utils/smartCacheInvalidation.js (NEW FILE)
const cacheVersionMap = new Map();

export const getCacheVersion = (endpoint, params) => {
  const key = `${endpoint}:${JSON.stringify(params)}`;
  return cacheVersionMap.get(key) || 1;
};

export const incrementCacheVersion = (endpoint, params) => {
  const key = `${endpoint}:${JSON.stringify(params)}`;
  const current = cacheVersionMap.get(key) || 1;
  cacheVersionMap.set(key, current + 1);
};

// In routes, increment version on mutations
router.post('/case-analytics/update', async (req, res) => {
  // ... update logic ...
  
  // Invalidate related caches
  incrementCacheVersion('/case-analytics/kpis', req.body.filters);
  incrementCacheVersion('/case-analytics/daily-new-cases', req.body.filters);
  
  res.json({ success: true });
});
```

**Files to Create:**
- `server/utils/smartCacheInvalidation.js`

**Files to Modify:**
- All mutation endpoints to increment cache versions

**Estimated Impact:** 15-25% reduction in unnecessary refreshes  
**Effort:** 2-3 days

---

#### 3.3 Debounce Filter Changes (Low Impact, Low Effort)

**Problem:** Filter changes trigger immediate API calls

**Current State:** Some debouncing exists but inconsistent

**Implementation:**
```javascript
// client/src/hooks/useDebouncedFilters.js (NEW FILE)
import { useState, useEffect, useRef } from 'react';
import { debounce } from '../utils/debounce';

export const useDebouncedFilters = (initialFilters, delay = 500) => {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(initialFilters);
  
  const debouncedSetFilters = useRef(
    debounce((newFilters) => {
      setDebouncedFilters(newFilters);
    }, delay)
  ).current;
  
  useEffect(() => {
    debouncedSetFilters(filters);
  }, [filters, debouncedSetFilters]);
  
  return [filters, setFilters, debouncedFilters];
};
```

**Files to Create:**
- `client/src/hooks/useDebouncedFilters.js`

**Files to Modify:**
- `client/src/pages/CaseAnalyticsDashboard.js` - Use debounced filters
- `client/src/pages/WorkStreamReporting.js` - Enhance existing debouncing

**Estimated Impact:** 20-30% reduction in filter-triggered calls  
**Effort:** 1 day

---

## Implementation Priority Matrix

| Optimization | Impact | Effort | Priority | Phase |
|-------------|--------|--------|----------|-------|
| Request Deduplication | High | Low | 1 | 1 |
| Polling Optimization | High | Low | 1 | 1 |
| Query Cache TTL Extension | High | Low | 1 | 1 |
| Expand Frontend Caching | Medium | Low | 2 | 1 |
| Batch API Endpoints | High | Medium | 3 | 2 |
| Enhanced Lazy Loading | Medium | Medium | 4 | 2 |
| Stale-While-Revalidate | High | Medium | 5 | 2 |
| Increase Batch Sizes | Medium | Low | 6 | 3 |
| Smart Cache Invalidation | Medium | Medium | 7 | 3 |
| Debounce Filters | Low | Low | 8 | 3 |

---

## Expected Overall Impact

### Cumulative Reduction Estimates

| Phase | Reduction | Cumulative |
|-------|-----------|------------|
| Phase 1 (Quick Wins) | 30-40% | 30-40% |
| Phase 2 (Medium-Term) | 20-30% | 50-60% |
| Phase 3 (Advanced) | 10-15% | 60-75% |

### Breakdown by Category

| Category | Current | After Optimization | Reduction |
|----------|---------|-------------------|-----------|
| Polling/Refresh | 100% | 30-50% | 50-70% |
| Dashboard Loads | 100% | 30-40% | 60-70% |
| Filter Changes | 100% | 70-80% | 20-30% |
| Bulk Operations | 100% | 70-80% | 20-30% |
| Repeated Queries | 100% | 20-30% | 70-80% |

---

## Risk Assessment & Mitigation

### Low Risk
- ✅ Request Deduplication
- ✅ Polling Optimization
- ✅ Query Cache TTL Extension
- ✅ Expand Frontend Caching
- ✅ Debounce Filters

### Medium Risk
- ⚠️ Batch API Endpoints (requires backend changes)
- ⚠️ Stale-While-Revalidate (complexity in state management)
- ⚠️ Smart Cache Invalidation (requires careful testing)

### Mitigation Strategies

1. **Feature Flags:** Implement feature flags for all optimizations
   ```javascript
   const ENABLE_BATCH_API = process.env.REACT_APP_ENABLE_BATCH_API === 'true';
   const ENABLE_STALE_WHILE_REVALIDATE = process.env.REACT_APP_ENABLE_SWR === 'true';
   ```

2. **Gradual Rollout:** Enable optimizations per component/page
3. **Monitoring:** Track API call counts, cache hit rates, error rates
4. **Easy Rollback:** Keep old code paths available behind feature flags

---

## Monitoring & Metrics

### Key Metrics to Track

1. **API Call Count**
   - Per endpoint
   - Per user session
   - Per time period
   - Before/after comparison

2. **Cache Performance**
   - Cache hit rate (target: >60%)
   - Cache miss rate
   - Average cache age on hit

3. **Performance Metrics**
   - Page load times
   - Time to first contentful paint
   - API response times (cached vs uncached)

4. **Error Rates**
   - Ensure optimizations don't increase errors

### Implementation

```javascript
// client/src/utils/apiMetrics.js (NEW FILE)
class ApiMetrics {
  constructor() {
    this.calls = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
  
  trackCall(endpoint, method, cached, duration) {
    this.calls.push({
      endpoint,
      method,
      cached,
      duration,
      timestamp: Date.now()
    });
    
    if (cached) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
    
    // Keep only last 1000 calls
    if (this.calls.length > 1000) {
      this.calls.shift();
    }
  }
  
  getStats() {
    const totalCalls = this.calls.length;
    const cacheHitRate = totalCalls > 0 
      ? (this.cacheHits / totalCalls) * 100 
      : 0;
    
    return {
      totalCalls,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheHitRate: `${cacheHitRate.toFixed(2)}%`,
      averageDuration: this.calls.reduce((sum, c) => sum + c.duration, 0) / totalCalls
    };
  }
}

export const apiMetrics = new ApiMetrics();
```

---

## Testing Strategy

### Unit Tests
- Test caching logic
- Test request deduplication
- Test batch API endpoints

### Integration Tests
- Test end-to-end flows with caching enabled
- Test cache invalidation
- Test stale-while-revalidate behavior

### Performance Tests
- Measure API call reduction
- Measure cache hit rates
- Measure page load times

### User Acceptance Tests
- Verify functionality unchanged
- Verify performance improvements
- Verify no regressions

---

## Rollout Plan

### Week 1-2: Phase 1 (Quick Wins)
- Day 1-2: Request deduplication
- Day 3-4: Polling optimization
- Day 5: Query cache TTL extension
- Day 6-10: Expand frontend caching
- Day 11-14: Testing & monitoring

### Week 3-4: Phase 2 (Medium-Term)
- Day 15-18: Batch API endpoints (backend)
- Day 19-20: Batch API endpoints (frontend)
- Day 21-22: Enhanced lazy loading
- Day 23-25: Stale-while-revalidate
- Day 26-28: Testing & monitoring

### Week 5-6: Phase 3 (Advanced)
- Day 29-30: Increase batch sizes
- Day 31-33: Smart cache invalidation
- Day 34-35: Debounce filters
- Day 36-42: Final testing, monitoring, documentation

---

## Success Criteria

### Quantitative
- ✅ 60-75% reduction in API calls
- ✅ Cache hit rate >60%
- ✅ No increase in error rates
- ✅ Page load times improved or maintained

### Qualitative
- ✅ No functionality regressions
- ✅ User experience maintained or improved
- ✅ Code maintainability preserved

---

## Conclusion

This plan provides a comprehensive, phased approach to reducing API calls by 60-75% while maintaining functionality and performance. The optimizations are prioritized by impact and effort, with low-risk quick wins implemented first, followed by medium-term improvements, and finally advanced optimizations.

**Key Recommendations:**
1. Start with Phase 1 (quick wins) for immediate 30-40% reduction
2. Implement monitoring before making changes
3. Use feature flags for safe rollout
4. Test thoroughly at each phase
5. Monitor metrics continuously

**Next Steps:**
1. Review and approve this plan
2. Set up monitoring infrastructure
3. Begin Phase 1 implementation
4. Track metrics and adjust as needed
