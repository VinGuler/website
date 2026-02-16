import { Router } from 'express';
import { PrismaClient } from '@workspace/database';
import { requireAuth } from '../middleware/auth.js';
import {
  calculateCycleDays,
  calculateBalanceCards,
  buildCycleLabel,
  buildWorkspaceCycleLabel,
} from '../services/cycle.js';
import { archiveCycleIfNeeded } from '../services/cycle.js';
import type { WorkspaceResponse } from '../types.js';

export function workspaceRouter(prisma: PrismaClient): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  // GET /api/workspace — fetch user's workspace (or a shared one via ?workspaceId=)
  router.get('/', async (req, res) => {
    const userId = req.user!.id;
    let workspaceId: number | undefined;

    if (req.query.workspaceId) {
      workspaceId = parseInt(req.query.workspaceId as string, 10);
      if (isNaN(workspaceId)) {
        res.status(400).json({ success: false, error: 'Invalid workspaceId' });
        return;
      }
    }

    // If no workspaceId specified, find user's OWNER workspace
    if (!workspaceId) {
      const ownerEntry = await prisma.workspaceUser.findFirst({
        where: { userId, permission: 'OWNER' },
      });

      if (!ownerEntry) {
        res.status(404).json({ success: false, error: 'No workspace found' });
        return;
      }

      workspaceId = ownerEntry.workspaceId;
    }

    // Verify user has access to this workspace
    const membership = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Archive completed cycle if needed
    // await archiveCycleIfNeeded(prisma, workspaceId);

    // Fetch workspace with items
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        items: { orderBy: { dayOfMonth: 'asc' } },
      },
    });

    if (!workspace) {
      res.status(404).json({ success: false, error: 'Workspace not found' });
      return;
    }

    // Recalculate cycle days from items
    const cycleDays = calculateCycleDays(
      workspace.items.map((i) => ({ type: i.type, dayOfMonth: i.dayOfMonth }))
    );

    // Update workspace if cycle days changed
    if (
      cycleDays.cycleStartDay !== workspace.cycleStartDay ||
      cycleDays.cycleEndDay !== workspace.cycleEndDay
    ) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          cycleStartDay: cycleDays.cycleStartDay,
          cycleEndDay: cycleDays.cycleEndDay,
        },
      });
    }

    const balance = Number(workspace.balance);
    const itemsForCalc = workspace.items.map((i) => ({
      type: i.type,
      amount: Number(i.amount),
      isPaid: i.isPaid,
    }));

    const balanceCards = calculateBalanceCards(balance, itemsForCalc);

    const cycleLabel = buildWorkspaceCycleLabel(
      cycleDays.cycleStartDay ?? 1,
      cycleDays.cycleEndDay ?? 1,
      new Date()
    );

    const response: WorkspaceResponse = {
      workspace: {
        id: workspace.id,
        balance,
        cycleStartDay: cycleDays.cycleStartDay,
        cycleEndDay: cycleDays.cycleEndDay,
      },
      items: workspace.items.map((i) => ({
        id: i.id,
        type: i.type,
        label: i.label,
        amount: Number(i.amount),
        dayOfMonth: i.dayOfMonth,
        isPaid: i.isPaid,
      })),
      balanceCards,
      cycleLabel,
      permission: membership.permission,
    };

    res.json({ success: true, data: response });
  });

  // PUT /api/workspace/balance — update workspace balance
  router.put('/balance', async (req, res) => {
    const userId = req.user!.id;
    const { balance, workspaceId: reqWorkspaceId } = req.body;

    if (typeof balance !== 'number' || isNaN(balance)) {
      res.status(400).json({ success: false, error: 'Balance must be a number' });
      return;
    }

    let workspaceId: number;

    if (reqWorkspaceId) {
      workspaceId = reqWorkspaceId;
    } else {
      const ownerEntry = await prisma.workspaceUser.findFirst({
        where: { userId, permission: 'OWNER' },
      });
      if (!ownerEntry) {
        res.status(404).json({ success: false, error: 'No workspace found' });
        return;
      }
      workspaceId = ownerEntry.workspaceId;
    }

    // Check permission: OWNER or MEMBER
    const membership = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership || membership.permission === 'VIEWER') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { balance },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        balance: Number(updated.balance),
        cycleStartDay: updated.cycleStartDay,
        cycleEndDay: updated.cycleEndDay,
      },
    });
  });

  // GET /api/workspace/cycles — fetch completed cycles for user's workspace
  router.get('/cycles', async (req, res) => {
    const userId = req.user!.id;

    // Find user's OWNER workspace
    const ownerEntry = await prisma.workspaceUser.findFirst({
      where: { userId, permission: 'OWNER' },
    });

    if (!ownerEntry) {
      res.status(404).json({ success: false, error: 'No workspace found' });
      return;
    }

    const workspaceId = ownerEntry.workspaceId;

    // Fetch all completed cycles for this workspace
    const cycles = await prisma.completedCycle.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedCycles = cycles.map((cycle) => ({
      id: cycle.id,
      cycleLabel: cycle.cycleLabel,
      finalBalance: Number(cycle.finalBalance),
      items: cycle.itemsSnapshot as any[],
      createdAt: cycle.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formattedCycles });
  });

  // POST /api/workspace/reset — delete all items, reset balance to 0, clear cycle days
  router.post('/reset', async (req, res) => {
    const userId = req.user!.id;
    const { workspaceId: reqWorkspaceId } = req.body;

    let workspaceId: number;

    if (reqWorkspaceId) {
      workspaceId = reqWorkspaceId;
    } else {
      const ownerEntry = await prisma.workspaceUser.findFirst({
        where: { userId, permission: 'OWNER' },
      });
      if (!ownerEntry) {
        res.status(404).json({ success: false, error: 'No workspace found' });
        return;
      }
      workspaceId = ownerEntry.workspaceId;
    }

    // Check permission: OWNER or MEMBER
    const membership = await prisma.workspaceUser.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership || membership.permission === 'VIEWER') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.findUnique({ where: { id: workspaceId } });
      const items = await tx.item.findMany({ where: { workspaceId } });

      await tx.completedCycle.create({
        data: {
          workspaceId,
          finalBalance: workspace?.balance ?? 0,
          cycleLabel: buildCycleLabel(new Date()),
          itemsSnapshot: items,
        },
      });
      await tx.item.updateMany({ where: { workspaceId }, data: { isPaid: false } });
    });

    res.json({ success: true });
  });

  return router;
}
