import { Router } from 'express';
import type { PrismaClient } from '../../generated/prisma/index.js';

// Verify the application belongs to the current user
async function verifyOwnership(prisma: PrismaClient, applicationId: number, userId: number) {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app || app.userId !== userId) return null;
  return app;
}

export function stageRouter(prisma: PrismaClient): Router {
  const router = Router();

  // List stages for an application
  router.get('/applications/:applicationId/stages', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const applicationId = parseInt(req.params.applicationId as string);

      const app = await verifyOwnership(prisma, applicationId, userId);
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      const stages = await prisma.stage.findMany({
        where: { applicationId },
        orderBy: { order: 'asc' },
      });

      res.json({ success: true, data: stages });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Add a stage
  router.post('/applications/:applicationId/stages', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const applicationId = parseInt(req.params.applicationId as string);
      const { label, scheduledAt } = req.body;

      if (!label) {
        return res.status(400).json({ success: false, error: 'Label is required' });
      }

      const app = await verifyOwnership(prisma, applicationId, userId);
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      // Place new stage at the end
      const maxOrder = await prisma.stage.aggregate({
        where: { applicationId },
        _max: { order: true },
      });
      const nextOrder = (maxOrder._max.order ?? -1) + 1;

      const stage = await prisma.stage.create({
        data: {
          applicationId,
          label,
          order: nextOrder,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        },
      });

      res.json({ success: true, data: stage });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Reorder stages (must be before /stages/:id to avoid matching "reorder" as an id)
  router.put('/stages/reorder', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { applicationId, stageIds } = req.body as {
        applicationId: number;
        stageIds: number[];
      };

      if (!applicationId || !Array.isArray(stageIds)) {
        return res
          .status(400)
          .json({ success: false, error: 'applicationId and stageIds are required' });
      }

      const app = await verifyOwnership(prisma, applicationId, userId);
      if (!app) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      await prisma.$transaction(
        stageIds.map((stageId, index) =>
          prisma.stage.update({ where: { id: stageId }, data: { order: index } })
        )
      );

      const stages = await prisma.stage.findMany({
        where: { applicationId },
        orderBy: { order: 'asc' },
      });

      res.json({ success: true, data: stages });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Update a stage
  router.put('/stages/:id', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id as string);
      const { label, notes, scheduledAt, isCompleted } = req.body;

      const stage = await prisma.stage.findUnique({
        where: { id },
        include: { application: { select: { userId: true } } },
      });
      if (!stage || stage.application.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Stage not found' });
      }

      const updated = await prisma.stage.update({
        where: { id },
        data: {
          ...(label !== undefined && { label }),
          ...(notes !== undefined && { notes }),
          ...(scheduledAt !== undefined && {
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          }),
          ...(isCompleted !== undefined && { isCompleted }),
        },
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Stage not found' });
      }
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Toggle stage completion
  router.put('/stages/:id/toggle', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id as string);

      const stage = await prisma.stage.findUnique({
        where: { id },
        include: { application: { select: { userId: true } } },
      });
      if (!stage || stage.application.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Stage not found' });
      }

      const updated = await prisma.stage.update({
        where: { id },
        data: { isCompleted: !stage.isCompleted },
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Delete a stage
  router.delete('/stages/:id', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id as string);

      const stage = await prisma.stage.findUnique({
        where: { id },
        include: { application: { select: { userId: true } } },
      });
      if (!stage || stage.application.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Stage not found' });
      }

      await prisma.stage.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Stage not found' });
      }
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
