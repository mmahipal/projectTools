// Performance comparison script for field search
// Run this in browser console to test search performance

const performanceTest = {
  // Simulate old search implementation
  oldSearch: (fields, searchTerm, selectedSection) => {
    const startTime = performance.now();
    let filtered = fields;
    
    // Old: Filter by section (O(n))
    if (selectedSection) {
      filtered = filtered.filter(field => field.section === selectedSection);
    }
    
    // Old: Multiple toLowerCase() calls and multiple indexOf() checks
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
    
    const endTime = performance.now();
    return {
      results: filtered.length,
      time: endTime - startTime
    };
  },
  
  // Simulate new search implementation
  newSearch: (preprocessedFields, sectionIndex, searchTerm, selectedSection) => {
    const startTime = performance.now();
    
    // New: Instant section lookup using index (O(1))
    let filtered;
    if (selectedSection && sectionIndex.has(selectedSection)) {
      filtered = sectionIndex.get(selectedSection);
    } else {
      filtered = preprocessedFields;
    }
    
    // New: Pre-computed search text, optimized for single/multi-word
    if (searchTerm && searchTerm.length >= 1) {
      const searchLower = searchTerm.toLowerCase().trim();
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
      
      if (searchWords.length === 1) {
        const searchWord = searchWords[0];
        filtered = filtered.filter(field => {
          if (field._labelLower.startsWith(searchWord) || 
              field._keyLower.startsWith(searchWord)) {
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
    
    const endTime = performance.now();
    return {
      results: filtered.length,
      time: endTime - startTime
    };
  },
  
  // Run comparison test
  runComparison: async () => {
    console.log('🔍 Field Search Performance Comparison Test');
    console.log('==========================================\n');
    
    // Fetch fields from API
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/projects/field-definitions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    const fields = data.fields || [];
    
    // Filter out current fields (simulate real scenario)
    const currentFields = new Set([
      'projectName', 'shortProjectName', 'contributorProjectName', 'appenPartner', 'projectType', 'projectPriority',
      'account', 'hireStartDate', 'predictedCloseDate', 'projectStatus', 'projectManager',
      'contributorFacingProjectName', 'projectObjectiveName', 'project', 'workType', 'daysBetweenReminderEmails', 'country', 'language',
      'qualificationStepProject', 'qualificationStepProjectObjective', 'qualificationStep', 'funnel', 'stepNumber', 'numberOfAttempts',
      'projectPageType', 'pageProject', 'pageProjectObjective', 'pageQualificationStep', 'active'
    ]);
    
    const availableFields = fields.filter(f => !currentFields.has(f.key));
    
    // Pre-process for new search
    const preprocessedFields = availableFields.map(field => {
      const label = field.label;
      const desc = field.description || '';
      const key = field.key;
      const labelLower = label.toLowerCase();
      const descLower = desc.toLowerCase();
      const keyLower = key.toLowerCase();
      
      return {
        ...field,
        _labelLower: labelLower,
        _descLower: descLower,
        _keyLower: keyLower,
        _searchText: `${labelLower} ${descLower} ${keyLower}`
      };
    });
    
    // Create section index
    const sectionIndex = new Map();
    preprocessedFields.forEach(field => {
      const section = field.section;
      if (!sectionIndex.has(section)) {
        sectionIndex.set(section, []);
      }
      sectionIndex.get(section).push(field);
    });
    
    console.log(`Total available fields: ${availableFields.length}\n`);
    
    // Test scenarios
    const testCases = [
      { searchTerm: '', section: '', description: 'No filter (all fields)' },
      { searchTerm: 'pro', section: '', description: 'Search "pro" (no section)' },
      { searchTerm: 'project', section: '', description: 'Search "project" (no section)' },
      { searchTerm: '', section: 'Project Objective', description: 'Section filter only' },
      { searchTerm: 'date', section: 'Project Objective', description: 'Search "date" in Project Objective' },
      { searchTerm: 'project objective', section: '', description: 'Multi-word search' },
      { searchTerm: 'name', section: 'Project Information', description: 'Search "name" in Project Information' }
    ];
    
    const results = [];
    
    testCases.forEach((testCase, index) => {
      console.log(`Test ${index + 1}: ${testCase.description}`);
      console.log(`  Search: "${testCase.searchTerm}" | Section: "${testCase.section}"`);
      
      // Old search
      const oldResult = performanceTest.oldSearch(availableFields, testCase.searchTerm, testCase.section);
      
      // New search
      const newResult = performanceTest.newSearch(preprocessedFields, sectionIndex, testCase.searchTerm, testCase.section);
      
      const improvement = ((oldResult.time - newResult.time) / oldResult.time * 100).toFixed(1);
      const speedup = (oldResult.time / newResult.time).toFixed(2);
      
      console.log(`  OLD: ${oldResult.results} results in ${oldResult.time.toFixed(2)}ms`);
      console.log(`  NEW: ${newResult.results} results in ${newResult.time.toFixed(2)}ms`);
      console.log(`  ⚡ Improvement: ${improvement}% faster (${speedup}x speedup)\n`);
      
      results.push({
        test: testCase.description,
        oldTime: oldResult.time,
        newTime: newResult.time,
        improvement: parseFloat(improvement),
        speedup: parseFloat(speedup)
      });
    });
    
    // Summary
    const avgOldTime = results.reduce((sum, r) => sum + r.oldTime, 0) / results.length;
    const avgNewTime = results.reduce((sum, r) => sum + r.newTime, 0) / results.length;
    const avgImprovement = ((avgOldTime - avgNewTime) / avgOldTime * 100).toFixed(1);
    const avgSpeedup = (avgOldTime / avgNewTime).toFixed(2);
    
    console.log('📊 Summary');
    console.log('==========');
    console.log(`Average OLD search time: ${avgOldTime.toFixed(2)}ms`);
    console.log(`Average NEW search time: ${avgNewTime.toFixed(2)}ms`);
    console.log(`Average improvement: ${avgImprovement}% faster`);
    console.log(`Average speedup: ${avgSpeedup}x faster`);
    
    return results;
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.performanceTest = performanceTest;
  console.log('✅ Performance test loaded! Run: performanceTest.runComparison()');
}




















