import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export class IncidentController {
  /**
   * Report a new incident (Driver)
   */
  static async reportIncident(req: AuthRequest, res: Response) {
    try {
      const {
        type,
        severity,
        title,
        description,
        location,
        latitude,
        longitude,
        vehicleId,
        routeId,
        assignmentId,
        estimatedDelay,
        affectedPassengers,
        requiresAssistance,
        isEmergency,
      } = req.body;

      const driverId = req.user?.id;
      if (!driverId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get driver's organization
      const driver = await prisma.user.findUnique({
        where: { id: driverId },
        select: { organizationId: true },
      });

      if (!driver?.organizationId) {
        return res.status(400).json({
          error: 'Driver must be associated with an organization',
        });
      }

      const incident = await prisma.incidentReport.create({
        data: {
          type,
          severity: severity || 'MEDIUM',
          title,
          description,
          location,
          latitude,
          longitude,
          driverId,
          vehicleId,
          routeId,
          assignmentId,
          organizationId: driver.organizationId,
          estimatedDelay,
          affectedPassengers,
          requiresAssistance: requiresAssistance || false,
          isEmergency: isEmergency || false,
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              type: true,
            },
          },
          route: {
            select: {
              id: true,
              name: true,
              routeNumber: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Incident reported successfully',
        incident,
      });
    } catch (error) {
      console.error('Report incident error:', error);
      res.status(500).json({ error: 'Failed to report incident' });
    }
  }

  /**
   * Get driver's incident reports
   */
  static async getDriverIncidents(req: AuthRequest, res: Response) {
    try {
      const driverId = req.user?.id;
      const { status, type, limit = '50' } = req.query;

      const where: any = { driverId };
      if (status) where.status = status;
      if (type) where.type = type;

      const incidents = await prisma.incidentReport.findMany({
        where,
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              type: true,
            },
          },
          route: {
            select: {
              name: true,
              routeNumber: true,
            },
          },
        },
        orderBy: { reportedAt: 'desc' },
        take: parseInt(limit as string),
      });

      res.json({
        success: true,
        incidents,
        count: incidents.length,
      });
    } catch (error) {
      console.error('Get driver incidents error:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  /**
   * Get organization incidents (Organization/Admin)
   */
  static async getOrganizationIncidents(req: AuthRequest, res: Response) {
    try {
      const { status, type, severity, limit = '100', driverId } = req.query;
      const organizationId = req.user?.organizationId || req.user?.id;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const where: any = { organizationId };
      if (status) where.status = status;
      if (type) where.type = type;
      if (severity) where.severity = severity;
      if (driverId) where.driverId = driverId;

      const incidents = await prisma.incidentReport.findMany({
        where,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              type: true,
            },
          },
          route: {
            select: {
              id: true,
              name: true,
              routeNumber: true,
              startPoint: true,
              endPoint: true,
            },
          },
          assignment: {
            select: {
              id: true,
              departureTime: true,
            },
          },
        },
        orderBy: { reportedAt: 'desc' },
        take: parseInt(limit as string),
      });

      // Get counts by status
      const statusCounts = await prisma.incidentReport.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true,
      });

      // Get counts by severity
      const severityCounts = await prisma.incidentReport.groupBy({
        by: ['severity'],
        where: { organizationId },
        _count: true,
      });

      res.json({
        success: true,
        incidents,
        count: incidents.length,
        stats: {
          byStatus: statusCounts,
          bySeverity: severityCounts,
        },
      });
    } catch (error) {
      console.error('Get organization incidents error:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  /**
   * Get active/unresolved incidents (for alerts)
   */
  static async getActiveIncidents(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId || req.user?.id;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const incidents = await prisma.incidentReport.findMany({
        where: {
          organizationId,
          status: {
            in: ['REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS'],
          },
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              plateNumber: true,
            },
          },
          route: {
            select: {
              name: true,
              routeNumber: true,
            },
          },
        },
        orderBy: [{ severity: 'desc' }, { reportedAt: 'desc' }],
      });

      res.json({
        success: true,
        incidents,
        count: incidents.length,
      });
    } catch (error) {
      console.error('Get active incidents error:', error);
      res.status(500).json({ error: 'Failed to fetch active incidents' });
    }
  }

  /**
   * Update incident status (Organization/Admin)
   */
  static async updateIncidentStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, resolutionNotes } = req.body;
      const userId = req.user?.id;

      const incident = await prisma.incidentReport.findUnique({
        where: { id },
      });

      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'ACKNOWLEDGED' && !incident.acknowledgedAt) {
        updateData.acknowledgedAt = new Date();
        updateData.acknowledgedBy = userId;
      }

      if (status === 'RESOLVED' && !incident.resolvedAt) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = userId;
        if (resolutionNotes) {
          updateData.resolutionNotes = resolutionNotes;
        }
      }

      const updated = await prisma.incidentReport.update({
        where: { id },
        data: updateData,
        include: {
          driver: {
            select: {
              name: true,
              phone: true,
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
        message: 'Incident status updated',
        incident: updated,
      });
    } catch (error) {
      console.error('Update incident status error:', error);
      res.status(500).json({ error: 'Failed to update incident status' });
    }
  }

  /**
   * Get incident details
   */
  static async getIncidentDetails(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const incident = await prisma.incidentReport.findUnique({
        where: { id },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              type: true,
              capacity: true,
            },
          },
          route: {
            select: {
              id: true,
              name: true,
              routeNumber: true,
              startPoint: true,
              endPoint: true,
              distance: true,
            },
          },
          assignment: {
            select: {
              id: true,
              departureTime: true,
              days: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      res.json({
        success: true,
        incident,
      });
    } catch (error) {
      console.error('Get incident details error:', error);
      res.status(500).json({ error: 'Failed to fetch incident details' });
    }
  }

  /**
   * Get incident statistics
   */
  static async getIncidentStats(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId || req.user?.id;
      const { startDate, endDate } = req.query;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const where: any = { organizationId };
      if (startDate || endDate) {
        where.reportedAt = {};
        if (startDate) where.reportedAt.gte = new Date(startDate as string);
        if (endDate) where.reportedAt.lte = new Date(endDate as string);
      }

      const [
        total,
        byType,
        bySeverity,
        byStatus,
        emergencies,
        avgResolutionTime,
      ] = await Promise.all([
        prisma.incidentReport.count({ where }),
        prisma.incidentReport.groupBy({
          by: ['type'],
          where,
          _count: true,
        }),
        prisma.incidentReport.groupBy({
          by: ['severity'],
          where,
          _count: true,
        }),
        prisma.incidentReport.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.incidentReport.count({
          where: { ...where, isEmergency: true },
        }),
        prisma.incidentReport.findMany({
          where: {
            ...where,
            status: 'RESOLVED',
            resolvedAt: { not: null },
          },
          select: {
            reportedAt: true,
            resolvedAt: true,
          },
        }),
      ]);

      // Calculate average resolution time in minutes
      const resolutionTimes = avgResolutionTime
        .filter((i) => i.resolvedAt)
        .map((i) => {
          const diff = i.resolvedAt!.getTime() - i.reportedAt.getTime();
          return diff / (1000 * 60); // Convert to minutes
        });

      const avgResolution =
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          : 0;

      res.json({
        success: true,
        stats: {
          total,
          emergencies,
          avgResolutionTimeMinutes: Math.round(avgResolution),
          byType,
          bySeverity,
          byStatus,
        },
      });
    } catch (error) {
      console.error('Get incident stats error:', error);
      res.status(500).json({ error: 'Failed to fetch incident statistics' });
    }
  }
}
