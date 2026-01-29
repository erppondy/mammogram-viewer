import React, { useState } from 'react';
import { AmbulanceLicense, RevokeLicenseDTO } from '../../services/licenseService';

interface RevokeLicenseModalProps {
  isOpen: boolean;
  license: AmbulanceLicense | null;
  onClose: () => void;
  onRevoke: (id: string, data: RevokeLicenseDTO) => void;
}

const RevokeLicenseModal: React.FC<RevokeLicenseModalProps> = ({
  isOpen,
  license,
  onClose,
  onRevoke,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!license) return;

    if (!reason.trim()) {
      setError('Revocation reason is required');
      return;
    }

    onRevoke(license.id, { reason: reason.trim() });
    handleClose();
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  if (!isOpen || !license) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-2xl font-semibold mb-4 text-gray-900">Revoke License</h3>
        
        {/* Warning */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-red-800 mb-1">Warning: This action cannot be undone</h4>
              <p className="text-sm text-red-700">
                Revoking this license will immediately block all users associated with this ambulance from accessing the system.
              </p>
            </div>
          </div>
        </div>

        {/* License Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Ambulance:</span>
              <span className="ml-2 font-semibold text-gray-900">{license.ambulanceName}</span>
            </div>
            <div>
              <span className="text-gray-600">License Key:</span>
              <span className="ml-2 font-mono font-semibold text-gray-900">{license.licenseKey}</span>
            </div>
            <div>
              <span className="text-gray-600">Uploads Used:</span>
              <span className="ml-2 text-gray-900">{license.uploadsUsed} / {license.uploadQuota}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Revocation *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={4}
              placeholder="Please provide a detailed reason for revoking this license..."
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              This reason will be recorded in the audit log and may be visible to the ambulance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Revoke License
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RevokeLicenseModal;
