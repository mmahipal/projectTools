// Advanced Report Builder Documentation
export default {
  title: 'Advanced Report Builder',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Advanced Report Builder provides enhanced capabilities for creating complex reports with multiple relationships, advanced filtering, custom calculations, and sophisticated data visualization.</p>
        <p><strong>Purpose:</strong> Create sophisticated reports that combine data from multiple Salesforce objects, apply complex business logic, and generate insights that aren't possible with the basic Report Builder.</p>
        <p><strong>When to use:</strong> Use the Advanced Report Builder when you need to create reports with multiple object relationships, complex calculations, advanced grouping, or custom visualizations.</p>
        <p><strong>Default View:</strong> The page has two tabs: Builder (for creating reports) and Reports (for managing saved reports).</p>
      `
    },
    {
      heading: 'Page Tabs',
      content: `
        <p>The page has two main tabs:</p>
        <ul>
          <li><strong>Builder Tab</strong> - Create and design reports
            <ul>
              <li>Visual report builder canvas</li>
              <li>Drag-and-drop interface</li>
              <li>Object and field selection</li>
              <li>Relationship configuration</li>
              <li>Filter and calculation setup</li>
            </ul>
          </li>
          <li><strong>Reports Tab</strong> - Manage saved reports
            <ul>
              <li>List of all saved advanced reports</li>
              <li>Edit, delete, or run saved reports</li>
              <li>Duplicate reports</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Builder Canvas',
      content: `
        <p>The Builder tab provides a visual canvas for designing reports:</p>
        <ul>
          <li><strong>Visual Interface</strong>:
            <ul>
              <li>Drag-and-drop objects onto the canvas</li>
              <li>Connect related objects with relationships</li>
              <li>Select fields from each object</li>
              <li>Configure filters and calculations</li>
            </ul>
          </li>
          <li><strong>Object Selection</strong>:
            <ul>
              <li>Add multiple objects to your report</li>
              <li>Objects appear as boxes on the canvas</li>
              <li>Select which objects to include</li>
            </ul>
          </li>
          <li><strong>Relationship Configuration</strong>:
            <ul>
              <li>Connect objects using their relationships</li>
              <li>Define join types (inner, left, right)</li>
              <li>Configure relationship filters</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Advanced Features',
      content: `
        <p>Key advanced features include:</p>
        <ul>
          <li><strong>Multiple Object Relationships</strong>:
            <ul>
              <li>Join data from multiple Salesforce objects</li>
              <li>Follow relationship paths (e.g., Project → Objective → Contributor Project)</li>
              <li>Configure join types and conditions</li>
            </ul>
          </li>
          <li><strong>Complex Filtering</strong>:
            <ul>
              <li>AND/OR logic combinations</li>
              <li>Nested filter groups</li>
              <li>Filters across multiple objects</li>
              <li>Date range filters</li>
              <li>Custom filter expressions</li>
            </ul>
          </li>
          <li><strong>Grouping and Aggregation</strong>:
            <ul>
              <li>Group by multiple fields</li>
              <li>Nested grouping</li>
              <li>Aggregate functions (SUM, AVG, COUNT, etc.)</li>
              <li>Group totals and subtotals</li>
            </ul>
          </li>
          <li><strong>Custom Calculations</strong>:
            <ul>
              <li>Create calculated fields</li>
              <li>Use formulas and expressions</li>
              <li>Reference other fields in calculations</li>
              <li>Apply business logic</li>
            </ul>
          </li>
          <li><strong>Export Capabilities</strong>:
            <ul>
              <li>Export to Excel with formatting</li>
              <li>Export to CSV</li>
              <li>Export with charts and visualizations</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Building a Report',
      content: `
        <p>To create an advanced report:</p>
        <ol>
          <li>Navigate to <strong>Reporting > Advanced Builder</strong></li>
          <li>Click the <strong>Builder</strong> tab</li>
          <li>Add objects to the canvas:
            <ul>
              <li>Select objects from the object picker</li>
              <li>Drag objects onto the canvas</li>
              <li>Objects appear as boxes</li>
            </ul>
          </li>
          <li>Configure relationships:
            <ul>
              <li>Connect related objects</li>
              <li>Define join types</li>
              <li>Set relationship conditions</li>
            </ul>
          </li>
          <li>Select fields:
            <ul>
              <li>Choose fields from each object</li>
              <li>Add calculated fields if needed</li>
            </ul>
          </li>
          <li>Apply filters:
            <ul>
              <li>Add filter conditions</li>
              <li>Combine with AND/OR logic</li>
              <li>Group filters as needed</li>
            </ul>
          </li>
          <li>Configure grouping and sorting</li>
          <li>Preview the report</li>
          <li>Save the report</li>
        </ol>
      `
    },
    {
      heading: 'Saving Reports',
      content: `
        <p>Save your advanced reports for future use:</p>
        <ul>
          <li><strong>Save Button</strong> - Click to save the current report
            <ul>
              <li>Enter a report name</li>
              <li>Add description (optional)</li>
              <li>Report configuration is saved</li>
            </ul>
          </li>
          <li><strong>Saved Reports</strong>:
            <ul>
              <li>Access from the Reports tab</li>
              <li>Edit saved reports</li>
              <li>Run saved reports</li>
              <li>Delete reports you no longer need</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Managing Saved Reports',
      content: `
        <p>In the Reports tab, you can:</p>
        <ul>
          <li><strong>View All Reports</strong> - See all your saved advanced reports</li>
          <li><strong>Edit Report</strong> - Open a saved report in the builder to modify it</li>
          <li><strong>Run Report</strong> - Execute a saved report to generate results</li>
          <li><strong>Delete Report</strong> - Remove reports you no longer need</li>
          <li><strong>Duplicate Report</strong> - Create a copy of an existing report</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Start Simple</strong> - Begin with a few objects and add complexity gradually</li>
          <li><strong>Understand Relationships</strong> - Know how objects relate before building complex reports</li>
          <li><strong>Test Filters</strong> - Test filters on small datasets before running on large data</li>
          <li><strong>Use Grouping</strong> - Group data for summary views and totals</li>
          <li><strong>Save Frequently</strong> - Save your work as you build to avoid losing progress</li>
          <li><strong>Optimize Performance</strong> - Use specific filters to reduce data volume</li>
          <li><strong>Document Calculations</strong> - Add descriptions to calculated fields for clarity</li>
          <li><strong>Review Before Saving</strong> - Preview reports before saving to ensure they're correct</li>
        </ul>
      `
    }
  ]
};

