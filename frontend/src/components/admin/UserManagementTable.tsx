import React, { useState } from 'react';
import { UserResponse } from '../../services/adminService';
import { AmbulanceLicense } from '../../services/licenseService';

interface UserManagementTableProps {
  users: UserResponse[];
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason?: string) => void;
  onDeactivate: (userId: string) => void;
  onActivate: (userId: string) => void;
  onDelete: (userId: string) => void;
  onAssignLicense: (userId: string, licenseId: string, ambulanceRole: string) => void;
  onUnassignLicense: (userId: string) => void;
  onResetPassword: (userId: string, newPassword: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  licenses: AmbulanceLicense[];
  selectedLicenseFilter: string;
  onLicenseFilterChange: (licenseId: string) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users,
  onApprove,
  onReject,
  onDeactivate,
  onActivate,
  onDelete,
  onAssignLicense,
  onUnassignLicense,
  onResetPassword,
  searchTerm,
  onSearchChange,
  licenses,
  selectedLicenseFilter,
  onLicenseFilterChange,
}) => {
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    action: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState('');
  const [selectedRole, setSelectedRole] = useState('operator');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      deactivated: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const handleConfirmAction = (userId: string, action: string) => {
    setConfirmAction({ userId, action });
  };

  const executeAction = () => {
    if (!confirmAction) return;

    const { userId, action } = confirmAction;
    switch (action) {
      case 'approve':
        onApprove(userId);
        break;
      case 'deactivate':
        onDeactivate(userId);
        break;
      case 'activate':
        onActivate(userId);
        break;
      case 'delete':
        onDelete(userId);
        break;
    }
    setConfirmAction(null);
  };

  const handleRejectClick = (userId: string) => {
    setRejectUserId(userId);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = () => {
    if (rejectUserId) {
      onReject(rejectUserId, rejectReason);
      setShowRejectModal(false);
      setRejectUserId(null);
      setRejectReason('');
    }
  };

  const handleAssignClick = (userId: string) => {
    setAssignUserId(userId);
    setShowAssignModal(true);
  };

  const handleAssignSubmit = () => {
    if (assignUserId && selectedLicense) {
      onAssignLicense(assignUserId, selectedLicense, selectedRole);
      setShowAssignModal(false);
      setAssignUserId(null);
      setSelectedLicense('');
      setSelectedRole('operator');
    }
  };

  const handleUnassignClick = (userId: string) => {
    if (window.confirm('Are you sure you want to unassign this user from their license?')) {
      onUnassignLicense(userId);
    }
  };

  const handleResetPasswordClick = (userId: string) => {
    setResetPasswordUserId(userId);
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordSubmit = () => {
    if (!resetPasswordUserId) return;

    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    onResetPassword(resetPasswordUserId, newPassword);
    setShowResetPasswordModal(false);
    setResetPasswordUserId(null);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const getLicenseName = (licenseId: string | null) => {
    if (!licenseId) return 'None';
    const license = licenses.find(l => l.id === licenseId);
    return license ? license.ambulanceName : 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="mb-4 space-y-3">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
        />
        <div className="flex gap-3">
          <select
            value={selectedLicenseFilter}
            onChange={(e) => onLicenseFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            <option value="">All Licenses</option>
            <option value="none">No License</option>
            {licenses.map((license) => (
              <option key={license.id} value={license.id}>
                {license.ambulanceName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                  {user.professionalCredentials && (
                    <div className="text-sm text-gray-500">{user.professionalCredentials}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getLicenseName(user.licenseId)}</div>
                  {user.licenseId && (
                    <button
                      onClick={() => handleUnassignClick(user.id)}
                      className="text-xs text-red-600 hover:text-red-900 mt-1"
                    >
                      Unassign
                    </button>
                  )}
                  {!user.licenseId && (
                    <button
                      onClick={() => handleAssignClick(user.id)}
                      className="text-xs text-blue-600 hover:text-blue-900 mt-1"
                    >
                      Assign
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.ambulanceRole || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.status)}`}
                  >
                    {user.status}
                  </span>
                  {user.rejectionReason && (
                    <div className="text-xs text-red-600 mt-1">{user.rejectionReason}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {user.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConfirmAction(user.id, 'approve')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {user.status === 'approved' && (
                    <button
                      onClick={() => handleConfirmAction(user.id, 'deactivate')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Deactivate
                    </button>
                  )}
                  {user.status === 'deactivated' && (
                    <button
                      onClick={() => handleConfirmAction(user.id, 'activate')}
                      className="text-green-600 hover:text-green-900"
                    >
                      Activate
                    </button>
                  )}
                  {user.status === 'rejected' && (
                    <button
                      onClick={() => handleConfirmAction(user.id, 'approve')}
                      className="text-green-600 hover:text-green-900"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleResetPasswordClick(user.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleConfirmAction(user.id, 'delete')}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Action</h3>
            <p className="mb-6 text-gray-700">
              Are you sure you want to {confirmAction.action} this user?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Reject User</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 text-gray-900 bg-white"
              rows={4}
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectUserId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Assign User to License</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select License
                </label>
                <select
                  value={selectedLicense}
                  onChange={(e) => setSelectedLicense(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Choose a license...</option>
                  {licenses.filter(l => l.status === 'active').map((license) => (
                    <option key={license.id} value={license.id}>
                      {license.ambulanceName} ({license.licenseKey})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ambulance Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="operator">Operator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignUserId(null);
                  setSelectedLicense('');
                  setSelectedRole('operator');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={!selectedLicense}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Reset User Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  minLength={8}
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ This will reset the user's password. They will need to use the new password to log in.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setResetPasswordUserId(null);
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPasswordSubmit}
                disabled={!newPassword || !confirmNewPassword || newPassword.length < 8}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;
