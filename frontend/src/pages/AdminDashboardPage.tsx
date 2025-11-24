import React, { useState, useEffect } from 'react';
import { adminService, UserResponse, SystemStats } from '../services/adminService';
import AdminStats from '../components/admin/AdminStats';
import UserManagementTable from '../components/admin/UserManagementTable';
import CustomLoader from '../components/CustomLoader';

const AdminDashboardPage: React.FC = () => {
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        adminService.getAllUsers({
          status: statusFilter || undefined,
          search: searchTerm || undefined,
        }),
        adminService.getStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, searchTerm]);

  const handleApprove = async (userId: string) => {
    try {
      await adminService.approveUser(userId);
      showToast('User approved successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Error approving user:', error);
      showToast('Failed to approve user', 'error');
    }
  };

  const handleReject = async (userId: string, reason?: string) => {
    try {
      await adminService.rejectUser(userId, reason);
      showToast('User rejected successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Error rejecting user:', error);
      showToast('Failed to reject user', 'error');
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await adminService.deactivateUser(userId);
      showToast('User deactivated successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deactivating user:', error);
      showToast('Failed to deactivate user', 'error');
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await adminService.activateUser(userId);
      showToast('User activated successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Error activating user:', error);
      showToast('Failed to activate user', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
      showToast('User deleted successfully', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  const handleFilterByStatus = (
    status: 'pending' | 'approved' | 'rejected' | 'deactivated' | null
  ) => {
    setStatusFilter(status);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size={60} />
          <div className="text-xl text-white">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage user accounts and approvals</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/analytics'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              📊 Analytics
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              My Images
            </button>
          </div>
        </div>

        <AdminStats stats={stats} onFilterByStatus={handleFilterByStatus} />

        {statusFilter && (
          <div className="mb-4">
            <button
              onClick={() => setStatusFilter(null)}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              ← Clear filter
            </button>
          </div>
        )}

        <UserManagementTable
          users={users}
          onApprove={handleApprove}
          onReject={handleReject}
          onDeactivate={handleDeactivate}
          onActivate={handleActivate}
          onDelete={handleDelete}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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
