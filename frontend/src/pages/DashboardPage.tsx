import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService, User, LicenseStatus } from '../services/authService';
import UploadSection from '../components/UploadSection';
import ImageGallery from '../components/ImageGallery';
import { MedicalHeader, MedicalButton } from '../components/MedicalUI';
import UserProfileButton from '../components/UserProfileButton';
import ActionCard from '../components/ActionCard';
import GradientButton from '../components/GradientButton';

type ViewMode = 'cards' | 'upload' | 'gallery';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);

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

  useEffect(() => {
    const fetchLicenseStatus = async () => {
      try {
        setIsLoadingLicense(true);
        const status = await authService.getLicenseStatus();
        setLicenseStatus(status);
      } catch (error) {
        console.error('Failed to fetch license status:', error);
        // If license fetch fails, assume no license (regular user)
        setLicenseStatus({ hasLicense: false, license: null });
      } finally {
        setIsLoadingLicense(false);
      }
    };
    fetchLicenseStatus();
  }, []);

  const handleUploadComplete = () => {
    // Small delay to ensure backend has finished processing
    setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
      setViewMode('gallery');
    }, 500);
  };

  const handleLogout = () => {
    authService.logout();
  };

  const isAdmin = user && authService.isAdmin(user);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg">
      <MedicalHeader title="Mammogram X-Ray Screener">
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
              <div className="mr-4">
                <UserProfileButton username={user.fullName} isAdmin={!!isAdmin} />
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
        {viewMode === 'cards' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-3xl font-bold text-[var(--medical-primary)] mb-8 text-center" style={{
              textShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
            }}>
              What would you like to do?
            </h2>
            <div className="flex flex-wrap gap-8 justify-center">
              {/* Hide upload for ambulance doctors - they only annotate */}
              {user?.ambulanceRole !== 'doctor' && (
                <ActionCard
                  title="Upload Images"
                  description="Upload new X-ray images for analysis and storage. Supports DICOM, PNG, JPG formats."
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  }
                  onClick={() => setViewMode('upload')}
                  actionText="Start Upload"
                />
              )}
              <ActionCard
                title="View Gallery"
                description="Browse and manage your uploaded X-ray images. View, download, and organize your files."
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                onClick={() => setViewMode('gallery')}
                actionText="View Images"
              />
            </div>
          </div>
        )}

        {viewMode === 'upload' && user?.ambulanceRole !== 'doctor' && (
          <div>
            <div className="mb-6">
              <GradientButton
                onClick={() => setViewMode('cards')}
                variant="secondary"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Menu
              </GradientButton>
            </div>
            <UploadSection onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {viewMode === 'gallery' && (
          <div>
            <div className="mb-6">
              <GradientButton
                onClick={() => setViewMode('cards')}
                variant="secondary"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Menu
              </GradientButton>
            </div>
            <ImageGallery key={refreshKey} />
          </div>
        )}
      </main>
    </div>
  );
}
