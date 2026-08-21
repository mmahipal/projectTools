// Scheduled Reports Documentation
export default {
  title: 'Scheduled Reports',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Scheduled Reports page allows you to schedule reports to run automatically and be delivered via email to specified recipients.</p>
        <p><strong>Purpose:</strong> Automate report generation and distribution to keep stakeholders informed without manual intervention. This ensures timely delivery of important information.</p>
        <p><strong>When to use:</strong> Use this page when you need to set up recurring reports that should be delivered automatically on a schedule, such as daily status reports, weekly summaries, or monthly analytics.</p>
        <p><strong>Default View:</strong> The page displays a list of all scheduled reports with their schedule information and status.</p>
      `
    },
    {
      heading: 'Scheduled Reports List',
      content: `
        <p>The main table displays all scheduled reports:</p>
        <ul>
          <li><strong>Report Name</strong> - Name of the scheduled report</li>
          <li><strong>Schedule</strong> - Frequency and timing (daily, weekly, monthly, etc.)</li>
          <li><strong>Recipients</strong> - Email addresses that receive the report</li>
          <li><strong>Format</strong> - Report format (Excel, CSV, PDF, etc.)</li>
          <li><strong>Status</strong> - Active, Paused, or Error status</li>
          <li><strong>Last Run</strong> - When the report was last executed</li>
          <li><strong>Next Run</strong> - When the report will run next</li>
          <li><strong>Actions</strong> - Edit, delete, run now, pause/resume</li>
        </ul>
      `
    },
    {
      heading: 'Creating a Scheduled Report',
      content: `
        <p>To create a new scheduled report:</p>
        <ol>
          <li>Click the <strong>Schedule Report</strong> or <strong>Create Schedule</strong> button</li>
          <li>Choose to schedule an existing saved report or create a new one:
            <ul>
              <li><strong>Schedule Existing Report</strong> - Select from your saved reports</li>
              <li><strong>Create New Report</strong> - Build a new report and schedule it</li>
            </ul>
          </li>
          <li>Configure the report (if creating new):
            <ul>
              <li>Select object type</li>
              <li>Choose fields</li>
              <li>Apply filters</li>
              <li>Configure grouping and sorting</li>
            </ul>
          </li>
          <li>Set the schedule:
            <ul>
              <li>Select frequency (daily, weekly, monthly, custom)</li>
              <li>Choose time and timezone</li>
              <li>Configure specific days (for weekly/monthly)</li>
            </ul>
          </li>
          <li>Configure delivery:
            <ul>
              <li>Add recipient email addresses</li>
              <li>Choose report format</li>
              <li>Add email subject and message (optional)</li>
            </ul>
          </li>
          <li>Save the scheduled report</li>
        </ol>
      `
    },
    {
      heading: 'Schedule Options',
      content: `
        <p>Available schedule frequencies:</p>
        <ul>
          <li><strong>Daily</strong>:
            <ul>
              <li>Runs every day at a specified time</li>
              <li>Choose the time (e.g., 9:00 AM)</li>
              <li>Select timezone</li>
            </ul>
          </li>
          <li><strong>Weekly</strong>:
            <ul>
              <li>Runs on specific days of the week</li>
              <li>Select which days (Monday, Tuesday, etc.)</li>
              <li>Choose the time</li>
            </ul>
          </li>
          <li><strong>Monthly</strong>:
            <ul>
              <li>Runs on a specific day of the month</li>
              <li>Select the day (1-31)</li>
              <li>Choose the time</li>
            </ul>
          </li>
          <li><strong>Custom</strong>:
            <ul>
              <li>Define custom schedule patterns</li>
              <li>More flexible scheduling options</li>
            </ul>
          </li>
        </ul>
        <p><strong>Time Configuration:</strong> Set the time when reports should run and the timezone to ensure reports are delivered at the right time for recipients.</p>
      `
    },
    {
      heading: 'Recipients Configuration',
      content: `
        <p>Configure who receives the scheduled reports:</p>
        <ul>
          <li><strong>Add Recipients</strong>:
            <ul>
              <li>Enter email addresses</li>
              <li>Add multiple recipients (comma-separated or one per line)</li>
              <li>Recipients can be internal or external</li>
            </ul>
          </li>
          <li><strong>Email Settings</strong>:
            <ul>
              <li>Customize email subject line</li>
              <li>Add email message/body</li>
              <li>Report is attached to the email</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Report Formats',
      content: `
        <p>Choose the format for scheduled reports:</p>
        <ul>
          <li><strong>Excel (.xlsx)</strong>:
            <ul>
              <li>Preserves formatting</li>
              <li>Includes charts if applicable</li>
              <li>Best for detailed analysis</li>
            </ul>
          </li>
          <li><strong>CSV (.csv)</strong>:
            <ul>
              <li>Simple text format</li>
              <li>Compatible with most tools</li>
              <li>Easy to import elsewhere</li>
            </ul>
          </li>
          <li><strong>PDF</strong> (if available):
            <ul>
              <li>Formatted document</li>
              <li>Good for sharing</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Managing Scheduled Reports',
      content: `
        <p>You can manage scheduled reports in several ways:</p>
        <ul>
          <li><strong>Edit Schedule</strong>:
            <ul>
              <li>Click Edit on a scheduled report</li>
              <li>Modify schedule, recipients, or report configuration</li>
              <li>Save changes</li>
            </ul>
          </li>
          <li><strong>Run Now</strong>:
            <ul>
              <li>Click "Run Now" to execute immediately</li>
              <li>Useful for testing or one-time delivery</li>
              <li>Doesn't affect the regular schedule</li>
            </ul>
          </li>
          <li><strong>Pause/Resume</strong>:
            <ul>
              <li>Pause a schedule to temporarily stop it</li>
              <li>Resume to restart paused schedules</li>
              <li>Useful for temporary holds</li>
            </ul>
          </li>
          <li><strong>Delete</strong>:
            <ul>
              <li>Remove scheduled reports you no longer need</li>
              <li>Confirmation required before deletion</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Report Status',
      content: `
        <p>Each scheduled report has a status:</p>
        <ul>
          <li><strong>Active</strong> - Report is scheduled and will run automatically
            <ul>
              <li>Shows next run time</li>
              <li>Report will execute on schedule</li>
            </ul>
          </li>
          <li><strong>Paused</strong> - Schedule is temporarily stopped
            <ul>
              <li>Report will not run until resumed</li>
              <li>Can be resumed at any time</li>
            </ul>
          </li>
          <li><strong>Error</strong> - Last run failed
            <ul>
              <li>Shows error message</li>
              <li>Review and fix the issue</li>
              <li>Report will retry on next schedule</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Scheduling Existing Reports',
      content: `
        <p>You can schedule reports you've already created:</p>
        <ol>
          <li>Click "Schedule Report"</li>
          <li>Select "Schedule Existing Report"</li>
          <li>Choose a saved report from the list</li>
          <li>Configure the schedule (frequency, time, etc.)</li>
          <li>Add recipients</li>
          <li>Choose format</li>
          <li>Save the schedule</li>
        </ol>
        <p><strong>Note:</strong> The report configuration is preserved. You're only setting up when and how it should be delivered.</p>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Test First</strong> - Use "Run Now" to test reports before scheduling</li>
          <li><strong>Choose Appropriate Frequency</strong> - Don't over-schedule; daily may be too frequent for some reports</li>
          <li><strong>Set Right Time</strong> - Schedule reports for times when recipients are available</li>
          <li><strong>Use Timezones</strong> - Set timezone correctly for recipient locations</li>
          <li><strong>Review Recipients</strong> - Keep recipient lists up to date</li>
          <li><strong>Monitor Status</strong> - Check report status regularly for errors</li>
          <li><strong>Pause When Needed</strong> - Pause schedules during maintenance or holidays</li>
          <li><strong>Document Schedules</strong> - Keep notes on why reports are scheduled</li>
          <li><strong>Optimize Reports</strong> - Ensure scheduled reports are optimized for performance</li>
          <li><strong>Clean Up</strong> - Delete schedules for reports that are no longer needed</li>
        </ul>
      `
    }
  ]
};

