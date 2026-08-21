// Case Analytics Dashboard Documentation
export default {
  title: 'Case Analytics',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Case Analytics Dashboard provides insights into case patterns, resolution times, and trends to help improve support processes.</p>
        <p><strong>Purpose:</strong> This dashboard helps you analyze case volume, identify bottlenecks, track resolution performance, and understand case trends over time.</p>
      `
    },
    {
      heading: 'Key Metrics',
      content: `
        <p>The dashboard displays several key metrics:</p>
        <ul>
          <li><strong>Total Cases</strong> - Total number of cases in the system</li>
          <li><strong>Open Cases</strong> - Currently unresolved cases</li>
          <li><strong>Resolved Cases</strong> - Cases that have been closed/resolved</li>
          <li><strong>Average Resolution Time</strong> - Average time to resolve cases</li>
          <li><strong>SLA Compliance Rate</strong> - Percentage of cases resolved within SLA</li>
        </ul>
      `
    },
    {
      heading: 'Visualizations',
      content: `
        <p>The dashboard includes various charts and visualizations:</p>
        <ul>
          <li><strong>Case Volume Over Time</strong> - Line or bar chart showing case volume trends</li>
          <li><strong>Resolution Time Metrics</strong> - Distribution of resolution times</li>
          <li><strong>Case Type Distribution</strong> - Pie or bar chart showing breakdown by case type</li>
          <li><strong>SLA Compliance</strong> - Compliance rate visualization</li>
          <li><strong>Trend Analysis</strong> - Comparative analysis over different time periods</li>
        </ul>
      `
    },
    {
      heading: 'Filters and Options',
      content: `
        <p>Use the following filters to customize your view:</p>
        <ul>
          <li><strong>Date Range</strong> - Filter cases by creation or resolution date</li>
          <li><strong>Case Status</strong> - Filter by open, closed, pending, etc.</li>
          <li><strong>Case Type</strong> - Filter by specific case types</li>
          <li><strong>Priority</strong> - Filter by case priority level</li>
          <li><strong>Project</strong> - Filter cases related to specific projects</li>
          <li><strong>Contributor</strong> - Filter cases by contributor</li>
          <li><strong>GPC Filter</strong> - Apply your personalized content filtering</li>
        </ul>
        <p><strong>Search:</strong> Use the search bar to find specific cases by ID, subject, or description.</p>
        <p><strong>Export:</strong> Export dashboard data to CSV or Excel for further analysis.</p>
      `
    },
    {
      heading: 'Using the Dashboard',
      content: `
        <p><strong>To view case analytics:</strong></p>
        <ol>
          <li>Navigate to <strong>Dashboards > Case Analytics</strong></li>
          <li>Select your desired filters from the filter panel</li>
          <li>Review the metrics and visualizations</li>
          <li>Click on chart elements to drill down into details</li>
          <li>Use the refresh button to update with latest data</li>
        </ol>
        <p><strong>Interpreting Results:</strong> Look for patterns in case volume, identify recurring issues, and track improvements in resolution times over time.</p>
      `
    },
    {
      heading: 'Drill-Down Analysis',
      content: `
        <p>Click on chart elements to drill down into details:</p>
        <ul>
          <li><strong>Case Volume Charts</strong> - Click on a time period to see cases for that period</li>
          <li><strong>Case Type Distribution</strong> - Click on a case type to filter by that type</li>
          <li><strong>Resolution Time Charts</strong> - Click on a time range to see cases in that range</li>
          <li><strong>SLA Compliance</strong> - Click to see cases that are within or outside SLA</li>
        </ul>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all case data from Salesforce</li>
          <li>Update analytics metrics and charts</li>
          <li>Get the latest case status information</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Monitor Trends</strong> - Regularly review case volume trends to identify patterns</li>
          <li><strong>Track Resolution Times</strong> - Monitor resolution times to ensure SLA compliance</li>
          <li><strong>Identify Recurring Issues</strong> - Look for patterns in case types to identify recurring problems</li>
          <li><strong>Use Filters</strong> - Use filters to focus on specific time periods, types, or projects</li>
          <li><strong>Export for Analysis</strong> - Export data for detailed trend analysis</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Review SLA Compliance</strong> - Regularly check SLA compliance rates</li>
        </ul>
      `
    }
  ]
};

