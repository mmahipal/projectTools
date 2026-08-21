// Workstream Management Documentation
export default {
  title: 'Workstream Management',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>Workstream Management helps you organize and track work across different streams within projects. A workstream represents a logical grouping of project objectives and related work.</p>
        <p><strong>Purpose:</strong> Create and manage workstreams, assign project objectives to workstreams, and generate comprehensive workstream reports for tracking and analysis.</p>
        <p><strong>When to use:</strong> Use this page when you need to organize multiple project objectives into logical work streams, track progress across related objectives, or generate consolidated reports.</p>
        <p><strong>Default View:</strong> The page displays a list of all workstreams with their associated projects and objectives.</p>
      `
    },
    {
      heading: 'Workstream List',
      content: `
        <p>The main page shows all workstreams in the system:</p>
        <ul>
          <li><strong>Workstream Name</strong> - Name of the workstream</li>
          <li><strong>Related Projects</strong> - Projects associated with the workstream</li>
          <li><strong>Project Objectives</strong> - Objectives assigned to the workstream</li>
          <li><strong>Status</strong> - Current status of the workstream</li>
          <li><strong>Actions</strong> - Edit, view details, or delete workstream</li>
        </ul>
        <p><strong>Search and Filter:</strong> Use the search bar to find specific workstreams by name, or filter by status or project.</p>
      `
    },
    {
      heading: 'Creating Workstreams',
      content: `
        <p>To create a new workstream:</p>
        <ol>
          <li>Navigate to <strong>Project Management > Workstream Management</strong></li>
          <li>Click the <strong>Create Workstream</strong> button (or navigate to <strong>Projects > Create Workstream</strong>)</li>
          <li>Fill in workstream details:
            <ul>
              <li>Workstream name (required)</li>
              <li>Description</li>
              <li>Related project(s) - searchable dropdown</li>
              <li>Status</li>
            </ul>
          </li>
          <li>Assign project objectives to the workstream</li>
          <li>Save the workstream</li>
        </ol>
        <p><strong>Project Search:</strong> When selecting projects, use the searchable dropdown to find and select projects. Start typing the project name to see matching results.</p>
      `
    },
    {
      heading: 'Assigning Project Objectives',
      content: `
        <p>After creating a workstream, you can assign project objectives to it:</p>
        <ul>
          <li><strong>From Workstream Details</strong>:
            <ul>
              <li>Open the workstream</li>
              <li>Go to the Project Objectives section</li>
              <li>Click "Add Objective"</li>
              <li>Search for and select project objectives</li>
              <li>Save the assignment</li>
            </ul>
          </li>
          <li><strong>From Project Objective Page</strong>:
            <ul>
              <li>Edit a project objective</li>
              <li>Select the workstream from the dropdown</li>
              <li>Save the objective</li>
            </ul>
          </li>
        </ul>
        <p><strong>Multiple Objectives:</strong> A workstream can contain multiple project objectives, and an objective can belong to multiple workstreams.</p>
      `
    },
    {
      heading: 'Workstream Reporting',
      content: `
        <p>View detailed reports and analytics for workstreams:</p>
        <ul>
          <li><strong>Completion Rates</strong>:
            <ul>
              <li>Track progress of objectives within the workstream</li>
              <li>View completion percentages</li>
              <li>Identify objectives that are behind schedule</li>
            </ul>
          </li>
          <li><strong>Resource Utilization</strong>:
            <ul>
              <li>See how resources are allocated across the workstream</li>
              <li>Track contributor assignments</li>
              <li>Monitor workload distribution</li>
            </ul>
          </li>
          <li><strong>Timeline Tracking</strong>:
            <ul>
              <li>View timelines for all objectives in the workstream</li>
              <li>Identify bottlenecks</li>
              <li>Track milestone progress</li>
            </ul>
          </li>
          <li><strong>Performance Metrics</strong>:
            <ul>
              <li>Quality scores</li>
              <li>Productivity metrics</li>
              <li>Budget vs. actuals</li>
              <li>Efficiency indicators</li>
            </ul>
          </li>
        </ul>
        <p><strong>Generating Reports:</strong> Navigate to <strong>Projects > Workstream Reporting</strong> to generate detailed reports for specific workstreams.</p>
      `
    },
    {
      heading: 'Editing Workstreams',
      content: `
        <p>To edit an existing workstream:</p>
        <ol>
          <li>Find the workstream in the list</li>
          <li>Click the <strong>Edit</strong> button (pencil icon)</li>
          <li>Modify workstream details</li>
          <li>Add or remove project objectives</li>
          <li>Save your changes</li>
        </ol>
      `
    },
    {
      heading: 'Viewing Workstream Details',
      content: `
        <p>Click on a workstream to view detailed information:</p>
        <ul>
          <li>Workstream configuration</li>
          <li>All assigned project objectives</li>
          <li>Related projects</li>
          <li>Status and timeline</li>
          <li>Performance metrics</li>
          <li>History and audit information</li>
        </ul>
      `
    },
    {
      heading: 'Search and Filters',
      content: `
        <p>The workstream list includes search and filter options:</p>
        <ul>
          <li><strong>Search</strong> - Search workstreams by name
            <ul>
              <li>Type in the search box</li>
              <li>Results filter in real-time</li>
              <li>Case-insensitive search</li>
            </ul>
          </li>
          <li><strong>Status Filter</strong> - Filter by workstream status</li>
          <li><strong>Project Filter</strong> - Filter workstreams by related project</li>
          <li><strong>GPC Filter</strong> - Apply personalized content filtering</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Organize Logically</strong> - Group related objectives into workstreams</li>
          <li><strong>Use Clear Names</strong> - Name workstreams clearly to identify their purpose</li>
          <li><strong>Regular Updates</strong> - Keep workstream assignments up to date</li>
          <li><strong>Review Reports</strong> - Regularly review workstream reports to track progress</li>
          <li><strong>Use Search</strong> - Use search to quickly find workstreams</li>
          <li><strong>Link Objectives</strong> - Assign all related objectives to appropriate workstreams</li>
          <li><strong>Monitor Performance</strong> - Use workstream reports to identify issues early</li>
        </ul>
      `
    }
  ]
};

