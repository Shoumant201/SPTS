import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
// Use typed alias for models that may have stale TS types after migration
const db = prisma as any;

const VALID_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const assignmentSchema = z.object({
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  routeId: z.string().min(1),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  days: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).min(1),
  notes: z.string().optional(),
});

const includeRelations = {
  vehicle: { select: { id: true, plateNumber: true, type: true, capacity: true } },
  driver: { select: { id: true, name: true, phone: true } },
  route: { select: { id: true, name: true, routeNumber: true, startPoint: true, endPoint: true, distance: true } },
};

export class AssignmentController {
  static async getAssignments(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      const where: any = {};
      if (userType === 'ORGANIZATION') where.organizationId = orgId;

      const assignments = await db.busAssignment.findMany({
        where,
        include: includeRelations,
        orderBy: [{ status: 'asc' }, { departureTime: 'asc' }],
      });

      res.json({ success: true, assignments });
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async createAssignment(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      if (userType !== 'ORGANIZATION') {
        return res.status(403).json({ success: false, message: 'Only organizations can create assignments' });
      }

      const data = assignmentSchema.parse(req.body);

      // Verify vehicle belongs to this org
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: data.vehicleId, organizationId: orgId },
      });
      if (!vehicle) {
        return res.status(400).json({ success: false, message: 'Vehicle not found in your fleet' });
      }

      // Verify driver belongs to this org
      const driver = await prisma.user.findFirst({
        where: { id: data.driverId, organizationId: orgId, role: 'DRIVER' },
      });
      if (!driver) {
        return res.status(400).json({ success: false, message: 'Driver not found in your organization' });
      }

      // Verify route exists and is active
      const route = await (prisma as any).route.findFirst({
        where: { id: data.routeId, isActive: true },
      });
      if (!route) {
        return res.status(400).json({ success: false, message: 'Route not found or inactive' });
      }

      // Check vehicle isn't already assigned on overlapping days/time
      const vehicleConflict = await db.busAssignment.findFirst({
        where: {
          vehicleId: data.vehicleId,
          departureTime: data.departureTime,
          status: 'ACTIVE',
          days: { hasSome: data.days },
        },
      });
      if (vehicleConflict) {
        return res.status(409).json({ success: false, message: 'Vehicle already assigned at this time on overlapping days' });
      }

      // Check driver isn't double-booked
      const driverConflict = await db.busAssignment.findFirst({
        where: {
          driverId: data.driverId,
          departureTime: data.departureTime,
          status: 'ACTIVE',
          days: { hasSome: data.days },
        },
      });
      if (driverConflict) {
        return res.status(409).json({ success: false, message: 'Driver already assigned at this time on overlapping days' });
      }

      const assignment = await db.busAssignment.create({
        data: {
          organizationId: orgId,
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          routeId: data.routeId,
          departureTime: data.departureTime,
          days: data.days,
          notes: data.notes,
        },
        include: includeRelations,
      });

      res.status(201).json({ success: true, message: 'Assignment created', assignment });
    } catch (error) {
      console.error('Create assignment error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async updateAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      const existing = await db.busAssignment.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ success: false, message: 'Assignment not found' });

      if (userType === 'ORGANIZATION' && existing.organizationId !== orgId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const data = assignmentSchema.partial().extend({
        status: z.enum(['ACTIVE', 'SUSPENDED', 'COMPLETED']).optional(),
      }).parse(req.body);

      const assignment = await db.busAssignment.update({
        where: { id },
        data: data as any,
        include: includeRelations,
      });

      res.json({ success: true, message: 'Assignment updated', assignment });
    } catch (error) {
      console.error('Update assignment error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async deleteAssignment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      const existing = await db.busAssignment.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ success: false, message: 'Assignment not found' });

      if (userType === 'ORGANIZATION' && existing.organizationId !== orgId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      await db.busAssignment.delete({ where: { id } });
      res.json({ success: true, message: 'Assignment deleted' });
    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get assignments for the authenticated driver (mobile app)
  static async getMyAssignments(req: Request, res: Response) {
    try {
      const driverId = (req as any).user?.id;

      if (!driverId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const today = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];

      const assignments = await db.busAssignment.findMany({
        where: {
          driverId,
          status: 'ACTIVE',
        },
        include: {
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              type: true,
              capacity: true,
              iotDevice: {
                select: { passengerCount: true, status: true },
              },
            },
          },
          route: {
            include: {
              stops: { orderBy: { order: 'asc' } },
            },
          },
          organization: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { departureTime: 'asc' },
      });

      // Mark which assignments run today
      const enriched = assignments.map((a: any) => ({
        ...a,
        runsToday: a.days.includes(today),
        todayDay: today,
      }));

      res.json({ success: true, assignments: enriched });
    } catch (error) {
      console.error('Get my assignments error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
