import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import AnnotationViewerPage from './pages/AnnotationViewerPage';
import EnhancedAnnotationViewer from './pages/EnhancedAnnotationViewer';
import { authService, User } from './services/authService';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastContainer';
import Footer from './components/Footer';

function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        console.log('Current user:', currentUser);
        console.log('User role:', currentUser.role);
        console.log('User status:', currentUser.status);
        console.log('Is admin?', authService.isAdmin(currentUser));
        console.log('Require admin?', requireAdmin);
        
        setUser(currentUser);

        if (requireAdmin && !authService.isAdmin(currentUser)) {
          console.log('Not admin, redirecting to dashboard');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg flex items-center justify-center">
        <div className="medical-spinner"></div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          await authService.getCurrentUser();
          setIsAuthenticated(true);
        } catch {
          authService.logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg flex items-center justify-center">
        <div className="medical-spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage
                  onLogin={() => setIsAuthenticated(true)}
                  onSwitchToRegister={() => navigate('/register')}
                />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <RegisterPage 
                  onRegister={() => navigate('/login')} 
                  onSwitchToLogin={() => navigate('/login')} 
                />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute requireAdmin>
                <AnalyticsDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/annotate/:imageId"
            element={
              <ProtectedRoute>
                <EnhancedAnnotationViewer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  // Use environment variable or default to /mammogram for local dev
  const basename = import.meta.env.VITE_BASE_PATH || '/mammogram';
  
  return (
    <BrowserRouter basename={basename}>
      <ErrorBoundary>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
