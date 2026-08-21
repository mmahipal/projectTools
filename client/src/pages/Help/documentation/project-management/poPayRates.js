// PO Pay Rates Documentation
export default {
  title: 'PO Pay Rates',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The PO Pay Rates page allows you to manage pay rates for Project Objectives (POs), enabling you to configure different payment structures for different objectives.</p>
        <p><strong>Purpose:</strong> Set and manage payment rates at the project objective level to ensure accurate compensation for contributors working on specific objectives.</p>
        <p><strong>When to use:</strong> Use this page when setting up payment rates for new project objectives, updating existing rates, or reviewing rate configurations across objectives.</p>
        <p><strong>Default View:</strong> The page displays a table of pay rate records with their associated project objectives and rate information.</p>
      `
    },
    {
      heading: 'Pay Rates Table',
      content: `
        <p>The main table displays pay rate records with the following information:</p>
        <ul>
          <li><strong>Record Name</strong> - Name/identifier of the pay rate record</li>
          <li><strong>Status</strong> - Current status of the pay rate (Active, Inactive, etc.)</li>
          <li><strong>Project Rate</strong> - Base project rate</li>
          <li><strong>Client Pay Rate</strong> - Rate paid by the client</li>
          <li><strong>Minimum Rate</strong> - Minimum payment rate</li>
          <li><strong>Maximum Rate</strong> - Maximum payment rate</li>
          <li><strong>Project Objective</strong> - Associated project objective</li>
          <li><strong>Additional Fields</strong> - Customizable columns based on available fields</li>
        </ul>
        <p><strong>Infinite Scroll:</strong> The table uses infinite scroll to load more records as you scroll down.</p>
      `
    },
    {
      heading: 'Search Functionality',
      content: `
        <p>The page includes a search bar to find specific pay rate records:</p>
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
              <li>Status</li>
              <li>Project Rate</li>
              <li>Client Pay Rate</li>
              <li>Project Objective</li>
              <li>Other rate-related fields</li>
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
              <li>Status__c</li>
              <li>Project_Rate__c</li>
              <li>Client_Pay_Rate__c</li>
              <li>Minimum_Rate__c</li>
              <li>Maximum_Rate__c</li>
            </ul>
          </li>
          <li><strong>Available Fields</strong> - All fields from the pay rate object are available</li>
          <li><strong>Column Selector</strong> - Use to add or remove columns</li>
          <li><strong>Customize View</strong> - Show only the information you need</li>
        </ul>
      `
    },
    {
      heading: 'Setting Pay Rates',
      content: `
        <p>To set or update pay rates:</p>
        <ol>
          <li>Navigate to the pay rate record (or create a new one)</li>
          <li>Configure the rate fields:
            <ul>
              <li><strong>Project Rate</strong> - Base rate for the project objective</li>
              <li><strong>Client Pay Rate</strong> - Rate that the client pays</li>
              <li><strong>Minimum Rate</strong> - Minimum payment amount</li>
              <li><strong>Maximum Rate</strong> - Maximum payment amount</li>
              <li><strong>Rate Tiers</strong> - If applicable, configure tiered rates</li>
            </ul>
          </li>
          <li>Set effective dates if using date-based rates</li>
          <li>Configure rate tiers or bonuses if applicable</li>
          <li>Save the pay rate configuration</li>
        </ol>
        <p><strong>Note:</strong> Pay rates are typically configured at the Project Objective level, allowing different rates for different objectives within the same project.</p>
      `
    },
    {
      heading: 'Rate Types',
      content: `
        <p>Different rate types may be available:</p>
        <ul>
          <li><strong>Fixed Rate</strong> - Single rate for all work</li>
          <li><strong>Tiered Rates</strong> - Different rates based on volume or performance</li>
          <li><strong>Bonus Rates</strong> - Additional rates for exceptional performance</li>
          <li><strong>Time-Based Rates</strong> - Rates that change over time</li>
        </ul>
        <p><strong>Configuration:</strong> The specific rate types available depend on your Salesforce configuration.</p>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all pay rate data from Salesforce</li>
          <li>Get the latest rate information</li>
          <li>Update the table with current data</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Use Filters</strong> - Use filters to focus on specific project objectives or statuses</li>
          <li><strong>Search Efficiently</strong> - Use search to quickly find specific pay rate records</li>
          <li><strong>Customize Columns</strong> - Show only the rate fields you need</li>
          <li><strong>Review Rates Regularly</strong> - Periodically review rates to ensure they're current</li>
          <li><strong>Set Appropriate Ranges</strong> - Use minimum and maximum rates to control payment ranges</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Export for Analysis</strong> - Export rate data for budgeting and analysis</li>
        </ul>
      `
    }
  ]
};

