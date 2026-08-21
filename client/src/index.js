import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress WebSocket errors from React's hot reload (harmless)
if (process.env.NODE_ENV === 'development') {
  // Suppress console.error for WebSocket errors
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    const errorMessage = args.join(' ');
    // Filter out WebSocket connection errors from React's hot reload
    if (errorMessage.includes('WebSocket') || 
        errorMessage.includes('ws://') || 
        errorMessage.includes('Invalid frame header') ||
        errorMessage.includes('WebSocketClient')) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const warnMessage = args.join(' ');
    // Filter out WebSocket warnings
    if (warnMessage.includes('WebSocket') || 
        warnMessage.includes('ws://') || 
        warnMessage.includes('Invalid frame header')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  // Suppress unhandled WebSocket errors at the window level
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (message && (
      message.toString().includes('WebSocket') || 
      message.toString().includes('ws://') ||
      message.toString().includes('Invalid frame header') ||
      message.toString().includes('WebSocketClient')
    )) {
      return true; // Suppress the error
    }
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    return false;
  };

  // Global error handler for uncaught errors (including WebSocket suppression)
  window.addEventListener('error', (event) => {
    const message = event.message || event.error?.message || '';
    const errorString = message.toString();
    const errorName = event.error?.name || '';
    const stack = event.error?.stack || '';
    
    // Suppress WebSocket errors from React's hot reload, including "Illegal invocation" errors
    const isWebSocketError = errorString.includes('WebSocket') || 
        errorString.includes('ws://') ||
        errorString.includes('wss://') ||
        errorString.includes('Invalid frame header') ||
        errorString.includes('WebSocketClient') ||
        errorString.includes('connection to ws://') ||
        errorString.includes('connection to wss://') ||
        errorString.includes('can\'t establish a connection') ||
        errorString.includes('was interrupted while the page was loading') ||
        (errorName === 'TypeError' && errorString.includes('Illegal invocation') && 
         (stack.includes('WebSocket') || stack.includes('webpack-dev-server') || stack.includes('WebSocketClient')));
    
    if (isWebSocketError) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
    
    // Suppress ChunkLoadError from browser extensions or stale builds
    const isChunkLoadError = errorString.includes('ChunkLoadError') ||
        errorString.includes('Loading chunk') ||
        errorString.includes('Failed to fetch dynamically imported module') ||
        (event.error?.name === 'ChunkLoadError');
    
    if (isChunkLoadError) {
      // Silently handle chunk load errors - they're usually from extensions or stale builds
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // Only log critical errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
      });
    }
    
    // Don't prevent default for non-WebSocket errors - let ErrorBoundary handle it
  }, true);

  // Global unhandled promise rejection handler (including WebSocket suppression)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || event.reason?.toString() || '';
    const reasonString = reason.toString();
    
    // Suppress WebSocket promise rejections, including "Illegal invocation" errors
    const reasonName = event.reason?.name || '';
    const stack = event.reason?.stack || '';
    const isWebSocketRejection = reasonString.includes('WebSocket') || 
        reasonString.includes('ws://') ||
        reasonString.includes('wss://') ||
        reasonString.includes('Invalid frame header') ||
        reasonString.includes('WebSocketClient') ||
        reasonString.includes('connection to ws://') ||
        reasonString.includes('connection to wss://') ||
        reasonString.includes('can\'t establish a connection') ||
        reasonString.includes('was interrupted while the page was loading') ||
        (reasonName === 'TypeError' && reasonString.includes('Illegal invocation') && 
         (stack.includes('WebSocket') || stack.includes('webpack-dev-server') || stack.includes('WebSocketClient')));
    
    if (isWebSocketRejection) {
      event.preventDefault();
      return false;
    }
    
    // Suppress ChunkLoadError from browser extensions or stale builds
    // These are typically harmless and can be resolved by refreshing
    const isChunkLoadError = reasonString.includes('ChunkLoadError') ||
        reasonString.includes('Loading chunk') ||
        reasonString.includes('Failed to fetch dynamically imported module') ||
        (event.reason?.name === 'ChunkLoadError');
    
    if (isChunkLoadError) {
      // Silently handle chunk load errors - they're usually from extensions or stale builds
      // User can refresh if needed
      event.preventDefault();
      return false;
    }
    
    // Only log critical promise rejections in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled promise rejection:', {
        reason: event.reason,
        message: event.reason?.message,
        stack: event.reason?.stack
      });
    }
    
    // Don't prevent default for non-WebSocket rejections - let ErrorBoundary handle it
  });
}

