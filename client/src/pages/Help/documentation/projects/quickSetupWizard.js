// Quick Setup Wizard Documentation
export default {
  title: 'Quick Setup Wizard',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Quick Setup Wizard provides a streamlined, step-by-step interface to create projects, project objectives, qualification steps, project pages, and project teams all in one flow.</p>
        <p><strong>Purpose:</strong> This wizard combines multiple setup pages into a single guided flow, making it much faster to create complete project configurations without navigating between separate pages.</p>
        <p><strong>When to use:</strong> Use the Quick Setup Wizard when creating a new project from scratch and you want to set up the project, objectives, qualification steps, and pages all at once.</p>
        <p><strong>Advantages:</strong> Faster project creation, guided workflow, automatic linking between related objects, and draft saving for later completion.</p>
      `
    },
    {
      heading: 'Wizard Sections',
      content: `
        <p>The wizard is organized into several sections that you complete in sequence:</p>
        <ul>
          <li><strong>Create Project</strong> - Set up the main project:
            <ul>
              <li>Project name and details</li>
              <li>Account selection (searchable)</li>
              <li>Project manager (searchable)</li>
              <li>Project type, priority, and status</li>
              <li>Dates and other project information</li>
            </ul>
          </li>
          <li><strong>Create Project Objective</strong> - Define project objectives:
            <ul>
              <li>Project objective name</li>
              <li>Link to the project (auto-linked if created in wizard)</li>
              <li>Work type, country, language</li>
              <li>Requirements and configurations</li>
            </ul>
          </li>
          <li><strong>Create Qualification Step</strong> - Set up qualification steps:
            <ul>
              <li>Qualification step details</li>
              <li>Link to project and project objective</li>
              <li>Step number and configuration</li>
            </ul>
          </li>
          <li><strong>Create Project Page</strong> - Create project pages:
            <ul>
              <li>Page type and details</li>
              <li>Link to project, objective, and qualification step</li>
              <li>Page configuration</li>
            </ul>
          </li>
          <li><strong>Project Team</strong> - Assign team members:
            <ul>
              <li>Add team members with roles</li>
              <li>Search for team members</li>
              <li>Assign multiple team members</li>
            </ul>
          </li>
          <li><strong>Dynamic Fields</strong> - Add additional custom fields:
            <ul>
              <li>Add fields not shown in the standard form</li>
              <li>Search available Salesforce fields</li>
              <li>Set values for custom fields</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Using the Wizard',
      content: `
        <p>To use the Quick Setup Wizard:</p>
        <ol>
          <li>Navigate to <strong>Create Objects > Quick Setup Wizard</strong> from the sidebar</li>
          <li>You'll see a multi-section form with tabs or navigation buttons</li>
          <li>Complete each section in order:
            <ul>
              <li>Start with Create Project (required)</li>
              <li>Then Create Project Objective (optional but recommended)</li>
              <li>Continue with other sections as needed</li>
            </ul>
          </li>
          <li>Use <strong>Save Draft</strong> to save your progress at any time</li>
          <li>Navigate between sections using Previous/Next buttons or section tabs</li>
          <li>When complete, click <strong>Publish</strong> to create all objects in Salesforce</li>
          <li>Review the publish results modal to see what was created</li>
        </ol>
        <p><strong>Note:</strong> You don't have to complete all sections. You can create just a project, or a project with objectives, etc.</p>
      `
    },
    {
      heading: 'Search Features',
      content: `
        <p>The wizard includes several searchable fields with autocomplete:</p>
        <ul>
          <li><strong>Account Search</strong> - Search for accounts by name
            <ul>
              <li>Start typing in the Account field</li>
              <li>Results appear as you type</li>
              <li>Select an account from the dropdown</li>
            </ul>
          </li>
          <li><strong>Project Manager Search</strong> - Search for project managers
            <ul>
              <li>Type in the Project Manager field</li>
              <li>Matching results appear</li>
              <li>Select a project manager</li>
            </ul>
          </li>
          <li><strong>Project Search</strong> (in Project Objective section) - Search for existing projects
            <ul>
              <li>Use this if linking to an existing project</li>
              <li>Or leave empty if creating new project in wizard</li>
            </ul>
          </li>
          <li><strong>Project Objective Search</strong> (in Qualification Step section) - Search for objectives</li>
          <li><strong>Team Member Search</strong> - Search for team members when adding to project team</li>
        </ul>
        <p><strong>Search Tips:</strong> All searches are case-insensitive, match partial text, and update as you type (with debouncing for performance).</p>
      `
    },
    {
      heading: 'Dynamic Fields Feature',
      content: `
        <p>The Dynamic Fields section allows you to add fields that aren't shown in the standard form:</p>
        <ul>
          <li><strong>Add Field Button</strong> - Click to open the field selector</li>
          <li><strong>Field Search</strong> - Search for available Salesforce fields
            <ul>
              <li>Type to search field names</li>
              <li>Results show field label and API name</li>
              <li>Select a field to add it to the form</li>
            </ul>
          </li>
          <li><strong>Field Selection</strong> - Choose which section to add the field to</li>
          <li><strong>Set Values</strong> - Enter values for the added fields</li>
          <li><strong>Remove Fields</strong> - Remove added fields if no longer needed</li>
        </ul>
        <p><strong>Use Case:</strong> Use this when you need to set values for custom fields or fields not included in the standard wizard form.</p>
      `
    },
    {
      heading: 'Draft Saving',
      content: `
        <p>The wizard automatically saves your progress as a draft:</p>
        <ul>
          <li><strong>Auto-save</strong> - Your progress is saved automatically as you work</li>
          <li><strong>Manual Save</strong> - Click <strong>Save Draft</strong> to explicitly save</li>
          <li><strong>Resume Later</strong> - Access your drafts from <strong>View Projects > Quick Setup</strong> tab</li>
          <li><strong>Delete Drafts</strong> - Remove drafts you no longer need</li>
        </ul>
        <p><strong>Benefits:</strong> You can start a project setup, save it, and return later to complete it without losing your work.</p>
      `
    },
    {
      heading: 'Publishing',
      content: `
        <p>When you're ready to create all objects in Salesforce:</p>
        <ol>
          <li>Complete the sections you want to create</li>
          <li>Fill in all required fields (marked with *)</li>
          <li>Click the <strong>Publish</strong> button</li>
          <li>Review the publish results modal:
            <ul>
              <li>Shows creation status for each object</li>
              <li>Green checkmarks = success</li>
              <li>Red X marks = failure with error details</li>
            </ul>
          </li>
          <li>Fix any errors and republish if needed</li>
        </ol>
        <p><strong>What Gets Created:</strong> The wizard creates all objects you've configured:
        <ul>
          <li>Project (if Create Project section completed)</li>
          <li>Project Objective (if Create Project Objective section completed)</li>
          <li>Qualification Step (if Create Qualification Step section completed)</li>
          <li>Project Page (if Create Project Page section completed)</li>
          <li>Project Team members (if Project Team section completed)</li>
        </ul>
        </p>
        <p><strong>Automatic Linking:</strong> Objects created in the wizard are automatically linked together (e.g., objective linked to project, qualification step linked to objective).</p>
      `
    },
    {
      heading: 'Navigation',
      content: `
        <p>Navigate through the wizard sections using:</p>
        <ul>
          <li><strong>Section Tabs</strong> - Click tabs at the top to jump to any section</li>
          <li><strong>Previous Button</strong> - Go back to the previous section</li>
          <li><strong>Next Button</strong> - Move to the next section (validates required fields first)</li>
        </ul>
        <p><strong>Validation:</strong> When clicking Next, the wizard validates required fields in the current section. If validation fails, errors are shown and you must fix them before proceeding.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Start with Project</strong> - Always complete the Create Project section first as other sections depend on it</li>
          <li><strong>Use Search</strong> - Don't try to type exact names - use the search features for accounts, managers, projects, etc.</li>
          <li><strong>Save Frequently</strong> - Save your draft regularly, especially for complex setups</li>
          <li><strong>Complete in Order</strong> - While you can jump between sections, completing them in order ensures proper linking</li>
          <li><strong>Review Before Publishing</strong> - Double-check your entries before publishing</li>
          <li><strong>Use Dynamic Fields Sparingly</strong> - Only add dynamic fields if you really need them</li>
          <li><strong>Link Existing Objects</strong> - You can link to existing projects/objectives instead of creating new ones</li>
          <li><strong>Manage Drafts</strong> - Regularly review and clean up old drafts in View Projects</li>
        </ul>
      `
    }
  ]
};

