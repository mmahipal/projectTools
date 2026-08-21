// Administration Documentation
export default {
  title: 'Administration',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Administration page provides a centralized interface for system configuration, user management, and application settings.</p>
        <p><strong>Purpose:</strong> Configure system settings, manage users and permissions, configure Salesforce integration, and maintain the application.</p>
        <p><strong>Access Control:</strong> This page is typically available to Administrators and users with administrative permissions.</p>
        <p><strong>Default View:</strong> The page uses a tabbed interface to organize different administration functions.</p>
      `
    },
    {
      heading: 'Page Tabs',
      content: `
        <p>The Administration page is organized into several tabs:</p>
        <ul>
          <li><strong>Settings Tab</strong> - System-wide configuration settings
            <ul>
              <li>Application preferences</li>
              <li>Default values</li>
              <li>Feature flags</li>
              <li>System configuration</li>
            </ul>
          </li>
          <li><strong>User Management Tab</strong> - Manage users and permissions
            <ul>
              <li>Create, edit, and deactivate user accounts</li>
              <li>Assign roles and permissions</li>
              <li>Manage user access to features</li>
              <li>View user activity</li>
            </ul>
          </li>
          <li><strong>Salesforce Settings Tab</strong> - Salesforce integration configuration
            <ul>
              <li>Connection credentials</li>
              <li>API settings</li>
              <li>Object mappings</li>
              <li>Sync configurations</li>
            </ul>
          </li>
          <li><strong>Content Filtering Preferences Tab</strong> - GPC filtering configuration
            <ul>
              <li>Manage your interested accounts</li>
              <li>Manage your interested projects</li>
              <li>Configure GPC filter preferences</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Settings Tab',
      content: `
        <p>The Settings tab allows you to configure system-wide preferences:</p>
        <ul>
          <li><strong>Application Preferences</strong>:
            <ul>
              <li>Default date formats</li>
              <li>Time zone settings</li>
              <li>Language preferences</li>
              <li>Display options</li>
            </ul>
          </li>
          <li><strong>Default Values</strong>:
            <ul>
              <li>Set default values for new records</li>
              <li>Configure default project settings</li>
              <li>Set default user preferences</li>
            </ul>
          </li>
          <li><strong>Feature Flags</strong>:
            <ul>
              <li>Enable/disable features</li>
              <li>Control feature rollout</li>
              <li>Manage experimental features</li>
            </ul>
          </li>
          <li><strong>System Configuration</strong>:
            <ul>
              <li>API endpoints</li>
              <li>Timeout settings</li>
              <li>Batch size configurations</li>
            </ul>
          </li>
        </ul>
        <p><strong>Saving Settings:</strong> Click Save to apply your changes. Some settings may require a page refresh to take effect.</p>
      `
    },
    {
      heading: 'User Management Tab',
      content: `
        <p>The User Management tab provides comprehensive user administration:</p>
        <ul>
          <li><strong>User List</strong>:
            <ul>
              <li>View all users in the system</li>
              <li>Search for specific users</li>
              <li>Filter by role, status, or other criteria</li>
              <li>Sort by various columns</li>
            </ul>
          </li>
          <li><strong>Creating Users</strong>:
            <ul>
              <li>Click "Add User" or "Create User" button</li>
              <li>Fill in user information (name, email, etc.)</li>
              <li>Assign a role</li>
              <li>Set permissions</li>
              <li>Save the user</li>
            </ul>
          </li>
          <li><strong>Editing Users</strong>:
            <ul>
              <li>Click Edit on a user row</li>
              <li>Modify user information</li>
              <li>Update role or permissions</li>
              <li>Save changes</li>
            </ul>
          </li>
          <li><strong>Deactivating Users</strong>:
            <ul>
              <li>Deactivate instead of deleting to preserve history</li>
              <li>Deactivated users cannot log in</li>
              <li>Can be reactivated if needed</li>
            </ul>
          </li>
          <li><strong>Roles and Permissions</strong>:
            <ul>
              <li>Assign roles (Admin, Manager, User, etc.)</li>
              <li>Set granular permissions</li>
              <li>Control access to features</li>
              <li>View permission matrix</li>
            </ul>
          </li>
          <li><strong>User Activity</strong>:
            <ul>
              <li>View login history</li>
              <li>Track user actions</li>
              <li>Monitor system usage</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Salesforce Settings Tab',
      content: `
        <p>The Salesforce Settings tab configures the Salesforce integration:</p>
        <ul>
          <li><strong>Connection Settings</strong>:
            <ul>
              <li>Salesforce instance URL</li>
              <li>API version</li>
              <li>Connection status</li>
              <li>Test connection button</li>
            </ul>
          </li>
          <li><strong>Authentication</strong>:
            <ul>
              <li>OAuth configuration</li>
              <li>API credentials</li>
              <li>Token management</li>
              <li>Refresh token settings</li>
            </ul>
          </li>
          <li><strong>Object Mappings</strong>:
            <ul>
              <li>Map Salesforce objects to application objects</li>
              <li>Configure field mappings</li>
              <li>Set up relationship mappings</li>
            </ul>
          </li>
          <li><strong>Sync Configuration</strong>:
            <ul>
              <li>Sync frequency settings</li>
              <li>Sync direction (bidirectional, one-way)</li>
              <li>Conflict resolution rules</li>
            </ul>
          </li>
          <li><strong>API Limits</strong>:
            <ul>
              <li>Monitor API usage</li>
              <li>View API limit status</li>
              <li>Configure rate limiting</li>
            </ul>
          </li>
        </ul>
        <p><strong>Important:</strong> Changes to Salesforce settings can affect data synchronization. Test connections before saving.</p>
      `
    },
    {
      heading: 'Content Filtering Preferences Tab',
      content: `
        <p>This tab allows you to configure your GPC (Global Persona-Based Content) filtering preferences:</p>
        <ul>
          <li><strong>Interested Accounts</strong>:
            <ul>
              <li>Select accounts you're interested in</li>
              <li>Search for accounts</li>
              <li>Add or remove accounts</li>
              <li>When GPC filter is enabled, only data for these accounts is shown</li>
            </ul>
          </li>
          <li><strong>Interested Projects</strong>:
            <ul>
              <li>Select projects you're interested in</li>
              <li>Search for projects</li>
              <li>Add or remove projects</li>
              <li>When GPC filter is enabled, only data for these projects is shown</li>
            </ul>
          </li>
          <li><strong>Saving Preferences</strong>:
            <ul>
              <li>Click Save to store your preferences</li>
              <li>Preferences are applied immediately</li>
              <li>Can be overridden per page using GPC Filter toggle</li>
            </ul>
          </li>
        </ul>
        <p><strong>Note:</strong> This is the same as accessing Profile from the user menu. Both locations access the same preferences.</p>
      `
    },
    {
      heading: 'Search and Filters',
      content: `
        <p>Various tabs include search and filter functionality:</p>
        <ul>
          <li><strong>User Management</strong> - Search users by name or email, filter by role or status</li>
          <li><strong>Content Filtering</strong> - Search for accounts or projects to add</li>
          <li><strong>Other Tabs</strong> - Search functionality varies by tab</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Test Before Saving</strong> - Test Salesforce connections before saving changes</li>
          <li><strong>Backup Settings</strong> - Document important settings before making changes</li>
          <li><strong>Review Permissions</strong> - Regularly review user permissions for security</li>
          <li><strong>Monitor Activity</strong> - Check user activity logs regularly</li>
          <li><strong>Use Search</strong> - Use search to quickly find users, accounts, or projects</li>
          <li><strong>Save Frequently</strong> - Save changes as you make them</li>
          <li><strong>Document Changes</strong> - Keep notes on configuration changes</li>
          <li><strong>Test Features</strong> - Test feature flags in a safe environment first</li>
          <li><strong>Review Defaults</strong> - Ensure default values make sense for your organization</li>
          <li><strong>Secure Credentials</strong> - Keep Salesforce credentials secure and rotate regularly</li>
        </ul>
      `
    }
  ]
};

