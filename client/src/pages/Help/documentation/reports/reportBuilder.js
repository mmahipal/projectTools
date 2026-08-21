// Report Builder Documentation
export default {
  title: 'Report Builder',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Report Builder allows you to create custom reports from Salesforce data with flexible filtering, grouping, and visualization options.</p>
        <p><strong>Purpose:</strong> Create ad-hoc reports tailored to your specific needs without requiring technical knowledge or SQL expertise.</p>
        <p><strong>When to use:</strong> Use this page when you need to generate custom reports on projects, contributors, cases, or other Salesforce objects for analysis, tracking, or sharing.</p>
        <p><strong>Default View:</strong> The page starts with a clean interface where you select an object type and begin building your report.</p>
      `
    },
    {
      heading: 'Creating a Report',
      content: `
        <p>To create a new report:</p>
        <ol>
          <li>Navigate to <strong>Reporting > Report Builder</strong> from the sidebar</li>
          <li>Select the Salesforce object type you want to report on</li>
          <li>Choose which fields to include in your report</li>
          <li>Apply filters to narrow down the data</li>
          <li>Configure grouping and sorting (optional)</li>
          <li>Click <strong>Generate Report</strong> to view results</li>
          <li>Export or save the report as needed</li>
        </ol>
      `
    },
    {
      heading: 'Object Selection',
      content: `
        <p>The first step is selecting which Salesforce object to report on:</p>
        <ul>
          <li><strong>Project</strong> - Report on projects</li>
          <li><strong>Project Objective</strong> - Report on project objectives</li>
          <li><strong>Contributor Project</strong> - Report on contributor projects</li>
          <li><strong>Case</strong> - Report on support cases</li>
          <li><strong>Contact</strong> - Report on contacts/contributors</li>
          <li><strong>Other Objects</strong> - Additional Salesforce objects as available</li>
        </ul>
        <p><strong>How to select:</strong> Use the dropdown at the top to choose the object type. Once selected, available fields for that object will be loaded.</p>
      `
    },
    {
      heading: 'Field Selection',
      content: `
        <p>After selecting an object, choose which fields to include in your report:</p>
        <ul>
          <li><strong>Available Fields</strong> - All fields from the selected object are shown
            <ul>
              <li>Fields are organized by category (Standard Fields, Custom Fields, etc.)</li>
              <li>Field type is indicated (text, number, date, etc.)</li>
              <li>Only fields you have permission to view are shown</li>
            </ul>
          </li>
          <li><strong>Adding Fields</strong>:
            <ul>
              <li>Click on a field to add it to your report</li>
              <li>Fields appear in the "Selected Fields" section</li>
              <li>Drag to reorder fields</li>
              <li>Remove fields by clicking the X button</li>
            </ul>
          </li>
          <li><strong>Field Types</strong>:
            <ul>
              <li>Standard fields (Name, Status, Created Date, etc.)</li>
              <li>Custom fields (project-specific fields)</li>
              <li>Related fields (fields from related objects)</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Filters',
      content: `
        <p>Apply filters to narrow down the data in your report:</p>
        <ul>
          <li><strong>Filter Types</strong>:
            <ul>
              <li><strong>Field Filters</strong> - Filter by specific field values
                <ul>
                  <li>Select a field</li>
                  <li>Choose an operator (equals, contains, greater than, etc.)</li>
                  <li>Enter or select the value</li>
                </ul>
              </li>
              <li><strong>Date Range Filters</strong> - Filter by date fields
                <ul>
                  <li>Select a date field</li>
                  <li>Choose date range (Today, Last 7 Days, Custom Range, etc.)</li>
                </ul>
              </li>
              <li><strong>Status Filters</strong> - Filter by status values</li>
              <li><strong>Related Object Filters</strong> - Filter by fields from related objects</li>
            </ul>
          </li>
          <li><strong>Filter Logic</strong>:
            <ul>
              <li>Add multiple filters</li>
              <li>Combine with AND/OR logic</li>
              <li>Group filters for complex conditions</li>
            </ul>
          </li>
          <li><strong>GPC Filter</strong> - Apply your personalized content filtering preferences
            <ul>
              <li>Toggle on/off using the GPC Filter button</li>
              <li>When enabled, only shows data for your selected accounts/projects</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Grouping and Sorting',
      content: `
        <p>Organize your report data:</p>
        <ul>
          <li><strong>Grouping</strong>:
            <ul>
              <li>Group rows by one or more fields</li>
              <li>Create summary reports with totals</li>
              <li>Nested grouping for hierarchical views</li>
            </ul>
          </li>
          <li><strong>Sorting</strong>:
            <ul>
              <li>Sort by any field in ascending or descending order</li>
              <li>Multiple sort levels (primary, secondary, etc.)</li>
              <li>Sort grouped data within groups</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Viewing Results',
      content: `
        <p>After configuring your report, generate and view results:</p>
        <ul>
          <li><strong>Generate Report</strong> - Click to run the report and see results</li>
          <li><strong>Results Table</strong>:
            <ul>
              <li>Displays data in a sortable table</li>
              <li>Shows selected fields as columns</li>
              <li>Respects filters and grouping</li>
              <li>Pagination for large result sets</li>
            </ul>
          </li>
          <li><strong>Summary Statistics</strong>:
            <ul>
              <li>Total record count</li>
              <li>Aggregated values (sums, averages, etc.)</li>
              <li>Group totals when grouping is used</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Exporting Reports',
      content: `
        <p>Export your report data:</p>
        <ul>
          <li><strong>Export to Excel</strong> - Download as .xlsx file
            <ul>
              <li>Preserves formatting</li>
              <li>Includes all columns</li>
              <li>Maintains grouping if used</li>
            </ul>
          </li>
          <li><strong>Export to CSV</strong> - Download as .csv file
            <ul>
              <li>Compatible with most tools</li>
              <li>Easy to import elsewhere</li>
            </ul>
          </li>
          <li><strong>Copy to Clipboard</strong> - Copy data for pasting into other applications</li>
        </ul>
      `
    },
    {
      heading: 'Saving Reports',
      content: `
        <p>Save reports for future use:</p>
        <ul>
          <li><strong>Save Report</strong> - Save the report configuration
            <ul>
              <li>Give the report a name</li>
              <li>Add description (optional)</li>
              <li>Report is saved with your current filters and field selections</li>
            </ul>
          </li>
          <li><strong>Load Saved Report</strong> - Open a previously saved report
            <ul>
              <li>Select from your saved reports</li>
              <li>Report configuration is restored</li>
              <li>Regenerate to get latest data</li>
            </ul>
          </li>
          <li><strong>Manage Reports</strong> - Edit, duplicate, or delete saved reports</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Start Simple</strong> - Begin with basic fields and filters, then add complexity</li>
          <li><strong>Use Filters</strong> - Always apply filters to focus on relevant data</li>
          <li><strong>Limit Fields</strong> - Only include fields you need to keep reports readable</li>
          <li><strong>Test Filters</strong> - Verify filters work as expected before generating large reports</li>
          <li><strong>Use Grouping</strong> - Group data for summary views and totals</li>
          <li><strong>Save Common Reports</strong> - Save frequently used report configurations</li>
          <li><strong>Export Regularly</strong> - Export important reports for record-keeping</li>
          <li><strong>Check Permissions</strong> - Ensure you have access to the objects and fields you need</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Optimize Performance</strong> - Use specific filters to reduce data volume and improve performance</li>
        </ul>
      `
    }
  ]
};

