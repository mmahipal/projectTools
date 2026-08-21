// Payment Adjustments Documentation
export default {
  title: 'Payment Adjustments',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Payment Adjustments page allows you to view, search, filter, and manage payment adjustments for contributors. This page provides comprehensive visibility into all payment adjustments made to contributor payments.</p>
        <p><strong>Purpose:</strong> Track and manage payment adjustments including corrections, bonuses, deductions, and other modifications to contributor payments. This is essential for maintaining accurate payment records and auditing payment changes.</p>
        <p><strong>When to use:</strong> Use this page when you need to:</p>
        <ul>
          <li>Review payment adjustments made to contributor payments</li>
          <li>Search for specific adjustments by contributor name</li>
          <li>Filter adjustments by status, date, amount, or other criteria</li>
          <li>Export adjustment data for reporting or auditing</li>
          <li>Track adjustment history and notes</li>
        </ul>
        <p><strong>Default View:</strong> The page displays a table of payment adjustment records with 1000 entries loaded by default. Additional records load automatically as you scroll down.</p>
      `
    },
    {
      heading: 'Page Header',
      content: `
        <p>The page header includes:</p>
        <ul>
          <li><strong>Page Title</strong> - "Payment Adjustments" with subtitle "View and manage payment adjustments"</li>
          <li><strong>Menu Toggle</strong> - Button to expand/collapse the sidebar navigation</li>
          <li><strong>GPC Filter Toggle</strong> - Enable or disable Global Persona-Based Content filtering to focus on your projects</li>
          <li><strong>Bookmark Icon</strong> - Click to bookmark this page for quick access</li>
          <li><strong>User Profile</strong> - Access your profile, help, and logout options</li>
        </ul>
        <p>The header uses the same styling and layout as the PO Pay Rates page for consistency across the application.</p>
      `
    },
    {
      heading: 'Creating New Payment Adjustments',
      content: `
        <p>You can create new payment adjustments directly from the Payment Adjustments page:</p>
        <ul>
          <li><strong>New Payment Adjustment Button</strong> - Located in the table header, next to the search bar
            <ul>
              <li>White button with border, matching the styling of other action buttons</li>
              <li>Click to open the "New Payment Adjustment" modal form</li>
            </ul>
          </li>
          <li><strong>New Payment Adjustment Modal</strong> - A comprehensive form for creating payment adjustments
            <ul>
              <li>Opens as a modal overlay when you click "New Payment Adjustment"</li>
              <li>Two-column layout for efficient data entry</li>
              <li>All fields are organized in logical sections</li>
            </ul>
          </li>
          <li><strong>Form Sections</strong>:
            <ul>
              <li><strong>Information Section</strong> - Contains all payment adjustment details</li>
            </ul>
          </li>
          <li><strong>Required Fields</strong>:
            <ul>
              <li><strong>Payment Adjustment Name</strong> - Required field (marked with red asterisk)</li>
              <li>All other fields are optional</li>
            </ul>
          </li>
          <li><strong>Form Fields (Left Column)</strong>:
            <ul>
              <li><strong>Payment Adjustment Name</strong> - Text input (required)</li>
              <li><strong>Contributor</strong> - Search field with dropdown
                <ul>
                  <li>Type to search for contributors by name</li>
                  <li>Dropdown shows matching contributors as you type</li>
                  <li>Click a contributor to select</li>
                  <li>Search is case-insensitive and supports partial matches</li>
                </ul>
              </li>
              <li><strong>Contributor Project</strong> - Search field with dropdown
                <ul>
                  <li>Type to search for contributor projects by name</li>
                  <li>Dropdown shows matching projects as you type</li>
                  <li>Click a project to select</li>
                </ul>
              </li>
              <li><strong>Adjustment Type</strong> - Dropdown with options:
                <ul>
                  <li>--None--</li>
                  <li>Bonus</li>
                  <li>Referral</li>
                  <li>Adjustment</li>
                  <li>Appen China</li>
                  <li>PreCrowdGen</li>
                  <li>Garnishment</li>
                  <li>Quick Tasks</li>
                  <li>Incentives</li>
                </ul>
              </li>
              <li><strong>Payment ID</strong> - Text input field (enter payment identifier)</li>
            </ul>
          </li>
          <li><strong>Form Fields (Right Column)</strong>:
            <ul>
              <li><strong>Contributor Facing Project Name</strong> - Text input</li>
              <li><strong>Status</strong> - Dropdown with options:
                <ul>
                  <li>--None--</li>
                  <li>In Review</li>
                  <li>Approved</li>
                  <li>Rejected</li>
                  <li>Payment Created</li>
                  <li>Unpaid</li>
                  <li>Paid</li>
                </ul>
              </li>
              <li><strong>Payment Adjustment Date</strong> - Date picker
                <ul>
                  <li>Click the calendar icon to select a date</li>
                  <li>Info icon provides additional context</li>
                </ul>
              </li>
              <li><strong>Payment Adjustment Date Text</strong> - Text input (for text-based date entry)</li>
              <li><strong>Payment Adjustment Amount</strong> - Number input (supports decimals)</li>
              <li><strong>Adjustment Notes</strong> - Multi-line text area (for detailed notes about the adjustment)</li>
            </ul>
          </li>
          <li><strong>Form Actions</strong>:
            <ul>
              <li><strong>Cancel Button</strong> - Closes the modal without saving
                <ul>
                  <li>White background with gray border</li>
                  <li>Matches the styling of cancel buttons in other modals</li>
                </ul>
              </li>
              <li><strong>Publish Button</strong> - Creates the payment adjustment in Salesforce
                <ul>
                  <li>Teal background (#08979C) matching other publish buttons</li>
                  <li>Shows "Publishing..." with spinner while processing</li>
                  <li>Includes Send icon when ready</li>
                  <li>Validates required fields before publishing</li>
                  <li>Creates the record in Salesforce Payment_Adjustment__c object</li>
                  <li>Closes the modal and refreshes the table on success</li>
                  <li>Shows success/error toast notifications</li>
                </ul>
              </li>
            </ul>
          </li>
          <li><strong>Creating a Payment Adjustment</strong>:
            <ol>
              <li>Click the "New Payment Adjustment" button in the table header</li>
              <li>Fill in the required "Payment Adjustment Name" field</li>
              <li>Optionally search and select a Contributor</li>
              <li>Optionally search and select a Contributor Project</li>
              <li>Select an Adjustment Type from the dropdown (optional)</li>
              <li>Enter a Payment ID if applicable (optional)</li>
              <li>Fill in any other optional fields as needed</li>
              <li>Add notes in the Adjustment Notes field to document the reason for the adjustment</li>
              <li>Click "Publish" to create the payment adjustment in Salesforce</li>
              <li>The modal closes and the table refreshes to show the new record</li>
            </ol>
          </li>
          <li><strong>Search Functionality in Form</strong>:
            <ul>
              <li>Both Contributor and Contributor Project fields support real-time search</li>
              <li>Type at least 3 characters to trigger search</li>
              <li>Search results appear in a dropdown below the field</li>
              <li>Click a result to select it</li>
              <li>Search is debounced (waits 300ms after typing stops)</li>
              <li>Loading indicator shows while searching</li>
            </ul>
          </li>
          <li><strong>Validation and Error Handling</strong>:
            <ul>
              <li>Payment Adjustment Name is required - form will not submit without it</li>
              <li>Error messages appear as toast notifications</li>
              <li>Form fields are validated before publishing</li>
              <li>If publishing fails, an error message explains the issue</li>
            </ul>
          </li>
          <li><strong>After Publishing</strong>:
            <ul>
              <li>Success toast notification confirms the payment adjustment was created</li>
              <li>Modal closes automatically</li>
              <li>Table refreshes to show the new payment adjustment</li>
              <li>New record appears in the table with all entered information</li>
            </ul>
          </li>
        </ul>
        <p><strong>Best Practices for Creating Payment Adjustments:</strong></p>
        <ul>
          <li>Always provide a clear Payment Adjustment Name for easy identification</li>
          <li>Include detailed notes explaining the reason for the adjustment</li>
          <li>Select the appropriate Adjustment Type for categorization</li>
          <li>Set the Status to track the adjustment workflow</li>
          <li>Link to the correct Contributor and Contributor Project for accurate tracking</li>
          <li>Enter the Payment ID if the adjustment relates to a specific payment transaction</li>
          <li>Use the Payment Adjustment Date to record when the adjustment should be applied</li>
        </ul>
      `
    },
    {
      heading: 'Payment Adjustments Table',
      content: `
        <p>The main table displays payment adjustment records with the following default columns:</p>
        <ul>
          <li><strong>Payment Adjustment Name</strong> - Unique identifier for the adjustment (e.g., PA-00000021)</li>
          <li><strong>Contributor</strong> - Name of the contributor for whom the adjustment was made (clickable link)</li>
          <li><strong>Contributor Project</strong> - The project associated with the contributor for this adjustment</li>
          <li><strong>Payment Adjustment Amount</strong> - The monetary amount of the adjustment (positive or negative)</li>
          <li><strong>Adjustment Notes</strong> - Notes or description explaining the reason for the adjustment</li>
          <li><strong>Payment Adjustment Date</strong> - Date when the adjustment was made</li>
          <li><strong>Payment ID</strong> - Unique identifier linking to the original payment transaction</li>
          <li><strong>Status</strong> - Current status of the adjustment (e.g., Payment Created, Pending, Approved)</li>
          <li><strong>Created By</strong> - User who created the adjustment record</li>
        </ul>
        <p><strong>Table Features:</strong></p>
        <ul>
          <li><strong>Infinite Scroll</strong> - The table loads 1000 records initially and automatically loads more as you scroll to the bottom</li>
          <li><strong>Sticky Header</strong> - Column headers remain visible while scrolling</li>
          <li><strong>Proper Alignment</strong> - All columns and values are properly aligned for easy reading</li>
          <li><strong>Responsive Design</strong> - Table adapts to different screen sizes</li>
        </ul>
      `
    },
    {
      heading: 'Search Functionality',
      content: `
        <p>The page includes a search bar to find specific payment adjustments:</p>
        <ul>
          <li><strong>Search Bar Location</strong> - Located in the table header, next to action buttons</li>
          <li><strong>Search by Contributor</strong> - Type a contributor name to filter adjustments for that contributor</li>
          <li><strong>Search Behavior</strong>:
            <ul>
              <li>Search is debounced (waits 500ms after you stop typing before searching)</li>
              <li>Server-side filtering for optimal performance</li>
              <li>Case-insensitive search</li>
              <li>Matches partial contributor names</li>
            </ul>
          </li>
          <li><strong>Clear Search</strong> - Click the X icon in the search bar to clear the search and show all records</li>
          <li><strong>Search Tips</strong>:
            <ul>
              <li>Type the contributor's first or last name</li>
              <li>Partial matches are supported</li>
              <li>Search works across all visible records</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Filtering Options',
      content: `
        <p>The page includes a comprehensive filter builder for advanced filtering:</p>
        <ul>
          <li><strong>Filter Button</strong> - Click the "Filter" button in the table header to show/hide the filter panel
            <ul>
              <li>Button shows a badge with the number of active filters</li>
              <li>Active filters are highlighted</li>
            </ul>
          </li>
          <li><strong>Filter Builder Panel</strong> - Appears below the table header when opened
            <ul>
              <li>Allows you to build complex filter conditions</li>
              <li>Filter by any field that is currently visible in the table columns</li>
              <li>Only fields from the selected columns are available in the filter dropdown</li>
              <li>Values are populated from available values in the current dataset</li>
            </ul>
          </li>
          <li><strong>Adding Filters</strong>:
            <ol>
              <li>Click "Add Filter" button</li>
              <li>Select a field from the dropdown (only fields from visible table columns are shown)</li>
              <li>Select an operator (Equals, Contains, Not Equals, Starts With, Greater Than, Less Than, Between)</li>
              <li>For picklist fields: Select a value from the dropdown of available values</li>
              <li>For text/number fields: Enter the filter value manually</li>
              <li>For date fields: Use date picker or enter date value</li>
              <li>Add multiple filters to narrow down results (all filters are combined with AND logic)</li>
            </ol>
          </li>
          <li><strong>Filter Operators</strong>:
            <ul>
              <li><strong>Equals</strong> - Exact match (for all field types)</li>
              <li><strong>Contains</strong> - Partial text match (for text fields)</li>
              <li><strong>Not Equals</strong> - Exclude matching values</li>
              <li><strong>Starts With</strong> - Text begins with specified value</li>
              <li><strong>Greater Than</strong> - Values greater than specified (for numbers and dates)</li>
              <li><strong>Less Than</strong> - Values less than specified (for numbers and dates)</li>
              <li><strong>Between</strong> - Values within a range (for numbers and dates)</li>
            </ul>
          </li>
          <li><strong>Available Filter Fields</strong> - Only fields from currently visible table columns are available:
            <ul>
              <li>Status (Status__c)</li>
              <li>Payment Adjustment Date (Payment_Adjustment_Date__c)</li>
              <li>Payment Adjustment Amount (Payment_Adjustment_Amount__c)</li>
              <li>Contributor (Contributor__c) - Can filter by contributor name (looks up Contact ID)</li>
              <li>Contributor Project (Contributor_Project__c)</li>
              <li>Payment ID (Payment_ID__c)</li>
              <li>Adjustment Type (Adjustment_Type__c)</li>
              <li>Created By (CreatedBy) - Can filter by user name (looks up User ID)</li>
              <li>And any other fields that are currently visible in the table</li>
            </ul>
          </li>
          <li><strong>Filter Field Restrictions</strong>:
            <ul>
              <li>Only fields from the selected table columns are available in the filter dropdown</li>
              <li>This ensures filters are relevant to what you're viewing</li>
              <li>To filter by a field, first add it as a column using "Add Columns"</li>
            </ul>
          </li>
          <li><strong>Filter Values</strong>:
            <ul>
              <li>For picklist fields: Values are dynamically populated from actual data in the table</li>
              <li>For text fields: Enter the value manually (supports partial matches with Contains operator)</li>
              <li>For Contributor and Created By: Enter the name (system looks up the ID automatically)</li>
              <li>URL-encoded values are automatically decoded</li>
              <li>SQL injection protection is applied to all filter values</li>
            </ul>
          </li>
          <li><strong>Applying Filters</strong>:
            <ul>
              <li>Click "Apply Filters" to filter the table with your conditions</li>
              <li>Filters are applied immediately and table refreshes</li>
              <li>Active filter count is shown on the Filter button badge</li>
            </ul>
          </li>
          <li><strong>Clearing Filters</strong>:
            <ul>
              <li>Click "Clear All" to remove all filters and show all records</li>
              <li>Individual filters can be removed using the trash icon on each filter row</li>
              <li>Clearing filters resets the table to show all records</li>
            </ul>
          </li>
          <li><strong>Closing Filter Panel</strong> - Click the X icon in the filter header to close the panel (filters remain active)</li>
        </ul>
        <p><strong>GPC Filter Integration:</strong> The GPC Filter toggle in the header applies your personalized content filtering preferences to show only adjustments related to your projects and accounts. GPC filters are automatically combined with your manual filters.</p>
        <p><strong>Filter Best Practices:</strong></p>
        <ul>
          <li>Start with broad filters and narrow down as needed</li>
          <li>Use "Contains" operator for flexible text searches</li>
          <li>Combine multiple filters to create precise views</li>
          <li>Remember that only visible column fields can be filtered</li>
          <li>Clear filters when switching between different analysis tasks</li>
        </ul>
      `
    },
    {
      heading: 'Column Customization',
      content: `
        <p>Customize which columns are displayed in the table:</p>
        <ul>
          <li><strong>Default Columns</strong> - The table shows these columns by default:
            <ul>
              <li>Payment Adjustment Name (Name)</li>
              <li>Contributor (Contributor__c)</li>
              <li>Contributor Project (Contributor_Project__c)</li>
              <li>Payment Adjustment Amount (Payment_Adjustment_Amount__c)</li>
              <li>Adjustment Notes (Adjustment_Notes__c)</li>
              <li>Payment Adjustment Date (Payment_Adjustment_Date__c)</li>
              <li>Payment ID (Payment_ID__c)</li>
              <li>Status (Status__c)</li>
              <li>Created By (CreatedBy)</li>
            </ul>
          </li>
          <li><strong>Add Columns</strong> - Click the "Add Columns" button (with + icon) to open the column selector
            <ul>
              <li>Shows all available fields from Payment_Adjustment__c object</li>
              <li>Only fields from Payment_Adjustment__c are available (no related object fields)</li>
              <li>Check/uncheck fields to add or remove columns</li>
              <li>Selected columns are added to the table while maintaining proper alignment</li>
            </ul>
          </li>
          <li><strong>Remove Columns</strong> - Uncheck a column in the selector to remove it from the table</li>
          <li><strong>Column Order</strong> - Columns maintain their order when added</li>
          <li><strong>Column Alignment</strong> - All columns and values are properly aligned for readability</li>
        </ul>
      `
    },
    {
      heading: 'Refresh Functionality',
      content: `
        <p>The table includes an independent refresh option:</p>
        <ul>
          <li><strong>Refresh Button</strong> - Located in the table header, next to the search bar</li>
          <li><strong>Refresh Behavior</strong>:
            <ul>
              <li>Reloads all payment adjustment data from Salesforce</li>
              <li>Resets to the first 1000 records</li>
              <li>Maintains current filters and search terms</li>
              <li>Shows a loading spinner while refreshing</li>
            </ul>
          </li>
          <li><strong>When to Refresh</strong>:
            <ul>
              <li>After making changes in Salesforce</li>
              <li>To get the latest adjustment records</li>
              <li>If data seems outdated</li>
              <li>After applying or clearing filters</li>
            </ul>
          </li>
          <li><strong>Refresh Indicator</strong> - The refresh button shows a spinning icon while data is being loaded</li>
        </ul>
      `
    },
    {
      heading: 'Export Functionality',
      content: `
        <p>Export payment adjustment data for reporting and analysis:</p>
        <ul>
          <li><strong>Export Button</strong> - Located in the table header, styled like PO Pay Rates page buttons</li>
          <li><strong>Export Format</strong> - Exports data as CSV (Comma-Separated Values) file</li>
          <li><strong>Exported Data</strong>:
            <ul>
              <li>Includes all visible columns in the table</li>
              <li>Exports all records (not just visible ones)</li>
              <li>Respects current filters and search terms</li>
              <li>Includes column headers with field labels</li>
            </ul>
          </li>
          <li><strong>File Naming</strong> - File is named with timestamp: payment_adjustments_YYYY-MM-DD.csv</li>
          <li><strong>Export Process</strong>:
            <ol>
              <li>Click the "Export" button</li>
              <li>File downloads automatically to your default download folder</li>
              <li>Open in Excel, Google Sheets, or any CSV-compatible application</li>
            </ol>
          </li>
          <li><strong>Use Cases</strong>:
            <ul>
              <li>Financial reporting and analysis</li>
              <li>Audit trail documentation</li>
              <li>Payment reconciliation</li>
              <li>Data backup</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Loading States',
      content: `
        <p>The page uses consistent loading indicators:</p>
        <ul>
          <li><strong>Initial Load</strong>:
            <ul>
              <li>Shows centered loading spinner with teal color (#08979C)</li>
              <li>Displays "Loading Payment Adjustments data..." message</li>
              <li>Loading icon and text appear at the center of the page</li>
              <li>Same loader icon style as PO Pay Rates page</li>
            </ul>
          </li>
          <li><strong>Loading More Records</strong>:
            <ul>
              <li>Shows loading indicator at the bottom of the table when scrolling</li>
              <li>Appears when loading additional records via infinite scroll</li>
            </ul>
          </li>
          <li><strong>Refresh Loading</strong>:
            <ul>
              <li>Refresh button shows spinning icon while refreshing</li>
              <li>Table remains visible during refresh</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Infinite Scroll',
      content: `
        <p>The table implements infinite scroll for optimal performance:</p>
        <ul>
          <li><strong>Initial Load</strong> - Loads 1000 records by default</li>
          <li><strong>Automatic Loading</strong> - Automatically loads more records when you scroll near the bottom (within 200px)</li>
          <li><strong>Scroll Detection</strong> - Uses debounced scroll events for smooth performance</li>
          <li><strong>Loading Indicator</strong> - Shows a loading indicator at the bottom while fetching more records</li>
          <li><strong>Duplicate Prevention</strong> - Prevents duplicate records from being added</li>
          <li><strong>Performance</strong> - Only loads data when needed, reducing initial page load time</li>
          <li><strong>No Pagination</strong> - Seamless scrolling experience without page breaks</li>
        </ul>
      `
    },
    {
      heading: 'Table Header Styling',
      content: `
        <p>The table header matches the Workstream Management page styling exactly:</p>
        <ul>
          <li><strong>Header Background</strong> - Light gray (#f3f2f2)</li>
          <li><strong>Header Text</strong> - Uppercase, gray color (#706e6b), bold</li>
          <li><strong>Header Border</strong> - Bottom border for separation</li>
          <li><strong>Sticky Header</strong> - Header remains visible while scrolling</li>
          <li><strong>Column Alignment</strong> - Headers align with column content</li>
          <li><strong>Font Styling</strong> - Consistent font size, weight, and letter spacing</li>
        </ul>
      `
    },
    {
      heading: 'Data Fields and Relationships',
      content: `
        <p>Understanding the Payment Adjustment data:</p>
        <ul>
          <li><strong>Payment_Adjustment__c Object</strong> - All data comes from this Salesforce object</li>
          <li><strong>Key Fields</strong>:
            <ul>
              <li><strong>Name</strong> - Auto-generated unique identifier</li>
              <li><strong>Contributor__c</strong> - Lookup to Contact/Contributor record</li>
              <li><strong>Contributor_Project__c</strong> - Lookup to Contributor_Project__c record</li>
              <li><strong>Payment_Adjustment_Amount__c</strong> - Currency field for adjustment amount</li>
              <li><strong>Adjustment_Notes__c</strong> - Long text area for notes</li>
              <li><strong>Payment_Adjustment_Date__c</strong> - Date field</li>
              <li><strong>Payment_ID__c</strong> - Text field linking to payment transaction</li>
              <li><strong>Status__c</strong> - Picklist field for adjustment status</li>
              <li><strong>CreatedBy</strong> - Standard Salesforce field for record creator</li>
            </ul>
          </li>
          <li><strong>Related Data</strong> - Contributor and Contributor Project names are resolved from lookups</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Use Search for Quick Lookups</strong> - Search by contributor name to quickly find their adjustments</li>
          <li><strong>Apply Filters for Focused Views</strong> - Use filters to focus on specific statuses, date ranges, or amounts</li>
          <li><strong>Customize Columns</strong> - Add only the columns you need to reduce clutter and improve performance</li>
          <li><strong>Export Regularly</strong> - Export data periodically for backup and audit purposes</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on adjustments for your projects</li>
          <li><strong>Scroll Efficiently</strong> - Let infinite scroll load data automatically; no need to click "Load More"</li>
          <li><strong>Refresh After Changes</strong> - Refresh the table after making changes in Salesforce to see updates</li>
          <li><strong>Review Adjustment Notes</strong> - Check adjustment notes to understand the reason for each adjustment</li>
          <li><strong>Monitor Status</strong> - Filter by status to track pending, approved, or rejected adjustments</li>
          <li><strong>Bookmark the Page</strong> - Use the bookmark icon to quickly access this page from your bookmarks</li>
        </ul>
      `
    },
    {
      heading: 'Common Use Cases',
      content: `
        <ul>
          <li><strong>Creating a New Payment Adjustment</strong>:
            <ol>
              <li>Click the "New Payment Adjustment" button in the table header</li>
              <li>Enter a Payment Adjustment Name (required)</li>
              <li>Search and select the Contributor (optional)</li>
              <li>Search and select the Contributor Project (optional)</li>
              <li>Select an Adjustment Type from the dropdown</li>
              <li>Enter the Payment Adjustment Amount</li>
              <li>Add notes explaining the reason for the adjustment</li>
              <li>Set the Status if applicable</li>
              <li>Click "Publish" to create the adjustment in Salesforce</li>
              <li>The new adjustment appears in the table after publishing</li>
            </ol>
          </li>
          <li><strong>Finding Adjustments for a Contributor</strong>:
            <ol>
              <li>Type the contributor's name in the search bar</li>
              <li>Review all adjustments for that contributor</li>
              <li>Use filters to narrow by date or status if needed</li>
            </ol>
          </li>
          <li><strong>Reviewing Recent Adjustments</strong>:
            <ol>
              <li>Click the Filter button</li>
              <li>Add filter for Payment Adjustment Date</li>
              <li>Select a recent date range</li>
              <li>Apply filters to see recent adjustments</li>
            </ol>
          </li>
          <li><strong>Filtering by Multiple Criteria</strong>:
            <ol>
              <li>Click the Filter button</li>
              <li>Add filter for Status (e.g., "In Review")</li>
              <li>Add another filter for Payment Adjustment Amount (e.g., "Greater Than" $100)</li>
              <li>Add filter for Created By if you want to see adjustments created by a specific user</li>
              <li>Apply filters to see adjustments matching all criteria</li>
            </ol>
          </li>
          <li><strong>Exporting for Audit</strong>:
            <ol>
              <li>Apply any necessary filters</li>
              <li>Add any additional columns you need</li>
              <li>Click the Export button</li>
              <li>Open the CSV file in Excel for analysis</li>
            </ol>
          </li>
          <li><strong>Tracking Adjustment Status</strong>:
            <ol>
              <li>Click Filter button</li>
              <li>Add filter for Status field</li>
              <li>Select the status you want to track (e.g., Pending, Approved)</li>
              <li>Apply to see only adjustments with that status</li>
            </ol>
          </li>
          <li><strong>Filtering by Contributor Name</strong>:
            <ol>
              <li>Click the Filter button</li>
              <li>Add filter for Contributor field</li>
              <li>Enter the contributor's name (system will look up the ID automatically)</li>
              <li>Select "Contains" operator for partial name matches</li>
              <li>Apply filter to see all adjustments for that contributor</li>
            </ol>
          </li>
          <li><strong>Filtering by Created By</strong>:
            <ol>
              <li>Click the Filter button</li>
              <li>Add filter for Created By field</li>
              <li>Enter the user's name (system will look up the User ID automatically)</li>
              <li>Apply filter to see adjustments created by that user</li>
            </ol>
          </li>
        </ul>
      `
    }
  ]
};

