import { Router } from 'express';
import { PrismaClient } from '@workspace/database';
import { requireAuth } from '../middleware/auth.js';
import { calculateCycleDays } from '../services/cycle.js';

const VALID_ITEM_TYPES = ['INCOME', 'CREDIT_CARD', 'LOAN_PAYMENT', 'RENT', 'OTHER'];

async function getWorkspacePermission(
  prisma: PrismaClient,
  userId: number,
  workspaceId: number
): Promise<string | null> {
  const membership = await prisma.workspaceUser.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  return membership?.permission ?? null;
}

async function recalculateAndUpdateCycleDays(
  prisma: PrismaClient,
  workspaceId: number
): Promise<void> {
  const items = await prisma.item.findMany({
    where: { workspaceId },
    select: { type: true, dayOfMonth: true },
  });

  const cycleDays = calculateCycleDays(items);

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      cycleStartDay: cycleDays.cycleStartDay,
      cycleEndDay: cycleDays.cycleEndDay,
    },
  });
}

export function itemsRouter(prisma: PrismaClient): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  // POST /api/items — create a new item
  router.post('/', async (req, res) => {
    const userId = req.user!.id;
    const { workspaceId, type, label, amount, dayOfMonth } = req.body;

    // Validation
    if (!workspaceId || typeof workspaceId !== 'number') {
      res.status(400).json({ success: false, error: 'workspaceId is required' });
      return;
    }

    if (!type || !VALID_ITEM_TYPES.includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid item type' });
      return;
    }

    const trimmedLabel = typeof label === 'string' ? label.trim() : '';
    if (!trimmedLabel) {
      res.status(400).json({ success: false, error: 'Label is required' });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
      return;
    }

    if (typeof dayOfMonth !== 'number' || dayOfMonth < 1 || dayOfMonth > 31) {
      res.status(400).json({ success: false, error: 'dayOfMonth must be between 1 and 31' });
      return;
    }

    // Check permission
    const permission = await getWorkspacePermission(prisma, userId, workspaceId);
    if (!permission || permission === 'VIEWER') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    const item = await prisma.item.create({
      data: {
        workspaceId,
        type: type as any,
        label: trimmedLabel,
        amount,
        dayOfMonth,
        isPaid: false,
      },
    });

    // Recalculate cycle days
    await recalculateAndUpdateCycleDays(prisma, workspaceId);

    res.json({
      success: true,
      data: {
        id: item.id,
        type: item.type,
        label: item.label,
        amount: Number(item.amount),
        dayOfMonth: item.dayOfMonth,
        isPaid: item.isPaid,
      },
    });
  });

  // PUT /api/items/:id — update an item
  router.put('/:id', async (req, res) => {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id, 10);

    if (isNaN(itemId)) {
      res.status(400).json({ success: false, error: 'Invalid item id' });
      return;
    }

    // Find the item
    const existingItem = await prisma.item.findUnique({ where: { id: itemId } });
    if (!existingItem) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    // Check permission
    const permission = await getWorkspacePermission(prisma, userId, existingItem.workspaceId);
    if (!permission || permission === 'VIEWER') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    const { label, amount, dayOfMonth, isPaid, type } = req.body;

    // Build update data
    const updateData: Record<string, any> = {};

    if (label !== undefined) {
      const trimmedLabel = typeof label === 'string' ? label.trim() : '';
      if (!trimmedLabel) {
        res.status(400).json({ success: false, error: 'Label cannot be empty' });
        return;
      }
      updateData.label = trimmedLabel;
    }

    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
        return;
      }
      updateData.amount = amount;
    }

    if (dayOfMonth !== undefined) {
      if (typeof dayOfMonth !== 'number' || dayOfMonth < 1 || dayOfMonth > 31) {
        res.status(400).json({ success: false, error: 'dayOfMonth must be between 1 and 31' });
        return;
      }
      updateData.dayOfMonth = dayOfMonth;
    }

    if (type !== undefined) {
      if (!VALID_ITEM_TYPES.includes(type)) {
        res.status(400).json({ success: false, error: 'Invalid item type' });
        return;
      }
      updateData.type = type;
    }

    if (isPaid !== undefined) {
      if (typeof isPaid !== 'boolean') {
        res.status(400).json({ success: false, error: 'isPaid must be a boolean' });
        return;
      }
      updateData.isPaid = isPaid;
    }

    // Handle balance adjustment when isPaid is toggled
    if (isPaid !== undefined && isPaid !== existingItem.isPaid) {
      const itemAmount = Number(existingItem.amount);
      const workspace = await prisma.workspace.findUnique({
        where: { id: existingItem.workspaceId },
      });

      if (workspace) {
        let balanceAdjustment = 0;
        const isIncome = existingItem.type === 'INCOME';

        if (isPaid && !existingItem.isPaid) {
          // Marking as paid: add income / subtract payment
          balanceAdjustment = isIncome ? itemAmount : -itemAmount;
        } else if (!isPaid && existingItem.isPaid) {
          // Marking as unpaid: reverse the adjustment
          balanceAdjustment = isIncome ? -itemAmount : itemAmount;
        }

        if (balanceAdjustment !== 0) {
          await prisma.workspace.update({
            where: { id: existingItem.workspaceId },
            data: { balance: Number(workspace.balance) + balanceAdjustment },
          });
        }
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
    });

    // Recalculate cycle days if dayOfMonth changed
    if (dayOfMonth !== undefined && dayOfMonth !== existingItem.dayOfMonth) {
      await recalculateAndUpdateCycleDays(prisma, existingItem.workspaceId);
    }

    res.json({
      success: true,
      data: {
        id: updatedItem.id,
        type: updatedItem.type,
        label: updatedItem.label,
        amount: Number(updatedItem.amount),
        dayOfMonth: updatedItem.dayOfMonth,
        isPaid: updatedItem.isPaid,
      },
    });
  });

  // PATCH /api/items/:id/toggle-paid — toggle an item's paid status
  router.patch('/:id/toggle-paid', async (req, res) => {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id, 10);

    if (isNaN(itemId)) {
      res.status(400).json({ success: false, error: 'Invalid item id' });
      return;
    }

    const existingItem = await prisma.item.findUnique({ where: { id: itemId } });
    if (!existingItem) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    const permission = await getWorkspacePermission(prisma, userId, existingItem.workspaceId);
    if (!permission || permission === 'VIEWER') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    const newIsPaid = !existingItem.isPaid;

    // Adjust balance
    const workspace = await prisma.workspace.findUnique({
      where: { id: existingItem.workspaceId },
    });

    if (workspace) {
      const itemAmount = Number(existingItem.amount);
      const isIncome = existingItem.type === 'INCOME';
      let balanceAdjustment = 0;

      if (newIsPaid) {
        balanceAdjustment = isIncome ? itemAmount : -itemAmount;
      } else {
        balanceAdjustment = isIncome ? -itemAmount : itemAmount;
      }

      if (balanceAdjustment !== 0) {
        await prisma.workspace.update({
          where: { id: existingItem.workspaceId },
          data: { balance: Number(workspace.balance) + balanceAdjustment },
        });
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: { isPaid: newIsPaid },
    });

    res.json({
      success: true,
      data: {
        id: updatedItem.id,
        type: updatedItem.type,
        label: updatedItem.label,
        amount: Number(updatedItem.amount),
        dayOfMonth: updatedItem.dayOfMonth,
        isPaid: updatedItem.isPaid,
      },
    });
  });

  // DELETE /api/items/:id — delete an item
  router.delete('/:id', async (req, res) => {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id, 10);

    if (isNaN(itemId)) {
      res.status(400).json({ success: false, error: 'Invalid item id' });
      return;
    }

    // Find the item
    const existingItem = await prisma.item.findUnique({ where: { id: itemId } });
    if (!existingItem) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    // Check permission
    const permission = await getWorkspacePermission(prisma, userId, existingItem.workspaceId);
    if (!permission || permission === 'VIEWER') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    await prisma.item.delete({ where: { id: itemId } });

    // Recalculate cycle days (may set to null if no items remain)
    await recalculateAndUpdateCycleDays(prisma, existingItem.workspaceId);

    res.json({ success: true });
  });

  return router;
}
