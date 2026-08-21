#!/bin/bash
# Script to update all pages to use responsive sidebar width
# This script finds and updates pages that use hardcoded sidebar widths

echo "Updating pages to use responsive sidebar width..."

# List of pages to update (most commonly used)
PAGES=(
  "client/src/pages/ClientToolAccount.js"
  "client/src/pages/ProjectDetail.js"
  "client/src/pages/ProjectObjectiveSetup.js"
  "client/src/pages/ProjectQualificationStepSetup.js"
  "client/src/pages/ProjectConfirmation.js"
  "client/src/pages/ProjectTeamSetup.js"
  "client/src/pages/WorkStreamReporting.js"
  "client/src/pages/CreateWorkStream.js"
  "client/src/pages/ContributorPaymentsDashboard.js"
  "client/src/pages/CaseManagement.js"
  "client/src/pages/Settings.js"
  "client/src/pages/SalesforceSettings.js"
  "client/src/pages/ViewProjects.js"
)

for page in "${PAGES[@]}"; do
  if [ -f "$page" ]; then
    echo "Processing $page..."
    # Add import if not present
    if ! grep -q "useSidebarWidth" "$page"; then
      # Find the import line for Sidebar and add useSidebarWidth after it
      sed -i.bak "s|import Sidebar from|import Sidebar from|" "$page"
      sed -i.bak "/import Sidebar from/a\\
import useSidebarWidth from '../hooks/useSidebarWidth';
" "$page"
    fi
    
    # Add hook usage if not present
    if ! grep -q "const sidebarWidth = useSidebarWidth" "$page"; then
      sed -i.bak "/const \[sidebarOpen, setSidebarOpen\]/a\\
  const sidebarWidth = useSidebarWidth(sidebarOpen);
" "$page"
    fi
    
    # Update marginLeft style
    sed -i.bak "s|marginLeft: sidebarOpen ? '320px' : '80px'|marginLeft: \`\${sidebarWidth}px\`, width: \`calc(100% - \${sidebarWidth}px)\`, transition: 'margin-left 0.2s ease, width 0.2s ease'|g" "$page"
    
    echo "✅ Updated $page"
  else
    echo "⚠️  File not found: $page"
  fi
done

echo "Done! Please review the changes and test."


