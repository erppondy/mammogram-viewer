import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService, User } from '../services/authService';
import UploadSection from '../components/UploadSection';
import ImageGallery from '../components/ImageGallery';
import { MedicalHeader, MedicalButton, StatusBadge } from '../components/MedicalUI';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleLogout = () => {
    authService.logout();
  };

  const isAdmin = user && authService.isAdmin(user);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg">
      <MedicalHeader title="Mammogram Viewer">
        <>
          {isAdmin && (
            <Link to="/admin" className="mr-4">
              <MedicalButton 
                variant="secondary"
                size="sm"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              >
                Admin
              </MedicalButton>
            </Link>
          )}
          {user && (
            <>
              <div className="flex flex-col items-end mr-4 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <div className="text-sm font-bold text-[var(--medical-primary)] mb-1" style={{
                  textShadow: '0 0 10px rgba(0, 212, 255, 0.5), 0 0 20px rgba(0, 212, 255, 0.3)'
                }}>
                  {user.fullName}
                </div>
                {isAdmin && (
                  <StatusBadge status="active" label="Admin" size="sm" />
                )}
              </div>
              <MedicalButton 
                onClick={handleLogout} 
                variant="secondary"
                size="sm"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Logout
              </MedicalButton>
            </>
          )}
        </>
      </MedicalHeader>

      <main className="container mx-auto px-4 py-8">
        <UploadSection onUploadComplete={handleUploadComplete} />
        <ImageGallery key={refreshKey} />
      </main>
    </div>
  );
}
