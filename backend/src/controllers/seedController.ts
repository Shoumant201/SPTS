import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/password';

/**
 * Seed Controller - Provides HTTP endpoints for database seeding
 * Use with caution - should be protected or disabled in production
 */
export class SeedController {
  /**
   * Seed initial super admin account
   * POST /api/seed/super-admin
   * Body: { email, password, name, seedKey }
   */
  static async seedSuperAdmin(req: Request, res: Response) {
    try {
      const { email, password, name, seedKey } = req.body;

      // Verify seed key from environment
      const expectedSeedKey = process.env.SEED_KEY;
      if (!expectedSeedKey || seedKey !== expectedSeedKey) {
        return res.status(403).json({ 
          error: 'Invalid seed key',
          message: 'Set SEED_KEY environment variable to enable seeding'
        });
      }

      // Check if super admin already exists
      const existingSuperAdmin = await prisma.superAdmin.findFirst();
      if (existingSuperAdmin) {
        return res.status(400).json({ 
          error: 'Super admin already exists',
          message: 'Database already has a super admin account'
        });
      }

      // Create super admin
      const hashedPassword = await hashPassword(password);
      const superAdmin = await prisma.superAdmin.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          createdAt: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Super admin created successfully',
        superAdmin
      });
    } catch (error) {
      console.error('Seed super admin error:', error);
      res.status(500).json({ error: 'Failed to seed super admin' });
    }
  }

  /**
   * Seed demo data (organizations, admins, users, etc.)
   * POST /api/seed/demo-data
   * Body: { seedKey }
   */
  static async seedDemoData(req: Request, res: Response) {
    try {
      const { seedKey } = req.body;

      // Verify seed key from environment
      const expectedSeedKey = process.env.SEED_KEY;
      if (!expectedSeedKey || seedKey !== expectedSeedKey) {
        return res.status(403).json({ 
          error: 'Invalid seed key',
          message: 'Set SEED_KEY environment variable to enable seeding'
        });
      }

      const results: any = {
        organizations: [],
        admins: [],
        drivers: [],
        passengers: [],
        vehicles: [],
        routes: []
      };

      // Create demo organizations
      const org1 = await prisma.organization.create({
        data: {
          email: 'citybus@example.com',
          password: await hashPassword('CityBus123!'),
          name: 'City Bus Services',
          contactPerson: 'John Manager',
          phone: '+1234567890',
          address: '123 Main St, City',
          isActive: true
        }
      });
      results.organizations.push(org1);

      const org2 = await prisma.organization.create({
        data: {
          email: 'metrotrans@example.com',
          password: await hashPassword('Metro123!'),
          name: 'Metro Transit',
          contactPerson: 'Jane Director',
          phone: '+1234567891',
          address: '456 Transit Ave, City',
          isActive: true
        }
      });
      results.organizations.push(org2);

      // Create demo admin
      const admin = await prisma.admin.create({
        data: {
          email: 'admin@sptm.com',
          password: await hashPassword('Admin123!'),
          name: 'System Administrator',
          isActive: true
        }
      });
      results.admins.push(admin);

      // Create demo drivers
      const driver1 = await prisma.user.create({
        data: {
          phone: '+1234567892',
          email: 'driver1@citybus.com',
          password: await hashPassword('Driver123!'),
          name: 'Mike Driver',
          role: 'DRIVER',
          organizationId: org1.id,
          isActive: true
        }
      });
      results.drivers.push(driver1);

      const driver2 = await prisma.user.create({
        data: {
          phone: '+1234567893',
          email: 'driver2@metro.com',
          password: await hashPassword('Driver123!'),
          name: 'Sarah Driver',
          role: 'DRIVER',
          organizationId: org2.id,
          isActive: true
        }
      });
      results.drivers.push(driver2);

      // Create demo passengers
      const passenger1 = await prisma.user.create({
        data: {
          phone: '+1234567894',
          email: 'passenger1@example.com',
          password: await hashPassword('Pass123!'),
          name: 'Alice Passenger',
          role: 'PASSENGER',
          isActive: true
        }
      });
      results.passengers.push(passenger1);

      const passenger2 = await prisma.user.create({
        data: {
          phone: '+1234567895',
          email: 'passenger2@example.com',
          password: await hashPassword('Pass123!'),
          name: 'Bob Passenger',
          role: 'PASSENGER',
          isActive: true
        }
      });
      results.passengers.push(passenger2);

      // Create demo vehicles
      const vehicle1 = await prisma.vehicle.create({
        data: {
          plateNumber: 'BUS-001',
          type: 'STANDARD',
          capacity: 50,
          organizationId: org1.id,
          status: 'ACTIVE'
        }
      });
      results.vehicles.push(vehicle1);

      const vehicle2 = await prisma.vehicle.create({
        data: {
          plateNumber: 'BUS-002',
          type: 'STANDARD',
          capacity: 45,
          organizationId: org2.id,
          status: 'ACTIVE'
        }
      });
      results.vehicles.push(vehicle2);

      // Create demo routes
      const route1 = await prisma.route.create({
        data: {
          name: 'Downtown Express',
          routeNumber: 'R-101',
          startPoint: 'Central Station',
          endPoint: 'Downtown Plaza',
          distance: 15.5,
          estimatedDuration: 45,
          organizationId: org1.id,
          isActive: true,
          stops: JSON.stringify([
            { name: 'Central Station', lat: 40.7128, lng: -74.0060, order: 1 },
            { name: 'City Hall', lat: 40.7129, lng: -74.0061, order: 2 },
            { name: 'Downtown Plaza', lat: 40.7130, lng: -74.0062, order: 3 }
          ])
        }
      });
      results.routes.push(route1);

      const route2 = await prisma.route.create({
        data: {
          name: 'Airport Shuttle',
          routeNumber: 'R-202',
          startPoint: 'Airport Terminal',
          endPoint: 'City Center',
          distance: 25.0,
          estimatedDuration: 60,
          organizationId: org2.id,
          isActive: true,
          stops: JSON.stringify([
            { name: 'Airport Terminal', lat: 40.6413, lng: -73.7781, order: 1 },
            { name: 'Highway Exit 5', lat: 40.6500, lng: -73.7800, order: 2 },
            { name: 'City Center', lat: 40.7128, lng: -74.0060, order: 3 }
          ])
        }
      });
      results.routes.push(route2);

      res.status(201).json({
        success: true,
        message: 'Demo data seeded successfully',
        summary: {
          organizations: results.organizations.length,
          admins: results.admins.length,
          drivers: results.drivers.length,
          passengers: results.passengers.length,
          vehicles: results.vehicles.length,
          routes: results.routes.length
        },
        credentials: {
          superAdmin: 'Use the account created via /api/seed/super-admin',
          admin: { email: 'admin@sptm.com', password: 'Admin123!' },
          organization1: { email: 'citybus@example.com', password: 'CityBus123!' },
          organization2: { email: 'metrotrans@example.com', password: 'Metro123!' },
          driver1: { email: 'driver1@citybus.com', password: 'Driver123!' },
          driver2: { email: 'driver2@metro.com', password: 'Driver123!' },
          passenger1: { email: 'passenger1@example.com', password: 'Pass123!' },
          passenger2: { email: 'passenger2@example.com', password: 'Pass123!' }
        }
      });
    } catch (error) {
      console.error('Seed demo data error:', error);
      res.status(500).json({ 
        error: 'Failed to seed demo data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check database status
   * GET /api/seed/status
   */
  static async checkStatus(req: Request, res: Response) {
    try {
      const [
        superAdminCount,
        adminCount,
        organizationCount,
        driverCount,
        passengerCount,
        vehicleCount,
        routeCount
      ] = await Promise.all([
        prisma.superAdmin.count(),
        prisma.admin.count(),
        prisma.organization.count(),
        prisma.user.count({ where: { role: 'DRIVER' } }),
        prisma.user.count({ where: { role: 'PASSENGER' } }),
        prisma.vehicle.count(),
        prisma.route.count()
      ]);

      res.json({
        success: true,
        database: {
          superAdmins: superAdminCount,
          admins: adminCount,
          organizations: organizationCount,
          drivers: driverCount,
          passengers: passengerCount,
          vehicles: vehicleCount,
          routes: routeCount
        },
        isEmpty: superAdminCount === 0 && adminCount === 0 && organizationCount === 0,
        needsSeeding: superAdminCount === 0
      });
    } catch (error) {
      console.error('Check status error:', error);
      res.status(500).json({ error: 'Failed to check database status' });
    }
  }
}
