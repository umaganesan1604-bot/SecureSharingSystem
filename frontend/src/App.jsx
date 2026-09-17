import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import Navbar from './components/Navbar';
import FileUploadModal from './components/FileUploadModal';
import FileDetailsModal from './components/FileDetailsModal';
import FileShareModal from './components/FileShareModal';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import FileManagerPage from './pages/FileManagerPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SecurityCenterPage from './pages/SecurityCenterPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { user, role, isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState('landing');

  // Shared Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState(null);
  const [selectedFileForShare, setSelectedFileForShare] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // When user logs in, default to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (activePage === 'landing' || activePage === 'login' || activePage === 'register') {
        setActivePage('dashboard');
      }
    } else {
      if (['dashboard', 'files', 'users', 'audit', 'profile'].includes(activePage)) {
        setActivePage('landing');
      }
    }
  }, [isAuthenticated]);

  const handleUploadSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleShareUpdated = () => {
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        Initializing SecureShare Cryptographic Core...
      </div>
    );
  }

  const renderDashboard = () => {
    if (role === 'ADMIN') {
      return (
        <AdminDashboard
          key={refreshKey}
          setActivePage={setActivePage}
          onOpenUpload={() => setIsUploadOpen(true)}
          setSelectedFileForDetails={setSelectedFileForDetails}
          onOpenFileShare={setSelectedFileForShare}
        />
      );
    } else if (role === 'MANAGER') {
      return (
        <ManagerDashboard
          key={refreshKey}
          setActivePage={setActivePage}
          onOpenUpload={() => setIsUploadOpen(true)}
          setSelectedFileForDetails={setSelectedFileForDetails}
          onOpenFileShare={setSelectedFileForShare}
        />
      );
    } else {
      return (
        <EmployeeDashboard
          key={refreshKey}
          setActivePage={setActivePage}
          onOpenUpload={() => setIsUploadOpen(true)}
          setSelectedFileForDetails={setSelectedFileForDetails}
          onOpenFileShare={setSelectedFileForShare}
        />
      );
    }
  };

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'landing':
        return <LandingPage setActivePage={setActivePage} />;
      case 'login':
        return <LoginPage setActivePage={setActivePage} />;
      case 'register':
        return <RegisterPage setActivePage={setActivePage} />;
      case 'dashboard':
        return renderDashboard();
      case 'files':
        return (
          <FileManagerPage
            key={refreshKey}
            onOpenUpload={() => setIsUploadOpen(true)}
            setSelectedFileForDetails={setSelectedFileForDetails}
            onOpenFileShare={setSelectedFileForShare}
          />
        );
      case 'users':
        return role === 'ADMIN' ? (
          <UserManagementPage key={refreshKey} />
        ) : (
          renderDashboard()
        );
      case 'audit':
        return role === 'ADMIN' ? (
          <AuditLogsPage key={refreshKey} />
        ) : (
          renderDashboard()
        );
      case 'security':
        return <SecurityCenterPage />;
      case 'profile':
        return <ProfilePage setActivePage={setActivePage} />;
      default:
        return <LandingPage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenUpload={isAuthenticated ? () => setIsUploadOpen(true) : null}
      />

      <main className="main-content">
        {renderCurrentPage()}
      </main>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* File Cryptographic Details Modal */}
      <FileDetailsModal
        isOpen={!!selectedFileForDetails}
        onClose={() => setSelectedFileForDetails(null)}
        file={selectedFileForDetails}
      />

      {/* File Share Modal */}
      <FileShareModal
        isOpen={!!selectedFileForShare}
        onClose={() => setSelectedFileForShare(null)}
        file={selectedFileForShare}
        onShareUpdated={handleShareUpdated}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
