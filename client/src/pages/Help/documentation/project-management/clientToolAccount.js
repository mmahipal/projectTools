// Client Tool Account Documentation
export default {
  title: 'Client Tool Account',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>Client Tool Account management allows you to configure and manage accounts used by contributors to access client tools and platforms.</p>
        <p><strong>Purpose:</strong> Manage account assignments, track usage, ensure proper access control for client tools, and monitor account status and availability.</p>
        <p><strong>When to use:</strong> Use this page when you need to assign client tool accounts to contributors, create new accounts, update account information, or analyze account usage and distribution.</p>
        <p><strong>Default View:</strong> The page loads showing all contributor projects in a table. You can assign accounts to projects, create new accounts, or view analytics.</p>
      `
    },
    {
      heading: 'Page Tabs',
      content: `
        <p>The page has two main tabs:</p>
        <ul>
          <li><strong>Management Tab</strong> - Manage account assignments and create/update accounts
            <ul>
              <li>View contributor projects</li>
              <li>Assign accounts to projects</li>
              <li>Create new accounts</li>
              <li>Update existing accounts</li>
              <li>Bulk operations</li>
            </ul>
          </li>
          <li><strong>Analytics Tab</strong> - View account usage analytics
            <ul>
              <li>Account distribution charts</li>
              <li>Assignment rates</li>
              <li>Utilization metrics</li>
              <li>Status breakdowns</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Contributor Projects Table',
      content: `
        <p>The main table displays contributor projects with their account assignments:</p>
        <ul>
          <li><strong>Project Information</strong> - Project name, objective, contributor details</li>
          <li><strong>Account Status</strong> - Whether an account is assigned</li>
          <li><strong>Account Details</strong> - Account name, tool name, status</li>
          <li><strong>Actions</strong> - Assign, update, or view account</li>
        </ul>
        <p><strong>Infinite Scroll:</strong> The table uses infinite scroll to load more projects as you scroll down. This allows efficient handling of large datasets.</p>
      `
    },
    {
      heading: 'Search and Filters',
      content: `
        <p>The page includes search functionality:</p>
        <ul>
          <li><strong>Search Bar</strong> - Search contributor projects
            <ul>
              <li>Type to search by project name, contributor name, or other criteria</li>
              <li>Results filter in real-time</li>
              <li>Server-side filtering for performance</li>
            </ul>
          </li>
          <li><strong>Search Tips:</strong>
            <ul>
              <li>Search is case-insensitive</li>
              <li>Matches partial text</li>
              <li>Results update as you type</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Creating Client Tool Accounts',
      content: `
        <p>To create a new client tool account:</p>
        <ol>
          <li>Click the <strong>Create Account</strong> button (plus icon)</li>
          <li>Fill in the account form:
            <ul>
              <li><strong>Client Tool Account Name</strong> - Name for the account</li>
              <li><strong>Contributor</strong> - Search for and select the contributor (required)</li>
              <li><strong>Account</strong> - Search for and select the Salesforce account (required)</li>
              <li><strong>Client Tool Name</strong> - Select from picklist (required)</li>
              <li><strong>Client Tool User ID</strong> - User ID in the client tool</li>
              <li><strong>Client Tool Email</strong> - Email associated with the account</li>
              <li><strong>OTP Limit Exceeded</strong> - Checkbox if OTP limit is exceeded</li>
              <li><strong>Deactivated</strong> - Checkbox if account is deactivated</li>
              <li><strong>Verified</strong> - Checkbox if account is verified</li>
              <li><strong>Last Changed Date/Time</strong> - When account was last modified</li>
            </ul>
          </li>
          <li>Click <strong>Create</strong> to save the account</li>
        </ol>
        <p><strong>Search Fields:</strong> Contributor and Account fields are searchable. Start typing to see matching results.</p>
      `
    },
    {
      heading: 'Assigning Accounts to Projects',
      content: `
        <p>To assign an account to a contributor project:</p>
        <ol>
          <li>Find the contributor project in the table</li>
          <li>Click the <strong>Assign Account</strong> button or link icon</li>
          <li>Search for an existing account or create a new one</li>
          <li>Select the account from search results</li>
          <li>The account is assigned to the project</li>
        </ol>
        <p><strong>Account Search:</strong> When assigning, you can search for existing accounts by name, tool, or other criteria.</p>
      `
    },
    {
      heading: 'Bulk Operations',
      content: `
        <p>The page supports bulk account assignments:</p>
        <ul>
          <li><strong>Select Multiple Projects</strong> - Use checkboxes to select multiple contributor projects</li>
          <li><strong>Bulk Assign</strong> - Assign the same account to multiple projects at once</li>
          <li><strong>Bulk Update</strong> - Update account information for multiple assignments</li>
          <li><strong>Bulk Validation</strong> - Validate account assignments in bulk</li>
        </ul>
        <p><strong>Validation:</strong> Before bulk operations, the system validates assignments to check for conflicts, availability, and status issues.</p>
      `
    },
    {
      heading: 'Account Validation',
      content: `
        <p>The page includes validation features to ensure account assignments are correct:</p>
        <ul>
          <li><strong>Conflict Detection</strong>:
            <ul>
              <li>Detects duplicate account assignments</li>
              <li>Identifies existing mappings</li>
              <li>Shows all conflicts before assignment</li>
            </ul>
          </li>
          <li><strong>Availability Check</strong>:
            <ul>
              <li>Checks if accounts are available</li>
              <li>Verifies account status</li>
              <li>Warns about unavailable accounts</li>
            </ul>
          </li>
          <li><strong>Status Check</strong>:
            <ul>
              <li>Verifies account status (active, deactivated, etc.)</li>
              <li>Checks OTP limit status</li>
              <li>Validates account verification status</li>
            </ul>
          </li>
          <li><strong>Validation Warnings</strong>:
            <ul>
              <li>Warnings are shown in the UI</li>
              <li>Review warnings before proceeding</li>
              <li>Fix issues before assigning</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Updating Accounts',
      content: `
        <p>To update an existing account:</p>
        <ol>
          <li>Find the account assignment in the table</li>
          <li>Click the <strong>Edit</strong> button (pencil icon)</li>
          <li>Modify account information in the form</li>
          <li>Click <strong>Update</strong> to save changes</li>
        </ol>
        <p><strong>Account Search for Update:</strong> When updating, you can search for a different account to reassign.</p>
      `
    },
    {
      heading: 'Viewing Account Details',
      content: `
        <p>Click on an account to view detailed information:</p>
        <ul>
          <li>Account configuration</li>
          <li>Contributor information</li>
          <li>Project assignments</li>
          <li>Status and verification details</li>
          <li>Related Salesforce records</li>
        </ul>
        <p><strong>Object View Modal:</strong> Use the view modal to see full account details and related objects.</p>
      `
    },
    {
      heading: 'Import/Export',
      content: `
        <p>The page supports importing and exporting account data:</p>
        <ul>
          <li><strong>Export to Excel</strong>:
            <ul>
              <li>Click the Export button</li>
              <li>Downloads account data as .xlsx file</li>
              <li>Includes all visible columns</li>
            </ul>
          </li>
          <li><strong>Import from Excel</strong>:
            <ul>
              <li>Click the Import button</li>
              <li>Select an Excel file</li>
              <li>Map columns to fields</li>
              <li>Review and import data</li>
            </ul>
          </li>
        </ul>
        <p><strong>Import Format:</strong> Excel files should match the expected format with columns for account name, contributor, tool name, etc.</p>
      `
    },
    {
      heading: 'Analytics Tab',
      content: `
        <p>The Analytics tab provides insights into account usage:</p>
        <ul>
          <li><strong>Account Distribution</strong> - Charts showing how accounts are distributed
            <ul>
              <li>By client tool</li>
              <li>By account status</li>
              <li>By project</li>
            </ul>
          </li>
          <li><strong>Assignment Rates</strong> - Percentage of projects with assigned accounts</li>
          <li><strong>Utilization Metrics</strong> - How accounts are being used</li>
          <li><strong>Status Breakdowns</strong> - Distribution of account statuses</li>
        </ul>
        <p>Use analytics to identify trends, optimize account allocation, and ensure efficient usage.</p>
      `
    },
    {
      heading: 'Client Tool Name Picklist',
      content: `
        <p>The Client Tool Name field uses a picklist of available client tools:</p>
        <ul>
          <li>Picklist values are loaded from Salesforce</li>
          <li>Select from the dropdown</li>
          <li>Values are specific to your organization's configuration</li>
        </ul>
        <p><strong>Note:</strong> If a tool name is not in the list, you may need to add it to Salesforce first.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Validate Before Assigning</strong> - Always review validation warnings before assigning accounts</li>
          <li><strong>Check Account Status</strong> - Verify accounts are active and available before assignment</li>
          <li><strong>Use Search</strong> - Use search to quickly find projects or accounts</li>
          <li><strong>Bulk Assign When Possible</strong> - Use bulk operations for efficiency</li>
          <li><strong>Review Analytics</strong> - Regularly check analytics to optimize account usage</li>
          <li><strong>Keep Accounts Updated</strong> - Update account status and information regularly</li>
          <li><strong>Monitor Conflicts</strong> - Watch for validation conflicts and resolve them</li>
          <li><strong>Export for Backup</strong> - Export account data regularly for record-keeping</li>
          <li><strong>Use Infinite Scroll</strong> - Scroll down to load more projects automatically</li>
          <li><strong>Check Verification Status</strong> - Ensure accounts are verified before assigning to production projects</li>
        </ul>
      `
    }
  ]
};

