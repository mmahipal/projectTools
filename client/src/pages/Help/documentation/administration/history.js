// History Documentation
export default {
  title: 'History',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The History page tracks all changes and operations performed in the system, providing a comprehensive audit trail for compliance, troubleshooting, and accountability.</p>
        <p><strong>Purpose:</strong> Maintain a complete record of all system activities including creates, updates, deletes, and other operations. This is essential for auditing, debugging, and understanding what happened in the system.</p>
        <p><strong>When to use:</strong> Use this page to investigate issues, track changes to specific records, audit user activities, or understand the history of an object.</p>
        <p><strong>Default View:</strong> The page displays recent history entries, sorted by timestamp (newest first).</p>
      `
    },
    {
      heading: 'History List',
      content: `
        <p>The main table displays all history entries with the following information:</p>
        <ul>
          <li><strong>Timestamp</strong> - When the operation occurred (date and time)</li>
          <li><strong>User</strong> - Who performed the action (user name and email)</li>
          <li><strong>Object Type</strong> - Type of Salesforce object (Project, Contributor Project, etc.)</li>
          <li><strong>Record ID</strong> - Salesforce record ID that was affected</li>
          <li><strong>Operation Type</strong> - Type of operation (Create, Update, Delete, Publish, etc.)</li>
          <li><strong>Status</strong> - Operation status (Success, Failed, Pending)</li>
          <li><strong>Details</strong> - Additional information about the operation</li>
        </ul>
      `
    },
    {
      heading: 'Filters',
      content: `
        <p>Use filters to narrow down the history entries:</p>
        <ul>
          <li><strong>Object Type Filter</strong> - Filter by object type:
            <ul>
              <li>Project</li>
              <li>Project Objective</li>
              <li>Contributor Project</li>
              <li>Case</li>
              <li>Other object types</li>
            </ul>
          </li>
          <li><strong>Operation Type Filter</strong> - Filter by operation:
            <ul>
              <li>Create</li>
              <li>Update</li>
              <li>Delete</li>
              <li>Publish</li>
              <li>Other operations</li>
            </ul>
          </li>
          <li><strong>Date Range Filter</strong> - Filter by when the operation occurred:
            <ul>
              <li>Select start and end dates</li>
              <li>Use date pickers to select dates</li>
              <li>Filter by Today, Last 7 Days, Last 30 Days, or Custom Range</li>
            </ul>
          </li>
          <li><strong>User Filter</strong> - Filter by who performed the action:
            <ul>
              <li>Search for users by name or email</li>
              <li>Select specific users</li>
            </ul>
          </li>
          <li><strong>Status Filter</strong> - Filter by operation status:
            <ul>
              <li>Success - Operations that completed successfully</li>
              <li>Failed - Operations that failed with errors</li>
              <li>Pending - Operations still in progress</li>
            </ul>
          </li>
          <li><strong>Record ID Search</strong> - Search for specific record IDs
            <ul>
              <li>Enter a Salesforce record ID</li>
              <li>Shows all history for that specific record</li>
            </ul>
          </li>
        </ul>
        <p><strong>Combining Filters:</strong> You can combine multiple filters to find very specific history entries. All filters work together with AND logic.</p>
      `
    },
    {
      heading: 'Viewing History Details',
      content: `
        <p>Click on any history entry to view detailed information:</p>
        <ul>
          <li><strong>Full Operation Details</strong>:
            <ul>
              <li>Complete timestamp with timezone</li>
              <li>User information</li>
              <li>Object and record details</li>
              <li>Operation type and parameters</li>
            </ul>
          </li>
          <li><strong>Field Changes (for Updates)</strong>:
            <ul>
              <li>Shows which fields were changed</li>
              <li>Old value vs. new value for each field</li>
              <li>Field names and types</li>
            </ul>
          </li>
          <li><strong>Error Information (for Failed Operations)</strong>:
            <ul>
              <li>Error message</li>
              <li>Error code</li>
              <li>Stack trace (if available)</li>
              <li>Context information</li>
            </ul>
          </li>
          <li><strong>Related Records</strong>:
            <ul>
              <li>Links to related objects</li>
              <li>Related operation history</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Search Functionality',
      content: `
        <p>The page includes search capabilities:</p>
        <ul>
          <li><strong>Record ID Search</strong> - Search for specific Salesforce record IDs</li>
          <li><strong>User Search</strong> - Search for users by name or email</li>
          <li><strong>Object Name Search</strong> - Search by object name (if applicable)</li>
        </ul>
        <p><strong>Search Tips:</strong> Use search in combination with filters for precise results. Search is case-insensitive.</p>
      `
    },
    {
      heading: 'Sorting',
      content: `
        <p>The history table supports sorting:</p>
        <ul>
          <li><strong>Sort by Timestamp</strong> - Default sort (newest first)</li>
          <li><strong>Sort by User</strong> - Group by user</li>
          <li><strong>Sort by Object Type</strong> - Group by object</li>
          <li><strong>Sort by Status</strong> - Group by success/failure</li>
        </ul>
        <p>Click column headers to change sort order. Click again to reverse the order.</p>
      `
    },
    {
      heading: 'Exporting History',
      content: `
        <p>Export history data for analysis or reporting:</p>
        <ul>
          <li><strong>Export to Excel</strong> - Download as .xlsx file
            <ul>
              <li>Includes all visible columns</li>
              <li>Respects current filters</li>
              <li>Preserves formatting</li>
            </ul>
          </li>
          <li><strong>Export to CSV</strong> - Download as .csv file
            <ul>
              <li>Compatible with most tools</li>
              <li>Easy to import into databases</li>
            </ul>
          </li>
        </ul>
        <p><strong>Note:</strong> Exported data includes only the entries currently visible based on your filters.</p>
      `
    },
    {
      heading: 'Reverting Changes',
      content: `
        <p>For some operations, you may be able to revert changes:</p>
        <ul>
          <li><strong>Available for Updates</strong> - If an update operation is selected, you may see a "Revert" button</li>
          <li><strong>How it Works</strong>:
            <ul>
              <li>Click "Revert" on a history entry</li>
              <li>Review what will be reverted</li>
              <li>Confirm the revert operation</li>
              <li>The record is restored to its previous state</li>
            </ul>
          </li>
          <li><strong>Limitations</strong>:
            <ul>
              <li>Not all operations can be reverted</li>
              <li>Revert may not be available for deleted records</li>
              <li>Some field types may not support revert</li>
            </ul>
          </li>
        </ul>
        <p><strong>Use with Caution:</strong> Reverting changes can affect current data. Always review what will be changed before reverting.</p>
      `
    },
    {
      heading: 'Pagination',
      content: `
        <p>For large history datasets, the table uses pagination:</p>
        <ul>
          <li><strong>Page Size</strong> - Number of entries per page (configurable)</li>
          <li><strong>Navigation</strong> - Use Previous/Next buttons or page numbers</li>
          <li><strong>Total Count</strong> - Shows total entries matching your filters</li>
        </ul>
        <p>This ensures the page remains responsive even with thousands of history entries.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Use Filters</strong> - Always use filters to narrow down results</li>
          <li><strong>Date Ranges</strong> - Use date range filters to focus on specific time periods</li>
          <li><strong>Track Specific Records</strong> - Use Record ID search to track all changes to a specific record</li>
          <li><strong>Investigate Failures</strong> - Filter by Failed status to find and fix issues</li>
          <li><strong>Audit User Activity</strong> - Use User filter to see what a specific user has done</li>
          <li><strong>Export for Analysis</strong> - Export history for detailed analysis in Excel</li>
          <li><strong>Regular Reviews</strong> - Regularly review history to understand system usage</li>
          <li><strong>Check Before Revert</strong> - Always review details before reverting changes</li>
          <li><strong>Use Object Filter</strong> - Filter by object type to focus on specific object changes</li>
          <li><strong>Monitor Failed Operations</strong> - Regularly check for failed operations that need attention</li>
        </ul>
      `
    }
  ]
};

