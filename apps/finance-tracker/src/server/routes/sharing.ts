import { Router } from 'express';
import { PrismaClient } from '@workspace/database';
import { requireAuth } from '../middleware/auth.js';

export function sharingRouter(prisma: PrismaClient): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  // GET /api/users/search?username= — search for a user by exact username (case-insensitive)
  router.get('/users/search', async (req, res) => {
    const username = req.query.username as string;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ success: false, error: 'Username query parameter is required' });
      return;
    }

    const currentUserId = req.user!.id;

    const user = await prisma.user.findFirst({
      where: { id: { not: currentUserId }, username: { equals: username, mode: 'insensitive' } },
      select: { id: true, username: true, displayName: true },
    });

    res.json({
      success: true,
      data: user || null,
    });
  });

  // GET /api/workspaces/shared — list workspaces shared with the current user
  router.get('/workspaces/shared', async (req, res) => {
    const userId = req.user!.id;

    const memberships = await prisma.workspaceUser.findMany({
      where: {
        userId,
        permission: { not: 'OWNER' },
      },
      include: {
        workspace: {
          include: {
            users: {
              where: { permission: 'OWNER' },
              include: { user: { select: { displayName: true } } },
            },
          },
        },
      },
    });

    const sharedWorkspaces = memberships.map((m) => ({
      workspaceId: m.workspaceId,
      ownerDisplayName: m.workspace.users[0]?.user.displayName ?? 'Unknown',
      permission: m.permission,
    }));

    res.json({ success: true, data: sharedWorkspaces });
  });

  // GET /api/workspace/:id/members — list all members of a workspace
  router.get('/workspace/:id/members', async (req, res) => {
    const userId = req.user!.id;
    const workspaceId = parseInt(req.params.id, 10);

    if (isNaN(workspaceId)) {
      res.status(400).json({ success: false, error: 'Invalid workspace id' });
      return;
    }

    // Verify user has access
    const membership = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const members = await prisma.workspaceUser.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
    });

    const result = members.map((m) => ({
      userId: m.user.id,
      username: m.user.username,
      displayName: m.user.displayName,
      permission: m.permission,
    }));

    res.json({ success: true, data: result });
  });

  // POST /api/workspace/:id/members — add a member to a workspace
  router.post('/workspace/:id/members', async (req, res) => {
    const userId = req.user!.id;
    const workspaceId = parseInt(req.params.id, 10);

    if (isNaN(workspaceId)) {
      res.status(400).json({ success: false, error: 'Invalid workspace id' });
      return;
    }

    const { userId: targetUserId, permission } = req.body;

    if (!targetUserId || typeof targetUserId !== 'number') {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    if (!permission || !['MEMBER', 'VIEWER'].includes(permission)) {
      res.status(400).json({ success: false, error: 'Permission must be MEMBER or VIEWER' });
      return;
    }

    // Check the requesting user's permission
    const myMembership = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!myMembership) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // OWNER can add MEMBER or VIEWER; MEMBER can add VIEWER only; VIEWER cannot add
    if (myMembership.permission === 'VIEWER') {
      res.status(403).json({ success: false, error: 'Viewers cannot add members' });
      return;
    }

    if (myMembership.permission === 'MEMBER' && permission === 'MEMBER') {
      res.status(403).json({ success: false, error: 'Members can only add viewers' });
      return;
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Verify target is not already a member
    const existingMembership = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });

    if (existingMembership) {
      res.status(409).json({ success: false, error: 'User is already a member of this workspace' });
      return;
    }

    const created = await prisma.workspaceUser.create({
      data: {
        userId: targetUserId,
        workspaceId,
        permission: permission as any,
      },
    });

    res.json({
      success: true,
      data: {
        userId: created.userId,
        workspaceId: created.workspaceId,
        permission: created.permission,
      },
    });
  });

  // DELETE /api/workspace/:id/members/:userId — remove a member from a workspace
  router.delete('/workspace/:id/members/:userId', async (req, res) => {
    const currentUserId = req.user!.id;
    const workspaceId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);

    if (isNaN(workspaceId) || isNaN(targetUserId)) {
      res.status(400).json({ success: false, error: 'Invalid workspace or user id' });
      return;
    }

    // Get the requesting user's membership
    const myMembership = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId: currentUserId, workspaceId } },
    });

    if (!myMembership) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Get the target user's membership
    const targetMembership = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });

    if (!targetMembership) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    // Permission checks
    const isSelf = currentUserId === targetUserId;

    if (isSelf) {
      // Any user can remove themselves EXCEPT the OWNER
      if (targetMembership.permission === 'OWNER') {
        res.status(403).json({ success: false, error: 'Owner cannot leave their workspace' });
        return;
      }
    } else {
      // Removing someone else
      if (myMembership.permission === 'VIEWER') {
        res.status(403).json({ success: false, error: 'Viewers cannot remove members' });
        return;
      }

      if (targetMembership.permission === 'OWNER') {
        res.status(403).json({ success: false, error: 'Cannot remove the workspace owner' });
        return;
      }

      // MEMBER can remove other MEMBERs and VIEWERs
      // OWNER can remove anyone except self (already excluded OWNER target above)
    }

    await prisma.workspaceUser.delete({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });

    res.json({ success: true });
  });

  return router;
}
