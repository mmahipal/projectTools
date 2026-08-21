// Project Setup Documentation
export default {
  title: 'Project Setup',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Project Setup page allows you to create and configure new projects in the system with comprehensive settings and configurations.</p>
        <p><strong>Purpose:</strong> This page is the primary interface for setting up new projects with all necessary configuration including project details, payment settings, team assignments, funnel configurations, and activation settings.</p>
        <p><strong>When to use:</strong> Use this page when creating a new project from scratch or when you need to edit an existing project's configuration.</p>
      `
    },
    {
      heading: 'Creating a New Project',
      content: `
        <p>To create a new project:</p>
        <ol>
          <li>Navigate to <strong>Create Objects > Create Project</strong> from the sidebar</li>
          <li>You'll see a multi-section form with tabs at the top</li>
          <li>Fill in all required fields in each section (required fields are marked with an asterisk *)</li>
          <li>Use the section navigation buttons or tabs to move between sections</li>
          <li>Click <strong>Save Draft</strong> to save your progress without publishing</li>
          <li>Click <strong>Publish</strong> to create the project in Salesforce</li>
          <li>Review the publish results modal to see what was created successfully</li>
        </ol>
        <p><strong>Note:</strong> Your progress is automatically saved as a draft, so you can return to complete the setup later.</p>
      `
    },
    {
      heading: 'Project Sections',
      content: `
        <p>The project setup form is organized into the following sections (accessible via tabs or navigation buttons):</p>
        <ul>
          <li><strong>Information</strong> - Basic project details including:
            <ul>
              <li>Project name and short name</li>
              <li>Project type and priority</li>
              <li>Account selection (searchable dropdown)</li>
              <li>Project manager (searchable with autocomplete)</li>
              <li>Dates (hire start date, predicted close date)</li>
              <li>Project status</li>
            </ul>
          </li>
          <li><strong>Contributor Active Status</strong> - Configure contributor activation settings and status tracking</li>
          <li><strong>People</strong> - Assign key personnel including:
            <ul>
              <li>Program Manager (searchable)</li>
              <li>Quality Lead (searchable)</li>
              <li>Productivity Lead (searchable)</li>
              <li>Reporting Lead (searchable)</li>
              <li>Invoicing Lead (searchable)</li>
              <li>Project Support Lead (searchable)</li>
              <li>Recruitment Lead (searchable)</li>
              <li>Qualification Lead (searchable)</li>
              <li>Onboarding Lead (searchable)</li>
            </ul>
            <p>All people fields support search - start typing to see matching results</p>
          </li>
          <li><strong>Project Team</strong> - Add team members with roles:
            <ul>
              <li>Click <strong>Add Team Member</strong> to add new members</li>
              <li>Search for team members by name</li>
              <li>Assign roles to each team member</li>
              <li>Remove team members using the X button</li>
            </ul>
          </li>
          <li><strong>Rates</strong> - Configure payment rates and rate structures</li>
          <li><strong>Funnel Totals</strong> - Set up funnel metrics and totals</li>
          <li><strong>Funnel Stages</strong> - Define funnel stages and progression</li>
          <li><strong>Lever Requisition Actions</strong> - Configure Lever integration actions</li>
          <li><strong>Lever Requisition Fields</strong> - Set up Lever requisition field mappings</li>
          <li><strong>Lever Admin</strong> - Lever administration settings</li>
          <li><strong>Payment Configurations</strong> - Payment setup requirements and configurations</li>
          <li><strong>Activation</strong> - Project activation settings and final configuration</li>
        </ul>
      `
    },
    {
      heading: 'Search and Autocomplete Features',
      content: `
        <p>The Project Setup page includes several searchable fields with autocomplete functionality:</p>
        <ul>
          <li><strong>Account Search</strong> - Search for accounts by name. Start typing to see matching accounts.</li>
          <li><strong>Project Manager Search</strong> - Search for project managers. Results appear as you type.</li>
          <li><strong>People Section Searches</strong> - All people fields (Program Manager, Quality Lead, etc.) support search:
            <ul>
              <li>Click in the field or start typing</li>
              <li>A dropdown appears with matching results</li>
              <li>Select a person from the dropdown</li>
              <li>Search is case-insensitive and matches partial names</li>
            </ul>
          </li>
          <li><strong>Team Member Search</strong> - When adding team members, search by name to find and select team members</li>
        </ul>
        <p><strong>Search Tips:</strong></p>
        <ul>
          <li>Type at least 2-3 characters to see results</li>
          <li>Results update as you type (debounced for performance)</li>
          <li>Use arrow keys to navigate results, Enter to select</li>
          <li>Click outside the dropdown to close it</li>
        </ul>
      `
    },
    {
      heading: 'Form Features',
      content: `
        <p>The form includes several helpful features:</p>
        <ul>
          <li><strong>Draft Saving</strong> - Your progress is automatically saved as a draft. You can return later to continue.</li>
          <li><strong>Validation</strong> - Required fields are validated before submission. Errors are shown in red.</li>
          <li><strong>Preview</strong> - Use the Preview button to see how the project will look before publishing</li>
          <li><strong>Section Navigation</strong> - Use Previous/Next buttons or click section tabs to navigate</li>
          <li><strong>JSON View</strong> - View the raw JSON data of your project configuration</li>
          <li><strong>Bookmark</strong> - Bookmark this page for quick access</li>
        </ul>
      `
    },
    {
      heading: 'Publishing Projects',
      content: `
        <p>When you're ready to create the project in Salesforce:</p>
        <ol>
          <li>Review all sections to ensure completeness</li>
          <li>Click the <strong>Publish</strong> button</li>
          <li>A modal will show the publish results:
            <ul>
              <li>Green checkmarks indicate successful operations</li>
              <li>Red X marks indicate failures with error messages</li>
              <li>Review any errors and fix them before republishing</li>
            </ul>
          </li>
          <li>After successful publish, you can navigate to View Projects to see your new project</li>
        </ol>
        <p><strong>Note:</strong> Publishing creates records in Salesforce. Make sure all required fields are filled before publishing.</p>
      `
    },
    {
      heading: 'Editing Existing Projects',
      content: `
        <p>To edit an existing project:</p>
        <ol>
          <li>Navigate to <strong>View Projects</strong></li>
          <li>Find the project you want to edit</li>
          <li>Click the <strong>Edit</strong> button (pencil icon)</li>
          <li>The Project Setup page will load with the project's current data</li>
          <li>Make your changes</li>
          <li>Save Draft or Publish your changes</li>
        </ol>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Complete Information Section First</strong> - Start with the Information section as it contains core project details</li>
          <li><strong>Use Search for People</strong> - Don't try to type full names - use the search to find the right person</li>
          <li><strong>Save Draft Frequently</strong> - Save your work as you go, especially for complex projects</li>
          <li><strong>Review Before Publishing</strong> - Use Preview to review your configuration before publishing</li>
          <li><strong>Check Required Fields</strong> - Required fields are marked with *. Make sure all are filled before publishing</li>
          <li><strong>Team Members</strong> - Add all necessary team members in the Project Team section</li>
        </ul>
      `
    }
  ]
};

