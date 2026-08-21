// Contributor Payments Dashboard Documentation
export default {
  title: 'Contributor Payments',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Contributor Payments Dashboard allows you to track and analyze contributor payments, view payment trends, and analyze payment distribution.</p>
        <p><strong>Purpose:</strong> This dashboard helps you monitor payment activity, identify payment patterns, track payment status, and ensure timely payments to contributors.</p>
      `
    },
    {
      heading: 'Key Metrics',
      content: `
        <p>The dashboard displays payment-related metrics:</p>
        <ul>
          <li><strong>Total Payments</strong> - Total amount paid to contributors</li>
          <li><strong>Pending Payments</strong> - Payments awaiting processing or approval</li>
          <li><strong>Payment Count</strong> - Number of payment transactions</li>
          <li><strong>Average Payment Amount</strong> - Average payment per transaction</li>
          <li><strong>Payment Status Distribution</strong> - Breakdown by status (approved, pending, rejected, etc.)</li>
        </ul>
      `
    },
    {
      heading: 'Visualizations',
      content: `
        <p>The dashboard includes various charts:</p>
        <ul>
          <li><strong>Payment Amounts and Frequencies</strong> - Trends in payment amounts over time</li>
          <li><strong>Payment Status Tracking</strong> - Distribution of payments by status</li>
          <li><strong>Payment by Method</strong> - Breakdown by payment method (PayPal, bank transfer, etc.)</li>
          <li><strong>Payment by Country</strong> - Geographic distribution of payments</li>
          <li><strong>Payment History</strong> - Historical payment trends</li>
        </ul>
      `
    },
    {
      heading: 'Filters and Options',
      content: `
        <p>Use filters to customize your view:</p>
        <ul>
          <li><strong>Date Range</strong> - Filter payments by date</li>
          <li><strong>Payment Status</strong> - Filter by approved, pending, rejected, etc.</li>
          <li><strong>Payment Method</strong> - Filter by payment method</li>
          <li><strong>Country</strong> - Filter by contributor country</li>
          <li><strong>Project</strong> - Filter payments related to specific projects</li>
          <li><strong>Contributor</strong> - Filter by specific contributor</li>
          <li><strong>GPC Filter</strong> - Apply personalized content filtering</li>
        </ul>
        <p><strong>Search:</strong> Search for specific payments by transaction ID, contributor name, or project.</p>
        <p><strong>Export:</strong> Export payment data for accounting or reporting purposes.</p>
      `
    },
    {
      heading: 'Approval Workflows',
      content: `
        <p>The dashboard integrates with payment approval workflows:</p>
        <ul>
          <li>View payments requiring approval</li>
          <li>Track approval status and history</li>
          <li>Monitor approval bottlenecks</li>
          <li>Access payment details for review</li>
        </ul>
        <p>Navigate to <strong>PM Approvals</strong> page to review and approve pending payments.</p>
      `
    },
    {
      heading: 'Payment History',
      content: `
        <p>View detailed payment history including:</p>
        <ul>
          <li>Transaction dates and amounts</li>
          <li>Payment methods used</li>
          <li>Status changes over time</li>
          <li>Related project and objective information</li>
          <li>Contributor details</li>
        </ul>
      `
    },
    {
      heading: 'Using the Dashboard',
      content: `
        <p><strong>To view payment analytics:</strong></p>
        <ol>
          <li>Navigate to <strong>Dashboards > Contributor Payments</strong></li>
          <li>Select your desired filters from the filter panel</li>
          <li>Review the metrics and visualizations</li>
          <li>Click on chart elements to drill down into details</li>
          <li>Use the refresh button to update with latest data</li>
        </ol>
        <p><strong>Interpreting Results:</strong> Look for payment trends, identify payment patterns, track approval workflows, and monitor payment status distribution.</p>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all payment data from Salesforce</li>
          <li>Update payment metrics and charts</li>
          <li>Get the latest payment status information</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Monitor Regularly</strong> - Check payment dashboard regularly to track payment activity</li>
          <li><strong>Use Filters</strong> - Use filters to focus on specific time periods, statuses, or projects</li>
          <li><strong>Review Pending Payments</strong> - Regularly review pending payments that need approval</li>
          <li><strong>Track Trends</strong> - Monitor payment trends over time to identify patterns</li>
          <li><strong>Export for Accounting</strong> - Export payment data for accounting and reporting purposes</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Review Approval Workflows</strong> - Check approval workflows to ensure timely payments</li>
        </ul>
      `
    }
  ]
};

