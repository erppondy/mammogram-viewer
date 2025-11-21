import React, { useState } from 'react';
import { UserResponse } from '../../services/adminService';

interface UserManagementTableProps {
  users: UserResponse[];
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason?: string) => void;
  onDeactivate: (userId: string) => void;
  onActivate: (userId: string) => void;
  onDelete: (userId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users,
  onApprove,
  onReject,
  onDeactivate,
  onActivate,
  onDelete,
  searchTerm,
  onSearchChange,
}) => {
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    action: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);

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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
            <p className="mb-6">
              Are you sure you want to {confirmAction.action} this user?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
            <h3 className="text-lg font-semibold mb-4">Reject User</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              rows={4}
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectUserId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
    </div>
  );
};

export default UserManagementTable;
