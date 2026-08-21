// User Management Documentation
export default {
  title: 'User Management',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The User Management page allows you to manage application users, roles, and permissions to control access and functionality throughout the system.</p>
        <p><strong>Purpose:</strong> Control who can access the application, what they can do, and how they interact with different features. This is essential for security and proper access control.</p>
        <p><strong>When to use:</strong> Use this page when adding new users, modifying user roles, updating permissions, deactivating users, or reviewing access controls.</p>
        <p><strong>Access Control:</strong> Only users with 'all' permissions (typically admins) can access this page.</p>
        <p><strong>Default View:</strong> The page has three tabs: Users, Roles, and Permissions.</p>
      `
    },
    {
      heading: 'Page Tabs',
      content: `
        <p>The page is organized into three main tabs:</p>
        <ul>
          <li><strong>Users Tab</strong> - Manage individual users
            <ul>
              <li>View all users</li>
              <li>Create new users</li>
              <li>Edit user information</li>
              <li>Deactivate users</li>
              <li>Assign roles and permissions</li>
            </ul>
          </li>
          <li><strong>Roles Tab</strong> - Manage user roles
            <ul>
              <li>View available roles</li>
              <li>Understand role permissions</li>
              <li>See role assignments</li>
            </ul>
          </li>
          <li><strong>Permissions Tab</strong> - Manage permissions
            <ul>
              <li>View all permissions</li>
              <li>Understand permission scope</li>
              <li>See permission assignments</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Users Tab',
      content: `
        <p>The Users tab displays all application users in a table:</p>
        <ul>
          <li><strong>User Information</strong>:
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Role</li>
              <li>Active status</li>
              <li>Permissions</li>
            </ul>
          </li>
          <li><strong>Actions</strong>:
            <ul>
              <li>Edit user</li>
              <li>Deactivate user</li>
              <li>View details</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Creating Users',
      content: `
        <p>To create a new user:</p>
        <ol>
          <li>Click the <strong>Add User</strong> or <strong>Create User</strong> button</li>
          <li>Fill in the user form:
            <ul>
              <li><strong>Name</strong> (required) - User's full name</li>
              <li><strong>Email</strong> (required) - User's email address (used for login)</li>
              <li><strong>Password</strong> (required) - Initial password</li>
              <li><strong>Role</strong> (required) - Select from available roles</li>
              <li><strong>Permissions</strong> - Additional permissions (if needed)</li>
              <li><strong>Active</strong> - Checkbox to set user as active</li>
            </ul>
          </li>
          <li>Click <strong>Create</strong> or <strong>Save</strong></li>
        </ol>
        <p><strong>Note:</strong> Users should change their password after first login for security.</p>
      `
    },
    {
      heading: 'Editing Users',
      content: `
        <p>To edit an existing user:</p>
        <ol>
          <li>Find the user in the table</li>
          <li>Click the <strong>Edit</strong> button</li>
          <li>Modify user information:
            <ul>
              <li>Update name or email</li>
              <li>Change role</li>
              <li>Modify permissions</li>
              <li>Update active status</li>
              <li>Reset password (leave blank to keep current)</li>
            </ul>
          </li>
          <li>Click <strong>Update</strong> or <strong>Save</strong></li>
        </ol>
      `
    },
    {
      heading: 'Deactivating Users',
      content: `
        <p>To deactivate a user:</p>
        <ol>
          <li>Find the user in the table</li>
          <li>Click the <strong>Delete</strong> or <strong>Deactivate</strong> button</li>
          <li>Confirm the deactivation</li>
        </ol>
        <p><strong>Note:</strong> Deactivating a user prevents them from logging in but preserves their data and history.</p>
      `
    },
    {
      heading: 'Available Roles',
      content: `
        <p>The system includes several predefined roles:</p>
        <ul>
          <li><strong>Admin</strong>:
            <ul>
              <li>Full access to all features</li>
              <li>Can manage users, roles, and permissions</li>
              <li>All permissions enabled</li>
            </ul>
          </li>
          <li><strong>Reports Viewer</strong>:
            <ul>
              <li>Can view dashboards</li>
              <li>Can view reports</li>
              <li>Read-only access to reporting features</li>
            </ul>
          </li>
          <li><strong>Reports Manager</strong>:
            <ul>
              <li>Can view and manage dashboards</li>
              <li>Can create, edit, and delete reports</li>
              <li>Can schedule reports</li>
              <li>Full access to reporting features</li>
            </ul>
          </li>
          <li><strong>Salesforce Manager</strong>:
            <ul>
              <li>Full access to all features</li>
              <li>Similar to Admin role</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Roles Tab',
      content: `
        <p>The Roles tab displays information about available roles:</p>
        <ul>
          <li><strong>Role List</strong> - All available roles in the system</li>
          <li><strong>Role Details</strong>:
            <ul>
              <li>Role name and description</li>
              <li>Associated permissions</li>
              <li>Number of users with this role</li>
            </ul>
          </li>
          <li><strong>Role Permissions</strong> - See what each role can do</li>
        </ul>
      `
    },
    {
      heading: 'Permissions Tab',
      content: `
        <p>The Permissions tab displays information about available permissions:</p>
        <ul>
          <li><strong>Permission List</strong> - All available permissions</li>
          <li><strong>Permission Details</strong>:
            <ul>
              <li>Permission name and description</li>
              <li>What the permission allows</li>
              <li>Which roles have this permission</li>
            </ul>
          </li>
          <li><strong>Common Permissions</strong>:
            <ul>
              <li><code>all</code> - Full access to everything</li>
              <li><code>view_dashboards</code> - Can view dashboards</li>
              <li><code>manage_dashboards</code> - Can create/edit dashboards</li>
              <li><code>view_reports</code> - Can view reports</li>
              <li><code>create_reports</code> - Can create reports</li>
              <li><code>edit_reports</code> - Can edit reports</li>
              <li><code>delete_reports</code> - Can delete reports</li>
              <li><code>schedule_reports</code> - Can schedule reports</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Use Appropriate Roles</strong> - Assign users to roles that match their responsibilities</li>
          <li><strong>Principle of Least Privilege</strong> - Give users only the permissions they need</li>
          <li><strong>Regular Review</strong> - Periodically review user access and permissions</li>
          <li><strong>Deactivate Unused Accounts</strong> - Deactivate users who no longer need access</li>
          <li><strong>Secure Passwords</strong> - Ensure users set strong passwords</li>
          <li><strong>Document Changes</strong> - Keep records of user management changes</li>
          <li><strong>Test Permissions</strong> - Test that permissions work as expected</li>
        </ul>
      `
    }
  ]
};

