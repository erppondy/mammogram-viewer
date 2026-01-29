import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { licenseTemplateService } from '../services/LicenseTemplateService';
import { validate } from '../middleware/validation';

const router = Router();

// Validation rules
const createTemplateValidation = validate([
  { field: 'templateName', required: true, type: 'string', minLength: 2 },
  { field: 'description', required: false, type: 'string' },
  { field: 'defaultDurationDays', required: true, type: 'number', custom: (v) => v >= 1, message: 'Duration must be at least 1 day' },
  { field: 'defaultUploadQuota', required: true, type: 'number', custom: (v) => v >= 1, message: 'Quota must be at least 1' },
]);

const updateTemplateValidation = validate([
  { field: 'templateName', required: false, type: 'string', minLength: 2 },
  { field: 'description', required: false, type: 'string' },
  { field: 'defaultDurationDays', required: false, type: 'number', custom: (v) => v >= 1, message: 'Duration must be at least 1 day' },
  { field: 'defaultUploadQuota', required: false, type: 'number', custom: (v) => v >= 1, message: 'Quota must be at least 1' },
  { field: 'isActive', required: false, type: 'boolean' },
]);

/**
 * POST /api/license-templates
 * Create a new license template (admin only)
 */
router.post('/', authMiddleware, requireAdmin, createTemplateValidation, async (req: Request, res: Response) => {
  try {
    const templateData = req.body;

    const template = await licenseTemplateService.createTemplate(templateData);

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Create template error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create template';

    if (message.includes('already exists')) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_TEMPLATE',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'CREATE_TEMPLATE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/license-templates
 * List all license templates (admin only)
 */
router.get('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;

    const templates = await licenseTemplateService.getAllTemplates(
      activeOnly === 'true'
    );

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('List templates error:', error);
    const message = error instanceof Error ? error.message : 'Failed to list templates';

    res.status(500).json({
      error: {
        code: 'LIST_TEMPLATES_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/license-templates/:id
 * Get template details by ID (admin only)
 */
router.get('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await licenseTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Get template error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get template';

    res.status(500).json({
      error: {
        code: 'GET_TEMPLATE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/license-templates/:id
 * Update template details (admin only)
 */
router.put('/:id', authMiddleware, requireAdmin, updateTemplateValidation, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const template = await licenseTemplateService.updateTemplate(id, updateData);

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Update template error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update template';

    if (message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'UPDATE_TEMPLATE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/license-templates/:id
 * Delete a template (admin only)
 */
router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await licenseTemplateService.deleteTemplate(id);

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete template';

    if (message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message.includes('in use')) {
      return res.status(400).json({
        error: {
          code: 'TEMPLATE_IN_USE',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'DELETE_TEMPLATE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