// Performance test utility (available in browser console)
if (process.env.NODE_ENV === 'development') {
  window.testFieldSearchPerformance = async () => {
    // Field Search Performance Test
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found. Please log in first.');
        return;
      }
      
      // Use relative URL to go through proxy (works in both dev and production)
      const response = await fetch('/api/projects/field-definitions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const fields = data.fields || [];
      
      const currentFields = new Set([
        'projectName', 'shortProjectName', 'contributorProjectName', 'appenPartner', 'projectType', 'projectPriority',
        'account', 'hireStartDate', 'predictedCloseDate', 'projectStatus', 'projectManager',
        'contributorFacingProjectName', 'projectObjectiveName', 'project', 'workType', 'daysBetweenReminderEmails', 'country', 'language',
        'qualificationStepProject', 'qualificationStepProjectObjective', 'qualificationStep', 'funnel', 'stepNumber', 'numberOfAttempts',
        'projectPageType', 'pageProject', 'pageProjectObjective', 'pageQualificationStep', 'active'
      ]);
      
      const availableFields = fields.filter(f => !currentFields.has(f.key));
      
      // OLD SEARCH IMPLEMENTATION
      const oldSearch = (searchTerm, selectedSection) => {
        const start = performance.now();
        let filtered = availableFields;
        
        if (selectedSection) {
          filtered = filtered.filter(field => field.section === selectedSection);
        }
        
        if (searchTerm && searchTerm.length >= 2) {
          const searchLower = searchTerm.toLowerCase();
          filtered = filtered.filter(field => {
            const labelLower = field.label.toLowerCase();
            const descLower = (field.description || '').toLowerCase();
            const keyLower = field.key.toLowerCase();
            return labelLower.indexOf(searchLower) !== -1 ||
                   descLower.indexOf(searchLower) !== -1 ||
                   keyLower.indexOf(searchLower) !== -1;
          });
        }
        
        return { results: filtered.length, time: performance.now() - start };
      };
      
      // NEW SEARCH IMPLEMENTATION
      const preprocessedFields = availableFields.map(field => {
        const label = field.label;
        const desc = field.description || '';
        const key = field.key;
        return {
          ...field,
          _labelLower: label.toLowerCase(),
          _descLower: desc.toLowerCase(),
          _keyLower: key.toLowerCase(),
          _searchText: `${label.toLowerCase()} ${desc.toLowerCase()} ${key.toLowerCase()}`
        };
      });
      
      const sectionIndex = new Map();
      preprocessedFields.forEach(field => {
        const section = field.section;
        if (!sectionIndex.has(section)) {
          sectionIndex.set(section, []);
        }
        sectionIndex.get(section).push(field);
      });
      
      const newSearch = (searchTerm, selectedSection) => {
        const start = performance.now();
        
        let filtered;
        if (selectedSection && sectionIndex.has(selectedSection)) {
          filtered = sectionIndex.get(selectedSection);
        } else {
          filtered = preprocessedFields;
        }
        
        if (searchTerm && searchTerm.length >= 1) {
          const searchLower = searchTerm.toLowerCase().trim();
          const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
          
          if (searchWords.length === 1) {
            const searchWord = searchWords[0];
            filtered = filtered.filter(field => {
              if (field._labelLower.startsWith(searchWord) || field._keyLower.startsWith(searchWord)) {
                return true;
              }
              return field._searchText.includes(searchWord);
            });
          } else {
            filtered = filtered.filter(field => {
              return searchWords.every(word => field._searchText.includes(word));
            });
          }
        }
        
        return { results: filtered.length, time: performance.now() - start };
      };
      
      // Run tests
      const tests = [
        { search: '', section: '', desc: 'No filter' },
        { search: 'pro', section: '', desc: 'Search "pro"' },
        { search: 'project', section: '', desc: 'Search "project"' },
        { search: '', section: 'Project Objective', desc: 'Section filter only' },
        { search: 'date', section: 'Project Objective', desc: 'Search "date" in section' },
        { search: 'project objective', section: '', desc: 'Multi-word search' }
      ];
      
      const results = [];
      tests.forEach((test, i) => {
        // Warm up
        oldSearch(test.search, test.section);
        newSearch(test.search, test.section);
        
        // Run multiple iterations for accuracy
        let oldTotal = 0, newTotal = 0;
        const iterations = 100;
        for (let j = 0; j < iterations; j++) {
          oldTotal += oldSearch(test.search, test.section).time;
          newTotal += newSearch(test.search, test.section).time;
        }
        
        const oldAvg = oldTotal / iterations;
        const newAvg = newTotal / iterations;
        const improvement = ((oldAvg - newAvg) / oldAvg * 100).toFixed(1);
        const speedup = (oldAvg / newAvg).toFixed(2);
        
        // Test results logged (removed for production)
        
        results.push({ test: test.desc, old: oldAvg, new: newAvg, improvement: parseFloat(improvement) });
      });
      
      const avgOld = results.reduce((sum, r) => sum + r.old, 0) / results.length;
      const avgNew = results.reduce((sum, r) => sum + r.new, 0) / results.length;
      const avgImprovement = ((avgOld - avgNew) / avgOld * 100).toFixed(1);
      const avgSpeedup = (avgOld / avgNew).toFixed(2);
      
      // Summary logged (removed for production)
      
      return results;
    } catch (error) {
      console.error('Error running performance test:', error);
    }
  };
}

// Initialize React app
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found. Please check that index.html contains <div id="root"></div>');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  // If React fails to initialize, show error message in the root element
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #ef4444; margin-bottom: 20px;">Application Failed to Load</h1>
        <p style="color: #666; margin-bottom: 10px;">An error occurred while initializing the application:</p>
        <p style="color: #333; font-weight: bold; margin-bottom: 20px;">${error.message}</p>
        <p style="color: #666; font-size: 14px;">Please refresh the page or contact support if the problem persists.</p>
        <button 
          onclick="window.location.reload()" 
          style="margin-top: 20px; padding: 10px 20px; background: #0176d3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
        >
          Refresh Page
        </button>
      </div>
    `;
  }
  console.error('Failed to initialize React application:', error);
}




