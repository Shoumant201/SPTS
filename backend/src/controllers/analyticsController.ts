import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class AnalyticsController {
  static async getSummary(req: Request, res: Response) {
    try {
      const userType = (req as any).user?.userType;
      const orgId = (req as any).user?.id;

      const isOrg = userType === 'ORGANIZATION';

      // Run all counts in parallel
      const [
        totalVehicles,
        activeVehicles,
        maintenanceVehicles,
        totalDrivers,
        totalRoutes,
        activeRoutes,
        totalAssignments,
        activeAssignments,
        pendingRequests,
        totalOrganizations,
      ] = await Promise.all([
        prisma.vehicle.count({ where: isOrg ? { organizationId: orgId } : {} }),
        prisma.vehicle.count({ where: { status: 'ACTIVE', ...(isOrg ? { organizationId: orgId } : {}) } }),
        prisma.vehicle.count({ where: { status: 'MAINTENANCE', ...(isOrg ? { organizationId: orgId } : {}) } }),
        prisma.user.count({ where: { role: 'DRIVER', isActive: true, ...(isOrg ? { organizationId: orgId } : {}) } }),
        prisma.route.count({ where: {} }),
        prisma.route.count({ where: { isActive: true } }),
        (prisma as any).busAssignment.count({ where: isOrg ? { organizationId: orgId } : {} }),
        (prisma as any).busAssignment.count({ where: { status: 'ACTIVE', ...(isOrg ? { organizationId: orgId } : {}) } }),
        prisma.organizationDriverRequest.count({ where: { status: 'PENDING', ...(isOrg ? { organizationId: orgId } : {}) } }),
        isOrg ? Promise.resolve(0) : prisma.organization.count(),
      ]);

      // IoT devices online
      const iotOnline = await (prisma as any).ioTDevice.count({
        where: { status: 'ACTIVE', ...(isOrg ? { vehicle: { organizationId: orgId } } : {}) },
      });

      res.json({
        success: true,
        summary: {
          vehicles: { total: totalVehicles, active: activeVehicles, maintenance: maintenanceVehicles, inactive: totalVehicles - activeVehicles - maintenanceVehicles },
          drivers: { total: totalDrivers },
          routes: { total: totalRoutes, active: activeRoutes },
          assignments: { total: totalAssignments, active: activeAssignments },
          requests: { pending: pendingRequests },
          organizations: { total: totalOrganizations },
          iot: { online: iotOnline },
        },
      });
    } catch (error) {
      console.error('Analytics summary error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async getFleetBreakdown(req: Request, res: Response) {
    try {
      const userType = (req as any).user?.userType;
      const orgId = (req as any).user?.id;
      const isOrg = userType === 'ORGANIZATION';
      const where = isOrg ? { organizationId: orgId } : {};

      const [byType, byStatus] = await Promise.all([
        prisma.vehicle.groupBy({ by: ['type'], where, _count: { id: true } }),
        prisma.vehicle.groupBy({ by: ['status'], where, _count: { id: true } }),
      ]);

      res.json({
        success: true,
        byType: byType.map(r => ({ label: r.type, count: r._count.id })),
        byStatus: byStatus.map(r => ({ label: r.status, count: r._count.id })),
      });
    } catch (error) {
      console.error('Fleet breakdown error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async getAssignmentBreakdown(req: Request, res: Response) {
    try {
      const userType = (req as any).user?.userType;
      const orgId = (req as any).user?.id;
      const isOrg = userType === 'ORGANIZATION';
      const where = isOrg ? { organizationId: orgId } : {};

      const db = prisma as any;

      const [byStatus, byDay, recentAssignments] = await Promise.all([
        db.busAssignment.groupBy({ by: ['status'], where, _count: { id: true } }),
        // Count assignments per day of week
        db.busAssignment.findMany({
          where: { ...where, status: 'ACTIVE' },
          select: { days: true },
        }),
        db.busAssignment.findMany({
          where,
          include: {
            vehicle: { select: { plateNumber: true, type: true } },
            driver: { select: { name: true, phone: true } },
            route: { select: { name: true, routeNumber: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      // Count per day
      const dayCount: Record<string, number> = { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0, SAT: 0, SUN: 0 };
      for (const a of byDay) {
        for (const d of a.days) {
          if (dayCount[d] !== undefined) dayCount[d]++;
        }
      }

      res.json({
        success: true,
        byStatus: byStatus.map((r: any) => ({ label: r.status, count: r._count.id })),
        byDay: Object.entries(dayCount).map(([day, count]) => ({ day, count })),
        recent: recentAssignments,
      });
    } catch (error) {
      console.error('Assignment breakdown error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async getDriverStats(req: Request, res: Response) {
    try {
      const userType = (req as any).user?.userType;
      const orgId = (req as any).user?.id;
      const isOrg = userType === 'ORGANIZATION';

      const drivers = await prisma.user.findMany({
        where: { role: 'DRIVER', isActive: true, ...(isOrg ? { organizationId: orgId } : {}) },
        include: {
          driverProfile: { select: { licenseType: true, experience: true, rating: true, totalTrips: true, isAvailable: true } },
          organization: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // Drivers with/without org
      const withOrg = await prisma.user.count({ where: { role: 'DRIVER', isActive: true, organizationId: { not: null } } });
      const withoutOrg = await prisma.user.count({ where: { role: 'DRIVER', isActive: true, organizationId: null } });
      const withProfile = await prisma.user.count({ where: { role: 'DRIVER', isActive: true, driverProfile: { isNot: null } } });

      res.json({
        success: true,
        stats: { withOrg, withoutOrg, withProfile, total: withOrg + withoutOrg },
        drivers: drivers.map(d => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          organization: d.organization?.name || null,
          licenseType: d.driverProfile?.licenseType || null,
          experience: d.driverProfile?.experience || 0,
          rating: d.driverProfile?.rating || 0,
          totalTrips: d.driverProfile?.totalTrips || 0,
          isAvailable: d.driverProfile?.isAvailable ?? true,
          hasProfile: !!d.driverProfile,
        })),
      });
    } catch (error) {
      console.error('Driver stats error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async getRouteStats(req: Request, res: Response) {
    try {
      const routes = await prisma.route.findMany({
        include: {
          stops: { select: { id: true } },
          _count: { select: { assignments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalDistance = routes.reduce((sum, r) => sum + r.distance, 0);
      const avgStops = routes.length > 0
        ? routes.reduce((sum, r) => sum + r.stops.length, 0) / routes.length
        : 0;

      res.json({
        success: true,
        stats: {
          total: routes.length,
          active: routes.filter(r => r.isActive).length,
          totalDistance: Math.round(totalDistance * 10) / 10,
          avgStops: Math.round(avgStops * 10) / 10,
        },
        routes: routes.map(r => ({
          id: r.id,
          name: r.name,
          routeNumber: r.routeNumber,
          distance: r.distance,
          basePrice: r.basePrice,
          stopCount: r.stops.length,
          assignmentCount: r._count.assignments,
          isActive: r.isActive,
        })),
      });
    } catch (error) {
      console.error('Route stats error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
