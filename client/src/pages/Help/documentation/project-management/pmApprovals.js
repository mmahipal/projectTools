// PM Approvals Documentation
export default {
  title: 'PM Approvals',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The PM Approvals page allows Project Managers to review and approve payment transactions and time entries submitted by contributors.</p>
        <p><strong>Purpose:</strong> Ensure accuracy and compliance before processing payments. This page centralizes all pending approvals in one place for efficient review and processing.</p>
        <p><strong>When to use:</strong> Use this page daily to review and approve contributor payment transactions. This is a critical step in the payment workflow.</p>
        <p><strong>Default View:</strong> The page loads showing all pending transactions that require approval, sorted by transaction date (newest first).</p>
      `
    },
    {
      heading: 'Page Layout',
      content: `
        <p>The page is organized into several sections:</p>
        <ul>
          <li><strong>Left Panel (Collapsible)</strong> - Contains filters and metrics
            <ul>
              <li>Field-based filters</li>
              <li>Records count</li>
              <li>Deadlines panel</li>
              <li>Can be collapsed to maximize table space</li>
            </ul>
          </li>
          <li><strong>Top Metrics Row</strong> - Key statistics at a glance:
            <ul>
              <li>Total pending transactions</li>
              <li>Unique records count</li>
              <li>Duplicate records count</li>
              <li>Total pending hours/units</li>
              <li>Total pending amount</li>
            </ul>
          </li>
          <li><strong>Main Table</strong> - Lists all transactions requiring approval
            <ul>
              <li>Sortable columns</li>
              <li>Selectable rows for bulk actions</li>
              <li>Pagination for large datasets</li>
            </ul>
          </li>
          <li><strong>Action Buttons</strong> - Approve, Reject, Email actions</li>
        </ul>
      `
    },
    {
      heading: 'Filters',
      content: `
        <p>The page includes comprehensive filtering options in the left panel:</p>
        <ul>
          <li><strong>Field-Based Filter</strong> - Filter by any table column:
            <ul>
              <li>Select a field (Transaction ID, Contributor, Email, Project, etc.)</li>
              <li>Select or enter a value</li>
              <li>Click Apply Filter</li>
              <li>Add multiple filters for precise filtering</li>
              <li>Clear individual filters or all filters</li>
            </ul>
          </li>
          <li><strong>Filterable Fields:</strong>
            <ul>
              <li>Transaction ID</li>
              <li>Contributor Name</li>
              <li>Email</li>
              <li>Project Name</li>
              <li>Project Objective Name</li>
              <li>Account Name</li>
              <li>Status</li>
            </ul>
          </li>
          <li><strong>GPC Filter</strong> - Apply your personalized content filtering preferences
            <ul>
              <li>Toggle on/off using the GPC Filter button</li>
              <li>When enabled, shows only transactions for your selected accounts/projects</li>
              <li>Works in combination with other filters</li>
            </ul>
          </li>
        </ul>
        <p><strong>Filter Tips:</strong></p>
        <ul>
          <li>Use filters to focus on specific contributors, projects, or time periods</li>
          <li>Combine multiple filters for precise results</li>
          <li>Check the records count to verify your filters are working</li>
          <li>Clear filters to see all pending transactions</li>
        </ul>
      `
    },
    {
      heading: 'Sorting',
      content: `
        <p>The table supports sorting by clicking column headers:</p>
        <ul>
          <li><strong>Sortable Columns:</strong>
            <ul>
              <li>Transaction ID</li>
              <li>Contributor Name</li>
              <li>Email</li>
              <li>Project Name</li>
              <li>Project Objective Name</li>
              <li>Account Name</li>
              <li>Transaction Date</li>
              <li>Status</li>
            </ul>
          </li>
          <li><strong>How to Sort:</strong>
            <ul>
              <li>Click a column header to sort ascending</li>
              <li>Click again to sort descending</li>
              <li>Current sort column is highlighted</li>
              <li>Default sort is by Transaction Date (newest first)</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Transaction Details',
      content: `
        <p>Each transaction row displays comprehensive information:</p>
        <ul>
          <li><strong>Transaction ID</strong> - Unique identifier for the transaction</li>
          <li><strong>Contributor Information</strong> - Name and email</li>
          <li><strong>Project Details</strong> - Project name, objective name, account</li>
          <li><strong>Time/Units</strong> - Self-reported vs. system-tracked:
            <ul>
              <li>Self-Reported Hours/Units - What the contributor reported</li>
              <li>System-Tracked Hours/Units - What the system recorded</li>
              <li>Comparison helps identify discrepancies</li>
            </ul>
          </li>
          <li><strong>Payment Information</strong> - Payment amount and rate</li>
          <li><strong>Transaction Date</strong> - When the transaction was created</li>
          <li><strong>Status</strong> - Current approval status</li>
          <li><strong>Week Ending Date</strong> - The week this transaction covers</li>
        </ul>
      `
    },
    {
      heading: 'Approval Actions',
      content: `
        <p>You can approve or reject transactions in several ways:</p>
        <ul>
          <li><strong>Individual Approval</strong>:
            <ul>
              <li>Click the <strong>Approve</strong> button in the action column</li>
              <li>Review transaction details in the approval modal</li>
              <li>Add optional notes</li>
              <li>Confirm approval</li>
            </ul>
          </li>
          <li><strong>Bulk Approval</strong>:
            <ul>
              <li>Select multiple transactions using checkboxes</li>
              <li>Click the <strong>Approve Selected</strong> button</li>
              <li>Review the list of transactions to be approved</li>
              <li>Confirm bulk approval</li>
            </ul>
          </li>
          <li><strong>Reject Transaction</strong>:
            <ul>
              <li>Click the <strong>Reject</strong> button</li>
              <li>Enter rejection reason (required)</li>
              <li>Optionally send email notification to contributor</li>
              <li>Confirm rejection</li>
            </ul>
          </li>
          <li><strong>Email Contributor</strong>:
            <ul>
              <li>Send email directly from the page</li>
              <li>Useful for requesting clarification</li>
              <li>Email modal includes transaction details</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Selecting Transactions',
      content: `
        <p>To select transactions for bulk actions:</p>
        <ul>
          <li><strong>Individual Selection</strong> - Click the checkbox in the first column</li>
          <li><strong>Select All</strong> - Use the checkbox in the table header to select all visible transactions</li>
          <li><strong>Selection Count</strong> - The number of selected transactions is shown</li>
          <li><strong>Clear Selection</strong> - Click "Clear Selection" to deselect all</li>
        </ul>
        <p><strong>Note:</strong> Selection works with current filters and sorting. Only visible transactions can be selected.</p>
      `
    },
    {
      heading: 'Deadlines Panel',
      content: `
        <p>The left panel includes a Deadlines section showing:</p>
        <ul>
          <li>Upcoming payment deadlines</li>
          <li>Transactions approaching deadlines</li>
          <li>Overdue approvals</li>
        </ul>
        <p>This helps you prioritize which transactions to review first.</p>
      `
    },
    {
      heading: 'Records Count',
      content: `
        <p>The left panel shows:</p>
        <ul>
          <li><strong>Total Records</strong> - Total number of transactions loaded</li>
          <li><strong>Unique Records</strong> - Number of unique transactions (duplicates excluded)</li>
          <li><strong>Duplicates</strong> - Number of duplicate transactions found</li>
        </ul>
        <p><strong>Note:</strong> The system automatically filters out duplicate transactions to prevent double payments.</p>
      `
    },
    {
      heading: 'Pagination',
      content: `
        <p>For large datasets, the table uses pagination:</p>
        <ul>
          <li><strong>Load More</strong> - Click to load additional records</li>
          <li><strong>Infinite Scroll</strong> - Automatically loads more as you scroll</li>
          <li><strong>Total Count</strong> - Shows total records available</li>
        </ul>
        <p>This ensures the page remains responsive even with thousands of transactions.</p>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all transactions from Salesforce</li>
          <li>Get the latest pending approvals</li>
          <li>Update metrics and counts</li>
        </ul>
        <p><strong>When to refresh:</strong> After approving/rejecting transactions, or if you suspect new transactions have been added.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Review Daily</strong> - Check for new approvals daily to avoid backlogs</li>
          <li><strong>Use Filters</strong> - Filter by project or contributor to focus your review</li>
          <li><strong>Check Discrepancies</strong> - Pay attention to differences between self-reported and system-tracked hours</li>
          <li><strong>Bulk Approve When Safe</strong> - Use bulk approval for straightforward transactions</li>
          <li><strong>Add Notes</strong> - Add notes when approving to document your decision</li>
          <li><strong>Reject with Reason</strong> - Always provide clear rejection reasons</li>
          <li><strong>Watch Deadlines</strong> - Check the deadlines panel regularly</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Sort by Date</strong> - Sort by transaction date to process oldest first</li>
          <li><strong>Verify Before Bulk Approve</strong> - Double-check selected transactions before bulk approval</li>
        </ul>
      `
    }
  ]
};

