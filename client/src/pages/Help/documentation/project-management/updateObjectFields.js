// Update Object Fields Documentation
export default {
  title: 'Update Object Fields',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Update Object Fields feature allows you to bulk update Salesforce object fields across multiple records efficiently and safely.</p>
        <p><strong>Purpose:</strong> Update multiple records at once without manually editing each one. This is essential for mass updates, data corrections, and batch operations.</p>
        <p><strong>When to use:</strong> Use this page when you need to update the same field value across many records, apply transformations to field values, or update multiple fields at once.</p>
        <p><strong>Safety Features:</strong> The page includes preview functionality, validation, and confirmation steps to prevent accidental mass updates.</p>
      `
    },
    {
      heading: 'Selecting Objects',
      content: `
        <p>The first step is to select which Salesforce object type you want to update:</p>
        <ul>
          <li><strong>Project</strong> - Update Project records</li>
          <li><strong>Project Objective</strong> - Update Project Objective records</li>
          <li><strong>Contributor Project</strong> - Update Contributor Project records</li>
          <li><strong>Other Objects</strong> - Additional Salesforce objects as available</li>
        </ul>
        <p><strong>How to select:</strong> Use the dropdown at the top of the page to choose the object type. Once selected, the page will load available fields and filter options for that object.</p>
      `
    },
    {
      heading: 'Applying Filters',
      content: `
        <p>Filters allow you to select which specific records to update. This is critical for ensuring you only update the intended records.</p>
        <p><strong>Available Filters (varies by object):</strong></p>
        <ul>
          <li><strong>Project Filter</strong> - Filter by specific project(s)
            <ul>
              <li>Searchable dropdown - type to search for projects</li>
              <li>Select one or multiple projects</li>
              <li>Shows matching records count as you filter</li>
            </ul>
          </li>
          <li><strong>Project Objective Filter</strong> - Filter by project objective(s)
            <ul>
              <li>Searchable dropdown</li>
              <li>Only available if project is selected</li>
            </ul>
          </li>
          <li><strong>Status Filter</strong> - Filter by record status (Draft, Open, Closed, etc.)</li>
          <li><strong>Type Filter</strong> - Filter by record type (if applicable)</li>
          <li><strong>Other Object-Specific Filters</strong> - Additional filters based on the selected object</li>
        </ul>
        <p><strong>Matching Records Count:</strong> As you apply filters, the page shows how many records match your criteria. This helps you verify you're targeting the right records before updating.</p>
        <p><strong>Filter Tips:</strong></p>
        <ul>
          <li>Always check the matching records count before proceeding</li>
          <li>Use multiple filters to narrow down to specific records</li>
          <li>Filters are combined with AND logic (all conditions must match)</li>
          <li>Clear filters to see all records</li>
        </ul>
      `
    },
    {
      heading: 'Update Modes',
      content: `
        <p>The page supports different update modes:</p>
        <ul>
          <li><strong>Single Field Update</strong> - Update one field across all matching records
            <ul>
              <li>Select a field from the dropdown</li>
              <li>Enter the new value</li>
              <li>For reference fields, use the search to find the related record</li>
            </ul>
          </li>
          <li><strong>Multiple Fields Update</strong> - Update multiple fields at once
            <ul>
              <li>Add multiple field-value pairs</li>
              <li>Each field can have its own value</li>
              <li>All fields are updated in a single operation</li>
            </ul>
          </li>
          <li><strong>Field Mapping</strong> - Advanced mode for complex updates
            <ul>
              <li>Map source fields to target fields</li>
              <li>Apply transformations to values</li>
              <li>Use formulas and conditional logic</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Field Selection and Values',
      content: `
        <p>After selecting an object and applying filters, you can select fields to update:</p>
        <ul>
          <li><strong>Field Dropdown</strong> - Shows all updateable fields for the selected object
            <ul>
              <li>Fields are loaded automatically when object is selected</li>
              <li>Only fields you have permission to update are shown</li>
              <li>Field type is indicated (text, number, date, picklist, reference, etc.)</li>
            </ul>
          </li>
          <li><strong>Value Input</strong> - Enter the new value based on field type:
            <ul>
              <li><strong>Text Fields</strong> - Type the text value</li>
              <li><strong>Number Fields</strong> - Enter numeric value</li>
              <li><strong>Date Fields</strong> - Use date picker</li>
              <li><strong>Picklist Fields</strong> - Select from dropdown of available values</li>
              <li><strong>Reference Fields</strong> - Use search to find related record
                <ul>
                  <li>Type to search for the related record</li>
                  <li>Select from search results</li>
                  <li>Shows record name and ID</li>
                </ul>
              </li>
              <li><strong>Checkbox Fields</strong> - Check/uncheck the box</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Transformations',
      content: `
        <p>For advanced updates, you can apply transformations to field values:</p>
        <ul>
          <li><strong>Formula</strong> - Calculate values using formulas</li>
          <li><strong>Conditional</strong> - Set values based on conditions (IF/THEN/ELSE)</li>
          <li><strong>Concatenate</strong> - Combine multiple field values</li>
          <li><strong>Value Map</strong> - Map old values to new values</li>
          <li><strong>Date Format</strong> - Format dates in different ways</li>
          <li><strong>Number Format</strong> - Format numbers</li>
          <li><strong>Text Replace</strong> - Find and replace text</li>
          <li><strong>Default Value</strong> - Set default if field is empty</li>
          <li><strong>Type Conversion</strong> - Convert between data types</li>
          <li><strong>Validate Format</strong> - Ensure values match a pattern</li>
          <li><strong>Remove Special Chars</strong> - Clean text values</li>
          <li><strong>Switch Case</strong> - Change text case (upper/lower/title)</li>
        </ul>
        <p><strong>Transformation Templates:</strong> Save and reuse common transformation patterns for efficiency.</p>
      `
    },
    {
      heading: 'Preview Updates',
      content: `
        <p>Before executing updates, always preview the changes:</p>
        <ul>
          <li><strong>Preview Button</strong> - Click to see what will be updated
            <ul>
              <li>Shows sample of records that will be updated</li>
              <li>Displays current value vs. new value</li>
              <li>Shows total count of records to be updated</li>
            </ul>
          </li>
          <li><strong>Preview Modal</strong> - Detailed preview in a modal
            <ul>
              <li>Review each record that will be updated</li>
              <li>Verify the changes are correct</li>
              <li>Check for any unexpected updates</li>
            </ul>
          </li>
          <li><strong>What to Check:</strong>
            <ul>
              <li>Record count matches your expectations</li>
              <li>New values are correct</li>
              <li>No unintended records are included</li>
              <li>Field types and formats are correct</li>
            </ul>
          </li>
        </ul>
        <p><strong>Important:</strong> Always preview before executing, especially for large updates.</p>
      `
    },
    {
      heading: 'Executing Updates',
      content: `
        <p>When you're ready to apply the updates:</p>
        <ol>
          <li>Review your filters and ensure the correct records are selected</li>
          <li>Select the field(s) to update</li>
          <li>Enter the new value(s)</li>
          <li>Click <strong>Preview</strong> to review changes</li>
          <li>Verify the preview looks correct</li>
          <li>Click <strong>Execute Update</strong> or <strong>Send</strong></li>
          <li>Confirm in the confirmation modal</li>
          <li>Review the results</li>
        </ol>
        <p><strong>Batch Processing:</strong> Large updates are processed in batches (default 200 records) to avoid timeouts.</p>
        <p><strong>Error Handling:</strong> If some records fail to update, you'll see which ones failed and why. Successful updates are still applied.</p>
        <p><strong>Confirmation:</strong> A confirmation modal appears before executing to prevent accidental updates.</p>
      `
    },
    {
      heading: 'Undo/Redo',
      content: `
        <p>The page includes undo/redo functionality for transformations:</p>
        <ul>
          <li><strong>Undo</strong> - Revert the last transformation change</li>
          <li><strong>Redo</strong> - Reapply a transformation that was undone</li>
          <li>Useful when building complex field mappings</li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Always Preview First</strong> - Never execute without previewing</li>
          <li><strong>Use Filters Carefully</strong> - Double-check matching records count</li>
          <li><strong>Test on Small Set</strong> - Test your update on a small subset first</li>
          <li><strong>Backup Important Data</strong> - Consider backing up before large updates</li>
          <li><strong>Check Field Types</strong> - Ensure values match field types</li>
          <li><strong>Use Transformations</strong> - Leverage transformations for complex updates</li>
          <li><strong>Save Templates</strong> - Save common transformation patterns</li>
          <li><strong>Review Results</strong> - Always review update results for errors</li>
          <li><strong>Batch Size</strong> - Adjust batch size if you encounter timeout issues</li>
          <li><strong>Reference Fields</strong> - Use search to find correct reference records</li>
        </ul>
      `
    }
  ]
};

