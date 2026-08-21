# API Call Optimization - Quick Reference Summary

## Target: 60-75% Reduction in API Calls

---

## 🔴 Critical Issues Identified

### 1. Aggressive Polling
- **Dashboard:** Refreshes every 10 seconds (even when tab hidden)
- **Welcome:** Refreshes every 30 seconds (even when tab hidden)
- **Performance Monitor:** Refreshes every 2 seconds
- **Impact:** ~50-70% of polling calls are unnecessary

### 2. Multiple Parallel Calls on Page Load
- **CaseAnalytics:** Up to 14 calls per tab
- **Welcome:** 4 separate calls (could be batched)
- **Impact:** High network overhead, could be reduced 50-70% with batching

### 3. Short Cache TTLs
- **Backend Query Cache:** Only 5 seconds (too short for read-only queries)
- **Impact:** Frequent cache misses, 40-50% reduction possible

### 4. Underutilized Caching
- **Frontend Cache:** Underutilized across the application
- **Impact:** 30-40% reduction possible by expanding usage

---

## ✅ Top 5 Quick Wins (Week 1-2)

### 1. Request Deduplication ⭐⭐⭐
- **Impact:** 20-30% reduction
- **Effort:** 1 day
- **File:** `client/src/config/api.js`
- **Description:** Prevent duplicate concurrent requests

### 2. Polling Optimization ⭐⭐⭐
- **Impact:** 50-70% reduction in polling calls
- **Effort:** 1 day
- **Files:** 
  - `client/src/pages/Dashboard.js` (10s → 60s)
  - `client/src/pages/Welcome.js` (30s → 120s)
  - Add visibility-aware polling hook
- **Description:** Increase intervals, pause when tab hidden

### 3. Query Cache TTL Extension ⭐⭐⭐
- **Impact:** 40-50% reduction in Salesforce queries
- **Effort:** 0.5 days
- **File:** `server/services/salesforce/queryCache.js`
- **Description:** Increase TTL from 5s to 15-60s based on query type

### 4. Expand Frontend Caching ⭐⭐
- **Impact:** 30-40% reduction
- **Effort:** 2 days
- **Files:** 
  - `client/src/pages/CaseAnalyticsDashboard.js`
  - `client/src/pages/Welcome.js`
  - `client/src/pages/Dashboard.js`
  - `client/src/pages/WorkStreamReporting.js`
- **Description:** Use existing `requestCache.js` in more components

### 5. Enhanced Lazy Loading ⭐⭐
- **Impact:** 40-60% reduction (for users who don't view all tabs)
- **Effort:** 1-2 days
- **Files:** 
  - `client/src/pages/CaseAnalyticsDashboard.js`
- **Description:** Only load tab data when tab is viewed

---

## 📊 Expected Impact by Phase

| Phase | Reduction | Timeline | Risk |
|-------|-----------|----------|------|
| **Phase 1 (Quick Wins)** | 30-40% | Week 1-2 | Low |
| **Phase 2 (Medium-Term)** | +20-30% | Week 3-4 | Medium |
| **Phase 3 (Advanced)** | +10-15% | Week 5-6 | Medium |
| **Total** | **60-75%** | 6 weeks | Low-Medium |

---

## 🎯 Implementation Priority

### Week 1-2: Quick Wins (30-40% reduction)
1. ✅ Request Deduplication
2. ✅ Polling Optimization  
3. ✅ Query Cache TTL Extension
4. ✅ Expand Frontend Caching

### Week 3-4: Medium-Term (Additional 20-30%)
5. ✅ Batch API Endpoints
6. ✅ Enhanced Lazy Loading
7. ✅ Stale-While-Revalidate Pattern

### Week 5-6: Advanced (Additional 10-15%)
8. ✅ Increase Batch Sizes
9. ✅ Smart Cache Invalidation
10. ✅ Debounce Filters

---

## 📈 Key Metrics to Track

1. **API Call Count** - Per endpoint, per session
2. **Cache Hit Rate** - Target: >60%
3. **Page Load Times** - Should improve or maintain
4. **Error Rates** - Should not increase

---

## 🚀 Getting Started

1. **Review:** `API_CALL_REDUCTION_PLAN.md` for detailed implementation
2. **Set up monitoring** before making changes
3. **Start with Phase 1** (quick wins) for immediate impact
4. **Use feature flags** for safe rollout
5. **Test thoroughly** at each phase

---

## 📝 Files Requiring Changes

### High Priority (Phase 1)
- `client/src/config/api.js` - Request deduplication
- `client/src/pages/Dashboard.js` - Polling optimization
- `client/src/pages/Welcome.js` - Polling optimization
- `server/services/salesforce/queryCache.js` - TTL extension
- `client/src/pages/CaseAnalyticsDashboard.js` - Caching

### Medium Priority (Phase 2)
- `server/routes/batch.js` - NEW: Batch endpoint
- `client/src/utils/batchApi.js` - NEW: Batch utility
- `client/src/utils/staleWhileRevalidate.js` - NEW: SWR pattern

### Low Priority (Phase 3)
- `server/routes/updateObjectFields/update.js` - Batch sizes
- `server/utils/smartCacheInvalidation.js` - NEW: Smart invalidation

---

## ⚠️ Risk Mitigation

- ✅ Use feature flags for all optimizations
- ✅ Gradual rollout per component
- ✅ Monitor metrics continuously
- ✅ Keep old code paths for easy rollback

---

## 📚 Documentation

- **Detailed Plan:** `API_CALL_REDUCTION_PLAN.md`
- **Existing Evaluation:** `API_CALL_OPTIMIZATION_EVALUATION.md`

---

**Next Step:** Review the detailed plan and begin Phase 1 implementation.
