// Project Roster Funnel Documentation
export default {
  title: 'Project Roster Funnel',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Project Roster Funnel page visualizes the contributor onboarding and qualification funnel to identify drop-off points and optimize the onboarding process.</p>
        <p><strong>Purpose:</strong> Track contributor progression through onboarding stages, identify where contributors drop off, measure conversion rates at each stage, and optimize the onboarding process to improve completion rates.</p>
        <p><strong>When to use:</strong> Use this page to analyze onboarding effectiveness, identify bottlenecks in the qualification process, measure funnel performance, and make data-driven decisions to improve contributor onboarding.</p>
        <p><strong>Default View:</strong> The page displays a table showing project objectives with their funnel metrics, including contributor counts at each stage of the onboarding process.</p>
      `
    },
    {
      heading: 'Funnel Table',
      content: `
        <p>The main table displays project objectives with their funnel metrics:</p>
        <ul>
          <li><strong>Project Objective Information</strong>:
            <ul>
              <li>Project Objective Name</li>
              <li>Related Project</li>
              <li>Objective details</li>
            </ul>
          </li>
          <li><strong>Funnel Stages</strong> - Contributor counts at each stage:
            <ul>
              <li>Stage 1 - Initial/Invited</li>
              <li>Stage 2 - Qualification Step 1</li>
              <li>Stage 3 - Qualification Step 2</li>
              <li>Additional stages as configured</li>
              <li>Final Stage - Qualified/Active</li>
            </ul>
          </li>
          <li><strong>Conversion Metrics</strong>:
            <ul>
              <li>Conversion rate between stages</li>
              <li>Drop-off rates</li>
              <li>Completion rates</li>
            </ul>
          </li>
          <li><strong>Total Contributors</strong> - Total number of contributors in the funnel</li>
        </ul>
        <p><strong>Infinite Scroll:</strong> The table uses infinite scroll to load more project objectives as you scroll down (500 records per page).</p>
      `
    },
    {
      heading: 'Understanding the Funnel',
      content: `
        <p>The funnel represents the contributor journey from initial invitation to qualification:</p>
        <ul>
          <li><strong>Funnel Stages</strong>:
            <ul>
              <li>Each stage represents a step in the onboarding/qualification process</li>
              <li>Stages typically correspond to qualification steps</li>
              <li>Contributors progress through stages sequentially</li>
            </ul>
          </li>
          <li><strong>Funnel Flow</strong>:
            <ul>
              <li>Contributors enter at the top (Stage 1)</li>
              <li>Progress through intermediate stages</li>
              <li>Complete at the final stage (Qualified/Active)</li>
            </ul>
          </li>
          <li><strong>Drop-off Points</strong>:
            <ul>
              <li>Stages with significant contributor loss</li>
              <li>Indicate where the process needs improvement</li>
              <li>Help prioritize optimization efforts</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Funnel Metrics',
      content: `
        <p>The table displays several key metrics:</p>
        <ul>
          <li><strong>Contributor Counts</strong> - Number of contributors at each stage</li>
          <li><strong>Conversion Rates</strong> - Percentage of contributors moving from one stage to the next
            <ul>
              <li>Calculated as: (Next Stage Count / Current Stage Count) × 100</li>
              <li>Higher rates indicate better progression</li>
            </ul>
          </li>
          <li><strong>Drop-off Rates</strong> - Percentage of contributors leaving at each stage
            <ul>
              <li>Calculated as: ((Current Stage - Next Stage) / Current Stage) × 100</li>
              <li>Lower rates are better</li>
            </ul>
          </li>
          <li><strong>Completion Rate</strong> - Percentage of contributors who complete the entire funnel
            <ul>
              <li>Calculated as: (Final Stage Count / Initial Stage Count) × 100</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Filters and Options',
      content: `
        <p>The page supports filtering (if available):</p>
        <ul>
          <li><strong>Project Filter</strong> - Filter by specific projects</li>
          <li><strong>Objective Filter</strong> - Filter by project objectives</li>
          <li><strong>GPC Filter</strong> - Apply your personalized content filtering preferences
            <ul>
              <li>Toggle on/off using the GPC Filter button</li>
              <li>When enabled, shows only data for your selected accounts/projects</li>
            </ul>
          </li>
        </ul>
        <p><strong>Refresh Button:</strong> Click to reload all funnel data with the latest information from Salesforce.</p>
      `
    },
    {
      heading: 'Analyzing Funnel Performance',
      content: `
        <p>Use the funnel data to analyze performance:</p>
        <ul>
          <li><strong>Identify Bottlenecks</strong>:
            <ul>
              <li>Look for stages with low conversion rates</li>
              <li>Find stages where many contributors drop off</li>
              <li>These are your optimization targets</li>
            </ul>
          </li>
          <li><strong>Compare Objectives</strong>:
            <ul>
              <li>Compare funnel performance across objectives</li>
              <li>Identify best practices from high-performing objectives</li>
              <li>Apply learnings to underperforming objectives</li>
            </ul>
          </li>
          <li><strong>Track Improvements</strong>:
            <ul>
              <li>Monitor conversion rates over time</li>
              <li>Measure impact of process changes</li>
              <li>Validate optimization efforts</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Exporting Data',
      content: `
        <p>Export funnel data for analysis:</p>
        <ul>
          <li><strong>Export to Excel</strong> - Download as .xlsx file
            <ul>
              <li>Includes all columns</li>
              <li>Preserves formatting</li>
              <li>Useful for detailed analysis</li>
            </ul>
          </li>
          <li><strong>Export to CSV</strong> - Download as .csv file
            <ul>
              <li>Compatible with most tools</li>
              <li>Easy to import into databases</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Performance Considerations',
      content: `
        <p>The page handles large datasets efficiently:</p>
        <ul>
          <li><strong>Infinite Scroll</strong> - Loads data in batches (500 records per page)</li>
          <li><strong>Extended Timeout</strong> - Uses 5-minute timeout for large queries</li>
          <li><strong>Progress Indicators</strong> - Shows loading states during data fetch</li>
        </ul>
        <p><strong>Note:</strong> For very large datasets, initial load may take time. The page will show progress indicators.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Focus on Drop-off Points</strong> - Identify stages with high drop-off rates</li>
          <li><strong>Compare Conversion Rates</strong> - Compare rates across objectives to find best practices</li>
          <li><strong>Track Over Time</strong> - Monitor funnel metrics regularly to track improvements</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Export for Analysis</strong> - Export data for detailed analysis in Excel</li>
          <li><strong>Optimize Problem Stages</strong> - Focus optimization efforts on stages with low conversion</li>
          <li><strong>Benchmark Performance</strong> - Establish baseline metrics and track improvements</li>
        </ul>
      `
    }
  ]
};

