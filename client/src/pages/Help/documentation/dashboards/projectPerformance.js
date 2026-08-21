// Project Performance Dashboard Documentation
export default {
  title: 'Project Performance',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Project Performance Dashboard provides detailed analytics about project execution, including completion rates, timelines, and resource utilization.</p>
        <p><strong>Purpose:</strong> This dashboard helps you monitor project health, identify at-risk projects, track progress against milestones, and optimize resource allocation.</p>
      `
    },
    {
      heading: 'Key Metrics',
      content: `
        <p>The dashboard displays project performance metrics:</p>
        <ul>
          <li><strong>Project Completion Rate</strong> - Percentage of projects completed on time</li>
          <li><strong>Active Projects</strong> - Number of currently active projects</li>
          <li><strong>At-Risk Projects</strong> - Projects that may miss deadlines</li>
          <li><strong>Resource Utilization</strong> - How efficiently resources are being used</li>
          <li><strong>Budget vs. Actuals</strong> - Financial performance tracking</li>
        </ul>
      `
    },
    {
      heading: 'Visualizations',
      content: `
        <p>The dashboard includes various performance visualizations:</p>
        <ul>
          <li><strong>Timeline Tracking</strong> - Gantt-style views of project timelines</li>
          <li><strong>Milestone Progress</strong> - Progress toward key milestones</li>
          <li><strong>Completion Rates</strong> - Charts showing completion percentages</li>
          <li><strong>Resource Utilization</strong> - Charts showing resource allocation and usage</li>
          <li><strong>Performance Trends</strong> - Trends over time</li>
        </ul>
      `
    },
    {
      heading: 'Filters and Options',
      content: `
        <p>Customize your view with filters:</p>
        <ul>
          <li><strong>Date Range</strong> - Filter by project dates or milestones</li>
          <li><strong>Project Status</strong> - Filter by active, completed, on-hold, etc.</li>
          <li><strong>Project Type</strong> - Filter by project type or category</li>
          <li><strong>Priority</strong> - Filter by project priority</li>
          <li><strong>Team Member</strong> - Filter projects by assigned team members</li>
          <li><strong>GPC Filter</strong> - Apply personalized content filtering</li>
        </ul>
        <p><strong>Search:</strong> Search for specific projects by name, ID, or description.</p>
      `
    },
    {
      heading: 'Project Details',
      content: `
        <p>Click on any project to view detailed information:</p>
        <ul>
          <li>Project configuration and settings</li>
          <li>Related objectives and milestones</li>
          <li>Team member assignments</li>
          <li>Status and timeline information</li>
          <li>Performance metrics specific to that project</li>
        </ul>
      `
    },
    {
      heading: 'Using the Dashboard',
      content: `
        <p><strong>To view project performance:</strong></p>
        <ol>
          <li>Navigate to <strong>Dashboards > Project Performance</strong></li>
          <li>Select your desired filters from the filter panel</li>
          <li>Review the metrics and visualizations</li>
          <li>Click on projects or chart elements to drill down into details</li>
          <li>Use the refresh button to update with latest data</li>
        </ol>
        <p><strong>Interpreting Results:</strong> Look for at-risk projects, track completion rates, monitor resource utilization, and identify projects that need attention.</p>
      `
    },
    {
      heading: 'Refresh Data',
      content: `
        <p>Use the refresh button to:</p>
        <ul>
          <li>Reload all project data from Salesforce</li>
          <li>Update performance metrics and charts</li>
          <li>Get the latest project status information</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Monitor At-Risk Projects</strong> - Regularly check for projects that may miss deadlines</li>
          <li><strong>Track Completion Rates</strong> - Monitor completion rates to ensure projects stay on track</li>
          <li><strong>Review Resource Utilization</strong> - Check resource allocation to optimize efficiency</li>
          <li><strong>Use Filters</strong> - Use filters to focus on specific project types, statuses, or time periods</li>
          <li><strong>Export for Analysis</strong> - Export data for detailed performance analysis</li>
          <li><strong>Use GPC Filter</strong> - Enable GPC filter to focus on your projects</li>
          <li><strong>Review Milestones</strong> - Regularly review milestone progress</li>
        </ul>
      `
    }
  ]
};

