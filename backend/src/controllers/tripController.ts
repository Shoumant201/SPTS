import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export class TripController {
  /**
   * Start a new trip (Driver)
   */
  static async startTrip(req: AuthRequest, res: Response) {
    try {
      const { routeId, vehicleId, assignmentId, startLocation, passengerCount } = req.body;
      const driverId = req.user?.id;

      if (!driverId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get route details for pricing
      const route = await prisma.route.findUnique({
        where: { id: routeId },
      });

      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      // Create trip
      const trip = await prisma.trip.create({
        data: {
          userId: driverId, // For now, driver is also the user
          driverId,
          routeId,
          vehicleId,
          assignmentId,
          startTime: new Date(),
          startLocation,
          basePrice: route.basePrice,
          finalPrice: route.basePrice,
          passengerCount: passengerCount || 0,
          status: 'ACTIVE',
        },
        include: {
          route: {
            select: {
              name: true,
              routeNumber: true,
              startPoint: true,
              endPoint: true,
              distance: true,
            },
          },
          vehicle: {
            select: {
              plateNumber: true,
              type: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Trip started successfully',
        trip,
      });
    } catch (error) {
      console.error('Start trip error:', error);
      res.status(500).json({ error: 'Failed to start trip' });
    }
  }

  /**
   * End a trip (Driver)
   */
  static async endTrip(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { endLocation, passengerCount, notes } = req.body;
      const driverId = req.user?.id;

      const trip = await prisma.trip.findUnique({
        where: { id },
        include: { route: true },
      });

      if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      if (trip.driverId !== driverId) {
        return res.status(403).json({ error: 'Not authorized to end this trip' });
      }

      if (trip.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Trip is not active' });
      }

      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - trip.startTime.getTime()) / (1000 * 60)); // minutes

      // Calculate earnings (70% to driver, 30% to organization)
      const driverEarnings = trip.finalPrice * 0.7;
      const organizationRevenue = trip.finalPrice * 0.3;

      const updatedTrip = await prisma.trip.update({
        where: { id },
        data: {
          endTime,
          endLocation,
          duration,
          distance: trip.route.distance,
          passengerCount: passengerCount || trip.passengerCount,
          driverEarnings,
          organizationRevenue,
          notes,
          status: 'COMPLETED',
        },
        include: {
          route: {
            select: {
              name: true,
              routeNumber: true,
              distance: true,
            },
          },
          vehicle: {
            select: {
              plateNumber: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: 'Trip completed successfully',
        trip: updatedTrip,
      });
    } catch (error) {
      console.error('End trip error:', error);
      res.status(500).json({ error: 'Failed to end trip' });
    }
  }

  /**
   * Get driver's trip history
   */
  static async getDriverTrips(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      const { status, startDate, endDate, limit = '50' } = req.query;

      const where: any = { driverId };
      
      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.startTime = {};
        if (startDate) where.startTime.gte = new Date(startDate as string);
        if (endDate) where.startTime.lte = new Date(endDate as string);
      }

      const trips = await prisma.trip.findMany({
        where,
        include: {
          route: {
            select: {
              name: true,
              routeNumber: true,
              startPoint: true,
              endPoint: true,
              distance: true,
            },
          },
          vehicle: {
            select: {
              plateNumber: true,
              type: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
        take: parseInt(limit as string),
      });

      res.json({
        success: true,
        trips,
        count: trips.length,
      });
    } catch (error) {
      console.error('Get driver trips error:', error);
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  }

  /**
   * Get driver's earnings summary
   */
  static async getDriverEarnings(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      const { startDate, endDate, period = 'all' } = req.query;

      const where: any = {
        driverId,
        status: 'COMPLETED',
      };

      // Calculate date range based on period
      const now = new Date();
      if (period === 'today') {
        where.startTime = {
          gte: new Date(now.setHours(0, 0, 0, 0)),
        };
      } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        where.startTime = { gte: weekAgo };
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        where.startTime = { gte: monthAgo };
      } else if (startDate || endDate) {
        where.startTime = {};
        if (startDate) where.startTime.gte = new Date(startDate as string);
        if (endDate) where.startTime.lte = new Date(endDate as string);
      }

      const [trips, aggregates] = await Promise.all([
        prisma.trip.findMany({
          where,
          select: {
            id: true,
            startTime: true,
            driverEarnings: true,
            finalPrice: true,
            duration: true,
            distance: true,
          },
          orderBy: { startTime: 'desc' },
        }),
        prisma.trip.aggregate({
          where,
          _sum: {
            driverEarnings: true,
            finalPrice: true,
            distance: true,
            duration: true,
          },
          _count: true,
        }),
      ]);

      // Group earnings by date
      const earningsByDate: Record<string, number> = {};
      trips.forEach((trip) => {
        const date = trip.startTime.toISOString().split('T')[0];
        earningsByDate[date] = (earningsByDate[date] || 0) + (trip.driverEarnings || 0);
      });

      res.json({
        success: true,
        summary: {
          totalEarnings: aggregates._sum.driverEarnings || 0,
          totalRevenue: aggregates._sum.finalPrice || 0,
          totalTrips: aggregates._count,
          totalDistance: aggregates._sum.distance || 0,
          totalDuration: aggregates._sum.duration || 0,
          averageEarningsPerTrip:
            aggregates._count > 0
              ? (aggregates._sum.driverEarnings || 0) / aggregates._count
              : 0,
        },
        earningsByDate,
        recentTrips: trips.slice(0, 10),
      });
    } catch (error) {
      console.error('Get driver earnings error:', error);
      res.status(500).json({ error: 'Failed to fetch earnings' });
    }
  }

  /**
   * Get active trip (Driver)
   */
  static async getActiveTrip(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;

      const trip = await prisma.trip.findFirst({
        where: {
          driverId,
          status: 'ACTIVE',
        },
        include: {
          route: {
            select: {
              name: true,
              routeNumber: true,
              startPoint: true,
              endPoint: true,
              distance: true,
            },
          },
          vehicle: {
            select: {
              plateNumber: true,
              type: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
      });

      res.json({
        success: true,
        trip,
      });
    } catch (error) {
      console.error('Get active trip error:', error);
      res.status(500).json({ error: 'Failed to fetch active trip' });
    }
  }

  /**
   * Get trip statistics
   */
  static async getTripStats(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      const { period = 'month' } = req.query;

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const [completed, cancelled, totalEarnings, topRoutes] = await Promise.all([
        prisma.trip.count({
          where: {
            driverId,
            status: 'COMPLETED',
            startTime: { gte: startDate },
          },
        }),
        prisma.trip.count({
          where: {
            driverId,
            status: 'CANCELLED',
            startTime: { gte: startDate },
          },
        }),
        prisma.trip.aggregate({
          where: {
            driverId,
            status: 'COMPLETED',
            startTime: { gte: startDate },
          },
          _sum: {
            driverEarnings: true,
          },
        }),
        prisma.trip.groupBy({
          by: ['routeId'],
          where: {
            driverId,
            status: 'COMPLETED',
            startTime: { gte: startDate },
          },
          _count: true,
          _sum: {
            driverEarnings: true,
          },
          orderBy: {
            _count: {
              routeId: 'desc',
            },
          },
          take: 5,
        }),
      ]);

      // Get route details for top routes
      const routeIds = topRoutes.map((r) => r.routeId);
      const routes = await prisma.route.findMany({
        where: { id: { in: routeIds } },
        select: { id: true, name: true, routeNumber: true },
      });

      const topRoutesWithDetails = topRoutes.map((tr) => {
        const route = routes.find((r) => r.id === tr.routeId);
        return {
          route: route || { name: 'Unknown', routeNumber: null },
          tripCount: tr._count,
          earnings: tr._sum.driverEarnings || 0,
        };
      });

      res.json({
        success: true,
        stats: {
          completedTrips: completed,
          cancelledTrips: cancelled,
          totalEarnings: totalEarnings._sum.driverEarnings || 0,
          topRoutes: topRoutesWithDetails,
        },
      });
    } catch (error) {
      console.error('Get trip stats error:', error);
      res.status(500).json({ error: 'Failed to fetch trip statistics' });
    }
  }
}
