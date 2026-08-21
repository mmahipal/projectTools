import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { GPCFilterProvider } from './context/GPCFilterContext';
import { SettingsProvider } from './store';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserManagement from './pages/UserManagement';
import Administration from './pages/Administration';
import Dashboard from './pages/Dashboard';
import ProjectSetup from './pages/ProjectSetup';
import ProjectObjectiveSetup from './pages/ProjectObjectiveSetup';
import ProjectQualificationStepSetup from './pages/ProjectQualificationStepSetup';
import ProjectPageSetup from './pages/ProjectPageSetup';
import ProjectTeamSetup from './pages/ProjectTeamSetup';
import QuickSetupWizard from './pages/QuickSetupWizard';
import ProjectConfirmation from './pages/ProjectConfirmation';
import ViewProjects from './pages/ViewProjects';
import ProjectDetail from './pages/ProjectDetail';
import History from './pages/History';
import Settings from './pages/Settings';
import SalesforceSettings from './pages/SalesforceSettings';
import ClientToolAccount from './pages/ClientToolAccount';
import QueueStatusManagement from './pages/QueueStatusManagement';
import WorkstreamManagement from './pages/WorkstreamManagement';
import UpdateObjectFields from './pages/UpdateObjectFields';
import CaseAnalyticsDashboard from './pages/CaseAnalyticsDashboard';
import ContributorPaymentsDashboard from './pages/ContributorPaymentsDashboard';
import Welcome from './pages/Welcome';
import QuickActionsMenu from './components/QuickActions/QuickActionsMenu';
import NavigationTracker from './components/NavigationTracker';
import ReportBuilder from './pages/ReportBuilder';
import AdvancedReportBuilder from './pages/AdvancedReportBuilder';
import ScheduledReportsManager from './pages/ScheduledReports';
import Clone from './pages/Clone';
import AddContributorReview from './pages/AddContributorReview';
import CaseManagement from './pages/CaseManagement';
import MFAVerificationLogs from './pages/MFAVerificationLogs';
import ProjectRosterFunnel from './pages/ProjectRosterFunnel';
import ActiveContributorsByProject from './pages/ActiveContributorsByProject';
import ActiveProjectObjectivesByQualStep from './pages/ActiveProjectObjectivesByQualStep';
import ProjectPerformance from './pages/Dashboard/ProjectPerformance';
import OnboardingContributors from './pages/OnboardingContributors';
import ContributorTimeStatusDashboard from './pages/ContributorTimeStatusDashboard';
import ContributorMatchMatrix from './pages/ContributorMatchMatrix';
import POPayRates from './pages/POPayRates';
import POProductivityTargets from './pages/POProductivityTargets';
import PaymentAdjustments from './pages/PaymentAdjustments';
import PMApprovals from './pages/ProjectManagement/PMApprovals/PMApprovals';
import Help from './pages/Help/Help';
import './App.css';
import './styles/GlobalTableHeaders.css';
import ErrorBoundary from './components/ErrorBoundary';
import { applyAutoTooltips } from './utils/autoTooltip';

