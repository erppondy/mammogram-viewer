import React, { useState, useEffect } from 'react';
import { adminService, UserResponse, SystemStats } from '../services/adminService';
import { licenseService, AmbulanceLicense, CreateLicenseDTO, UpdateLicenseDTO, RevokeLicenseDTO } from '../services/licenseService';
import { ambulanceStatsService, AmbulanceStats, SystemStats as AmbulanceSystemStats } from '../services/ambulanceStatsService';
import AdminStats from '../components/admin/AdminStats';
import UserManagementTable from '../components/admin/UserManagementTable';
import LicenseManagementTable from '../components/admin/LicenseManagementTable';
import CreateLicenseModal from '../components/admin/CreateLicenseModal';
import EditLicenseModal from '../components/admin/EditLicenseModal';
import RevokeLicenseModal from '../components/admin/RevokeLicenseModal';
import LicenseDetailsPanel from '../components/admin/LicenseDetailsPanel';
import LicenseTemplateManager from '../components/admin/LicenseTemplateManager';
import SystemStatsOverview from '../components/admin/SystemStatsOverview';
import AmbulanceStatsTable from '../components/admin/AmbulanceStatsTable';
import AmbulanceDetailsDashboard from '../components/admin/AmbulanceDetailsDashboard';
import CustomLoader from '../components/CustomLoader';
import GradientButton from '../components/GradientButton';

