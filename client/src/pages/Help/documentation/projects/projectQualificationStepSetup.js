// Project Qualification Step Setup Documentation
export default {
  title: 'Project Qualification Step Setup',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>Qualification Steps define the process contributors must complete to become qualified for a project. These steps ensure quality and consistency by requiring contributors to demonstrate competency before working on production tasks.</p>
        <p><strong>Purpose:</strong> Use this page to create and configure qualification steps that contributors must pass before they can work on a project. Each step represents a milestone in the qualification process.</p>
        <p><strong>When to use:</strong> Create qualification steps when setting up a new project or when you need to add additional qualification requirements to an existing project.</p>
        <p><strong>Default View:</strong> The page loads with a form to create a new qualification step, or loads existing data if editing.</p>
      `
    },
    {
      heading: 'Creating a Qualification Step',
      content: `
        <p>To create a new qualification step:</p>
        <ol>
          <li>Navigate to <strong>Create Objects > Create Qualification Step</strong> from the sidebar</li>
          <li>Fill in the qualification step details</li>
          <li>Select the parent project (required)</li>
          <li>Select the project objective (optional but recommended)</li>
          <li>Configure step settings</li>
          <li>Click <strong>Save Draft</strong> to save your progress</li>
          <li>Click <strong>Publish</strong> to create the qualification step in Salesforce</li>
        </ol>
        <p><strong>Note:</strong> Your progress is automatically saved as a draft, so you can return to complete the setup later.</p>
      `
    },
    {
      heading: 'Required Fields',
      content: `
        <p>The qualification step form includes several fields:</p>
        <ul>
          <li><strong>Project</strong> (required) - The parent project for this qualification step
            <ul>
              <li>Searchable dropdown - start typing to find projects</li>
              <li>Results appear as you type (after 300ms delay)</li>
              <li>Select a project from the dropdown</li>
            </ul>
          </li>
          <li><strong>Project Objective</strong> (optional) - The project objective this step belongs to
            <ul>
              <li>Only available after a project is selected</li>
              <li>Shows objectives for the selected project</li>
              <li>Select from the dropdown</li>
            </ul>
          </li>
          <li><strong>Qualification Step</strong> - The qualification step name or identifier</li>
          <li><strong>Funnel</strong> - Funnel designation (A, B, C, D, or E)</li>
          <li><strong>Step Number</strong> - The order/sequence number of this step</li>
          <li><strong>Number of Attempts</strong> - How many times a contributor can attempt this step (defaults to 1)</li>
          <li><strong>Status</strong> - Qualification step status (defaults to Draft)</li>
        </ul>
      `
    },
    {
      heading: 'Project Search',
      content: `
        <p>The Project field includes a searchable dropdown:</p>
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
          <li><strong>Cascading Selection:</strong> After selecting a project, the Project Objective dropdown is populated with objectives for that project.</li>
        </ul>
        <p><strong>Required Field:</strong> You must select a project before you can publish the qualification step.</p>
      `
    },
    {
      heading: 'Qualification Step Search',
      content: `
        <p>If linking to an existing qualification step, you can search for it:</p>
        <ul>
          <li>Start typing in the Qualification Step field</li>
          <li>Results are filtered by the selected project</li>
          <li>Select an existing step to link to it</li>
        </ul>
        <p><strong>Note:</strong> This is typically used when creating a new step that references an existing one, or when editing an existing step.</p>
      `
    },
    {
      heading: 'Funnel Configuration',
      content: `
        <p>The Funnel field designates which funnel this qualification step belongs to:</p>
        <ul>
          <li><strong>Funnel Options:</strong> A, B, C, D, or E</li>
          <li><strong>Purpose:</strong> Funnels help organize qualification steps into logical groups</li>
          <li><strong>Usage:</strong> Different funnels can represent different qualification paths or tracks</li>
        </ul>
        <p><strong>Note:</strong> The funnel designation affects how qualification steps are organized and displayed in reports.</p>
      `
    },
    {
      heading: 'Step Number',
      content: `
        <p>The Step Number field determines the order of qualification steps:</p>
        <ul>
          <li><strong>Purpose:</strong> Defines the sequence in which steps should be completed</li>
          <li><strong>Usage:</strong> Lower numbers are completed first</li>
          <li><strong>Example:</strong> Step 1, Step 2, Step 3, etc.</li>
        </ul>
        <p><strong>Important:</strong> Ensure step numbers are sequential and logical for the qualification process.</p>
      `
    },
    {
      heading: 'Number of Attempts',
      content: `
        <p>The Number of Attempts field controls how many times a contributor can attempt this qualification step:</p>
        <ul>
          <li><strong>Default:</strong> 1 attempt</li>
          <li><strong>Purpose:</strong> Limits retries to ensure quality standards</li>
          <li><strong>Usage:</strong> Set higher numbers for more lenient qualification processes</li>
        </ul>
        <p><strong>Note:</strong> Once a contributor exhausts their attempts, they may need to be reset by an administrator to try again.</p>
      `
    },
    {
      heading: 'Form Features',
      content: `
        <p>The form includes several helpful features:</p>
        <ul>
          <li><strong>Draft Saving</strong> - Progress is automatically saved. You can return later to continue.</li>
          <li><strong>Validation</strong> - Required fields are validated before submission. Errors are shown in red.</li>
          <li><strong>Preview</strong> - Use the Preview button to see how the qualification step will look before publishing</li>
          <li><strong>Publish Results</strong> - See detailed results after publishing</li>
          <li><strong>Cascading Dropdowns</strong> - Project Objective dropdown updates based on selected project</li>
        </ul>
      `
    },
    {
      heading: 'Publishing Qualification Steps',
      content: `
        <p>When ready to create the qualification step in Salesforce:</p>
        <ol>
          <li>Complete all required fields</li>
          <li>Ensure project is selected</li>
          <li>Click the <strong>Publish</strong> button</li>
          <li>Review the publish results modal:
            <ul>
              <li>Green checkmarks = successful operations</li>
              <li>Red X marks = failures with error messages</li>
            </ul>
          </li>
          <li>Fix any errors and republish if needed</li>
        </ol>
        <p><strong>Note:</strong> Publishing creates the Qualification Step record in Salesforce and links it to the selected project and objective.</p>
      `
    },
    {
      heading: 'Editing Existing Qualification Steps',
      content: `
        <p>To edit an existing qualification step:</p>
        <ol>
          <li>Navigate to the project that contains the qualification step</li>
          <li>Find the qualification step you want to edit</li>
          <li>Click the <strong>Edit</strong> button</li>
          <li>The Qualification Step Setup page will load with the step's current data</li>
          <li>Make your changes</li>
          <li>Save Draft or Publish your changes</li>
        </ol>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Select Project First</strong> - Choose the parent project before filling other details</li>
          <li><strong>Use Project Search</strong> - Don't try to remember exact project names - use the search</li>
          <li><strong>Set Logical Step Numbers</strong> - Use sequential numbers that make sense for the qualification flow</li>
          <li><strong>Configure Attempts Appropriately</strong> - Set attempt limits based on the difficulty and importance of the step</li>
          <li><strong>Save Draft Frequently</strong> - Save your work as you progress</li>
          <li><strong>Review Before Publishing</strong> - Use Preview to review your configuration</li>
          <li><strong>Link to Objectives</strong> - Link qualification steps to project objectives for better organization</li>
          <li><strong>Use Funnels</strong> - Organize steps into funnels for clearer qualification paths</li>
        </ul>
      `
    }
  ]
};

