const fs = require('fs');
const path = require('path');

const pagesToUpdate = [
  'client/src/pages/ClientToolAccount.js',
  'client/src/pages/ProjectDetail.js',
  'client/src/pages/ProjectObjectiveSetup.js',
  'client/src/pages/ProjectQualificationStepSetup.js',
  'client/src/pages/ProjectConfirmation.js',
  'client/src/pages/ProjectTeamSetup.js',
  'client/src/pages/WorkStreamReporting.js',
  'client/src/pages/CreateWorkStream.js',
  'client/src/pages/ContributorPaymentsDashboard.js',
  'client/src/pages/Dashboard/ProjectPerformance.js',
  'client/src/pages/UpdateObjectFields.js',
  'client/src/pages/MFAVerificationLogs.js',
  'client/src/pages/QueueStatusManagement.js',
  'client/src/pages/ActiveContributorsByQualStep.js',
  'client/src/pages/OnboardingContributors.js',
  'client/src/pages/ContributorTimeStatusDashboard.js',
  'client/src/pages/AdvancedReportBuilder.js',
  'client/src/pages/ActiveContributorsByProject.js',
  'client/src/pages/ProjectPageSetup.js',
  'client/src/pages/ViewProjects.js',
  'client/src/pages/ReportBuilder.js',
  'client/src/pages/Settings.js',
  'client/src/pages/SalesforceSettings.js',
  'client/src/pages/ScheduledReports.js',
  'client/src/pages/QuickSetupWizard.js',
  'client/src/pages/WorkstreamManagement.js'
];

pagesToUpdate.forEach(pagePath => {
  const fullPath = path.join(__dirname, pagePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${pagePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // 1. Add import if not present
  if (!content.includes("import useSidebarWidth")) {
    const sidebarImportMatch = content.match(/import Sidebar from ['"].*['"];?/);
    if (sidebarImportMatch) {
      const importLine = sidebarImportMatch[0];
      // Calculate correct relative path based on file location
      const depth = (pagePath.match(/\//g) || []).length - 2; // Subtract 'client' and 'src'
      const relativePath = depth > 0 ? '../'.repeat(depth) + 'hooks/useSidebarWidth' : '../hooks/useSidebarWidth';
      const newImport = importLine + '\nimport useSidebarWidth from \'' + relativePath + '\';';
      content = content.replace(importLine, newImport);
      modified = true;
    }
  }

  // 2. Add hook usage if not present
  if (!content.includes("const sidebarWidth = useSidebarWidth")) {
    const sidebarOpenMatch = content.match(/const \[sidebarOpen, setSidebarOpen\] = useState\([^)]+\);/);
    if (sidebarOpenMatch) {
      content = content.replace(
        sidebarOpenMatch[0],
        sidebarOpenMatch[0] + '\n  const sidebarWidth = useSidebarWidth(sidebarOpen);'
      );
      modified = true;
    }
  }

  // 3. Update marginLeft styles
  const oldPattern = /marginLeft:\s*sidebarOpen\s*\?\s*['"]320px['"]\s*:\s*['"]80px['"]/g;
  if (oldPattern.test(content)) {
    content = content.replace(
      oldPattern,
      `marginLeft: \`\${sidebarWidth}px\`, width: \`calc(100% - \${sidebarWidth}px)\`, transition: 'margin-left 0.2s ease, width 0.2s ease'`
    );
    modified = true;
  }

  // Also handle variations with calc width
  const calcPattern = /marginLeft:\s*sidebarOpen\s*\?\s*['"]320px['"]\s*:\s*['"]80px['"],\s*transition[^}]*width:\s*sidebarOpen\s*\?\s*['"]calc\(100%\s*-\s*320px\)['"]\s*:\s*['"]calc\(100%\s*-\s*80px\)['"]/g;
  if (calcPattern.test(content)) {
    content = content.replace(
      calcPattern,
      `marginLeft: \`\${sidebarWidth}px\`, width: \`calc(100% - \${sidebarWidth}px)\`, transition: 'margin-left 0.2s ease, width 0.2s ease'`
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${pagePath}`);
  } else {
    console.log(`⏭️  Skipped (already updated or no changes needed): ${pagePath}`);
  }
});

console.log('\n✅ All pages updated!');

