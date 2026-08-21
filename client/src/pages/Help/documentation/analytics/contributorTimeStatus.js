// Contributor Time Status Documentation
export default {
  title: 'Contributor Time Status',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Contributor Time Status Dashboard provides comprehensive analytics about how contributors spend their time in different statuses, status transition patterns, and workflow bottlenecks.</p>
        <p><strong>Purpose:</strong> Understand how contributors spend their time, identify bottlenecks in workflows, track status transitions, and optimize contributor allocation and processes.</p>
        <p><strong>When to use:</strong> Use this dashboard to analyze contributor time patterns, identify where contributors are spending too much time, understand status transition patterns, and find workflow bottlenecks.</p>
        <p><strong>Default View:</strong> The dashboard loads showing overview cards, charts, and tables with time status analytics.</p>
      `
    },
    {
      heading: 'Dashboard Components',
      content: `
        <p>The dashboard is organized into several sections:</p>
        <ul>
          <li><strong>Overview Cards</strong> - Key metrics at a glance:
            <ul>
              <li>Total contributors tracked</li>
              <li>Average time in status</li>
              <li>Status distribution</li>
              <li>Other summary metrics</li>
            </ul>
          </li>
          <li><strong>Time in Status Chart</strong> - Visualizes time spent in each status
            <ul>
              <li>Bar or pie chart showing distribution</li>
              <li>Average, minimum, maximum times</li>
              <li>Comparison across statuses</li>
            </ul>
          </li>
          <li><strong>Status Distribution Chart</strong> - Shows how contributors are distributed across statuses
            <ul>
              <li>Current status breakdown</li>
              <li>Visual representation</li>
            </ul>
          </li>
          <li><strong>Status Timeline Table</strong> - Detailed timeline of status changes
            <ul>
              <li>Contributor status history</li>
              <li>Time spent in each status</li>
              <li>Transition dates</li>
            </ul>
          </li>
          <li><strong>Bottleneck Analysis</strong> - Identifies workflow bottlenecks
            <ul>
              <li>Statuses where contributors spend too much time</li>
              <li>Bottleneck severity indicators</li>
              <li>Recommendations for improvement</li>
            </ul>
          </li>
          <li><strong>Status Transition Chart</strong> - Shows how contributors move between statuses
            <ul>
              <li>Transition patterns</li>
              <li>Common paths</li>
              <li>Transition frequencies</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Filters and Options',
      content: `
        <p>The dashboard supports various filtering options:</p>
        <ul>
          <li><strong>Account Filter</strong> - Filter by Salesforce account (if applicable)</li>
          <li><strong>Date Range</strong> - Filter by time period (if available)</li>
          <li><strong>Status Filter</strong> - Focus on specific statuses</li>
          <li><strong>GPC Filter</strong> - Apply your personalized content filtering preferences
            <ul>
              <li>Toggle on/off using the GPC Filter button</li>
              <li>When enabled, shows only data for your selected accounts/projects</li>
            </ul>
          </li>
        </ul>
        <p><strong>Refresh Button:</strong> Click to reload all dashboard data with the latest information from Salesforce.</p>
      `
    },
    {
      heading: 'Understanding Time Metrics',
      content: `
        <p>The dashboard tracks several time-related metrics:</p>
        <ul>
          <li><strong>Time in Status</strong>:
            <ul>
              <li>How long contributors spend in each status</li>
              <li>Average, minimum, and maximum times</li>
              <li>Helps identify slow-moving statuses</li>
            </ul>
          </li>
          <li><strong>Status Duration</strong>:
            <ul>
              <li>Time from entering to leaving a status</li>
              <li>Tracked per contributor</li>
              <li>Aggregated for analysis</li>
            </ul>
          </li>
          <li><strong>Total Time</strong>:
            <ul>
              <li>Total time across all statuses</li>
              <li>Per contributor or aggregate</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Bottleneck Analysis',
      content: `
        <p>The Bottleneck Analysis section helps identify workflow issues:</p>
        <ul>
          <li><strong>Bottleneck Indicators</strong>:
            <ul>
              <li>Statuses with unusually long average times</li>
              <li>High contributor counts in specific statuses</li>
              <li>Slow transition rates</li>
            </ul>
          </li>
          <li><strong>Severity Levels</strong>:
            <ul>
              <li>Critical - Immediate attention needed</li>
              <li>High - Should be addressed soon</li>
              <li>Medium - Monitor and optimize</li>
              <li>Low - Minor issues</li>
            </ul>
          </li>
          <li><strong>Recommendations</strong>:
            <ul>
              <li>Suggestions for improving bottlenecks</li>
              <li>Process optimization ideas</li>
              <li>Resource reallocation suggestions</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Status Transitions',
      content: `
        <p>The Status Transition Chart shows how contributors move between statuses:</p>
        <ul>
          <li><strong>Transition Patterns</strong>:
            <ul>
              <li>Common paths between statuses</li>
              <li>Frequency of each transition</li>
              <li>Visual flow representation</li>
            </ul>
          </li>
          <li><strong>Analysis</strong>:
            <ul>
              <li>Identify typical workflows</li>
              <li>Find unusual transitions</li>
              <li>Understand process flow</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Timeline Table',
      content: `
        <p>The Status Timeline Table provides detailed history:</p>
        <ul>
          <li><strong>Contributor Information</strong> - Name, ID, etc.</li>
          <li><strong>Status History</strong> - Chronological list of status changes</li>
          <li><strong>Time in Each Status</strong> - Duration for each status</li>
          <li><strong>Transition Dates</strong> - When status changes occurred</li>
          <li><strong>Sorting</strong> - Sort by various columns</li>
          <li><strong>Pagination</strong> - Navigate through large datasets</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Monitor Regularly</strong> - Check the dashboard regularly to identify issues early</li>
          <li><strong>Focus on Bottlenecks</strong> - Pay attention to bottleneck analysis for process improvement</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Review Transitions</strong> - Understand transition patterns to optimize workflows</li>
          <li><strong>Compare Time Metrics</strong> - Compare average times across statuses to find issues</li>
          <li><strong>Export Data</strong> - Export timeline data for detailed analysis</li>
          <li><strong>Refresh Frequently</strong> - Refresh to get the latest time status data</li>
        </ul>
      `
    }
  ]
};

