import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User, LicenseStatus } from '../services/authService';
import { MedicalHeader, MedicalButton } from '../components/MedicalUI';
import { useToast } from '../components/ToastContainer';
import AmbulanceLicenseStatus from '../components/AmbulanceLicenseStatus';
import api from '../services/api';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        setFormData({
          fullName: currentUser.fullName,
          email: currentUser.email,
        });
        
        // Fetch license status
        const status = await authService.getLicenseStatus();
        setLicenseStatus(status);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        showToast('Failed to load user profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('Updating profile with:', formData);
      
      const response = await api.put('/auth/profile', formData);
      
      console.log('Updated user:', response.data);
      setUser(response.data);

      showToast('Profile updated successfully', 'success');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to update profile';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New password and confirm password do not match', 'error');
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setChangingPassword(true);

    try {
      await api.put('/auth/change-password', passwordData);

      showToast('Password changed successfully', 'success');
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error('Failed to change password:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to change password';
      showToast(errorMessage, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg flex items-center justify-center">
        <div className="medical-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg">
      <MedicalHeader title="User Profile">
        <MedicalButton 
          onClick={() => navigate('/dashboard')} 
          variant="secondary"
          size="sm"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          }
        >
          Back to Dashboard
        </MedicalButton>
      </MedicalHeader>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* License Status Widget */}
        {licenseStatus?.hasLicense && licenseStatus.license && (
          <div className="mb-6">
            <AmbulanceLicenseStatus license={licenseStatus.license} />
          </div>
        )}

        <div className="medical-card p-8">
          <h2 className="text-2xl font-bold text-[var(--medical-primary)] mb-6" style={{
            textShadow: '0 0 10px rgba(0, 212, 255, 0.5)'
          }}>
            Edit Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Full Name
              </label>
              <div className="input-container">
                <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  name="fullName"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Email Address
              </label>
              <div className="input-container">
                <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {user && (
              <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Account Information</h3>
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <p><span className="font-medium">Role:</span> {user.role || 'user'}</p>
                  <p><span className="font-medium">Status:</span> {user.status || 'active'}</p>
                  {user.professionalCredentials && (
                    <p><span className="font-medium">Credentials:</span> {user.professionalCredentials}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <MedicalButton
                type="submit"
                disabled={saving}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </MedicalButton>

              <MedicalButton
                type="button"
                variant="secondary"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </MedicalButton>
            </div>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="medical-card p-8 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--medical-primary)]" style={{
              textShadow: '0 0 10px rgba(0, 212, 255, 0.5)'
            }}>
              Change Password
            </h2>
            {!showPasswordForm && (
              <MedicalButton
                onClick={() => setShowPasswordForm(true)}
                size="sm"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                }
              >
                Change Password
              </MedicalButton>
            )}
          </div>

          {showPasswordForm ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Current Password
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 212, 255, 0.05)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <svg 
                    style={{ width: '20px', height: '20px', marginRight: '12px', color: 'rgba(0, 212, 255, 0.7)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    name="currentPassword"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      color: 'rgb(0, 255, 200)',
                      fontSize: '16px'
                    }}
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  New Password
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 212, 255, 0.05)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <svg 
                    style={{ width: '20px', height: '20px', marginRight: '12px', color: 'rgba(0, 212, 255, 0.7)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <input
                    type="password"
                    name="newPassword"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      color: 'rgb(0, 255, 200)',
                      fontSize: '16px'
                    }}
                    placeholder="Enter new password (min 8 characters)"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Confirm New Password
                </label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 212, 255, 0.05)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  transition: 'all 0.3s ease'
                }}>
                  <svg 
                    style={{ width: '20px', height: '20px', marginRight: '12px', color: 'rgba(0, 212, 255, 0.7)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <input
                    type="password"
                    name="confirmPassword"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      color: 'rgb(0, 255, 200)',
                      fontSize: '16px'
                    }}
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <MedicalButton
                  type="submit"
                  disabled={changingPassword}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </MedicalButton>

                <MedicalButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Cancel
                </MedicalButton>
              </div>
            </form>
          ) : (
            <p className="text-[var(--text-secondary)]">
              Click the "Change Password" button to update your password.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
