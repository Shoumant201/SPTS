import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const stopSchema = z.object({
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  order: z.number().int().min(1),
});

const createRouteSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  routeNumber: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  stops: z.array(stopSchema).min(2, 'At least 2 stops required'),
});

const updateRouteSchema = createRouteSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Haversine formula to calculate distance between two GPS points in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateTotalDistance(stops: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineDistance(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
  }
  return Math.round(total * 100) / 100;
}

export class RouteController {
  // Public endpoint - Get all active routes (for passengers)
  static async getPublicRoutes(req: Request, res: Response) {
    try {
      const { search, sortBy = 'name' } = req.query;

      const where: any = { isActive: true };

      // Search by route name, number, start/end point
      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { routeNumber: { contains: search, mode: 'insensitive' } },
          { startPoint: { contains: search, mode: 'insensitive' } },
          { endPoint: { contains: search, mode: 'insensitive' } },
        ];
      }

      const orderBy: any = {};
      if (sortBy === 'price') orderBy.basePrice = 'asc';
      else if (sortBy === 'distance') orderBy.distance = 'asc';
      else orderBy.name = 'asc';

      const routes = await prisma.route.findMany({
        where,
        include: {
          stops: { orderBy: { order: 'asc' } },
          organization: { select: { id: true, name: true } },
          _count: { 
            select: { 
              trips: { where: { status: 'COMPLETED' } },
              assignments: { where: { status: 'ACTIVE' } }
            } 
          },
        },
        orderBy,
      });

      res.json({ success: true, count: routes.length, routes });
    } catch (error) {
      console.error('Get public routes error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Public endpoint - Search routes by destination
  static async searchRoutes(req: Request, res: Response) {
    try {
      const { destination, maxPrice, minDistance, maxDistance } = req.query;

      if (!destination || typeof destination !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: 'Destination parameter is required' 
        });
      }

      const where: any = { isActive: true };

      // Search in route name, stops, start/end points
      where.OR = [
        { name: { contains: destination, mode: 'insensitive' } },
        { startPoint: { contains: destination, mode: 'insensitive' } },
        { endPoint: { contains: destination, mode: 'insensitive' } },
        { stops: { some: { name: { contains: destination, mode: 'insensitive' } } } },
      ];

      // Price filter
      if (maxPrice) {
        where.basePrice = { lte: parseFloat(maxPrice as string) };
      }

      // Distance filters
      if (minDistance || maxDistance) {
        where.distance = {};
        if (minDistance) where.distance.gte = parseFloat(minDistance as string);
        if (maxDistance) where.distance.lte = parseFloat(maxDistance as string);
      }

      const routes = await prisma.route.findMany({
        where,
        include: {
          stops: { orderBy: { order: 'asc' } },
          organization: { select: { id: true, name: true } },
          _count: { 
            select: { 
              assignments: { where: { status: 'ACTIVE' } }
            } 
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json({ 
        success: true, 
        count: routes.length, 
        routes,
        searchQuery: destination 
      });
    } catch (error) {
      console.error('Search routes error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Public endpoint - Get route details
  static async getPublicRoute(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const route = await prisma.route.findUnique({
        where: { id, isActive: true },
        include: {
          stops: { orderBy: { order: 'asc' } },
          organization: { select: { id: true, name: true } },
          assignments: {
            where: { status: 'ACTIVE' },
            include: {
              driver: { select: { id: true, name: true } },
              vehicle: { select: { plateNumber: true, type: true, capacity: true } },
            },
          },
          _count: { 
            select: { 
              trips: { where: { status: 'COMPLETED' } }
            } 
          },
        },
      });

      if (!route) {
        return res.status(404).json({ success: false, message: 'Route not found' });
      }

      res.json({ success: true, route });
    } catch (error) {
      console.error('Get public route error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async getRoutes(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      const where: any = {};
      if (userType === 'ORGANIZATION') where.organizationId = orgId;

      const routes = await prisma.route.findMany({
        where,
        include: {
          stops: { orderBy: { order: 'asc' } },
          organization: { select: { id: true, name: true } },
          _count: { select: { trips: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, routes });
    } catch (error) {
      console.error('Get routes error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async getRoute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      const route = await prisma.route.findUnique({
        where: { id },
        include: {
          stops: { orderBy: { order: 'asc' } },
          organization: { select: { id: true, name: true } },
        },
      });

      if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

      if (userType === 'ORGANIZATION' && route.organizationId !== orgId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({ success: true, route });
    } catch (error) {
      console.error('Get route error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async createRoute(req: Request, res: Response) {
    try {
      const userType = (req as any).user?.userType;

      // Only SuperAdmin and Admin can create routes
      if (!['SUPER_ADMIN', 'ADMIN'].includes(userType)) {
        return res.status(403).json({ success: false, message: 'Only admins can create routes' });
      }

      const data = createRouteSchema.parse(req.body);
      const sortedStops = [...data.stops].sort((a, b) => a.order - b.order);
      const distance = calculateTotalDistance(sortedStops);

      const route = await prisma.route.create({
        data: {
          name: data.name,
          routeNumber: data.routeNumber,
          description: data.description,
          startPoint: sortedStops[0].name,
          endPoint: sortedStops[sortedStops.length - 1].name,
          distance,
          basePrice: data.basePrice,
          // Routes are global — not org-scoped
          stops: {
            create: sortedStops.map(s => ({
              name: s.name,
              lat: s.lat,
              lng: s.lng,
              order: s.order,
            })),
          },
        },
        include: {
          stops: { orderBy: { order: 'asc' } },
        },
      });

      res.status(201).json({ success: true, message: 'Route created', route });
    } catch (error) {
      console.error('Create route error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async updateRoute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userType = (req as any).user?.userType;

      if (!['SUPER_ADMIN', 'ADMIN'].includes(userType)) {
        return res.status(403).json({ success: false, message: 'Only admins can modify routes' });
      }

      const existing = await prisma.route.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ success: false, message: 'Route not found' });

      const data = updateRouteSchema.parse(req.body);

      let updateData: any = {
        name: data.name,
        routeNumber: data.routeNumber,
        description: data.description,
        basePrice: data.basePrice,
        isActive: data.isActive,
      };

      // If stops are being updated, recalculate distance and replace stops
      if (data.stops && data.stops.length >= 2) {
        const sortedStops = [...data.stops].sort((a, b) => a.order - b.order);
        updateData.distance = calculateTotalDistance(sortedStops);
        updateData.startPoint = sortedStops[0].name;
        updateData.endPoint = sortedStops[sortedStops.length - 1].name;

        // Delete old stops and recreate
        await prisma.routeStop.deleteMany({ where: { routeId: id } });
        updateData.stops = {
          create: sortedStops.map(s => ({
            name: s.name,
            lat: s.lat,
            lng: s.lng,
            order: s.order,
          })),
        };
      }

      // Remove undefined fields
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      const route = await prisma.route.update({
        where: { id },
        data: updateData,
        include: { stops: { orderBy: { order: 'asc' } } },
      });

      res.json({ success: true, message: 'Route updated', route });
    } catch (error) {
      console.error('Update route error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  static async deleteRoute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userType = (req as any).user?.userType;

      if (!['SUPER_ADMIN', 'ADMIN'].includes(userType)) {
        return res.status(403).json({ success: false, message: 'Only admins can delete routes' });
      }

      const route = await prisma.route.findUnique({ where: { id } });
      if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

      await prisma.route.delete({ where: { id } });
      res.json({ success: true, message: 'Route deleted' });
    } catch (error) {
      console.error('Delete route error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
