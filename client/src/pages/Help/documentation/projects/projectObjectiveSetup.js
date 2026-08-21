// Project Objective Setup Documentation
export default {
  title: 'Project Objective Setup',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>Project Objectives define specific goals and work streams within a project. You can create multiple objectives for a single project, each with its own configuration, requirements, rates, and settings.</p>
        <p><strong>Purpose:</strong> Use this page to create and configure project objectives that break down a project into manageable, trackable components. Each objective can have different requirements, payment rates, and configurations.</p>
        <p><strong>When to use:</strong> Create a project objective when you need to define a specific work stream, job type, or deliverable within a project.</p>
      `
    },
    {
      heading: 'Creating a Project Objective',
      content: `
        <p>To create a new project objective:</p>
        <ol>
          <li>Navigate to <strong>Create Objects > Create Project Objective</strong> from the sidebar</li>
          <li>You'll see a multi-section form with 9 sections</li>
          <li>Fill in required fields (marked with *) in each section</li>
          <li>Use Previous/Next buttons to navigate between sections</li>
          <li>Click <strong>Save Draft</strong> to save your progress</li>
          <li>Click <strong>Publish</strong> to create the objective in Salesforce</li>
        </ol>
        <p><strong>Note:</strong> Each objective must be linked to a parent project. You'll need to select a project in the first section.</p>
      `
    },
    {
      heading: 'Project Objective Sections',
      content: `
        <p>The form is organized into 9 sections:</p>
        <ul>
          <li><strong>Project Objective Information</strong> - Core objective details:
            <ul>
              <li>Contributor Facing Project Name (required)</li>
              <li>Project (required) - Searchable dropdown to select parent project</li>
              <li>Project Objective Name (required)</li>
              <li>Status (defaults to Draft)</li>
            </ul>
          </li>
          <li><strong>Admin & System</strong> - Administrative and system-level settings</li>
          <li><strong>Job Information</strong> - Job-related details and configurations</li>
          <li><strong>Requirements</strong> - Work requirements and specifications:
            <ul>
              <li>Work Type (required)</li>
              <li>Country selection</li>
              <li>Language selection</li>
              <li>Dialect selection</li>
              <li>Degree requirements</li>
              <li>Language skill level</li>
              <li>Fluency type</li>
            </ul>
            <p><strong>Important:</strong> Either Country OR Language must be selected before publishing</p>
          </li>
          <li><strong>Productivity & Diversity</strong> - Productivity targets and diversity settings</li>
          <li><strong>Funnel Metrics</strong> - Funnel configuration and metrics (read-only display)</li>
          <li><strong>Rates & AC IDs</strong> - Payment rates and account IDs</li>
          <li><strong>Action Rules & Quality</strong> - Quality rules and action configurations</li>
          <li><strong>Configuration & Email Templates</strong> - Email and notification settings:
            <ul>
              <li>Days Between Reminder Emails (required, defaults to 5)</li>
              <li>Rolling weeks settings for availability and production</li>
              <li>Funnel percentage allocations</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Project Search',
      content: `
        <p>The Project field in the first section includes a searchable dropdown:</p>
        <ul>
          <li><strong>How to use:</strong>
            <ul>
              <li>Click in the Project field</li>
              <li>Start typing the project name</li>
              <li>Results appear as you type (after 300ms delay)</li>
              <li>Select a project from the dropdown</li>
            </ul>
          </li>
          <li><strong>Search Features:</strong>
            <ul>
              <li>Case-insensitive search</li>
              <li>Matches partial project names</li>
              <li>Shows loading indicator while searching</li>
              <li>Dropdown closes when you select a project</li>
            </ul>
          </li>
        </ul>
        <p><strong>Required Field:</strong> You must select a project before you can publish the objective.</p>
      `
    },
    {
      heading: 'Required Fields',
      content: `
        <p>Each section has specific required fields that must be filled before you can proceed:</p>
        <ul>
          <li><strong>Section 1 (Project Objective Information):</strong>
            <ul>
              <li>Contributor Facing Project Name</li>
              <li>Project</li>
              <li>Project Objective Name</li>
            </ul>
          </li>
          <li><strong>Section 4 (Requirements):</strong>
            <ul>
              <li>Work Type</li>
            </ul>
          </li>
          <li><strong>Section 9 (Configuration & Email Templates):</strong>
            <ul>
              <li>Days Between Reminder Emails</li>
            </ul>
          </li>
        </ul>
        <p><strong>Validation:</strong> The form validates required fields when you try to move to the next section or publish. Errors are shown in red.</p>
        <p><strong>Special Requirement:</strong> Either Country OR Language must be selected in the Requirements section before publishing.</p>
      `
    },
    {
      heading: 'Default Values',
      content: `
        <p>The form automatically sets several default values:</p>
        <ul>
          <li><strong>Status:</strong> Draft</li>
          <li><strong>Productivity Target Type:</strong> Hours</li>
          <li><strong>Days Between Reminder Emails:</strong> 5</li>
          <li><strong>Rolling Weeks Settings:</strong> All default to 6 weeks</li>
          <li><strong>Funnel Percentages:</strong> Funnel A = 100%, others = 0%</li>
        </ul>
        <p>You can change these defaults as needed for your objective.</p>
      `
    },
    {
      heading: 'Form Features',
      content: `
        <p>The form includes several helpful features:</p>
        <ul>
          <li><strong>Draft Saving</strong> - Progress is automatically saved. You can return later to continue.</li>
          <li><strong>Section Navigation</strong> - Use Previous/Next buttons to move between sections</li>
          <li><strong>Validation</strong> - Required fields are validated before moving to next section</li>
          <li><strong>Error Display</strong> - Validation errors appear in red below the field</li>
          <li><strong>Preview</strong> - Preview your objective before publishing</li>
          <li><strong>Publish Results</strong> - See detailed results after publishing</li>
        </ul>
      `
    },
    {
      heading: 'Publishing Objectives',
      content: `
        <p>When ready to create the objective in Salesforce:</p>
        <ol>
          <li>Complete all required fields across all sections</li>
          <li>Ensure either Country or Language is selected</li>
          <li>Click the <strong>Publish</strong> button</li>
          <li>Review the publish results modal:
            <ul>
              <li>Green checkmarks = successful operations</li>
              <li>Red X marks = failures with error messages</li>
            </ul>
          </li>
          <li>Fix any errors and republish if needed</li>
        </ol>
        <p><strong>Note:</strong> Publishing creates the Project Objective record in Salesforce and links it to the selected project.</p>
      `
    },
    {
      heading: 'Editing Existing Objectives',
      content: `
        <p>To edit an existing project objective:</p>
        <ol>
          <li>Navigate to <strong>View Projects</strong></li>
          <li>Switch to the <strong>Project Objectives</strong> tab</li>
          <li>Find the objective you want to edit</li>
          <li>Click the <strong>Edit</strong> button (pencil icon)</li>
          <li>The Project Objective Setup page loads with current data</li>
          <li>Make your changes</li>
          <li>Save Draft or Publish your changes</li>
        </ol>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Select Project First</strong> - Choose the parent project in section 1 before filling other details</li>
          <li><strong>Use Project Search</strong> - Don't try to remember exact project names - use the search</li>
          <li><strong>Complete Requirements Section</strong> - Make sure to select either Country or Language (or both)</li>
          <li><strong>Save Draft Frequently</strong> - Save your work as you progress through sections</li>
          <li><strong>Review Before Publishing</strong> - Use Preview to review your configuration</li>
          <li><strong>Check Required Fields</strong> - Required fields are marked with *. Complete them before publishing</li>
          <li><strong>Understand Funnel Metrics</strong> - Funnel Metrics section is read-only but shows important information</li>
        </ul>
      `
    }
  ]
};

