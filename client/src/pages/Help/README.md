# Help Documentation Structure

This directory contains the modular help documentation system for the application. Each page has its own documentation file that can be updated independently.

## Structure

```
Help/
├── Help.js                          # Main Help component
├── components/
│   ├── HelpSidebar.js               # Left navigation panel
│   └── HelpContent.js               # Right content display
└── documentation/
    ├── index.js                     # Aggregates all documentation
    ├── getting-started/
    │   └── gettingStarted.js
    ├── dashboards/
    │   ├── dashboard.js
    │   ├── caseAnalytics.js
    │   ├── contributorPayments.js
    │   └── projectPerformance.js
    ├── projects/
    │   ├── projectSetup.js
    │   ├── projectObjectiveSetup.js
    │   ├── projectQualificationStepSetup.js
    │   ├── projectPageSetup.js
    │   ├── projectTeamSetup.js
    │   ├── quickSetupWizard.js
    │   └── viewProjects.js
    ├── project-management/
    │   ├── queueStatusManagement.js
    │   ├── caseManagement.js
    │   ├── workstreamManagement.js
    │   ├── updateObjectFields.js
    │   ├── pmApprovals.js
    │   ├── clientToolAccount.js
    │   ├── onboardingContributors.js
    │   ├── poPayRates.js
    │   └── poProductivityTargets.js
    ├── reports/
    │   ├── reportBuilder.js
    │   ├── advancedReportBuilder.js
    │   └── scheduledReports.js
    ├── analytics/
    │   ├── contributorTimeStatus.js
    │   ├── projectRosterFunnel.js
    │   ├── activeContributorsByProject.js
    │   ├── activeProjectObjectivesByQualStep.js
    │   └── contributorMatchMatrix.js
    └── administration/
        ├── administration.js
        ├── userManagement.js
        ├── history.js
        ├── clone.js
        └── gpcFiltering.js
```

## Adding/Updating Documentation

Each documentation file exports a default object with this structure:

```javascript
export default {
  title: 'Page Title',
  sections: [
    {
      heading: 'Section Heading',
      content: `
        <p>HTML content here</p>
        <ul>
          <li>List items</li>
        </ul>
      `
    }
  ]
};
```

## Documentation Files Status

### ✅ Completed (with detailed content)
- Getting Started
- Dashboard
- Case Analytics
- Contributor Payments
- Project Performance
- Queue Status Management
- Case Management

### 📝 Created (with basic structure - ready for detailed content)
- All Project Setup pages
- All Project Management pages
- All Reports pages
- All Analytics pages
- All Administration pages

## Next Steps

Each documentation file can now be updated independently. To add detailed content to a page:

1. Open the corresponding `.js` file in the appropriate category folder
2. Add detailed sections explaining:
   - What the page does
   - How to use it
   - Available filters and search options
   - All features and functionality
   - Any special notes or tips
3. Use HTML in the `content` field for formatting
4. The changes will automatically appear in the Help page

## Notes

- All documentation files are imported in `documentation/index.js`
- The Help page automatically includes all documentation from the index
- Search functionality works across all documentation
- Each file is independent and can be updated without affecting others





