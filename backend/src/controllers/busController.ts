import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate estimated time of arrival based on distance and average speed
function calculateETA(distanceKm: number, averageSpeedKmh: number = 30): number {
  // Returns ETA in minutes
  const hours = distanceKm / averageSpeedKmh;
  return Math.round(hours * 60);
}

export class BusController {
  // GET /api/buses/nearby - Find buses near passenger location
  static async getNearbyBuses(req: Request, res: Response) {
    try {
      const { latitude, longitude, radius = 5 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'latitude and longitude are required',
        });
      }

      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const radiusKm = parseFloat(radius as string);

      if (isNaN(lat) || isNaN(lon) || isNaN(radiusKm)) {
        return res.status(400).json({
          error: 'Invalid coordinates or radius',
        });
      }

      // Get all active drivers with their locations
      const activeDrivers = await prisma.driverLocation.findMany({
        where: {
          isOnShift: true,
          latitude: { not: 0 },
          longitude: { not: 0 },
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              organizationId: true,
              assignments: {
                where: { status: 'ACTIVE' },
                include: {
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
                      basePrice: true,
                      stops: {
                        orderBy: { order: 'asc' },
                        select: {
                          id: true,
                          name: true,
                          lat: true,
                          lng: true,
                          order: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Calculate distances and filter by radius
      const nearbyBuses = activeDrivers
        .map((location) => {
          const distance = calculateDistance(
            lat,
            lon,
            location.latitude,
            location.longitude
          );

          // Only include buses within radius
          if (distance > radiusKm) return null;

          const assignment = location.driver.assignments[0];
          if (!assignment) return null;

          const eta = calculateETA(distance);

          return {
            id: location.id,
            driverId: location.driver.id,
            driverName: location.driver.name,
            driverPhone: location.driver.phone,
            vehicle: assignment.vehicle,
            route: assignment.route,
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              heading: location.heading,
              speed: location.speed,
              recordedAt: location.recordedAt,
            },
            distance: Math.round(distance * 100) / 100, // Round to 2 decimals
            eta: eta,
            etaText: eta < 60 ? `${eta} mins` : `${Math.round(eta / 60)} hrs`,
          };
        })
        .filter((bus) => bus !== null)
        .sort((a, b) => a!.distance - b!.distance); // Sort by distance

      return res.json({
        success: true,
        count: nearbyBuses.length,
        buses: nearbyBuses,
        searchLocation: { latitude: lat, longitude: lon },
        radiusKm,
      });
    } catch (error) {
      console.error('Get nearby buses error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/buses/:id/location - Get specific bus location
  static async getBusLocation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const location = await prisma.driverLocation.findUnique({
        where: { driverId: id },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              assignments: {
                where: { status: 'ACTIVE' },
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
              },
            },
          },
        },
      });

      if (!location) {
        return res.status(404).json({ error: 'Bus not found' });
      }

      return res.json({
        success: true,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          heading: location.heading,
          speed: location.speed,
          isOnShift: location.isOnShift,
          recordedAt: location.recordedAt,
          driver: location.driver,
        },
      });
    } catch (error) {
      console.error('Get bus location error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/buses/route/:routeId - Get all buses on a specific route
  static async getBusesByRoute(req: Request, res: Response) {
    try {
      const { routeId } = req.params;

      const assignments = await prisma.busAssignment.findMany({
        where: {
          routeId,
          status: 'ACTIVE',
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              driverLocation: true,
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
              basePrice: true,
            },
          },
        },
      });

      const buses = assignments
        .filter((assignment) => assignment.driver.driverLocation?.isOnShift)
        .map((assignment) => ({
          assignmentId: assignment.id,
          driver: {
            id: assignment.driver.id,
            name: assignment.driver.name,
          },
          vehicle: assignment.vehicle,
          route: assignment.route,
          location: assignment.driver.driverLocation
            ? {
                latitude: assignment.driver.driverLocation.latitude,
                longitude: assignment.driver.driverLocation.longitude,
                accuracy: assignment.driver.driverLocation.accuracy,
                heading: assignment.driver.driverLocation.heading,
                speed: assignment.driver.driverLocation.speed,
                recordedAt: assignment.driver.driverLocation.recordedAt,
              }
            : null,
        }));

      return res.json({
        success: true,
        count: buses.length,
        buses,
      });
    } catch (error) {
      console.error('Get buses by route error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
