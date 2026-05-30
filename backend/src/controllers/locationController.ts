import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

export class LocationController {
  // POST /api/location/shift/start — mark driver on-shift and set isAvailable
  static async startShift(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

      // Mark driver as available in their profile
      await prisma.driverProfile.updateMany({
        where: { userId: driverId },
        data: { isAvailable: true },
      });

      // Upsert a location record flagged as on-shift (coords will be filled by first GPS ping)
      const location = await prisma.driverLocation.upsert({
        where: { driverId },
        update: { isOnShift: true, recordedAt: new Date() },
        create: { driverId, latitude: 0, longitude: 0, isOnShift: true },
      });

      return res.json({ success: true, shiftStatus: 'ACTIVE', location });
    } catch (error) {
      console.error('Start shift error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/location/shift/end — mark driver off-shift
  static async endShift(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

      // Mark driver as unavailable
      await prisma.driverProfile.updateMany({
        where: { userId: driverId },
        data: { isAvailable: false },
      });

      // Mark location record as off-shift
      await prisma.driverLocation.updateMany({
        where: { driverId },
        data: { isOnShift: false },
      });

      return res.json({ success: true, shiftStatus: 'ENDED' });
    } catch (error) {
      console.error('End shift error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/location/shift/status — driver checks their current shift state on app load
  static async getShiftStatus(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

      const [profile, location] = await Promise.all([
        prisma.driverProfile.findUnique({ where: { userId: driverId }, select: { isAvailable: true } }),
        prisma.driverLocation.findUnique({ where: { driverId }, select: { isOnShift: true, recordedAt: true } }),
      ]);

      const isOnShift = profile?.isAvailable === true && location?.isOnShift === true;
      return res.json({ success: true, isOnShift, lastSeen: location?.recordedAt ?? null });
    } catch (error) {
      console.error('Shift status error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/location — driver updates their position
  static async updateLocation(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      if (!driverId) return res.status(401).json({ error: 'Unauthorized' });

      const { latitude, longitude, accuracy, heading, speed, isOnShift } = req.body;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'latitude and longitude are required numbers' });
      }

      const location = await prisma.driverLocation.upsert({
        where: { driverId },
        update: {
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          heading: heading ?? null,
          speed: speed ?? null,
          isOnShift: isOnShift !== false,
          recordedAt: new Date(),
        },
        create: {
          driverId,
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          heading: heading ?? null,
          speed: speed ?? null,
          isOnShift: isOnShift !== false,
        },
      });

      return res.json({ success: true, location });
    } catch (error) {
      console.error('Location update error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/location/live — returns all drivers currently on shift with their location
  static async getLiveLocations(req: AuthRequest, res: Response) {
    try {
      const userType = req.user?.userType;
      const organizationId = req.user?.organizationId;

      // Build filter: org users only see their own drivers
      const whereClause: any = { isOnShift: true };

      if (userType === 'ORGANIZATION' && organizationId) {
        whereClause.driver = { organizationId };
      }

      const locations = await prisma.driverLocation.findMany({
        where: whereClause,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              organizationId: true,
              assignments: {
                where: { status: 'ACTIVE' },
                take: 1,
                include: {
                  vehicle: { select: { plateNumber: true, type: true } },
                  route: { select: { name: true, routeNumber: true } },
                },
              },
            },
          },
        },
        orderBy: { recordedAt: 'desc' },
      });

      return res.json({ success: true, locations });
    } catch (error) {
      console.error('Get live locations error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
