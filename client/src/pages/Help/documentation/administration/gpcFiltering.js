// GPC Filtering Documentation
export default {
  title: 'GPC Filtering',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>GPC (Global Persona-Based Content) Filtering allows you to personalize your view by filtering data based on your interested accounts and projects. This feature helps you focus on the information that's most relevant to you.</p>
        <p><strong>Purpose:</strong> Focus on data relevant to you, reduce information overload, and improve productivity by showing only the accounts and projects you care about.</p>
        <p><strong>When to use:</strong> Enable GPC filtering when you want to focus on specific accounts or projects. Disable it when you need to see all data across the organization.</p>
        <p><strong>Configuration:</strong> GPC filtering preferences are configured in your Profile settings (accessible from the user profile dropdown).</p>
      `
    },
    {
      heading: 'How GPC Filtering Works',
      content: `
        <p>GPC filtering works by:</p>
        <ul>
          <li><strong>Account-Based Filtering</strong>:
            <ul>
              <li>Filter data to show only records related to your selected accounts</li>
              <li>Projects, cases, contributors, etc. are filtered by account</li>
            </ul>
          </li>
          <li><strong>Project-Based Filtering</strong>:
            <ul>
              <li>Filter data to show only records related to your selected projects</li>
              <li>More granular than account filtering</li>
            </ul>
          </li>
          <li><strong>Automatic Application</strong>:
            <ul>
              <li>Filters are automatically applied to queries</li>
              <li>Works across all pages that support GPC filtering</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Configuring GPC Preferences',
      content: `
        <p>To configure your GPC filtering preferences:</p>
        <ol>
          <li>Click your user avatar in the top-right corner</li>
          <li>Select <strong>Profile</strong></li>
          <li>Navigate to the <strong>Content Filtering Preferences</strong> section</li>
          <li>Select accounts and/or projects:
            <ul>
              <li>Use search to find accounts</li>
              <li>Use search to find projects</li>
              <li>Select multiple accounts/projects</li>
            </ul>
          </li>
          <li>Save your preferences</li>
        </ol>
        <p><strong>Note:</strong> You can select both accounts and projects, or just one or the other. The filter will show data matching your selections.</p>
      `
    },
    {
      heading: 'GPC Filter Toggle',
      content: `
        <p>Many pages include a GPC Filter toggle button:</p>
        <ul>
          <li><strong>Toggle Button</strong>:
            <ul>
              <li>Located near the top of pages that support filtering</li>
              <li>Shows current filter status (enabled/disabled)</li>
              <li>Click to toggle filtering on or off</li>
            </ul>
          </li>
          <li><strong>When Enabled</strong>:
            <ul>
              <li>Data is filtered based on your preferences</li>
              <li>Only shows data for your selected accounts/projects</li>
              <li>Button shows as "enabled" or highlighted</li>
            </ul>
          </li>
          <li><strong>When Disabled</strong>:
            <ul>
              <li>Shows all data (no filtering)</li>
              <li>Useful when you need to see everything</li>
              <li>Button shows as "disabled" or not highlighted</li>
            </ul>
          </li>
        </ul>
        <p><strong>Temporary Override:</strong> You can temporarily disable the filter on a page without changing your preferences. The filter will be enabled again when you refresh or navigate away.</p>
      `
    },
    {
      heading: 'Pages That Support GPC Filtering',
      content: `
        <p>GPC filtering is available on many pages throughout the application:</p>
        <ul>
          <li><strong>Dashboards</strong>:
            <ul>
              <li>Case Analytics Dashboard</li>
              <li>Contributor Payments Dashboard</li>
              <li>Project Performance Dashboard</li>
            </ul>
          </li>
          <li><strong>Project Management</strong>:
            <ul>
              <li>Queue Status Management</li>
              <li>Case Management</li>
              <li>PO Pay Rates</li>
              <li>PO Productivity Targets</li>
            </ul>
          </li>
          <li><strong>Analytics</strong>:
            <ul>
              <li>Contributor Time Status</li>
              <li>Project Roster Funnel</li>
              <li>Active Contributors by Project</li>
              <li>Other analytics pages</li>
            </ul>
          </li>
        </ul>
        <p><strong>Note:</strong> Not all pages support GPC filtering. Pages that do will show the GPC Filter toggle button.</p>
      `
    },
    {
      heading: 'Benefits of GPC Filtering',
      content: `
        <p>Using GPC filtering provides several benefits:</p>
        <ul>
          <li><strong>Reduced Information Overload</strong>:
            <ul>
              <li>See only relevant data</li>
              <li>Faster page loading</li>
              <li>Easier to find what you need</li>
            </ul>
          </li>
          <li><strong>Improved Performance</strong>:
            <ul>
              <li>Smaller datasets load faster</li>
              <li>Reduced query complexity</li>
              <li>Better user experience</li>
            </ul>
          </li>
          <li><strong>Better Focus</strong>:
            <ul>
              <li>Concentrate on your work</li>
              <li>Less distraction from irrelevant data</li>
              <li>More efficient workflows</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Select Relevant Accounts/Projects</strong> - Only select accounts and projects you actually work with</li>
          <li><strong>Update Preferences Regularly</strong> - Keep your preferences current as your work changes</li>
          <li><strong>Use Toggle When Needed</strong> - Temporarily disable filtering when you need to see all data</li>
          <li><strong>Understand Filter Behavior</strong> - Know that filtering applies to queries, not just display</li>
          <li><strong>Check Filter Status</strong> - Be aware of whether filtering is enabled on each page</li>
          <li><strong>Combine with Other Filters</strong> - GPC filtering works alongside page-specific filters</li>
        </ul>
      `
    }
  ]
};

