import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export class DriverManagementController {
  /**
   * Search for available drivers by phone, license number, or name
   * Organization can search for drivers to invite
   */
  static async searchDrivers(req: Request, res: Response) {
    try {
      const { query } = req.query;
      const organizationId = (req as any).user?.id;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      // Search drivers by phone, license number, or name
      const drivers = await prisma.user.findMany({
        where: {
          role: 'DRIVER',
          isActive: true,
          OR: [
            { phone: { contains: query } },
            { name: { contains: query, mode: 'insensitive' } },
            {
              driverProfile: {
                licenseNumber: { contains: query, mode: 'insensitive' }
              }
            }
          ],
          // Exclude drivers already in this organization
          organizationId: null
        },
        include: {
          driverProfile: true,
          sentJoinRequests: {
            where: {
              organizationId,
              status: { in: ['PENDING', 'ACCEPTED'] }
            }
          }
        },
        take: 20
      });

      const formattedDrivers = drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        isPhoneVerified: driver.isPhoneVerified,
        profile: driver.driverProfile ? {
          licenseNumber: driver.driverProfile.licenseNumber,
          licenseExpiryDate: driver.driverProfile.licenseExpiryDate,
          licenseType: driver.driverProfile.licenseType,
          experience: driver.driverProfile.experience,
          rating: driver.driverProfile.rating,
          totalTrips: driver.driverProfile.totalTrips,
          isAvailable: driver.driverProfile.isAvailable
        } : null,
        hasExistingRequest: driver.sentJoinRequests.length > 0,
        existingRequestStatus: driver.sentJoinRequests[0]?.status
      }));

      res.json({
        success: true,
        drivers: formattedDrivers,
        count: formattedDrivers.length
      });
    } catch (error) {
      console.error('Search drivers error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search drivers'
      });
    }
  }

  /**
   * Send join request to a driver
   * Organization invites a driver to join
   */
  static async sendJoinRequest(req: Request, res: Response) {
    try {
      const { driverId, message } = req.body;
      const organizationId = (req as any).user?.id;

      if (!driverId) {
        return res.status(400).json({
          success: false,
          error: 'Driver ID is required'
        });
      }

      // Check if driver exists and is available
      const driver = await prisma.user.findUnique({
        where: { id: driverId },
        include: { driverProfile: true }
      });

      if (!driver || driver.role !== 'DRIVER') {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }

      if (driver.organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Driver is already part of an organization'
        });
      }

      // Check for existing pending request
      const existingRequest = await prisma.organizationDriverRequest.findUnique({
        where: {
          organizationId_driverId: {
            organizationId,
            driverId
          }
        }
      });

      if (existingRequest && existingRequest.status === 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'A pending request already exists for this driver'
        });
      }

      // Create or update join request
      const joinRequest = await prisma.organizationDriverRequest.upsert({
        where: {
          organizationId_driverId: {
            organizationId,
            driverId
          }
        },
        create: {
          organizationId,
          driverId,
          requestedBy: 'ORGANIZATION',
          message,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        update: {
          status: 'PENDING',
          message,
          requestedBy: 'ORGANIZATION',
          requestedAt: new Date(),
          respondedAt: null,
          responseNote: null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Join request sent successfully',
        request: joinRequest
      });
    } catch (error) {
      console.error('Send join request error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send join request'
      });
    }
  }

  /**
   * Get all join requests for an organization
   */
  static async getOrganizationRequests(req: Request, res: Response) {
    try {
      const organizationId = (req as any).user?.id;
      const { status } = req.query;

      const whereClause: any = { organizationId };
      if (status && typeof status === 'string') {
        whereClause.status = status.toUpperCase();
      }

      const requests = await prisma.organizationDriverRequest.findMany({
        where: whereClause,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              isPhoneVerified: true,
              driverProfile: true
            }
          }
        },
        orderBy: { requestedAt: 'desc' }
      });

      res.json({
        success: true,
        requests,
        count: requests.length
      });
    } catch (error) {
      console.error('Get organization requests error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch join requests'
      });
    }
  }

  /**
   * Cancel a join request (by organization)
   */
  static async cancelJoinRequest(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const organizationId = (req as any).user?.id;

      const request = await prisma.organizationDriverRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'Request not found'
        });
      }

      if (request.organizationId !== organizationId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to cancel this request'
        });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Only pending requests can be cancelled'
        });
      }

      const updatedRequest = await prisma.organizationDriverRequest.update({
        where: { id: requestId },
        data: {
          status: 'CANCELLED',
          respondedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Join request cancelled successfully',
        request: updatedRequest
      });
    } catch (error) {
      console.error('Cancel join request error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel join request'
      });
    }
  }

  /**
   * Get join requests for a driver (driver app)
   */
  static async getDriverRequests(req: Request, res: Response) {
    try {
      const driverId = (req as any).user?.id;
      const { status } = req.query;

      const whereClause: any = { driverId };
      if (status && typeof status === 'string') {
        whereClause.status = status.toUpperCase();
      }

      const requests = await prisma.organizationDriverRequest.findMany({
        where: whereClause,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true,
              licenseNumber: true
            }
          }
        },
        orderBy: { requestedAt: 'desc' }
      });

      res.json({
        success: true,
        requests,
        count: requests.length
      });
    } catch (error) {
      console.error('Get driver requests error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch join requests'
      });
    }
  }

  /**
   * Respond to join request (driver accepts/rejects)
   */
  static async respondToRequest(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const { action, responseNote } = req.body;
      const driverId = (req as any).user?.id;

      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be "accept" or "reject"'
        });
      }

      const request = await prisma.organizationDriverRequest.findUnique({
        where: { id: requestId },
        include: { organization: true }
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'Request not found'
        });
      }

      if (request.driverId !== driverId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to respond to this request'
        });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'This request has already been responded to'
        });
      }

      // Check if request has expired
      if (request.expiresAt && request.expiresAt < new Date()) {
        await prisma.organizationDriverRequest.update({
          where: { id: requestId },
          data: { status: 'EXPIRED' }
        });
        return res.status(400).json({
          success: false,
          error: 'This request has expired'
        });
      }

      const newStatus = action === 'accept' ? 'ACCEPTED' : 'REJECTED';

      // Use transaction to update request and driver's organization
      const result = await prisma.$transaction(async (tx) => {
        // Update request status
        const updatedRequest = await tx.organizationDriverRequest.update({
          where: { id: requestId },
          data: {
            status: newStatus,
            responseNote,
            respondedAt: new Date()
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true
              }
            }
          }
        });

        // If accepted, assign driver to organization
        if (action === 'accept') {
          await tx.user.update({
            where: { id: driverId },
            data: { organizationId: request.organizationId }
          });

          // Cancel all other pending requests for this driver
          await tx.organizationDriverRequest.updateMany({
            where: {
              driverId,
              id: { not: requestId },
              status: 'PENDING'
            },
            data: {
              status: 'CANCELLED',
              responseNote: 'Driver accepted another organization'
            }
          });
        }

        return updatedRequest;
      });

      res.json({
        success: true,
        message: `Request ${action}ed successfully`,
        request: result
      });
    } catch (error) {
      console.error('Respond to request error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to respond to request'
      });
    }
  }

  /**
   * Get drivers in organization
   */
  static async getOrganizationDrivers(req: Request, res: Response) {
    try {
      const organizationId = (req as any).user?.id;

      const drivers = await prisma.user.findMany({
        where: {
          organizationId,
          role: 'DRIVER',
          isActive: true
        },
        include: {
          driverProfile: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const formattedDrivers = drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        isPhoneVerified: driver.isPhoneVerified,
        joinedAt: driver.updatedAt,
        profile: driver.driverProfile
      }));

      res.json({
        success: true,
        drivers: formattedDrivers,
        count: formattedDrivers.length
      });
    } catch (error) {
      console.error('Get organization drivers error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch organization drivers'
      });
    }
  }

  /**
   * Remove driver from organization
   */
  static async removeDriver(req: Request, res: Response) {
    try {
      const { driverId } = req.params;
      const organizationId = (req as any).user?.id;

      const driver = await prisma.user.findUnique({
        where: { id: driverId }
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }

      if (driver.organizationId !== organizationId) {
        return res.status(403).json({
          success: false,
          error: 'Driver does not belong to your organization'
        });
      }

      await prisma.user.update({
        where: { id: driverId },
        data: { organizationId: null }
      });

      res.json({
        success: true,
        message: 'Driver removed from organization successfully'
      });
    } catch (error) {
      console.error('Remove driver error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove driver'
      });
    }
  }

  /**
   * Validate driver license against government database
   */
  static async validateLicense(req: Request, res: Response) {
    try {
      const { licenseNumber } = req.body;

      if (!licenseNumber) {
        return res.status(400).json({
          success: false,
          error: 'License number is required'
        });
      }

      // Check if license exists in valid licenses database
      const validLicense = await prisma.validDriverLicense.findUnique({
        where: { licenseNumber }
      });

      if (!validLicense) {
        return res.status(404).json({
          success: false,
          error: 'License number not found in government database',
          isValid: false
        });
      }

      if (!validLicense.isActive) {
        return res.status(400).json({
          success: false,
          error: 'This license has been deactivated',
          isValid: false
        });
      }

      // Check if license is expired
      if (validLicense.expiryDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'This license has expired',
          isValid: false,
          expiryDate: validLicense.expiryDate
        });
      }

      // Check if license is already registered by another driver
      const existingProfile = await prisma.driverProfile.findUnique({
        where: { licenseNumber },
        include: {
          user: {
            select: {
              id: true,
              phone: true
            }
          }
        }
      });

      const currentUserId = (req as any).user?.id;
      if (existingProfile && existingProfile.userId !== currentUserId) {
        return res.status(400).json({
          success: false,
          error: 'This license is already registered by another driver',
          isValid: false
        });
      }

      res.json({
        success: true,
        isValid: true,
        message: 'License is valid',
        licenseData: {
          licenseNumber: validLicense.licenseNumber,
          fullName: validLicense.fullName,
          licenseType: validLicense.licenseType,
          expiryDate: validLicense.expiryDate,
          bloodGroup: validLicense.bloodGroup,
          address: validLicense.address
        }
      });
    } catch (error) {
      console.error('Validate license error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate license'
      });
    }
  }

  /**
   * Create or update driver profile (for drivers)
   */
  static async updateDriverProfile(req: Request, res: Response) {
    try {
      const driverId = (req as any).user?.id;
      const {
        licenseNumber,
        licenseExpiryDate,
        licenseType,
        experience,
        address,
        emergencyContact,
        bloodGroup
      } = req.body;

      if (!licenseNumber || !licenseExpiryDate) {
        return res.status(400).json({
          success: false,
          error: 'License number and expiry date are required'
        });
      }

      // Validate license against government database
      const validLicense = await prisma.validDriverLicense.findUnique({
        where: { licenseNumber }
      });

      if (!validLicense) {
        return res.status(400).json({
          success: false,
          error: 'Invalid license number. License not found in government database.'
        });
      }

      if (!validLicense.isActive) {
        return res.status(400).json({
          success: false,
          error: 'This license has been deactivated'
        });
      }

      if (validLicense.expiryDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'This license has expired'
        });
      }

      // Check if license number is already used by another driver
      const existingProfile = await prisma.driverProfile.findUnique({
        where: { licenseNumber }
      });

      if (existingProfile && existingProfile.userId !== driverId) {
        return res.status(400).json({
          success: false,
          error: 'License number is already registered by another driver'
        });
      }

      const profile = await prisma.driverProfile.upsert({
        where: { userId: driverId },
        create: {
          userId: driverId,
          licenseNumber,
          licenseExpiryDate: new Date(licenseExpiryDate),
          licenseType: licenseType || validLicense.licenseType,
          experience,
          address: address || validLicense.address,
          emergencyContact,
          bloodGroup: bloodGroup || validLicense.bloodGroup
        },
        update: {
          licenseNumber,
          licenseExpiryDate: new Date(licenseExpiryDate),
          licenseType: licenseType || validLicense.licenseType,
          experience,
          address: address || validLicense.address,
          emergencyContact,
          bloodGroup: bloodGroup || validLicense.bloodGroup
        }
      });

      res.json({
        success: true,
        message: 'Driver profile updated successfully',
        profile
      });
    } catch (error) {
      console.error('Update driver profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update driver profile'
      });
    }
  }

  /**
   * Get driver's own profile
   */
  static async getDriverProfile(req: Request, res: Response) {
    try {
      const driverId = (req as any).user?.id;

      const driver = await prisma.user.findUnique({
        where: { id: driverId },
        include: {
          driverProfile: true,
          organization: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true
            }
          }
        }
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }

      res.json({
        success: true,
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          isPhoneVerified: driver.isPhoneVerified,
          profile: driver.driverProfile,
          organization: driver.organization
        }
      });
    } catch (error) {
      console.error('Get driver profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch driver profile'
      });
    }
  }
}
