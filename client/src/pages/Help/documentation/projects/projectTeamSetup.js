// Project Team Setup Documentation
export default {
  title: 'Project Team Setup',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Project Team Setup page allows you to assign team members to projects and configure team roles and responsibilities.</p>
        <p><strong>Purpose:</strong> Manage project team assignments, assign roles to team members, and ensure proper resource allocation across projects.</p>
        <p><strong>When to use:</strong> Use this page when setting up a new project team, adding team members to existing projects, or updating team member roles.</p>
        <p><strong>Default View:</strong> The page loads with a form to select a project and add team members.</p>
      `
    },
    {
      heading: 'Setting Up a Project Team',
      content: `
        <p>To set up a project team:</p>
        <ol>
          <li>Navigate to <strong>Create Objects > Create Project Team</strong> from the sidebar</li>
          <li>Select a project using the searchable project dropdown</li>
          <li>Add team members (see Adding Team Members below)</li>
          <li>Assign roles to each team member</li>
          <li>Click <strong>Publish</strong> to save the team assignments</li>
        </ol>
        <p><strong>Note:</strong> You can add multiple team members in a single session. Each team member can have a different role.</p>
      `
    },
    {
      heading: 'Project Selection',
      content: `
        <p>The first step is to select the project:</p>
        <ul>
          <li><strong>Project Field</strong> - Searchable dropdown to select a project
            <ul>
              <li>Click in the Project field</li>
              <li>Start typing the project name</li>
              <li>Results appear as you type (after 300ms delay)</li>
              <li>Select a project from the dropdown</li>
            </ul>
          </li>
          <li><strong>Search Features</strong>:
            <ul>
              <li>Case-insensitive search</li>
              <li>Matches partial project names</li>
              <li>Shows loading indicator while searching</li>
              <li>Dropdown closes when you select a project</li>
            </ul>
          </li>
        </ul>
        <p><strong>Required Field:</strong> You must select a project before you can add team members.</p>
      `
    },
    {
      heading: 'Adding Team Members',
      content: `
        <p>After selecting a project, you can add team members:</p>
        <ul>
          <li><strong>Add Team Member Button</strong> - Click to add a new team member row</li>
          <li><strong>Team Member Search</strong>:
            <ul>
              <li>Type at least 3 characters in the team member field</li>
              <li>Results appear showing matching people</li>
              <li>Select a person from the results</li>
              <li>Search is debounced for performance</li>
            </ul>
          </li>
          <li><strong>Role Assignment</strong>:
            <ul>
              <li>Select a role from the Role dropdown for each team member</li>
              <li>Available roles include:
                <ul>
                  <li>Invoicing Lead</li>
                  <li>Onboarding Lead</li>
                  <li>Program Manager</li>
                  <li>Project Manager</li>
                  <li>Project Support Lead</li>
                  <li>Recruitment Lead</li>
                  <li>Reporting Writer</li>
                  <li>Tech Lead</li>
                  <li>Project Lead</li>
                  <li>Project Team</li>
                  <li>Productivity Lead</li>
                </ul>
              </li>
            </ul>
          </li>
          <li><strong>Remove Team Member</strong> - Click the X button to remove a team member from the list</li>
        </ul>
      `
    },
    {
      heading: 'Team Member Roles',
      content: `
        <p>Each team member must be assigned a role. Available roles include:</p>
        <ul>
          <li><strong>Program Manager</strong> - Oversees the overall program</li>
          <li><strong>Project Manager</strong> - Manages the specific project</li>
          <li><strong>Project Lead</strong> - Leads project execution</li>
          <li><strong>Tech Lead</strong> - Provides technical leadership</li>
          <li><strong>Productivity Lead</strong> - Monitors and improves productivity</li>
          <li><strong>Quality Lead</strong> - Ensures quality standards</li>
          <li><strong>Reporting Writer</strong> - Creates reports and documentation</li>
          <li><strong>Recruitment Lead</strong> - Manages contributor recruitment</li>
          <li><strong>Onboarding Lead</strong> - Handles contributor onboarding</li>
          <li><strong>Project Support Lead</strong> - Provides project support</li>
          <li><strong>Invoicing Lead</strong> - Manages invoicing and payments</li>
          <li><strong>Project Team</strong> - General team member role</li>
        </ul>
        <p><strong>Multiple Roles:</strong> A person can have different roles on different projects, but typically has one role per project.</p>
      `
    },
    {
      heading: 'Form Validation',
      content: `
        <p>The form validates team member assignments:</p>
        <ul>
          <li><strong>Required Fields</strong>:
            <ul>
              <li>Project (required)</li>
              <li>Team Member (required for each row)</li>
              <li>Role (required for each team member)</li>
            </ul>
          </li>
          <li><strong>Validation Errors</strong>:
            <ul>
              <li>Errors are shown in red below the field</li>
              <li>Must fix errors before publishing</li>
              <li>Empty team member rows are ignored</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Publishing Team Assignments',
      content: `
        <p>When ready to save team assignments:</p>
        <ol>
          <li>Select a project</li>
          <li>Add at least one team member with a role</li>
          <li>Ensure all team members have both a name and role assigned</li>
          <li>Click the <strong>Publish</strong> button</li>
          <li>Review the results to confirm assignments were created</li>
        </ol>
        <p><strong>Note:</strong> Publishing creates Project Team Member records in Salesforce linking people to projects with their assigned roles.</p>
      `
    },
    {
      heading: 'Editing Team Assignments',
      content: `
        <p>To edit existing team assignments:</p>
        <ul>
          <li>Navigate to the project detail page</li>
          <li>Find the team section</li>
          <li>Edit team members and roles as needed</li>
          <li>Or use this page to add additional team members</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Select Project First</strong> - Always select the project before adding team members</li>
          <li><strong>Use Search</strong> - Type at least 3 characters to search for team members</li>
          <li><strong>Assign Appropriate Roles</strong> - Ensure each team member has the correct role</li>
          <li><strong>Add All Members at Once</strong> - Use Add Team Member to add multiple people in one session</li>
          <li><strong>Remove Empty Rows</strong> - Remove team member rows you don't need</li>
          <li><strong>Verify Before Publishing</strong> - Double-check all assignments before publishing</li>
          <li><strong>One Role Per Person</strong> - Typically, assign one role per person per project</li>
        </ul>
      `
    }
  ]
};

