// Clone Documentation
export default {
  title: 'Clone Projects',
  sections: [
    {
      heading: 'Overview',
      content: `
        <p>The Clone page allows you to clone existing projects or other Salesforce objects to create new ones based on existing configurations. This saves time by copying settings, fields, and relationships from existing objects.</p>
        <p><strong>Purpose:</strong> Quickly create new objects by copying settings from existing ones. This is especially useful when creating similar projects, objectives, or other objects that share many common settings.</p>
        <p><strong>When to use:</strong> Use this page when you need to create a new object that is similar to an existing one. Instead of manually entering all the same information, you can clone the existing object and modify only what's different.</p>
        <p><strong>Default View:</strong> The page starts with a step-by-step wizard: first select the object type, then search for the object to clone, and finally edit the cloned data before publishing.</p>
      `
    },
    {
      heading: 'Cloning Process',
      content: `
        <p>The cloning process consists of three main steps:</p>
        <ol>
          <li><strong>Select Object Type</strong> - Choose what type of object to clone
            <ul>
              <li>Project</li>
              <li>Project Objective</li>
              <li>Other object types as available</li>
            </ul>
          </li>
          <li><strong>Search and Select</strong> - Find the object you want to clone
            <ul>
              <li>Search for the object by name</li>
              <li>Select from search results</li>
              <li>Load the object data</li>
            </ul>
          </li>
          <li><strong>Edit and Publish</strong> - Modify the cloned data and create the new object
            <ul>
              <li>Review all fields</li>
              <li>Modify what needs to be different</li>
              <li>Publish to create the new object</li>
            </ul>
          </li>
        </ol>
      `
    },
    {
      heading: 'Step 1: Select Object Type',
      content: `
        <p>First, choose what type of object you want to clone:</p>
        <ul>
          <li><strong>Available Object Types</strong>:
            <ul>
              <li>Project - Clone a project with all its settings</li>
              <li>Project Objective - Clone a project objective</li>
              <li>Other types as configured in your system</li>
            </ul>
          </li>
          <li><strong>Selection</strong>:
            <ul>
              <li>Click on the object type you want to clone</li>
              <li>The page will advance to the search step</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Step 2: Search and Select Object',
      content: `
        <p>After selecting the object type, search for the object to clone:</p>
        <ul>
          <li><strong>Search Bar</strong>:
            <ul>
              <li>Type the name of the object you want to clone</li>
              <li>Search is debounced (waits after you stop typing)</li>
              <li>Results appear as you type</li>
            </ul>
          </li>
          <li><strong>Search Results</strong>:
            <ul>
              <li>List of matching objects</li>
              <li>Shows object name and key details</li>
              <li>Click to select an object</li>
            </ul>
          </li>
          <li><strong>Selecting an Object</strong>:
            <ul>
              <li>Click on the object you want to clone</li>
              <li>The object data will be loaded</li>
              <li>Page advances to the edit step</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Step 3: Edit Cloned Data',
      content: `
        <p>After selecting an object, you'll see a form with all the object's data pre-filled:</p>
        <ul>
          <li><strong>Form Sections</strong>:
            <ul>
              <li>All sections from the original object</li>
              <li>Fields are pre-populated with original values</li>
              <li>Same structure as creating a new object</li>
            </ul>
          </li>
          <li><strong>Editing Fields</strong>:
            <ul>
              <li>Modify any fields that should be different</li>
              <li>Required fields must be filled</li>
              <li>Some fields may need to be changed (e.g., project name)</li>
            </ul>
          </li>
          <li><strong>Review All Sections</strong>:
            <ul>
              <li>Go through each section</li>
              <li>Update what needs to change</li>
              <li>Keep what should remain the same</li>
            </ul>
          </li>
        </ul>
        <p><strong>Note:</strong> For projects, you'll see all the same sections as in Project Setup (Information, People, Project Team, Rates, etc.).</p>
      `
    },
    {
      heading: 'What Gets Cloned',
      content: `
        <p>When cloning, the following are typically copied:</p>
        <ul>
          <li><strong>Field Values</strong> - All field values from the original object</li>
          <li><strong>Relationships</strong> - Links to related objects (may need review)</li>
          <li><strong>Settings</strong> - Configuration settings</li>
          <li><strong>Team Members</strong> - Project team assignments (for projects)</li>
          <li><strong>Rates</strong> - Payment rate configurations</li>
          <li><strong>Other Configurations</strong> - Other settings and configurations</li>
        </ul>
        <p><strong>What to Change:</strong> Typically, you'll want to change:
          <ul>
            <li>Object name (e.g., project name)</li>
            <li>Dates (if time-sensitive)</li>
            <li>Some relationships (if project-specific)</li>
            <li>Status (usually set to Draft)</li>
          </ul>
        </p>
      `
    },
    {
      heading: 'Saving and Publishing',
      content: `
        <p>After editing the cloned data:</p>
        <ul>
          <li><strong>Save Draft</strong>:
            <ul>
              <li>Click "Save Draft" to save your progress</li>
              <li>You can return later to continue editing</li>
              <li>Draft is saved locally</li>
            </ul>
          </li>
          <li><strong>Preview</strong>:
            <ul>
              <li>Use Preview to see how the object will look</li>
              <li>Review before publishing</li>
            </ul>
          </li>
          <li><strong>Publish</strong>:
            <ul>
              <li>Click "Publish" to create the new object in Salesforce</li>
              <li>Review publish results</li>
              <li>New object is created with the cloned data</li>
            </ul>
          </li>
        </ul>
      `
    },
    {
      heading: 'Tips and Best Practices',
      content: `
        <ul>
          <li><strong>Choose Similar Objects</strong> - Clone objects that are similar to what you need</li>
          <li><strong>Review All Sections</strong> - Don't skip sections; review everything</li>
          <li><strong>Change Required Fields</strong> - Update names and other required unique fields</li>
          <li><strong>Update Dates</strong> - Change dates to appropriate values for the new object</li>
          <li><strong>Review Relationships</strong> - Check that relationships are appropriate</li>
          <li><strong>Save Draft Frequently</strong> - Save your work as you edit</li>
          <li><strong>Preview Before Publishing</strong> - Use Preview to catch errors</li>
          <li><strong>Verify After Publishing</strong> - Check the new object in Salesforce after publishing</li>
        </ul>
      `
    }
  ]
};