// Inner component to access location within Router context
function AppContent() {
  try {
    const location = useLocation();
    const isHelpPage = location.pathname === '/help';

    return (
      <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1e293b',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <RoleProtectedRoute>
                  <Dashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/setup"
              element={
                <RoleProtectedRoute>
                  <ProjectSetup />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/setup-objective"
              element={
                <RoleProtectedRoute>
                  <ProjectObjectiveSetup />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/setup-qualification-step"
              element={
                <RoleProtectedRoute>
                  <ProjectQualificationStepSetup />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/setup-project-page"
              element={
                <RoleProtectedRoute>
                  <ProjectPageSetup />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/setup-project-team"
              element={
                <RoleProtectedRoute>
                  <ProjectTeamSetup />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/clone"
              element={
                <RoleProtectedRoute>
                  <Clone />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/add-contributor-review"
              element={
                <RoleProtectedRoute>
                  <AddContributorReview />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/quick-setup"
              element={
                <RoleProtectedRoute>
                  <QuickSetupWizard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/confirmation"
              element={
                <ProtectedRoute>
                  <ProjectConfirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <RoleProtectedRoute>
                  <ViewProjects />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/project-detail/:id?"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client-tool-account"
              element={
                <RoleProtectedRoute>
                  <ClientToolAccount />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/queue-status-management"
              element={
                <RoleProtectedRoute>
                  <QueueStatusManagement />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/case-management"
              element={
                <RoleProtectedRoute>
                  <CaseManagement />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/mfa-verification-logs"
              element={
                <RoleProtectedRoute>
                  <MFAVerificationLogs />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/project-roster-funnel"
              element={
                <RoleProtectedRoute>
                  <ProjectRosterFunnel />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/active-contributors-by-project"
              element={
                <RoleProtectedRoute>
                  <ActiveContributorsByProject />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/active-project-objectives-by-qual-step"
              element={
                <RoleProtectedRoute>
                  <ActiveProjectObjectivesByQualStep />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/onboarding-contributors"
              element={
                <RoleProtectedRoute>
                  <OnboardingContributors />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/project-performance"
              element={
                <RoleProtectedRoute>
                  <ProjectPerformance />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/contributor-time-status"
              element={
                <RoleProtectedRoute>
                  <ContributorTimeStatusDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/contributor-match-matrix"
              element={
                <RoleProtectedRoute>
                  <ContributorMatchMatrix />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/po-pay-rates"
              element={
                <RoleProtectedRoute>
                  <POPayRates />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/payment-adjustments"
              element={
                <RoleProtectedRoute>
                  <PaymentAdjustments />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/po-productivity-targets"
              element={
                <RoleProtectedRoute>
                  <POProductivityTargets />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/pm-approvals"
              element={
                <RoleProtectedRoute>
                  <PMApprovals />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/workstream-management"
              element={
                <RoleProtectedRoute>
                  <WorkstreamManagement />
                </RoleProtectedRoute>
              }
            />
            {/* Legacy routes - redirect to new combined page */}
            <Route
              path="/create-workstream"
              element={
                <RoleProtectedRoute>
                  <Navigate to="/workstream-management" replace />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/workstream-reporting"
              element={
                <RoleProtectedRoute>
                  <Navigate to="/workstream-management" replace />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/update-object-fields"
              element={
                <RoleProtectedRoute>
                  <UpdateObjectFields />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/case-analytics"
              element={
                <RoleProtectedRoute>
                  <CaseAnalyticsDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/contributor-payments"
              element={
                <RoleProtectedRoute>
                  <ContributorPaymentsDashboard />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <RoleProtectedRoute>
                  <Settings />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/salesforce-settings"
              element={
                <RoleProtectedRoute>
                  <SalesforceSettings />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/administration"
              element={
                <RoleProtectedRoute>
                  <Administration />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <RoleProtectedRoute>
                  <UserManagement />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Welcome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/welcome"
              element={
                <ProtectedRoute>
                  <Welcome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-builder"
              element={
                <RoleProtectedRoute>
                  <ReportBuilder />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/advanced-report-builder"
              element={
                <RoleProtectedRoute>
                  <AdvancedReportBuilder />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/scheduled-reports"
              element={
                <RoleProtectedRoute>
                  <ScheduledReportsManager />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <RoleProtectedRoute>
                  <Help />
                </RoleProtectedRoute>
              }
            />
            {/* Catch-all route for unknown paths - redirect to home */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
      </Routes>
      {/* Navigation Tracker - Tracks page visits for recent items */}
      <NavigationTracker />
      {/* Quick Actions Menu - Available on all protected pages except Help */}
      {!isHelpPage && <QuickActionsMenu />}
    </div>
    );
  } catch (error) {
    console.error('Error rendering AppContent:', error);
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Content Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }
}

function App() {
  useEffect(() => {
    // Apply auto tooltips after initial render and on route changes
    const timer = setTimeout(() => {
      applyAutoTooltips();
    }, 100);

    // Reapply on window resize
    const handleResize = () => {
      setTimeout(() => {
        applyAutoTooltips();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  try {
    return (
      <ErrorBoundary>
        <AuthProvider>
          <SettingsProvider>
            <GPCFilterProvider>
            <Router>
              <AppContent />
            </Router>
            </GPCFilterProvider>
          </SettingsProvider>
        </AuthProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error rendering App component:', error);
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#ef4444' }}>Application Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }
}

export default App;