type TabType = 'users' | 'licenses' | 'templates' | 'statistics';

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  
  // User management state
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
    deactivatedUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'approved' | 'rejected' | 'deactivated' | null
  >(null);
  const [selectedLicenseFilter, setSelectedLicenseFilter] = useState('');
  
  // License management state
  const [licenses, setLicenses] = useState<AmbulanceLicense[]>([]);
  const [licenseSearchTerm, setLicenseSearchTerm] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'active' | 'expired' | 'revoked' | null>(null);
  const [showCreateLicenseModal, setShowCreateLicenseModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<AmbulanceLicense | null>(null);
  const [revokingLicense, setRevokingLicense] = useState<AmbulanceLicense | null>(null);
  const [viewingLicense, setViewingLicense] = useState<AmbulanceLicense | null>(null);
  
  // Statistics state
  const [ambulanceStats, setAmbulanceStats] = useState<AmbulanceStats[]>([]);
  const [systemStats, setSystemStats] = useState<AmbulanceSystemStats | null>(null);
  const [viewingStatsLicenseId, setViewingStatsLicenseId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData, licensesData] = await Promise.all([
        adminService.getAllUsers({
          status: statusFilter || undefined,
          search: searchTerm || undefined,
          licenseId: selectedLicenseFilter === 'none' ? 'null' : (selectedLicenseFilter || undefined),
        }),
        adminService.getStats(),
        licenseService.getAllLicenses(),
      ]);
      setUsers(usersData);
      setStats(statsData);
      if (licenses.length === 0) {
        setLicenses(licensesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenseData = async () => {
    try {
      setLoading(true);
      const licensesData = await licenseService.getAllLicenses({
        status: licenseStatusFilter || undefined,
        search: licenseSearchTerm || undefined,
      });
      setLicenses(licensesData);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      showToast('Failed to load licenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatisticsData = async () => {
    try {
      setLoading(true);
      const [statsData, systemStatsData] = await Promise.all([
        ambulanceStatsService.getAllAmbulanceStats(),
        ambulanceStatsService.getSystemStats(),
      ]);
      setAmbulanceStats(statsData);
      setSystemStats(systemStatsData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUserData();
    } else if (activeTab === 'licenses') {
      fetchLicenseData();
    } else if (activeTab === 'statistics') {
      fetchStatisticsData();
    }
  }, [activeTab, statusFilter, searchTerm, licenseStatusFilter, licenseSearchTerm, selectedLicenseFilter]);

  const handleApprove = async (userId: string) => {
    try {
      await adminService.approveUser(userId);
      showToast('User approved successfully', 'success');
      fetchUserData();
    } catch (error) {
      console.error('Error approving user:', error);
      showToast('Failed to approve user', 'error');
    }
  };

  const handleReject = async (userId: string, reason?: string) => {
    try {
      await adminService.rejectUser(userId, reason);
      showToast('User rejected successfully', 'success');
      fetchUserData();
    } catch (error) {
      console.error('Error rejecting user:', error);
      showToast('Failed to reject user', 'error');
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await adminService.deactivateUser(userId);
      showToast('User deactivated successfully', 'success');
      fetchUserData();
    } catch (error) {
      console.error('Error deactivating user:', error);
      showToast('Failed to deactivate user', 'error');
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await adminService.activateUser(userId);
      showToast('User activated successfully', 'success');
      fetchUserData();
    } catch (error) {
      console.error('Error activating user:', error);
      showToast('Failed to activate user', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
      showToast('User deleted successfully', 'success');
      fetchUserData();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  const handleAssignLicense = async (userId: string, licenseId: string, ambulanceRole: string) => {
    try {
      await adminService.assignUserToLicense(userId, licenseId, ambulanceRole);
      showToast('User assigned to license successfully', 'success');
      fetchUserData();
    } catch (error) {
      console.error('Error assigning user to license:', error);
      showToast('Failed to assign user to license', 'error');
    }
  };

  const handleUnassignLicense = async (userId: string) => {
    try {
      await adminService.unassignUserFromLicense(userId);
      showToast('User unassigned from license successfully', 'success');
      fetchUserData();
    } catch (error) {
      console.error('Error unassigning user from license:', error);
      showToast('Failed to unassign user from license', 'error');
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    try {
      await adminService.resetUserPassword(userId, newPassword);
      showToast('User password reset successfully', 'success');
    } catch (error) {
      console.error('Error resetting user password:', error);
      showToast('Failed to reset user password', 'error');
    }
  };

  const handleFilterByStatus = (
    status: 'pending' | 'approved' | 'rejected' | 'deactivated' | null
  ) => {
    setStatusFilter(status);
  };

  // License management handlers
  const handleCreateLicense = async (data: CreateLicenseDTO) => {
    try {
      await licenseService.createLicense(data);
      showToast('License created successfully', 'success');
      fetchLicenseData();
    } catch (error) {
      console.error('Error creating license:', error);
      showToast('Failed to create license', 'error');
    }
  };

  const handleUpdateLicense = async (id: string, data: UpdateLicenseDTO) => {
    try {
      await licenseService.updateLicense(id, data);
      showToast('License updated successfully', 'success');
      fetchLicenseData();
    } catch (error) {
      console.error('Error updating license:', error);
      showToast('Failed to update license', 'error');
    }
  };

  const handleExtendLicense = async (id: string, days: number) => {
    try {
      await licenseService.extendLicense(id, days);
      showToast('License extended successfully', 'success');
      fetchLicenseData();
    } catch (error) {
      console.error('Error extending license:', error);
      showToast('Failed to extend license', 'error');
    }
  };

  const handleUpdateQuota = async (id: string, quota: number) => {
    try {
      await licenseService.updateQuota(id, quota);
      showToast('Quota updated successfully', 'success');
      fetchLicenseData();
    } catch (error) {
      console.error('Error updating quota:', error);
      showToast('Failed to update quota', 'error');
    }
  };

  const handleRevokeLicense = async (id: string, data: RevokeLicenseDTO) => {
    try {
      await licenseService.revokeLicense(id, data);
      showToast('License revoked successfully', 'success');
      fetchLicenseData();
    } catch (error) {
      console.error('Error revoking license:', error);
      showToast('Failed to revoke license', 'error');
    }
  };

  const handleExportAllStats = async () => {
    try {
      const blob = await ambulanceStatsService.exportStatsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-ambulance-stats-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Statistics exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting stats:', error);
      showToast('Failed to export statistics', 'error');
    }
  };

  if (loading && users.length === 0 && licenses.length === 0 && ambulanceStats.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#000000' }}>
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size={60} />
          <div className="text-xl text-white">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#000000', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users, licenses, and templates</p>
          </div>
          <div className="flex gap-3">
            <GradientButton
              onClick={() => window.history.back()}
              variant="secondary"
              size="sm"
            >
              ← Back
            </GradientButton>
            <GradientButton
              onClick={() => window.location.href = '/mammogram/dashboard'}
              variant="secondary"
              size="sm"
            >
              My Images
            </GradientButton>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 p-1 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('licenses')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'licenses'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              License Management
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'statistics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'templates'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Templates
            </button>
          </div>
        </div>

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <>
            <AdminStats stats={stats} onFilterByStatus={handleFilterByStatus} />

            {statusFilter && (
              <div className="mb-4">
                <GradientButton
                  onClick={() => setStatusFilter(null)}
                  variant="info"
                  size="xs"
                >
                  ← Clear filter
                </GradientButton>
              </div>
            )}

            <UserManagementTable
              users={users}
              onApprove={handleApprove}
              onReject={handleReject}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
              onDelete={handleDelete}
              onAssignLicense={handleAssignLicense}
              onUnassignLicense={handleUnassignLicense}
              onResetPassword={handleResetPassword}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              licenses={licenses}
              selectedLicenseFilter={selectedLicenseFilter}
              onLicenseFilterChange={setSelectedLicenseFilter}
            />
          </>
        )}

        {/* License Management Tab */}
        {activeTab === 'licenses' && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-white">
                Total Licenses: {licenses.length} | 
                Active: {licenses.filter(l => l.status === 'active').length} | 
                Expired: {licenses.filter(l => l.status === 'expired').length} | 
                Revoked: {licenses.filter(l => l.status === 'revoked').length}
              </div>
              <GradientButton
                onClick={() => setShowCreateLicenseModal(true)}
                variant="primary"
                size="sm"
              >
                + Create License
              </GradientButton>
            </div>

            <LicenseManagementTable
              licenses={licenses}
              onEdit={setEditingLicense}
              onRevoke={setRevokingLicense}
              onViewDetails={setViewingLicense}
              searchTerm={licenseSearchTerm}
              onSearchChange={setLicenseSearchTerm}
              statusFilter={licenseStatusFilter}
              onStatusFilterChange={setLicenseStatusFilter}
            />
          </>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <>
            {systemStats && <SystemStatsOverview stats={systemStats} />}
            
            <AmbulanceStatsTable
              stats={ambulanceStats}
              onViewDetails={setViewingStatsLicenseId}
              onExport={handleExportAllStats}
            />
          </>
        )}

        {/* License Templates Tab */}
        {activeTab === 'templates' && (
          <LicenseTemplateManager />
        )}
      </div>

      {/* Modals */}
      <CreateLicenseModal
        isOpen={showCreateLicenseModal}
        onClose={() => setShowCreateLicenseModal(false)}
        onCreate={handleCreateLicense}
      />

      <EditLicenseModal
        isOpen={!!editingLicense}
        license={editingLicense}
        onClose={() => setEditingLicense(null)}
        onUpdate={handleUpdateLicense}
        onExtend={handleExtendLicense}
        onUpdateQuota={handleUpdateQuota}
      />

      <RevokeLicenseModal
        isOpen={!!revokingLicense}
        license={revokingLicense}
        onClose={() => setRevokingLicense(null)}
        onRevoke={handleRevokeLicense}
      />

      <LicenseDetailsPanel
        isOpen={!!viewingLicense}
        license={viewingLicense}
        onClose={() => setViewingLicense(null)}
      />

      {viewingStatsLicenseId && (
        <AmbulanceDetailsDashboard
          licenseId={viewingStatsLicenseId}
          onClose={() => setViewingStatsLicenseId(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              } text-white`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
