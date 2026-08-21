// PO Productivity Targets Documentation
export default {
  title: 'PO Productivity Targets',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The PO Productivity Targets page allows you to set and track productivity targets for Project Objectives to measure and improve contributor performance.</p>
        <p><strong>Purpose:</strong> Define performance benchmarks at the project objective level and track actual performance against these targets. This helps identify areas for improvement and recognize high performers.</p>
        <p><strong>When to use:</strong> Use this page when setting productivity goals for project objectives, monitoring performance against targets, or analyzing productivity trends.</p>
        <p><strong>Default View:</strong> The page displays a table of productivity target records with their associated project objectives and target metrics.</p>
      `
    },
    {
      heading: 'Productivity Targets Table',
      content: `
        <p>The main table displays productivity target records with the following information:</p>
        <ul>
          <li><strong>Record Name</strong> - Name/identifier of the productivity target record</li>
          <li><strong>Target Contributors</strong> - Number of contributors targeted</li>
          <li><strong>Weekly Contributor Production Hours</strong> - Target hours per contributor per week</li>
          <li><strong>Weekly Target Production Hours (Calc)</strong> - Calculated weekly target hours</li>
          <li><strong>Total Target Productivity Hours</strong> - Overall target productivity hours</li>
          <li><strong>Productivity Target Type</strong> - Type of target (Hours, Units, etc.)</li>
          <li><strong>Project Objective</strong> - Associated project objective</li>
          <li><strong>Additional Fields</strong> - Customizable columns based on available fields</li>
        </ul>
        <p><strong>Infinite Scroll:</strong> The table uses infinite scroll to load more records as you scroll down.</p>
      `
    },
    {
      heading: 'Search Functionality',
      content: `
        <p>The page includes a search bar to find specific productivity target records:</p>
        <ul>
          <li><strong>Search Bar</strong> - Located at the top
            <ul>
              <li>Type to search by record name, project objective, or other criteria</li>
              <li>Search is debounced (waits 500ms after you stop typing)</li>
              <li>Results filter in real-time</li>
              <li>Server-side filtering for performance</li>
            </ul>
          </li>
          <li><strong>Search Tips:</strong>
            <ul>
              <li>Case-insensitive search</li>
              <li>Matches partial text</li>
              <li>Clear search to see all records</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Filters',
      content: `
        <p>The page includes a filter builder for advanced filtering:</p>
        <ul>
          <li><strong>Filter Button</strong> - Click to show/hide the filter panel</li>
          <li><strong>Filter Builder</strong> - Build complex filters with multiple conditions
            <ul>
              <li>Select a field to filter by</li>
              <li>Choose an operator (equals, contains, greater than, etc.)</li>
              <li>Enter or select the value</li>
              <li>Add multiple filter conditions</li>
              <li>Combine with AND/OR logic</li>
            </ul>
          </li>
          <li><strong>Available Filter Fields</strong>:
            <ul>
              <li>Productivity Target Type</li>
              <li>Target Contributors</li>
              <li>Weekly Hours</li>
              <li>Project Objective</li>
              <li>Other productivity-related fields</li>
            </ul>
          </li>
          <li><strong>Apply Filters</strong> - Click to apply your filter conditions</li>
          <li><strong>Clear Filters</strong> - Remove all filters to see all records</li>
        </ul>
        <p><strong>GPC Filter:</strong> Toggle the GPC Filter to apply your personalized content filtering preferences.</p>
      `
    },
    {
      heading: 'Column Selection',
      content: `
        <p>Customize which columns are displayed:</p>
        <ul>
          <li><strong>Default Columns</strong>:
            <ul>
              <li>Name</li>
              <li>Target_Contributors__c</li>
              <li>Weekly_Contributor_Production_Hours__c</li>
              <li>Weekly_Target_Production_Hours_Calc__c</li>
              <li>Total_Target_Productivity_Hours__c</li>
              <li>Productivity_Target_Type__c</li>
            </ul>
          </li>
          <li><strong>Available Fields</strong> - All fields from the productivity target object are available</li>
          <li><strong>Column Selector</strong> - Use to add or remove columns</li>
          <li><strong>Customize View</strong> - Show only the information you need</li>
        </ul>
      `
    },
    {
      heading: 'Setting Productivity Targets',
      content: `
        <p>To set or update productivity targets:</p>
        <ol>
          <li>Navigate to the productivity target record (or create a new one)</li>
          <li>Configure the target fields:
            <ul>
              <li><strong>Productivity Target Type</strong> - Select Hours, Units, or other type</li>
              <li><strong>Target Contributors</strong> - Number of contributors to target</li>
              <li><strong>Weekly Contributor Production Hours</strong> - Target hours per contributor per week</li>
              <li><strong>Total Target Productivity Hours</strong> - Overall target hours</li>
              <li><strong>Quality Score Requirements</strong> - Minimum quality scores (if applicable)</li>
              <li><strong>Completion Time Goals</strong> - Target completion times (if applicable)</li>
            </ul>
          </li>
          <li>Set performance benchmarks</li>
          <li>Save the productivity target configuration</li>
        </ol>
        <p><strong>Calculated Fields:</strong> Some fields like "Weekly Target Production Hours (Calc)" are automatically calculated based on other field values.</p>
      `
    },
    {
      heading: 'Target Types',
      content: `
        <p>Different productivity target types may be available:</p>
        <ul>
          <li><strong>Hours</strong> - Target based on hours worked</li>
          <li><strong>Units</strong> - Target based on units completed</li>
          <li><strong>Quality</strong> - Target based on quality scores</li>
          <li><strong>Combined</strong> - Targets combining multiple metrics</li>
        </ul>
        <p><strong>Configuration:</strong> The specific target types available depend on your Salesforce configuration.</p>
      `
    },
    {
      heading: 'Tracking Performance',
      content: `
        <p>Monitor actual performance against targets:</p>
        <ul>
          <li><strong>Performance Metrics</strong>:
            <ul>
              <li>Actual hours vs. target hours</li>
              <li>Actual units vs. target units</li>
              <li>Quality scores vs. requirements</li>
              <li>Completion times vs. goals</li>
            </ul>
          </li>
          <li><strong>Performance Analysis</strong>:
            <ul>
              <li>Identify objectives meeting targets</li>
              <li>Find objectives below targets</li>
              <li>Recognize high performers</li>
              <li>Identify areas needing improvement</li>
            </ul>
          </li>
          <li><strong>Trends</strong>:
            <ul>
              <li>Track performance over time</li>
              <li>Identify improving or declining trends</li>
              <li>Compare performance across objectives</li>
            </ul>
          </li>
        </ul>
        <p><strong>Note:</strong> Performance tracking may be available in other analytics pages or dashboards.</p>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all productivity target data from Salesforce</li>
          <li>Get the latest target information</li>
          <li>Update calculated fields</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Set Realistic Targets</strong> - Set targets that are achievable but challenging</li>
          <li><strong>Use Filters</strong> - Use filters to focus on specific project objectives or target types</li>
          <li><strong>Search Efficiently</strong> - Use search to quickly find specific productivity target records</li>
          <li><strong>Customize Columns</strong> - Show only the target fields you need</li>
          <li><strong>Review Targets Regularly</strong> - Periodically review and adjust targets based on actual performance</li>
          <li><strong>Track Performance</strong> - Monitor actual performance against targets regularly</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Export for Analysis</strong> - Export target data for detailed analysis</li>
        </ul>
      `
    }
  ]
};

