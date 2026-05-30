import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

const createVehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  type: z.enum(['BUS', 'MINIBUS', 'TAXI']),
  model: z.string().optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  iotDeviceId: z.string().min(1, 'IoT device serial number is required'),
});

const updateVehicleSchema = z.object({
  plateNumber: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  type: z.enum(['BUS', 'MINIBUS', 'TAXI']).optional(),
  model: z.string().optional(),
  year: z.number().int().min(1990).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

export class FleetController {
  // Get all vehicles for the authenticated organization
  static async getVehicles(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      let where: any = {};

      if (userType === 'ORGANIZATION') {
        where.organizationId = orgId;
      }
      // SuperAdmin/Admin can see all vehicles (no filter)

      const vehicles = await prisma.vehicle.findMany({
        where,
        include: {
          iotDevice: {
            select: {
              id: true,
              deviceId: true,
              status: true,
              lastSeenAt: true,
              passengerCount: true,
            },
          },
          organization: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, vehicles });
    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Get single vehicle
  static async getVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          iotDevice: true,
          organization: { select: { id: true, name: true } },
        },
      });

      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }

      // Org can only see their own vehicles
      if (userType === 'ORGANIZATION' && vehicle.organizationId !== orgId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({ success: true, vehicle });
    } catch (error) {
      console.error('Get vehicle error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Create vehicle + register IoT device
  static async createVehicle(req: Request, res: Response) {
    try {
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      if (!['ORGANIZATION', 'SUPER_ADMIN', 'ADMIN'].includes(userType)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const data = createVehicleSchema.parse(req.body);

      // Check plate number uniqueness
      const existing = await prisma.vehicle.findUnique({
        where: { plateNumber: data.plateNumber },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Plate number already registered' });
      }

      // Check IoT device serial uniqueness
      const existingDevice = await prisma.ioTDevice.findUnique({
        where: { deviceId: data.iotDeviceId },
      });
      if (existingDevice) {
        return res.status(409).json({ success: false, message: 'IoT device serial number already registered' });
      }

      // Generate a secure device token for the IoT hardware
      const deviceToken = crypto.randomBytes(32).toString('hex');

      const vehicle = await prisma.vehicle.create({
        data: {
          plateNumber: data.plateNumber,
          capacity: data.capacity,
          type: data.type as any,
          model: data.model,
          year: data.year,
          organizationId: userType === 'ORGANIZATION' ? orgId : undefined,
          iotDevice: {
            create: {
              deviceId: data.iotDeviceId,
              deviceToken,
              status: 'INACTIVE',
            },
          },
        },
        include: {
          iotDevice: {
            select: {
              id: true,
              deviceId: true,
              deviceToken: true, // Return token once on creation
              status: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Vehicle registered successfully',
        vehicle,
        note: 'Save the device token — it will not be shown again',
      });
    } catch (error) {
      console.error('Create vehicle error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Update vehicle details
  static async updateVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      const vehicle = await prisma.vehicle.findUnique({ where: { id } });
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }

      if (userType === 'ORGANIZATION' && vehicle.organizationId !== orgId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const data = updateVehicleSchema.parse(req.body);

      const updated = await prisma.vehicle.update({
        where: { id },
        data: data as any,
        include: {
          iotDevice: {
            select: { id: true, deviceId: true, status: true, lastSeenAt: true, passengerCount: true },
          },
        },
      });

      res.json({ success: true, message: 'Vehicle updated', vehicle: updated });
    } catch (error) {
      console.error('Update vehicle error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: 'Validation error', errors: error.issues });
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Delete vehicle (also deletes IoT device via cascade)
  static async deleteVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      const vehicle = await prisma.vehicle.findUnique({ where: { id } });
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }

      if (userType === 'ORGANIZATION' && vehicle.organizationId !== orgId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      await prisma.vehicle.delete({ where: { id } });

      res.json({ success: true, message: 'Vehicle deleted' });
    } catch (error) {
      console.error('Delete vehicle error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Update IoT device status (called by the IoT hardware itself)
  static async updateIoTData(req: Request, res: Response) {
    try {
      const { deviceId } = req.params;
      const { deviceToken, passengerCount } = req.body;

      const device = await prisma.ioTDevice.findUnique({ where: { deviceId } });

      if (!device || device.deviceToken !== deviceToken) {
        return res.status(401).json({ success: false, message: 'Invalid device credentials' });
      }

      const updated = await prisma.ioTDevice.update({
        where: { deviceId },
        data: {
          passengerCount: passengerCount ?? device.passengerCount,
          lastSeenAt: new Date(),
          status: 'ACTIVE',
        },
      });

      res.json({ success: true, device: { id: updated.id, status: updated.status } });
    } catch (error) {
      console.error('IoT data update error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Regenerate IoT device token (if hardware is replaced/compromised)
  static async regenerateDeviceToken(req: Request, res: Response) {
    try {
      const { vehicleId } = req.params;
      const orgId = (req as any).user?.id;
      const userType = (req as any).user?.userType;

      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: { iotDevice: true },
      });

      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle not found' });
      }

      if (userType === 'ORGANIZATION' && vehicle.organizationId !== orgId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (!vehicle.iotDevice) {
        return res.status(404).json({ success: false, message: 'No IoT device found for this vehicle' });
      }

      const newToken = crypto.randomBytes(32).toString('hex');

      await prisma.ioTDevice.update({
        where: { vehicleId },
        data: { deviceToken: newToken, status: 'INACTIVE' },
      });

      res.json({
        success: true,
        message: 'Device token regenerated',
        deviceToken: newToken,
        note: 'Update the token on the physical device. It will be offline until reconfigured.',
      });
    } catch (error) {
      console.error('Regenerate token error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
