// Documentation index - aggregates all page documentation
// All documentation files are now modular and can be updated independently
// Version: 2.1 - 36 documentation pages completed with detailed content (added Payment Adjustments)
// Updated: 2024-12-08
import gettingStarted from './getting-started/gettingStarted';
import dashboard from './dashboards/dashboard';
import caseAnalytics from './dashboards/caseAnalytics';
import contributorPayments from './dashboards/contributorPayments';
import projectPerformance from './dashboards/projectPerformance';
import projectSetup from './projects/projectSetup';
import projectObjectiveSetup from './projects/projectObjectiveSetup';
import projectQualificationStepSetup from './projects/projectQualificationStepSetup';
import projectPageSetup from './projects/projectPageSetup';
import projectTeamSetup from './projects/projectTeamSetup';
import quickSetupWizard from './projects/quickSetupWizard';
import viewProjects from './projects/viewProjects';
import queueStatusManagement from './project-management/queueStatusManagement';
import caseManagement from './project-management/caseManagement';
import workstreamManagement from './project-management/workstreamManagement';
import updateObjectFields from './project-management/updateObjectFields';
import pmApprovals from './project-management/pmApprovals';
import clientToolAccount from './project-management/clientToolAccount';
import onboardingContributors from './project-management/onboardingContributors';
import poPayRates from './project-management/poPayRates';
import poProductivityTargets from './project-management/poProductivityTargets';
import paymentAdjustments from './project-management/paymentAdjustments';
import reportBuilder from './reports/reportBuilder';
import advancedReportBuilder from './reports/advancedReportBuilder';
import scheduledReports from './reports/scheduledReports';
import contributorTimeStatus from './analytics/contributorTimeStatus';
import projectRosterFunnel from './analytics/projectRosterFunnel';
import activeContributorsByProject from './analytics/activeContributorsByProject';
import activeProjectObjectivesByQualStep from './analytics/activeProjectObjectivesByQualStep';
import contributorMatchMatrix from './analytics/contributorMatchMatrix';
import administration from './administration/administration';
import userManagement from './administration/userManagement';
import history from './administration/history';
import clone from './administration/clone';
import gpcFiltering from './administration/gpcFiltering';

// Export all documentation as a single object
export const documentationContent = {
  'getting-started': gettingStarted,
  'dashboard': dashboard,
  'case-analytics': caseAnalytics,
  'contributor-payments': contributorPayments,
  'project-performance': projectPerformance,
  'project-setup': projectSetup,
  'project-objective-setup': projectObjectiveSetup,
  'project-qualification-step-setup': projectQualificationStepSetup,
  'project-page-setup': projectPageSetup,
  'project-team-setup': projectTeamSetup,
  'quick-setup-wizard': quickSetupWizard,
  'view-projects': viewProjects,
  'queue-status-management': queueStatusManagement,
  'case-management': caseManagement,
  'workstream-management': workstreamManagement,
  'update-object-fields': updateObjectFields,
  'pm-approvals': pmApprovals,
  'client-tool-account': clientToolAccount,
  'onboarding-contributors': onboardingContributors,
  'po-pay-rates': poPayRates,
  'po-productivity-targets': poProductivityTargets,
  'payment-adjustments': paymentAdjustments,
  'report-builder': reportBuilder,
  'advanced-report-builder': advancedReportBuilder,
  'scheduled-reports': scheduledReports,
  'contributor-time-status': contributorTimeStatus,
  'project-roster-funnel': projectRosterFunnel,
  'active-contributors-by-project': activeContributorsByProject,
  'active-project-objectives-by-qual-step': activeProjectObjectivesByQualStep,
  'contributor-match-matrix': contributorMatchMatrix,
  'administration': administration,
  'user-management': userManagement,
  'history': history,
  'clone': clone,
  'gpc-filtering': gpcFiltering,
};

