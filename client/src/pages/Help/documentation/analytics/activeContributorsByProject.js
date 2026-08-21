// Active Contributors by Project Documentation
export default {
  title: 'Active Contributors by Project',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Active Contributors by Project page allows you to view and analyze active contributors for specific projects, including their status, performance, and engagement metrics.</p>
        <p><strong>Purpose:</strong> Understand contributor engagement and performance at the project level. This helps you see which projects have active contributors, how many contributors are active per project, and their current status.</p>
        <p><strong>When to use:</strong> Use this page to analyze contributor distribution across projects, identify projects with low contributor engagement, track active contributor counts, and understand contributor-project relationships.</p>
        <p><strong>Default View:</strong> The page displays a table showing projects with their active contributor information.</p>
      `
    },
    {
      heading: 'Projects Table',
      content: `
        <p>The main table displays projects with their active contributor data:</p>
        <ul>
          <li><strong>Project Information</strong>:
            <ul>
              <li>Project Name</li>
              <li>Project ID</li>
              <li>Project Status</li>
              <li>Related account</li>
            </ul>
          </li>
          <li><strong>Active Contributor Metrics</strong>:
            <ul>
              <li>Total active contributors</li>
              <li>Contributors by status</li>
              <li>Contributor distribution</li>
            </ul>
          </li>
          <li><strong>Performance Metrics</strong> (if available):
            <ul>
              <li>Contributor performance scores</li>
              <li>Engagement levels</li>
              <li>Activity rates</li>
            </ul>
          </li>
        </ul>
        <p><strong>Infinite Scroll:</strong> The table uses infinite scroll to load more projects as you scroll down (1000 records per page).</p>
      `
    },
    {
      heading: 'Filters and Options',
      content: `
        <p>The page supports filtering (if available):</p>
        <ul>
          <li><strong>Project Filter</strong> - Filter by specific projects</li>
          <li><strong>Status Filter</strong> - Filter by project status</li>
          <li><strong>Account Filter</strong> - Filter by account</li>
          <li><strong>GPC Filter</strong> - Apply your personalized content filtering preferences
            <ul>
              <li>Toggle on/off using the GPC Filter button</li>
              <li>When enabled, shows only data for your selected accounts/projects</li>
            </ul>
          </li>
        </ul>
        <p><strong>Refresh Button:</strong> Click to reload all data with the latest information from Salesforce.</p>
      `
    },
    {
      heading: 'Understanding Active Contributors',
      content: `
        <p>Active contributors are typically defined as:</p>
        <ul>
          <li><strong>Status-Based</strong>:
            <ul>
              <li>Contributors with status "Active"</li>
              <li>Contributors in "Qualified" status</li>
              <li>Contributors in "Production" status</li>
              <li>Excludes "Closed" or "Removed" statuses</li>
            </ul>
          </li>
          <li><strong>Activity-Based</strong> (if applicable):
            <ul>
              <li>Contributors who have been active recently</li>
              <li>Based on last activity date</li>
            </ul>
          </li>
        </ul>
        <p><strong>Note:</strong> The exact definition of "active" may vary based on your organization's configuration.</p>
      `
    },
    {
      heading: 'Analyzing Contributor Distribution',
      content: `
        <p>Use the data to analyze contributor distribution:</p>
        <ul>
          <li><strong>Project Comparison</strong>:
            <ul>
              <li>Compare active contributor counts across projects</li>
              <li>Identify projects with many or few contributors</li>
              <li>Find resource allocation patterns</li>
            </ul>
          </li>
          <li><strong>Engagement Analysis</strong>:
            <ul>
              <li>Identify projects with high contributor engagement</li>
              <li>Find projects needing more contributors</li>
              <li>Understand contributor-project fit</li>
            </ul>
          </li>
          <li><strong>Resource Planning</strong>:
            <ul>
              <li>Plan contributor allocation</li>
              <li>Identify resource gaps</li>
              <li>Optimize contributor distribution</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Exporting Data',
      content: `
        <p>Export project and contributor data for analysis:</p>
        <ul>
          <li><strong>Export to Excel</strong> - Download as .xlsx file</li>
          <li><strong>Export to CSV</strong> - Download as .csv file</li>
        </ul>
      `
    },
    {
      heading: 'Performance Considerations',
      content: `
        <p>The page handles large datasets efficiently:</p>
        <ul>
          <li><strong>Infinite Scroll</strong> - Loads data in batches (1000 records per page)</li>
          <li><strong>Extended Timeout</strong> - Uses 5-minute timeout for large queries</li>
          <li><strong>Progress Indicators</strong> - Shows loading states during data fetch</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Monitor Regularly</strong> - Check active contributor counts regularly</li>
          <li><strong>Compare Projects</strong> - Compare contributor distribution across projects</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Export for Analysis</strong> - Export data for detailed analysis</li>
          <li><strong>Identify Gaps</strong> - Find projects with low contributor counts</li>
          <li><strong>Track Changes</strong> - Monitor how active contributor counts change over time</li>
        </ul>
      `
    }
  ]
};

