// Case Management Documentation
export default {
  title: 'Case Management',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>Case Management allows you to track, manage, and resolve support cases and issues related to projects and contributors.</p>
        <p><strong>Purpose:</strong> Centralize case tracking, manage case resolution workflows, maintain a history of all support interactions, and ensure timely resolution of issues.</p>
        <p><strong>When to use:</strong> Use this page to view all support cases, track case resolution progress, manage case assignments, and analyze case patterns.</p>
        <p><strong>Default View:</strong> The page displays a table of all cases with their current status, priority, and key information.</p>
      `
    },
    {
      heading: 'Case Table',
      content: `
        <p>The case table displays all cases with customizable columns. You can:</p>
        <ul>
          <li><strong>View Cases</strong> - See all cases in a sortable, filterable table</li>
          <li><strong>Customize Columns</strong> - Select which fields to display
            <ul>
              <li>Click the column selector button</li>
              <li>Choose from available fields</li>
              <li>Drag to reorder columns</li>
            </ul>
          </li>
          <li><strong>Sort Cases</strong> - Click column headers to sort (if enabled)</li>
          <li><strong>Filter Cases</strong> - Use the filter builder to create complex filters</li>
          <li><strong>Search Cases</strong> - Use the search bar for quick text search</li>
          <li><strong>View Case Details</strong> - Click on any case to see full details</li>
          <li><strong>Track Duration</strong> - See how long cases have been open</li>
          <li><strong>Monitor SLA Status</strong> - Check if cases are within SLA timeframes</li>
        </ul>
      `
    },
    {
      heading: 'Filter Builder',
      content: `
        <p>The page includes a powerful filter builder for advanced filtering:</p>
        <ul>
          <li><strong>Filter Button</strong> - Click to show/hide the filter panel</li>
          <li><strong>Add Filter Conditions</strong>:
            <ul>
              <li>Select a field to filter by</li>
              <li>Choose an operator (equals, contains, greater than, etc.)</li>
              <li>Enter or select the value</li>
              <li>Add multiple conditions</li>
              <li>Combine with AND/OR logic</li>
            </ul>
          </li>
          <li><strong>Available Filter Fields</strong>:
            <ul>
              <li>Case Status (Open, Closed, Pending, etc.)</li>
              <li>Case Type</li>
              <li>Priority (High, Medium, Low, etc.)</li>
              <li>Project Name</li>
              <li>Contributor Name</li>
              <li>Created Date</li>
              <li>Resolved Date</li>
              <li>Assigned To</li>
              <li>Other case-related fields</li>
            </ul>
          </li>
          <li><strong>Apply Filters</strong> - Click to apply your filter conditions</li>
          <li><strong>Clear Filters</strong> - Remove all filters to see all cases</li>
        </ul>
      `
    },
    {
      heading: 'Search Functionality',
      content: `
        <p>The search bar provides quick text-based search:</p>
        <ul>
          <li><strong>Search Fields</strong>:
            <ul>
              <li>Case ID or number</li>
              <li>Case subject/title</li>
              <li>Case description</li>
              <li>Contributor name</li>
              <li>Project name</li>
            </ul>
          </li>
          <li><strong>Search Tips</strong>:
            <ul>
              <li>Search is case-insensitive</li>
              <li>Matches partial text</li>
              <li>Results update as you type</li>
              <li>Works in combination with filters</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Case Details View',
      content: `
        <p>Click on any case to view detailed information in a side panel or modal:</p>
        <ul>
          <li><strong>Case Information</strong>:
            <ul>
              <li>Case ID and number</li>
              <li>Status and priority</li>
              <li>Type and category</li>
              <li>Created and updated dates</li>
              <li>Resolution date (if resolved)</li>
            </ul>
          </li>
          <li><strong>Contributor Details</strong>:
            <ul>
              <li>Contributor name and contact information</li>
              <li>Contributor project information</li>
            </ul>
          </li>
          <li><strong>Project Information</strong>:
            <ul>
              <li>Related project and objective</li>
              <li>Project status</li>
            </ul>
          </li>
          <li><strong>Timeline and History</strong>:
            <ul>
              <li>Status change history</li>
              <li>Assignment history</li>
              <li>Comment history</li>
              <li>Activity log</li>
            </ul>
          </li>
          <li><strong>Related Items</strong>:
            <ul>
              <li>Related cases</li>
              <li>Related projects</li>
              <li>Related contributor projects</li>
            </ul>
          </li>
          <li><strong>Comments and Communications</strong>:
            <ul>
              <li>All case comments</li>
              <li>Email communications</li>
              <li>Internal notes</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Case Actions',
      content: `
        <p>You can perform various actions on cases:</p>
        <ul>
          <li><strong>Update Case Status</strong>:
            <ul>
              <li>Change status (Open → In Progress → Resolved)</li>
              <li>Set resolution status</li>
              <li>Close cases</li>
            </ul>
          </li>
          <li><strong>Add Comments</strong>:
            <ul>
              <li>Add internal notes</li>
              <li>Add public comments</li>
              <li>Tag team members</li>
            </ul>
          </li>
          <li><strong>Assign Cases</strong>:
            <ul>
              <li>Assign to team members</li>
              <li>Reassign cases</li>
              <li>Set ownership</li>
            </ul>
          </li>
          <li><strong>Set Priority</strong>:
            <ul>
              <li>Change priority level</li>
              <li>Mark as urgent</li>
            </ul>
          </li>
          <li><strong>Link Related Cases</strong>:
            <ul>
              <li>Link to related cases</li>
              <li>Create case relationships</li>
            </ul>
          </li>
          <li><strong>Export Case Data</strong>:
            <ul>
              <li>Export to Excel</li>
              <li>Export to CSV</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Column Customization',
      content: `
        <p>Customize which columns are displayed in the case table:</p>
        <ul>
          <li><strong>Column Selector</strong> - Click to open column selection menu</li>
          <li><strong>Available Fields</strong> - All case fields are available for display</li>
          <li><strong>Default Columns</strong> - Common columns are shown by default</li>
          <li><strong>Reorder Columns</strong> - Drag columns to reorder them</li>
          <li><strong>Save Preferences</strong> - Column preferences may be saved for your next visit</li>
        </ul>
      `
    },
    {
      heading: 'GPC Filter',
      content: `
        <p>The page supports GPC (Global Persona-Based Content) filtering:</p>
        <ul>
          <li><strong>Toggle Button</strong> - Use the GPC Filter toggle to enable/disable</li>
          <li><strong>When Enabled</strong> - Shows only cases related to your selected accounts/projects</li>
          <li><strong>When Disabled</strong> - Shows all cases</li>
          <li><strong>Configuration</strong> - Set your preferences in Profile settings</li>
        </ul>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all case data from Salesforce</li>
          <li>Get the latest case status updates</li>
          <li>Update case counts and metrics</li>
        </ul>
        <p><strong>When to refresh:</strong> After making case updates, or if you suspect data is outdated.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Use Filters Regularly</strong> - Filter to focus on specific case types or statuses</li>
          <li><strong>Customize Columns</strong> - Show only the columns you need for better visibility</li>
          <li><strong>Monitor SLA</strong> - Regularly check cases approaching SLA deadlines</li>
          <li><strong>Update Status Promptly</strong> - Keep case statuses current for accurate tracking</li>
          <li><strong>Add Comments</strong> - Document case progress with regular comments</li>
          <li><strong>Use Search</strong> - Use search to quickly find specific cases</li>
          <li><strong>Link Related Cases</strong> - Link related cases to track patterns</li>
          <li><strong>Export for Analysis</strong> - Export case data for trend analysis</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
        </ul>
      `
    }
  ]
};

