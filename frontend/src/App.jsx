import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { Login } from './pages/Login';
import { ForgotPassword, ResetPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { AssetList } from './pages/AssetList';
import { AssetForm } from './pages/AssetForm';
import { AssetDetail } from './pages/AssetDetail';
import { AssetMap } from './pages/AssetMap';
import { Categories } from './pages/Categories';
import { LifecycleTracking } from './pages/LifecycleTracking';
import { ReplacementPlanning } from './pages/ReplacementPlanning';
import { InspectionsList } from './pages/InspectionsList';
import { MaintenanceList } from './pages/MaintenanceList';
import { ProjectsList } from './pages/ProjectsList';
import { ProcurementVendors } from './pages/ProcurementVendors';
import { Reports } from './pages/Reports';
import { UsersList } from './pages/UsersList';
import { AuditLogs } from './pages/AuditLogs';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicAssetScan } from './pages/PublicAssetScan';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 text-xs">
        Verifying security credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Route for /assets/:identifier (QR tag scan landing)
const AssetIdentifierRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">Loading...</div>;
  }

  if (isAuthenticated) {
    return (
      <DashboardLayout>
        <AssetDetail />
      </DashboardLayout>
    );
  }

  return <PublicAssetScan />;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Asset by Code / ID (Handles both authenticated dossier and public QR scan) */}
      <Route path="/assets/:identifier" element={<AssetIdentifierRoute />} />

      {/* Protected Routes in DashboardLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assets" element={<AssetList />} />
        <Route path="assets/new" element={<AssetForm />} />
        <Route path="assets/:id/edit" element={<AssetForm />} />
        <Route path="assets/map" element={<AssetMap />} />
        <Route path="categories" element={<Categories />} />
        <Route path="lifecycle" element={<LifecycleTracking />} />
        <Route path="replacement-planning" element={<ReplacementPlanning />} />
        <Route path="inspections" element={<InspectionsList />} />
        <Route path="maintenance" element={<MaintenanceList />} />
        <Route path="work-orders" element={<MaintenanceList />} />
        <Route path="maintenance/schedules" element={<MaintenanceList />} />
        <Route path="projects" element={<ProjectsList />} />
        <Route path="vendors" element={<ProcurementVendors />} />
        <Route path="procurement" element={<ProcurementVendors />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<UsersList />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
