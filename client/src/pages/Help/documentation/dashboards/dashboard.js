// Dashboard Documentation
export default {
  title: 'Dashboard',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Dashboard provides a high-level overview of your projects and activities. It displays key metrics and statistics to help you understand the current state of your operations.</p>
        <p><strong>Purpose:</strong> This page serves as the main landing page for administrators and Salesforce managers, providing a centralized view of system activity and performance metrics.</p>
      `
    },
    {
      heading: 'Key Metrics',
      content: `
        <p>The dashboard displays several key metrics by default:</p>
        <ul>
          <li><strong>Total Publishes</strong> - All items published to Salesforce across all time</li>
          <li><strong>Today</strong> - Items published today (current day)</li>
          <li><strong>Last 7 Days</strong> - Items published in the last week</li>
          <li><strong>Success Rate</strong> - Overall publish success rate percentage</li>
        </ul>
        <p>These metrics are calculated in real-time based on the latest data from Salesforce.</p>
      `
    },
    {
      heading: 'Project Performance',
      content: `
        <p>The Project Performance section shows detailed analytics about project execution, including:</p>
        <ul>
          <li>Completion rates by project</li>
          <li>Timeline tracking and milestones</li>
          <li>Resource utilization metrics</li>
          <li>Performance trends over time</li>
        </ul>
        <p>This section helps you identify projects that are on track, at risk, or need attention.</p>
      `
    },
    {
      heading: 'Activity Analytics',
      content: `
        <p>View activity trends and patterns including:</p>
        <ul>
          <li><strong>Projects by User</strong> - Distribution of projects across team members</li>
          <li><strong>Publishes by Date</strong> - Daily publish activity trends</li>
          <li><strong>Activity by Object Type</strong> - Breakdown of operations by Salesforce object type</li>
          <li><strong>Operation Types Breakdown</strong> - Distribution of create, update, and delete operations</li>
        </ul>
        <p>These visualizations help you understand usage patterns and identify peak activity periods.</p>
      `
    },
    {
      heading: 'Filters and Options',
      content: `
        <p>The dashboard supports various filtering options:</p>
        <ul>
          <li><strong>Date Range Filter</strong> - Filter metrics by specific date ranges</li>
          <li><strong>Project Filter</strong> - Focus on specific projects</li>
          <li><strong>User Filter</strong> - View activity by specific users</li>
          <li><strong>GPC Filter</strong> - Apply your personalized content filtering preferences</li>
        </ul>
        <p>Use the refresh button to update the dashboard with the latest data from Salesforce.</p>
      `
    },
    {
      heading: 'Using the Dashboard',
      content: `
        <p><strong>To view the dashboard:</strong></p>
        <ol>
          <li>Navigate to <strong>Dashboard</strong> from the sidebar (if you have access)</li>
          <li>Review the key metrics at the top</li>
          <li>Explore the Project Performance section</li>
          <li>Review Activity Analytics charts</li>
          <li>Apply filters to customize your view</li>
          <li>Use the refresh button to update with latest data</li>
        </ol>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all dashboard data from Salesforce</li>
          <li>Update metrics and statistics</li>
          <li>Refresh activity analytics</li>
          <li>Get the latest publish information</li>
        </ul>
      `
    },
    {
      heading: 'Access Control',
      content: `
        <p><strong>Who can access:</strong> This dashboard is available to Administrators and Salesforce Managers only. Regular users will not see this page in their navigation.</p>
        <p>If you need access to this dashboard, contact your system administrator.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Monitor Daily</strong> - Check the dashboard daily to stay informed about system activity</li>
          <li><strong>Review Metrics</strong> - Regularly review key metrics to track system health</li>
          <li><strong>Use Filters</strong> - Use filters to focus on specific time periods or projects</li>
          <li><strong>Track Trends</strong> - Monitor activity trends to understand usage patterns</li>
          <li><strong>Review Performance</strong> - Check project performance section to identify issues</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Export Data</strong> - Export data for reporting and analysis</li>
        </ul>
      `
    }
  ]
};

