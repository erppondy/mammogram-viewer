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
router.get('/users/pending', async (req: Request, res: Response) => {
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
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});
