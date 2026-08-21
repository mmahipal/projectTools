// Queue Status Management Documentation
export default {
  title: 'Queue Status Management',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>Queue Status Management helps you track and manage contributor projects through different queue statuses such as Calibration Queue, Production Queue, and Test Queue.</p>
        <p><strong>Purpose:</strong> Monitor and manage the flow of contributor projects through various queue statuses to ensure efficient processing and quality control. This page helps you understand where contributor projects are in the qualification and production pipeline.</p>
        <p><strong>When to use:</strong> Use this page to track contributor project progress through queues, identify bottlenecks, update queue statuses, and analyze queue performance.</p>
        <p><strong>Default View:</strong> The page displays a table of all contributor projects with their current queue status. You can switch to the Analytics tab to view queue metrics.</p>
        <p><strong>Important Note:</strong> Queue Status is tracked at the Contributor Project level. One project can have many contributor project records, each with its own queue status.</p>
      `
    },
    {
      heading: 'Page Tabs',
      content: `
        <p>The page has two main tabs:</p>
        <ul>
          <li><strong>Management Tab</strong> - Manage contributor projects and queue statuses
            <ul>
              <li>View all contributor projects</li>
              <li>Filter and search projects</li>
              <li>Update queue statuses</li>
              <li>Bulk operations</li>
            </ul>
          </li>
          <li><strong>Analytics Tab</strong> - View queue analytics and metrics
            <ul>
              <li>Queue status distribution</li>
              <li>Time in queue metrics</li>
              <li>Status change frequency</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Contributor Projects Table',
      content: `
        <p>The main table displays all contributor projects with their current queue status. You can:</p>
        <ul>
          <li><strong>View Projects</strong> - See all contributor projects with their queue status</li>
          <li><strong>Filter Projects</strong> - Use filters to narrow down the list</li>
          <li><strong>Search Projects</strong> - Search by contributor name, project name, or ID</li>
          <li><strong>Update Queue Status</strong> - Change queue status for individual or multiple projects</li>
          <li><strong>View Details</strong> - Click on a project to see detailed information</li>
          <li><strong>Bulk Operations</strong> - Select multiple projects for bulk updates</li>
          <li><strong>Export Data</strong> - Export project data to Excel or CSV</li>
        </ul>
        <p><strong>Queue Statuses:</strong> Common queue statuses include:
          <ul>
            <li>Calibration Queue</li>
            <li>Production Queue</li>
            <li>Test Queue</li>
            <li>--None-- (no queue status assigned)</li>
          </ul>
        </p>
      `
    },
    {
      heading: 'Filter Builder',
      content: `
        <p>The page includes a filter builder for advanced filtering:</p>
        <ul>
          <li><strong>Filter Button</strong> - Click to show/hide the filter panel</li>
          <li><strong>Available Filters</strong>:
            <ul>
              <li><strong>Project Filter</strong> - Filter by parent project name</li>
              <li><strong>Status Filter</strong> - Filter by contributor project status (Active, Qualified, Production, Closed, Removed, etc.)</li>
              <li><strong>Queue Status Filter</strong> - Filter by queue status (Calibration Queue, Production Queue, Test Queue, --None--, etc.)</li>
              <li><strong>Contributor Filter</strong> - Filter by contributor name</li>
              <li><strong>Date Filters</strong> - Filter by creation date, last modified date, etc.</li>
            </ul>
          </li>
          <li><strong>Add Multiple Filters</strong> - Combine filters with AND/OR logic</li>
          <li><strong>Apply Filters</strong> - Click to apply your filter conditions</li>
          <li><strong>Clear Filters</strong> - Remove all filters to see all projects</li>
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
              <li>Contributor name</li>
              <li>Project name</li>
              <li>Contributor project ID</li>
              <li>Project objective name</li>
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
      heading: 'Updating Queue Status',
      content: `
        <p>To update queue status for contributor projects:</p>
        <ol>
          <li>Select one or more contributor projects from the table</li>
          <li>Click the <strong>Update Queue Status</strong> button</li>
          <li>Select the new queue status from the dropdown</li>
          <li>Confirm the update</li>
          <li>The queue status is updated in Salesforce</li>
        </ol>
        <p><strong>Bulk Updates:</strong> You can select multiple projects (using checkboxes) and update their queue statuses all at once.</p>
      `
    },
    {
      heading: 'Analytics Dashboard',
      content: `
        <p>The Analytics tab provides comprehensive insights into queue performance:</p>
        <ul>
          <li><strong>Contributor Projects by Queue Status</strong>:
            <ul>
              <li>Shows distribution of projects across all queue statuses</li>
              <li>Displays total count and counts per status</li>
              <li>Includes projects in Active, Qualified, and Production statuses (excludes Closed and Removed)</li>
              <li>Visual chart showing the distribution</li>
            </ul>
          </li>
          <li><strong>Time in Queue Metrics</strong>:
            <ul>
              <li>Average time spent in each queue status</li>
              <li>Minimum and maximum time in queue</li>
              <li>Count of projects in each queue</li>
              <li>Helps identify slow-moving queues</li>
            </ul>
          </li>
          <li><strong>Status Change Frequency (Last 30 Days)</strong>:
            <ul>
              <li>Total number of status changes in the last 30 days</li>
              <li>Breakdown by queue status</li>
              <li>Top status transitions</li>
              <li>Shows activity patterns</li>
            </ul>
          </li>
        </ul>
        <p><strong>Using Analytics:</strong> Use these metrics to identify bottlenecks, optimize queue workflows, and track improvement over time.</p>
      `
    },
    {
      heading: 'Bulk Actions',
      content: `
        <p>You can perform bulk operations on selected contributor projects:</p>
        <ul>
          <li><strong>Bulk Update Queue Status</strong>:
            <ul>
              <li>Select multiple projects using checkboxes</li>
              <li>Click "Bulk Update Queue Status"</li>
              <li>Select the new queue status</li>
              <li>Confirm the bulk update</li>
            </ul>
          </li>
          <li><strong>Export Selected Records</strong>:
            <ul>
              <li>Select projects to export</li>
              <li>Click Export button</li>
              <li>Choose format (Excel or CSV)</li>
            </ul>
          </li>
          <li><strong>Apply Filters to Selection</strong> - Use filters to narrow down, then select all filtered results</li>
        </ul>
      `
    },
    {
      heading: 'Column Customization',
      content: `
        <p>Customize which columns are displayed:</p>
        <ul>
          <li><strong>Column Selector</strong> - Click to open column selection menu</li>
          <li><strong>Available Fields</strong> - All contributor project fields are available</li>
          <li><strong>Common Columns</strong>:
            <ul>
              <li>Contributor Name</li>
              <li>Project Name</li>
              <li>Project Objective</li>
              <li>Status</li>
              <li>Queue Status</li>
              <li>Created Date</li>
              <li>Last Modified Date</li>
            </ul>
          </li>
          <li><strong>Reorder Columns</strong> - Drag to reorder</li>
        </ul>
      `
    },
    {
      heading: 'GPC Filter',
      content: `
        <p>The page supports GPC filtering:</p>
        <ul>
          <li><strong>Toggle Button</strong> - Use the GPC Filter toggle to enable/disable</li>
          <li><strong>When Enabled</strong> - Shows only contributor projects related to your selected accounts/projects</li>
          <li><strong>When Disabled</strong> - Shows all contributor projects</li>
        </ul>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all contributor project data from Salesforce</li>
          <li>Update queue status information</li>
          <li>Refresh analytics metrics</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Monitor Analytics Regularly</strong> - Check the Analytics tab to identify bottlenecks</li>
          <li><strong>Use Filters</strong> - Use filters to focus on specific projects or statuses</li>
          <li><strong>Update Status Promptly</strong> - Keep queue statuses current for accurate tracking</li>
          <li><strong>Bulk Update When Possible</strong> - Use bulk updates for efficiency</li>
          <li><strong>Review Time Metrics</strong> - Monitor time in queue to identify slow-moving queues</li>
          <li><strong>Track Status Changes</strong> - Review status change frequency to understand workflow patterns</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Export for Analysis</strong> - Export data for detailed analysis</li>
        </ul>
      `
    }
  ]
};

