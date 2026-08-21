// Project Page Setup Documentation
export default {
  title: 'Project Page Setup',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>Project Pages represent specific pages or sections within a project objective. They help organize work at a granular level and provide structure to project objectives.</p>
        <p><strong>Purpose:</strong> Use this page to create and manage pages within project objectives. Pages help break down objectives into manageable components and organize work more effectively.</p>
        <p><strong>When to use:</strong> Create project pages when you need to organize work within a project objective into distinct pages or sections. This is useful for complex objectives that require multiple pages or steps.</p>
        <p><strong>Default View:</strong> The page loads with a form to create a new project page. You can add multiple pages in a single session.</p>
      `
    },
    {
      heading: 'Creating Project Pages',
      content: `
        <p>To create project pages:</p>
        <ol>
          <li>Navigate to <strong>Create Objects > Create Project Page</strong> from the sidebar</li>
          <li>You'll see a form with fields for the first page</li>
          <li>Fill in the page details (see Fields section below)</li>
          <li>Click <strong>Add Page</strong> to create additional pages if needed</li>
          <li>Fill in details for each page</li>
          <li>Click <strong>Save Draft</strong> to save your progress</li>
          <li>Click <strong>Publish</strong> to create all pages in Salesforce</li>
        </ol>
        <p><strong>Multiple Pages:</strong> You can create multiple pages in a single session. Each page is independent and can be linked to different projects, objectives, and qualification steps.</p>
      `
    },
    {
      heading: 'Page Fields',
      content: `
        <p>Each project page includes the following fields:</p>
        <ul>
          <li><strong>Project</strong> (required) - The parent project for this page
            <ul>
              <li>Searchable dropdown - start typing to find projects</li>
              <li>Results appear as you type (after 300ms delay)</li>
              <li>Select a project from the dropdown</li>
            </ul>
          </li>
          <li><strong>Project Objective</strong> (optional) - The project objective this page belongs to
            <ul>
              <li>Only available after a project is selected</li>
              <li>Shows objectives for the selected project</li>
              <li>Searchable dropdown</li>
            </ul>
          </li>
          <li><strong>Qualification Step</strong> (optional) - The qualification step this page is associated with
            <ul>
              <li>Only available after a project is selected</li>
              <li>Shows qualification steps for the selected project</li>
              <li>Searchable dropdown</li>
            </ul>
          </li>
          <li><strong>Qualification</strong> (for Default Qualification Page type) - The qualification from Qualification_Step__c
            <ul>
              <li>Only shown for "Default Qualification Page" type</li>
              <li>Filtered by selected project</li>
              <li>Searchable dropdown</li>
            </ul>
          </li>
          <li><strong>Page Type</strong> - Type of page (e.g., Default Qualification Page, Custom Page, etc.)</li>
          <li><strong>Active</strong> - Whether the page is active (checkbox)</li>
        </ul>
      `
    },
    {
      heading: 'Search Features',
      content: `
        <p>All relationship fields include searchable dropdowns:</p>
        <ul>
          <li><strong>Project Search</strong>:
            <ul>
              <li>Type to search for projects</li>
              <li>Case-insensitive, matches partial names</li>
              <li>Results update as you type (debounced)</li>
            </ul>
          </li>
          <li><strong>Project Objective Search</strong>:
            <ul>
              <li>Only available after selecting a project</li>
              <li>Shows objectives for the selected project</li>
              <li>Type to search within those objectives</li>
            </ul>
          </li>
          <li><strong>Qualification Step Search</strong>:
            <ul>
              <li>Only available after selecting a project</li>
              <li>Filtered by the selected project</li>
              <li>Type to search for qualification steps</li>
            </ul>
          </li>
          <li><strong>Qualification Search</strong> (for Default Qualification Page):
            <ul>
              <li>Only shown for "Default Qualification Page" type</li>
              <li>Filtered by selected project</li>
              <li>Searches Qualification_Step__c records</li>
            </ul>
          </li>
        </ul>
        <p><strong>Cascading Dropdowns:</strong> Selecting a project enables the Project Objective and Qualification Step dropdowns. The selections cascade based on your project choice.</p>
      `
    },
    {
      heading: 'Adding Multiple Pages',
      content: `
        <p>You can create multiple pages in a single session:</p>
        <ul>
          <li><strong>Add Page Button</strong> - Click to add a new page form</li>
          <li><strong>Remove Page</strong> - Click the X button to remove a page from the form</li>
          <li><strong>Independent Pages</strong> - Each page is configured independently</li>
          <li><strong>Bulk Publishing</strong> - All pages are published together when you click Publish</li>
        </ul>
        <p><strong>Tip:</strong> Use multiple pages when setting up a complete project structure. You can create all pages for an objective in one session.</p>
      `
    },
    {
      heading: 'Page Types',
      content: `
        <p>Different page types serve different purposes:</p>
        <ul>
          <li><strong>Default Qualification Page</strong> - Standard qualification page linked to a qualification step
            <ul>
              <li>Requires Qualification field to be filled</li>
              <li>Links to Qualification_Step__c records</li>
            </ul>
          </li>
          <li><strong>Custom Page</strong> - Custom page type for specific needs</li>
          <li><strong>Other Types</strong> - Additional page types as configured in your system</li>
        </ul>
      `
    },
    {
      heading: 'Form Features',
      content: `
        <p>The form includes several helpful features:</p>
        <ul>
          <li><strong>Draft Saving</strong> - Progress is automatically saved. You can return later to continue.</li>
          <li><strong>Validation</strong> - Required fields are validated before submission</li>
          <li><strong>Preview</strong> - Preview your pages before publishing</li>
          <li><strong>Publish Results</strong> - See detailed results after publishing</li>
          <li><strong>Dynamic Forms</strong> - Add or remove pages as needed</li>
        </ul>
      `
    },
    {
      heading: 'Publishing Pages',
      content: `
        <p>When ready to create pages in Salesforce:</p>
        <ol>
          <li>Complete all required fields for each page</li>
          <li>Ensure at least one page is configured</li>
          <li>Click the <strong>Publish</strong> button</li>
          <li>Review the publish results modal:
            <ul>
              <li>Shows creation status for each page</li>
              <li>Green checkmarks = success</li>
              <li>Red X marks = failure with error details</li>
            </ul>
          </li>
          <li>Fix any errors and republish if needed</li>
        </ol>
        <p><strong>Note:</strong> Publishing creates all configured pages in Salesforce and links them to the selected projects, objectives, and qualification steps.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Select Project First</strong> - Always select the project before filling other fields</li>
          <li><strong>Use Search</strong> - Don't try to remember exact names - use the search features</li>
          <li><strong>Link to Objectives</strong> - Link pages to project objectives for better organization</li>
          <li><strong>Link to Qualification Steps</strong> - Associate pages with qualification steps when relevant</li>
          <li><strong>Create Multiple Pages</strong> - Use the Add Page feature to create all pages at once</li>
          <li><strong>Save Draft Frequently</strong> - Save your work as you progress</li>
          <li><strong>Review Before Publishing</strong> - Use Preview to review your configuration</li>
          <li><strong>Check Active Status</strong> - Set pages as active only when they're ready to use</li>
        </ul>
      `
    }
  ]
};

