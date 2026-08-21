// View Projects Documentation
export default {
  title: 'View Projects',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The View Projects page displays all projects, project objectives, and quick setup drafts in a searchable, filterable interface.</p>
        <p><strong>Purpose:</strong> Browse, search, filter, and manage all projects and related objects in the system. This is your central hub for viewing and managing project data.</p>
        <p><strong>Default View:</strong> The page loads showing all projects by default. You can switch between Projects, Project Objectives, and Quick Setup tabs.</p>
      `
    },
    {
      heading: 'Tabs',
      content: `
        <p>The page has three main tabs:</p>
        <ul>
          <li><strong>Projects Tab</strong> - Displays all projects in the system
            <ul>
              <li>Shows project name, status, type, account, and other key information</li>
              <li>Each project row shows actions: View, Edit, Delete, Clone, Resync</li>
            </ul>
          </li>
          <li><strong>Project Objectives Tab</strong> - Displays all project objectives
            <ul>
              <li>Shows objective name, related project, status, and other details</li>
              <li>Similar action buttons for each objective</li>
            </ul>
          </li>
          <li><strong>Quick Setup Tab</strong> - Shows saved quick setup wizard drafts
            <ul>
              <li>Displays draft projects created via the Quick Setup Wizard</li>
              <li>Allows you to continue working on drafts or delete them</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Search Functionality',
      content: `
        <p>The search bar at the top allows you to search for projects or objectives:</p>
        <ul>
          <li><strong>For Projects Tab:</strong> Search by project name or Workday ID
            <ul>
              <li>Type in the search box: "Search by project name or Workday ID..."</li>
              <li>Results filter in real-time as you type</li>
              <li>Search is case-insensitive</li>
              <li>Matches partial text in project names</li>
            </ul>
          </li>
          <li><strong>For Project Objectives Tab:</strong> Search by project objective name
            <ul>
              <li>Type in the search box: "Search by project objective name..."</li>
              <li>Real-time filtering as you type</li>
            </ul>
          </li>
          <li><strong>Clear Search:</strong> Delete text in the search box to show all items again</li>
        </ul>
      `
    },
    {
      heading: 'Status Filter',
      content: `
        <p>The status filter dropdown allows you to filter projects by their status:</p>
        <ul>
          <li><strong>All Status</strong> - Shows all projects regardless of status (default)</li>
          <li><strong>Draft</strong> - Shows only draft projects</li>
          <li><strong>Open</strong> - Shows only open/active projects</li>
          <li><strong>Roster hold</strong> - Shows projects on roster hold</li>
          <li><strong>Closed</strong> - Shows closed/completed projects</li>
        </ul>
        <p><strong>How to use:</strong> Select a status from the filter dropdown. The table updates immediately to show only projects matching that status.</p>
        <p><strong>Combining Filters:</strong> The status filter works together with the search - you can search for a project name AND filter by status simultaneously.</p>
      `
    },
    {
      heading: 'Project Actions',
      content: `
        <p>Each project row has several action buttons:</p>
        <ul>
          <li><strong>View (Eye Icon)</strong> - Opens the project detail page to see full project information
            <ul>
              <li>Shows all project configuration</li>
              <li>Displays related objectives and pages</li>
              <li>Shows team members and assignments</li>
              <li>Includes history and audit information</li>
            </ul>
          </li>
          <li><strong>Edit (Pencil Icon)</strong> - Opens the Project Setup page in edit mode
            <ul>
              <li>Loads the project's current data</li>
              <li>Allows you to modify any field</li>
              <li>Save changes or publish updates</li>
            </ul>
          </li>
          <li><strong>Delete (Trash Icon)</strong> - Deletes the project
            <ul>
              <li>Shows a confirmation dialog before deleting</li>
              <li>Permanently removes the project from the system</li>
              <li>Use with caution - this action cannot be undone</li>
            </ul>
          </li>
          <li><strong>Clone (Copy Icon)</strong> - Creates a copy of the project
            <ul>
              <li>Opens the Clone page</li>
              <li>Allows you to select which fields and related objects to copy</li>
              <li>Useful for creating similar projects quickly</li>
            </ul>
          </li>
          <li><strong>Resync (Refresh Icon)</strong> - Resynchronizes the project with Salesforce
            <ul>
              <li>Fetches the latest data from Salesforce</li>
              <li>Updates the project record in the system</li>
              <li>Useful if data seems out of sync</li>
            </ul>
          </li>
          <li><strong>JSON View (File Icon)</strong> - Shows the raw JSON data for the project
            <ul>
              <li>Opens a modal with the JSON representation</li>
              <li>Useful for debugging or data export</li>
              <li>You can copy the JSON if needed</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Project Objectives Tab',
      content: `
        <p>The Project Objectives tab shows all project objectives with similar functionality:</p>
        <ul>
          <li><strong>Search</strong> - Search by objective name</li>
          <li><strong>Filter</strong> - Filter by status (if applicable)</li>
          <li><strong>Actions</strong> - View, Edit, Delete, Clone, Resync for each objective</li>
          <li><strong>Columns</strong> - Shows objective name, related project, status, and other key fields</li>
        </ul>
        <p>Click on any objective to view its details or use the action buttons to manage it.</p>
      `
    },
    {
      heading: 'Quick Setup Tab',
      content: `
        <p>The Quick Setup tab displays saved drafts from the Quick Setup Wizard:</p>
        <ul>
          <li><strong>Draft List</strong> - Shows all saved quick setup drafts</li>
          <li><strong>Continue Draft</strong> - Click to continue working on a draft in the Quick Setup Wizard</li>
          <li><strong>Delete Draft</strong> - Remove a draft if you no longer need it</li>
          <li><strong>Draft Information</strong> - Shows when the draft was created and last modified</li>
        </ul>
        <p>Drafts are automatically saved as you work in the Quick Setup Wizard. Use this tab to manage and continue your work.</p>
      `
    },
    {
      heading: 'Table Features',
      content: `
        <p>The project table includes several features:</p>
        <ul>
          <li><strong>Sortable Columns</strong> - Click column headers to sort (if sorting is enabled for that column)</li>
          <li><strong>Responsive Design</strong> - Table adapts to screen size</li>
          <li><strong>Loading States</strong> - Shows loading indicators while fetching data</li>
          <li><strong>Empty States</strong> - Shows helpful messages when no projects match your filters</li>
          <li><strong>Pagination</strong> - If there are many projects, they may be paginated</li>
        </ul>
      `
    },
    {
      heading: 'URL Parameters',
      content: `
        <p>The page supports URL parameters for direct linking:</p>
        <ul>
          <li><strong>?status=Draft</strong> - Opens the page with Draft status filter applied</li>
          <li><strong>?status=Open</strong> - Opens with Open status filter applied</li>
          <li>Other status values work similarly</li>
        </ul>
        <p>This allows you to bookmark filtered views or share links to specific project lists.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Use Search First</strong> - If you know the project name, use search rather than scrolling</li>
          <li><strong>Combine Filters</strong> - Use both search and status filter together for precise results</li>
          <li><strong>Resync When Needed</strong> - If project data seems outdated, use the Resync button</li>
          <li><strong>Clone for Similar Projects</strong> - Use Clone to quickly create similar projects</li>
          <li><strong>Check Drafts Regularly</strong> - Review the Quick Setup tab to complete or clean up drafts</li>
          <li><strong>Use View Before Edit</strong> - View project details first to understand the full context before editing</li>
        </ul>
      `
    }
  ]
};

