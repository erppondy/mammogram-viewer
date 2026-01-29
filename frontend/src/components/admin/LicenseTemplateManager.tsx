import React, { useState, useEffect } from 'react';
import { LicenseTemplate, CreateTemplateDTO, UpdateTemplateDTO, licenseTemplateService } from '../../services/licenseTemplateService';

interface LicenseTemplateManagerProps {
  onClose?: () => void;
}

const LicenseTemplateManager: React.FC<LicenseTemplateManagerProps> = () => {
  const [templates, setTemplates] = useState<LicenseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LicenseTemplate | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await licenseTemplateService.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      showToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateTemplateDTO) => {
    try {
      await licenseTemplateService.createTemplate(data);
      showToast('Template created successfully', 'success');
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      showToast('Failed to create template', 'error');
    }
  };

  const handleUpdate = async (id: string, data: UpdateTemplateDTO) => {
    try {
      await licenseTemplateService.updateTemplate(id, data);
      showToast('Template updated successfully', 'success');
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      showToast('Failed to update template', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await licenseTemplateService.deleteTemplate(id);
      showToast('Template deleted successfully', 'success');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Failed to delete template', 'error');
    }
  };

  const handleToggleActive = async (template: LicenseTemplate) => {
    try {
      await licenseTemplateService.updateTemplate(template.id, {
        isActive: !template.isActive,
      });
      showToast(`Template ${template.isActive ? 'deactivated' : 'activated'} successfully`, 'success');
      loadTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      showToast('Failed to update template', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-900">License Templates</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Create Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No templates found. Create your first template to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-4 border rounded-lg ${
                template.isActive ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-gray-900">{template.templateName}</h4>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Upload Quota:</span>
                  <span className="font-semibold text-gray-900">{template.defaultUploadQuota}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900">
                    {template.defaultDurationDays} days ({Math.round(template.defaultDurationDays / 30)} months)
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="flex-1 px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(template)}
                  className={`flex-1 px-3 py-1 text-sm border rounded ${
                    template.isActive
                      ? 'border-gray-600 text-gray-600 hover:bg-gray-50'
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {template.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          onSave={(data) => {
            if (editingTemplate) {
              handleUpdate(editingTemplate.id, data);
            } else {
              handleCreate(data as CreateTemplateDTO);
            }
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Toast */}
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

interface TemplateModalProps {
  template: LicenseTemplate | null;
  onClose: () => void;
  onSave: (data: CreateTemplateDTO | UpdateTemplateDTO) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState<CreateTemplateDTO>({
    templateName: template?.templateName || '',
    description: template?.description || '',
    defaultDurationDays: template?.defaultDurationDays || 365,
    defaultUploadQuota: template?.defaultUploadQuota || 1000,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.templateName.trim()) {
      newErrors.templateName = 'Template name is required';
    }

    if (formData.defaultUploadQuota < 1) {
      newErrors.defaultUploadQuota = 'Upload quota must be at least 1';
    }

    if (formData.defaultDurationDays < 1) {
      newErrors.defaultDurationDays = 'Duration must be at least 1 day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-2xl font-semibold mb-6 text-gray-900">
          {template ? 'Edit Template' : 'Create Template'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.templateName}
              onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                errors.templateName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Standard, Premium, Basic"
            />
            {errors.templateName && (
              <p className="text-red-500 text-sm mt-1">{errors.templateName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              rows={3}
              placeholder="Optional description of this template"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Upload Quota *
            </label>
            <input
              type="number"
              value={formData.defaultUploadQuota}
              onChange={(e) => setFormData({ ...formData, defaultUploadQuota: parseInt(e.target.value) || 0 })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                errors.defaultUploadQuota ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
            />
            {errors.defaultUploadQuota && (
              <p className="text-red-500 text-sm mt-1">{errors.defaultUploadQuota}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Duration (Days) *
            </label>
            <input
              type="number"
              value={formData.defaultDurationDays}
              onChange={(e) => setFormData({ ...formData, defaultDurationDays: parseInt(e.target.value) || 0 })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                errors.defaultDurationDays ? 'border-red-500' : 'border-gray-300'
              }`}
              min="1"
            />
            {errors.defaultDurationDays && (
              <p className="text-red-500 text-sm mt-1">{errors.defaultDurationDays}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              Approximately {Math.round(formData.defaultDurationDays / 30)} months
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {template ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LicenseTemplateManager;
