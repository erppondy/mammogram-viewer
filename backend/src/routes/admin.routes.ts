import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { adminService } from '../services/AdminService';
import { UserStatus, UserRole } from '../models/User';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(requireAdmin);

export default router;

/**
 * GET /api/admin/users
 * Get all users with optional filtering
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { status, role, search } = req.query;

    const filters: any = {};
    if (status) filters.status = status as UserStatus;
    if (role) filters.role = role as UserRole;
    if (search) filters.search = search as string;

    const users = await adminService.getAllUsers(filters);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/pending
 * Get all pending users
 */
router.get('/users/pending', async (_req: Request, res: Response) => {
  try {
    const users = await adminService.getPendingUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

/**
 * PUT /api/admin/users/:id/approve
 * Approve a user
 */
router.put('/users/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await adminService.approveUser(id, adminId);
    res.json({ message: 'User approved successfully' });
  } catch (error: any) {
    console.error('Error approving user:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: 'Invalid status transition' });
    }
    if (error.message === 'CANNOT_MODIFY_SELF') {
      return res.status(403).json({ error: 'Cannot modify your own account' });
    }

    res.status(500).json({ error: 'Failed to approve user' });
  }
});

/**
 * PUT /api/admin/users/:id/reject
 * Reject a user
 */
router.put('/users/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    await adminService.rejectUser(id, adminId, reason);
    res.json({ message: 'User rejected successfully' });
  } catch (error: any) {
    console.error('Error rejecting user:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: 'Invalid status transition' });
    }
    if (error.message === 'CANNOT_MODIFY_SELF') {
      return res.status(403).json({ error: 'Cannot modify your own account' });
    }

    res.status(500).json({ error: 'Failed to reject user' });
  }
});

/**
 * PUT /api/admin/users/:id/deactivate
 * Deactivate a user
 */
router.put('/users/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await adminService.deactivateUser(id, adminId);
    res.json({ message: 'User deactivated successfully' });
  } catch (error: any) {
    console.error('Error deactivating user:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: 'Invalid status transition' });
    }
    if (error.message === 'CANNOT_MODIFY_SELF') {
      return res.status(403).json({ error: 'Cannot modify your own account' });
    }

    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

/**
 * PUT /api/admin/users/:id/activate
 * Activate a user
 */
router.put('/users/:id/activate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await adminService.activateUser(id, adminId);
    res.json({ message: 'User activated successfully' });
  } catch (error: any) {
    console.error('Error activating user:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({ error: 'Invalid status transition' });
    }
    if (error.message === 'CANNOT_MODIFY_SELF') {
      return res.status(403).json({ error: 'Cannot modify your own account' });
    }

    res.status(500).json({ error: 'Failed to activate user' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await adminService.deleteUser(id, adminId);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'CANNOT_MODIFY_SELF') {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }

    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/admin/stats
 * Get system statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * PUT /api/admin/users/:id/assign-license
 * Assign a user to an ambulance license
 */
router.put('/users/:id/assign-license', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { licenseId, ambulanceRole } = req.body;
    const adminId = req.user!.id;

    if (!licenseId || !ambulanceRole) {
      return res.status(400).json({ error: 'License ID and ambulance role are required' });
    }

    await adminService.assignUserToLicense(id, licenseId, ambulanceRole, adminId);
    res.json({ message: 'User assigned to license successfully' });
  } catch (error: any) {
    console.error('Error assigning user to license:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'LICENSE_NOT_FOUND') {
      return res.status(404).json({ error: 'License not found' });
    }
    if (error.message === 'CANNOT_MODIFY_SELF') {
      return res.status(403).json({ error: 'Cannot modify your own account' });
    }

    res.status(500).json({ error: 'Failed to assign user to license' });
  }
});

/**
 * PUT /api/admin/users/:id/unassign-license
 * Unassign a user from their ambulance license
 */
router.put('/users/:id/unassign-license', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;

    await adminService.unassignUserFromLicense(id, adminId);
    res.json({ message: 'User unassigned from license successfully' });
  } catch (error: any) {
    console.error('Error unassigning user from license:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.message === 'CANNOT_MODIFY_SELF') {
      return res.status(403).json({ error: 'Cannot modify your own account' });
    }

    res.status(500).json({ error: 'Failed to unassign user from license' });
  }
});

/**
 * GET /api/admin/images/by-license/:licenseId
 * Get images for a specific license
 */
router.get('/images/by-license/:licenseId', async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const { imageRepository } = await import('../repositories/ImageRepository');
    const images = await imageRepository.findByLicenseId(licenseId, limit, offset);
    const totalCount = await imageRepository.countByLicenseId(licenseId);

    res.json({
      images,
      totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching images by license:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

/**
 * PUT /api/admin/users/:id/reset-password
 * Reset a user's password (admin only)
 */
router.put('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const adminId = req.user!.id;

    // Prevent admin from resetting their own password this way
    if (id === adminId) {
      return res.status(403).json({
        error: {
          code: 'CANNOT_RESET_OWN_PASSWORD',
          message: 'Cannot reset your own password. Use the change password feature instead.',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate input
    if (!newPassword) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PASSWORD',
          message: 'New password is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Reset password
    const { authService } = await import('../services/AuthService');
    await authService.resetUserPassword(id, newPassword);

    res.json({
      message: 'User password reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error resetting user password:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (error.message.includes('Password must be')) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'PASSWORD_RESET_ERROR',
        message: 'Failed to reset user password',
        timestamp: new Date().toISOString(),
      },
    });
  }
});
