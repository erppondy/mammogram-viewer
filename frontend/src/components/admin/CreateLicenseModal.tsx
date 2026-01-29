import React, { useState, useEffect } from 'react';
import { CreateLicenseDTO } from '../../services/licenseService';
import { LicenseTemplate, licenseTemplateService } from '../../services/licenseTemplateService';

interface CreateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateLicenseDTO) => void;
}

const CreateLicenseModal: React.FC<CreateLicenseModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState<CreateLicenseDTO>({
    ambulanceName: '',
    ambulanceContactEmail: '',
    ambulanceContactPhone: '',
    ambulanceAddress: '',
    uploadQuota: 1000,
  });
  
  const [templates, setTemplates] = useState<LicenseTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const data = await licenseTemplateService.getAllTemplates(true);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setFormData(prev => ({
          ...prev,
          uploadQuota: template.defaultUploadQuota,
          templateId: template.id,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        uploadQuota: 1000,
        templateId: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ambulanceName.trim()) {
      newErrors.ambulanceName = 'Ambulance name is required';
    }

    if (!formData.ambulanceContactEmail.trim()) {
      newErrors.ambulanceContactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ambulanceContactEmail)) {
      newErrors.ambulanceContactEmail = 'Invalid email format';
    }

    if (formData.uploadQuota < 1) {
      newErrors.uploadQuota = 'Upload quota must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onCreate(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      ambulanceName: '',
      ambulanceContactEmail: '',
      ambulanceContactPhone: '',
      ambulanceAddress: '',
      uploadQuota: 1000,
    });
    setSelectedTemplateId('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-semibold mb-6 text-gray-900">Create New License</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Template (Optional)
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">No template - Custom settings</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.templateName} ({template.defaultUploadQuota} uploads)
                </option>
              ))}
            </select>
          </div>

          {/* Ambulance Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ambulance Name *
            </label>
            <input
              type="text"
              value={formData.ambulanceName}
              onChange={(e) => setFormData({ ...formData, ambulanceName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                errors.ambulanceName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter ambulance name"
            />
            {errors.ambulanceName && (
              <p className="text-red-500 text-sm mt-1">{errors.ambulanceName}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email *
            </label>
            <input
              type="email"
              value={formData.ambulanceContactEmail}
              onChange={(e) => setFormData({ ...formData, ambulanceContactEmail: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                errors.ambulanceContactEmail ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="contact@ambulance.com"
            />
            {errors.ambulanceContactEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.ambulanceContactEmail}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.ambulanceContactPhone}
              onChange={(e) => setFormData({ ...formData, ambulanceContactPhone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.ambulanceAddress}
              onChange={(e) => setFormData({ ...formData, ambulanceAddress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              rows={3}
              placeholder="Enter ambulance address"
            />
          </div>

          {/* Upload Quota */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Quota *
            </label>
            <input
              type="number"
              value={formData.uploadQuota}
              onChange={(e) => setFormData({ ...formData, uploadQuota: parseInt(e.target.value) || 0 })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                errors.uploadQuota ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
              placeholder="1000"
            />
            {errors.uploadQuota && (
              <p className="text-red-500 text-sm mt-1">{errors.uploadQuota}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Maximum number of images that can be uploaded</p>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create License
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLicenseModal;
