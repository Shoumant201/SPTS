import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

export class OrganizationController {
  // Get all organizations (Super Admin only)
  static async getAllOrganizations(req: AuthRequest, res: Response) {
    try {
      const organizations = await prisma.organization.findMany({
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
            }
          },
          vehicles: {
            select: {
              id: true,
              plateNumber: true,
              type: true,
              status: true
            }
          },
          _count: {
            select: {
              users: true,
              vehicles: true
            }
          }
        }
      });

      res.json({ organizations });
    } catch (error) {
      console.error('Get organizations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get organization by ID
  static async getOrganization(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true
            }
          },
          vehicles: {
            select: {
              id: true,
              plateNumber: true,
              type: true,
              status: true,
              capacity: true
            }
          }
        }
      });

      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      res.json({ organization });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create organization (Super Admin only)
  static async createOrganization(req: AuthRequest, res: Response) {
    try {
      const { name, email, phone, address, licenseNumber } = req.body;

      // Check if organization with email already exists
      const existingOrg = await prisma.organization.findUnique({
        where: { email }
      });

      if (existingOrg) {
        return res.status(400).json({ error: 'Organization with this email already exists' });
      }

      const organization = await prisma.organization.create({
        data: {
          name,
          email,
          phone,
          address,
          licenseNumber,
          password: 'temp-password', // This should be set properly
          admin: {
            connect: { id: req.user!.id }
          }
        }
      });

      res.status(201).json({
        message: 'Organization created successfully',
        organization
      });
    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update organization
  static async updateOrganization(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, phone, address, licenseNumber, isActive } = req.body;

      const organization = await prisma.organization.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          address,
          licenseNumber,
          isActive
        }
      });

      res.json({
        message: 'Organization updated successfully',
        organization
      });
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get organization users
  static async getOrganizationUsers(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const users = await prisma.user.findMany({
        where: { organizationId: id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true
        }
      });

      res.json({ users });
    } catch (error) {
      console.error('Get organization users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get organization vehicles
  static async getOrganizationVehicles(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const vehicles = await prisma.vehicle.findMany({
        where: { organizationId: id },
        include: {
          trips: {
            select: {
              id: true,
              status: true,
              startTime: true,
              endTime: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      res.json({ vehicles });
    } catch (error) {
      console.error('Get organization vehicles error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}