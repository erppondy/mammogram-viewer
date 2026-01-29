import React, { useState, useEffect } from 'react';
import { AmbulanceLicense, UpdateLicenseDTO } from '../../services/licenseService';

interface EditLicenseModalProps {
  isOpen: boolean;
  license: AmbulanceLicense | null;
  onClose: () => void;
  onUpdate: (id: string, data: UpdateLicenseDTO) => void;
  onExtend: (id: string, days: number) => void;
  onUpdateQuota: (id: string, quota: number) => void;
}

const EditLicenseModal: React.FC<EditLicenseModalProps> = ({
  isOpen,
  license,
  onClose,
  onUpdate,
  onExtend,
  onUpdateQuota,
}) => {
  const [formData, setFormData] = useState<UpdateLicenseDTO>({});
  const [extendDays, setExtendDays] = useState<number>(30);
  const [newQuota, setNewQuota] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'quota' | 'expiry'>('details');

  useEffect(() => {
    if (license) {
      setFormData({
        ambulanceName: license.ambulanceName,
        ambulanceContactEmail: license.ambulanceContactEmail,
        ambulanceContactPhone: license.ambulanceContactPhone || '',
        ambulanceAddress: license.ambulanceAddress || '',
      });
      setNewQuota(license.uploadQuota);
    }
  }, [license]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (activeTab === 'details') {
      if (formData.ambulanceName && !formData.ambulanceName.trim()) {
        newErrors.ambulanceName = 'Ambulance name cannot be empty';
      }

      if (formData.ambulanceContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ambulanceContactEmail)) {
        newErrors.ambulanceContactEmail = 'Invalid email format';
      }
    }

    if (activeTab === 'quota') {
      if (newQuota < 1) {
        newErrors.newQuota = 'Upload quota must be at least 1';
      }
      if (license && newQuota < license.uploadsUsed) {
        newErrors.newQuota = `Quota cannot be less than uploads already used (${license.uploadsUsed})`;
      }
    }

    if (activeTab === 'expiry') {
      if (extendDays < 1) {
        newErrors.extendDays = 'Extension must be at least 1 day';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!license) return;

    if (validateForm()) {
      if (activeTab === 'details') {
        onUpdate(license.id, formData);
      } else if (activeTab === 'quota') {
        onUpdateQuota(license.id, newQuota);
      } else if (activeTab === 'expiry') {
        onExtend(license.id, extendDays);
      }
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({});
    setExtendDays(30);
    setErrors({});
    setActiveTab('details');
    onClose();
  };

  if (!isOpen || !license) return null;

  const currentExpiry = new Date(license.expiresAt);
  const newExpiry = new Date(currentExpiry.getTime() + extendDays * 24 * 60 * 60 * 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-semibold mb-6 text-gray-900">Edit License</h3>
        
        {/* License Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">License Key:</span>
              <span className="ml-2 font-mono font-semibold text-gray-900">{license.licenseKey}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                license.status === 'active' ? 'bg-green-100 text-green-800' :
                license.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {license.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('quota')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'quota'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload Quota
          </button>
          <button
            onClick={() => setActiveTab('expiry')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'expiry'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expiry Date
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ambulance Name
                </label>
                <input
                  type="text"
                  value={formData.ambulanceName || ''}
                  onChange={(e) => setFormData({ ...formData, ambulanceName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                    errors.ambulanceName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.ambulanceName && (
                  <p className="text-red-500 text-sm mt-1">{errors.ambulanceName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.ambulanceContactEmail || ''}
                  onChange={(e) => setFormData({ ...formData, ambulanceContactEmail: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                    errors.ambulanceContactEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.ambulanceContactEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.ambulanceContactEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.ambulanceContactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, ambulanceContactPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.ambulanceAddress || ''}
                  onChange={(e) => setFormData({ ...formData, ambulanceAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Quota Tab */}
          {activeTab === 'quota' && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <div className="text-sm text-gray-700">
                  <div className="mb-2">
                    <span className="font-semibold">Current Quota:</span> {license.uploadQuota} uploads
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Used:</span> {license.uploadsUsed} uploads
                  </div>
                  <div>
                    <span className="font-semibold">Remaining:</span> {license.uploadQuota - license.uploadsUsed} uploads
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Upload Quota
                </label>
                <input
                  type="number"
                  value={newQuota}
                  onChange={(e) => setNewQuota(parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                    errors.newQuota ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min={license.uploadsUsed}
                />
                {errors.newQuota && (
                  <p className="text-red-500 text-sm mt-1">{errors.newQuota}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  New remaining: {newQuota - license.uploadsUsed} uploads
                </p>
              </div>
            </>
          )}

          {/* Expiry Tab */}
          {activeTab === 'expiry' && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <div className="text-sm text-gray-700">
                  <div className="mb-2">
                    <span className="font-semibold">Current Expiry:</span> {currentExpiry.toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-semibold">New Expiry:</span> {newExpiry.toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extend License By (Days)
                </label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                    errors.extendDays ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="1"
                />
                {errors.extendDays && (
                  <p className="text-red-500 text-sm mt-1">{errors.extendDays}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Approximately {Math.round(extendDays / 30)} months
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExtendDays(30)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  +30 days
                </button>
                <button
                  type="button"
                  onClick={() => setExtendDays(90)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  +90 days
                </button>
                <button
                  type="button"
                  onClick={() => setExtendDays(180)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  +180 days
                </button>
                <button
                  type="button"
                  onClick={() => setExtendDays(365)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                >
                  +1 year
                </button>
              </div>
            </>
          )}

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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {activeTab === 'details' ? 'Update Details' :
               activeTab === 'quota' ? 'Update Quota' :
               'Extend License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLicenseModal;
