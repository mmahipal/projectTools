// Onboarding Contributors Documentation
export default {
  title: 'Onboarding Contributors',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Onboarding Contributors page helps you manage the process of bringing new contributors into projects and track their progress through the onboarding funnel.</p>
        <p><strong>Purpose:</strong> Track and manage the contributor onboarding process from initial invitation through qualification steps to activation. This page provides visibility into where contributors are in the onboarding process.</p>
        <p><strong>When to use:</strong> Use this page to monitor contributor onboarding progress, identify bottlenecks in the onboarding funnel, and track contributors at each stage of the process.</p>
        <p><strong>Default View:</strong> The page displays a table of contributors with their onboarding status and progress information.</p>
      `
    },
    {
      heading: 'Contributors Table',
      content: `
        <p>The main table displays contributors with their onboarding information:</p>
        <ul>
          <li><strong>Contributor Information</strong>:
            <ul>
              <li>Name</li>
              <li>Email</li>
              <li>Contributor Type</li>
              <li>Gender</li>
              <li>Source Details</li>
              <li>Mailing Country</li>
            </ul>
          </li>
          <li><strong>Onboarding Status</strong> - Current stage in the onboarding process</li>
          <li><strong>Progress Information</strong> - Details about qualification steps completed</li>
          <li><strong>Additional Fields</strong> - Customizable columns based on available fields</li>
        </ul>
        <p><strong>Infinite Scroll:</strong> The table uses infinite scroll to load more contributors as you scroll down, allowing efficient handling of large datasets.</p>
      `
    },
    {
      heading: 'Search Functionality',
      content: `
        <p>The page includes a search bar to find specific contributors:</p>
        <ul>
          <li><strong>Search Bar</strong> - Located at the top of the page
            <ul>
              <li>Type to search by name, email, or other criteria</li>
              <li>Search is debounced (waits 500ms after you stop typing)</li>
              <li>Results filter in real-time</li>
              <li>Server-side filtering for performance</li>
            </ul>
          </li>
          <li><strong>Search Tips:</strong>
            <ul>
              <li>Search is case-insensitive</li>
              <li>Matches partial text</li>
              <li>Results update automatically</li>
              <li>Clear search to see all contributors</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Column Selection',
      content: `
        <p>You can customize which columns are displayed:</p>
        <ul>
          <li><strong>Default Columns</strong>:
            <ul>
              <li>Name</li>
              <li>Email</li>
              <li>Contributor_Type__c</li>
              <li>Gender__c</li>
              <li>Source_Details__c</li>
              <li>MailingCountry</li>
            </ul>
          </li>
          <li><strong>Available Fields</strong> - All fields from the Contact object are available</li>
          <li><strong>Column Selector</strong> - Use the column selector to add or remove columns</li>
          <li><strong>Customize View</strong> - Show only the information you need</li>
        </ul>
        <p><strong>Note:</strong> Column preferences may be saved for your next visit.</p>
      `
    },
    {
      heading: 'Onboarding Process Stages',
      content: `
        <p>The onboarding process typically includes these stages:</p>
        <ul>
          <li><strong>Invitation</strong> - Contributor is invited to join a project
            <ul>
              <li>Initial contact and invitation sent</li>
              <li>Contributor accepts invitation</li>
            </ul>
          </li>
          <li><strong>Qualification Steps</strong> - Contributor completes required qualification steps
            <ul>
              <li>Step 1, Step 2, etc.</li>
              <li>Each step must be completed in order</li>
              <li>Progress tracked per step</li>
            </ul>
          </li>
          <li><strong>Account Setup</strong> - Setting up accounts and access
            <ul>
              <li>Client tool accounts</li>
              <li>Platform access</li>
              <li>Credentials and verification</li>
            </ul>
          </li>
          <li><strong>Training</strong> - Providing training materials and resources
            <ul>
              <li>Training materials delivery</li>
              <li>Training completion tracking</li>
            </ul>
          </li>
          <li><strong>Activation</strong> - Contributor is activated and can work
            <ul>
              <li>Final verification</li>
              <li>Activation in system</li>
              <li>Ready for production work</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Tracking Progress',
      content: `
        <p>Monitor contributor progress through the onboarding funnel:</p>
        <ul>
          <li><strong>Status Indicators</strong> - Visual indicators show current stage</li>
          <li><strong>Progress Metrics</strong> - See how many contributors are at each stage</li>
          <li><strong>Bottleneck Identification</strong> - Identify where contributors are getting stuck
            <ul>
              <li>Large numbers at a specific stage indicate bottlenecks</li>
              <li>Long time at a stage suggests issues</li>
              <li>Use this to optimize the process</li>
            </ul>
          </li>
          <li><strong>Time Tracking</strong> - See how long contributors have been at each stage</li>
        </ul>
        <p><strong>Funnel Analysis:</strong> Use the Project Roster Funnel page for detailed funnel visualization and analysis.</p>
      `
    },
    {
      heading: 'Sorting and Filtering',
      content: `
        <p>The table supports sorting and filtering:</p>
        <ul>
          <li><strong>Default Sort</strong> - By Created Date (newest first)</li>
          <li><strong>Column Sorting</strong> - Click column headers to sort (if enabled)</li>
          <li><strong>Search Filter</strong> - Use search to filter by name, email, etc.</li>
          <li><strong>Additional Filters</strong> - May be available based on your configuration</li>
        </ul>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all contributor data from Salesforce</li>
          <li>Get the latest onboarding status</li>
          <li>Update progress information</li>
        </ul>
        <p><strong>When to refresh:</strong> After making changes to contributor records, or if you suspect data is outdated.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Monitor Regularly</strong> - Check onboarding progress regularly to identify issues early</li>
          <li><strong>Use Search</strong> - Use search to quickly find specific contributors</li>
          <li><strong>Customize Columns</strong> - Show only the columns you need for better visibility</li>
          <li><strong>Identify Bottlenecks</strong> - Look for stages where many contributors are stuck</li>
          <li><strong>Track Time</strong> - Monitor how long contributors spend at each stage</li>
          <li><strong>Use Funnel Analysis</strong> - Use the Project Roster Funnel page for detailed analysis</li>
          <li><strong>Refresh When Needed</strong> - Refresh data to get the latest status</li>
          <li><strong>Export for Analysis</strong> - Export data to analyze onboarding patterns</li>
        </ul>
      `
    }
  ]
};

