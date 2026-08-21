# Salesforce Session Management Implementation

## Overview

This document describes the implementation of session management for Salesforce API connections to optimize performance by reusing authentication tokens instead of creating a new connection for every API call.

## Problem

Previously, every Salesforce API call was creating a new connection and performing a new login/authentication:
- Each call to `createSalesforceConnection()` created a new `jsforce.Connection` object
- Each connection required a new `conn.login()` call to authenticate
- This resulted in unnecessary overhead and slower API responses
- Salesforce tokens typically last 2 hours, so we were wasting valid tokens

## Solution

A session management system has been implemented that:
1. **Caches connections and tokens** - Stores authenticated connections in memory
2. **Reuses valid tokens** - Checks if a cached token is still valid before creating a new connection
3. **Automatic expiration handling** - Detects expired tokens and creates new ones automatically
4. **Per-user sessions** - Maintains separate sessions for different users (since each user may have different Salesforce credentials)
5. **Connection verification** - Verifies cached connections are still working before reuse

## Implementation Details

### Session Manager (`server/services/salesforce/sessionManager.js`)

The session manager provides:
- `getSalesforceConnection(settings, userId)` - Main function to get or create a cached connection
- `clearSession(userId)` - Clear a specific user's session
- `clearAllSessions()` - Clear all cached sessions
- `getSessionStats()` - Get statistics about cached sessions

**Key Features:**
- Token expiration: Tokens are cached for ~1 hour 55 minutes (2 hours minus 5 minute buffer)
- Automatic cleanup: Expired sessions are cleaned up every 10 minutes
- Connection verification: Lightweight API call to verify connection is still valid
- Per-user caching: Sessions are keyed by userId to support multiple users

### Updated Files

1. **`server/services/salesforce/connectionService.js`**
   - Updated `createSalesforceConnection()` to use the session manager
   - Now delegates to `getSalesforceConnection()` from session manager

2. **`server/services/salesforce/projectPageService.js`**
   - Removed direct `jsforce.Connection` creation
   - Now uses `createSalesforceConnection()` which uses session management

3. **`server/services/salesforce/projectTeamService.js`**
   - Removed direct `jsforce.Connection` creation
   - Now uses `createSalesforceConnection()` which uses session management

## How It Works

1. **First API Call:**
   ```
   User makes API call → createSalesforceConnection() → 
   Session manager checks cache → No session found → 
   Creates new connection → Authenticates → 
   Caches session → Returns connection
   ```

2. **Subsequent API Calls (within token lifetime):**
   ```
   User makes API call → createSalesforceConnection() → 
   Session manager checks cache → Session found → 
   Verifies connection is valid → Returns cached connection
   ```

3. **After Token Expiration:**
   ```
   User makes API call → createSalesforceConnection() → 
   Session manager checks cache → Session expired → 
   Creates new connection → Authenticates → 
   Updates cache → Returns connection
   ```

## Benefits

1. **Performance Improvement:**
   - Eliminates redundant login calls
   - Faster API responses for subsequent calls
   - Reduces load on Salesforce authentication servers

2. **Resource Efficiency:**
   - Reuses valid tokens instead of discarding them
   - Reduces network overhead
   - Lower memory usage (single connection per user vs. many)

3. **Automatic Management:**
   - No code changes needed in existing routes
   - Automatic token refresh when expired
   - Automatic cleanup of expired sessions

## Configuration

The session management uses these default settings:
- **Token lifetime**: 1 hour 55 minutes (2 hours minus 5 minute buffer)
- **Refresh buffer**: 5 minutes before expiration
- **Cleanup interval**: Every 10 minutes
- **Connection verification timeout**: 5 seconds

These can be adjusted in `server/services/salesforce/sessionManager.js` if needed.

## Monitoring

Session statistics can be retrieved using:
```javascript
const { getSessionStats } = require('./services/salesforce/sessionManager');
const stats = getSessionStats();
console.log(stats);
```

This returns information about:
- Total number of cached sessions
- Session details (userId, username, creation time, expiration time, validity)

## Backward Compatibility

This implementation is **fully backward compatible**:
- All existing code using `createSalesforceConnection()` continues to work
- No changes needed in route handlers or service functions
- The session management is transparent to calling code

## Testing Recommendations

1. **Verify token reuse:**
   - Make multiple API calls in quick succession
   - Check logs to confirm only first call performs login
   - Subsequent calls should show "Using cached connection"

2. **Verify token expiration:**
   - Wait for token to expire (or manually clear cache)
   - Make API call and verify new login occurs

3. **Verify per-user sessions:**
   - Make API calls as different users
   - Verify each user gets their own cached session

4. **Verify connection verification:**
   - Manually invalidate a token (if possible)
   - Make API call and verify new connection is created

## Future Enhancements

Potential improvements:
1. **Persistent cache**: Store sessions in Redis/database for multi-server deployments
2. **Token refresh**: Proactively refresh tokens before expiration
3. **Metrics**: Add detailed metrics for session hit/miss rates
4. **Configuration**: Make expiration times configurable via environment variables
