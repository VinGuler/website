import { Router } from 'express';
import type { PrismaClient } from '../../generated/prisma/index.js';

export function applicationRouter(prisma: PrismaClient): Router {
  const router = Router();

  // List all applications for current user (with next step computed)
  router.get('/', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const search = req.query.search as string | undefined;

      const where: any = { userId };
      if (search) {
        where.OR = [
          { companyName: { contains: search, mode: 'insensitive' } },
          { role: { contains: search, mode: 'insensitive' } },
        ];
      }

      const applications = await prisma.application.findMany({
        where,
        include: { stages: { orderBy: { order: 'asc' } } },
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
      });

      const data = applications.map((app) => {
        const nextStage = app.stages.find((s) => !s.isCompleted);
        return {
          ...app,
          nextStep: nextStage ? nextStage.label : app.stages.length > 0 ? 'Pending Decision' : null,
        };
      });

      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Create application
  router.post('/', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { companyName, role, status, salaryRange, jobLink, companyUrl, description } = req.body;

      if (!companyName || !role) {
        return res
          .status(400)
          .json({ success: false, error: 'Company name and role are required' });
      }

      const application = await prisma.application.create({
        data: {
          userId,
          companyName,
          role,
          status: status || 'APPLIED',
          salaryRange,
          jobLink,
          companyUrl,
          description,
        },
        include: { stages: true },
      });

      res.json({ success: true, data: { ...application, nextStep: null } });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Update application
  router.put('/:id', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id as string);
      const { companyName, role, status, salaryRange, jobLink, companyUrl, description, position } =
        req.body;

      const existing = await prisma.application.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      const application = await prisma.application.update({
        where: { id },
        data: {
          ...(companyName !== undefined && { companyName }),
          ...(role !== undefined && { role }),
          ...(status !== undefined && { status }),
          ...(salaryRange !== undefined && { salaryRange }),
          ...(jobLink !== undefined && { jobLink }),
          ...(companyUrl !== undefined && { companyUrl }),
          ...(description !== undefined && { description }),
          ...(position !== undefined && { position }),
        },
        include: { stages: { orderBy: { order: 'asc' } } },
      });

      const nextStage = application.stages.find((s) => !s.isCompleted);
      res.json({
        success: true,
        data: {
          ...application,
          nextStep: nextStage
            ? nextStage.label
            : application.stages.length > 0
              ? 'Pending Decision'
              : null,
        },
      });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  // Delete application
  router.delete('/:id', async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id as string);

      const existing = await prisma.application.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      await prisma.application.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  return router;
}
