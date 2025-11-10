import { Request, Response } from 'express';
import { hashPassword } from '../utils/password';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { UserRole } from '@prisma/client';

export class OrganizationAuthController {
    /**
     * Organization login
     */
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required'
                });
            }

            const result = await authService.authenticateOrganization(email, password);

            if (!result.success) {
                return res.status(401).json({
                    error: result.error || 'Authentication failed'
                });
            }

            res.json({
                message: 'Organization login successful',
                user: result.user,
                tokens: result.tokens
            });
        } catch (error) {
            console.error('Organization login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get Organization profile
     */
    static async getProfile(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const organization = await prisma.organization.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    address: true,
                    licenseNumber: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                    createdBy: true,
                    _count: {
                        select: {
                            users: true,
                            vehicles: true
                        }
                    }
                }
            });

            if (!organization) {
                return res.status(404).json({ error: 'Organization not found' });
            }

            res.json({ organization });
        } catch (error) {
            console.error('Get Organization profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Update Organization profile
     */
    static async updateProfile(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const { name, phone, address } = req.body;

            const updatedOrganization = await prisma.organization.update({
                where: { id: req.user.id },
                data: { name, phone, address },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    address: true,
                    licenseNumber: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            res.json({
                message: 'Profile updated successfully',
                organization: updatedOrganization
            });
        } catch (error) {
            console.error('Update Organization profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Change Organization password
     */
    static async changePassword(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    error: 'Current password and new password are required'
                });
            }

            // Get organization with password
            const organization = await prisma.organization.findUnique({
                where: { id: req.user.id }
            });

            if (!organization) {
                return res.status(404).json({ error: 'Organization not found' });
            }

            // Verify current password using auth service
            const authResult = await authService.authenticateOrganization(
                organization.email,
                currentPassword
            );

            if (!authResult.success) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }

            // Hash new password
            const hashedNewPassword = await hashPassword(newPassword);

            // Update password
            await prisma.organization.update({
                where: { id: req.user.id },
                data: { password: hashedNewPassword }
            });

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change Organization password error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get Organization's drivers with boundary enforcement
     */
    static async getDrivers(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const drivers = await prisma.user.findMany({
                where: {
                    organizationId: req.user.organizationId,
                    role: UserRole.DRIVER
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    isEmailVerified: true,
                    lastLoginAt: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            res.json({ drivers });
        } catch (error) {
            console.error('Get Organization drivers error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get specific driver details (with boundary enforcement)
     */
    static async getDriver(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const { driverId } = req.params;

            const driver = await prisma.user.findFirst({
                where: {
                    id: driverId,
                    organizationId: req.user.organizationId,
                    role: UserRole.DRIVER
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    isEmailVerified: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            if (!driver) {
                return res.status(404).json({ error: 'Driver not found' });
            }

            res.json({ driver });
        } catch (error) {
            console.error('Get Organization driver error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Update driver status (with boundary enforcement)
     */
    static async updateDriverStatus(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const { driverId } = req.params;
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({
                    error: 'isActive must be a boolean value'
                });
            }

            const updatedDriver = await prisma.user.updateMany({
                where: {
                    id: driverId,
                    organizationId: req.user.organizationId,
                    role: UserRole.DRIVER
                },
                data: { isActive }
            });

            if (updatedDriver.count === 0) {
                return res.status(404).json({ error: 'Driver not found' });
            }

            res.json({
                message: `Driver ${isActive ? 'activated' : 'deactivated'} successfully`
            });
        } catch (error) {
            console.error('Update driver status error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get Organization's vehicles with boundary enforcement
     */
    static async getVehicles(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const vehicles = await prisma.vehicle.findMany({
                where: {
                    organizationId: req.user.organizationId
                },
                select: {
                    id: true,
                    plateNumber: true,
                    type: true,
                    capacity: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            res.json({ vehicles });
        } catch (error) {
            console.error('Get Organization vehicles error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get Organization dashboard data with boundary enforcement
     */
    static async getDashboardData(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get drivers count
            const driversCount = await prisma.user.count({
                where: {
                    organizationId: req.user.organizationId,
                    role: UserRole.DRIVER
                }
            });

            // Get active drivers count
            const activeDriversCount = await prisma.user.count({
                where: {
                    organizationId: req.user.organizationId,
                    role: UserRole.DRIVER,
                    isActive: true
                }
            });

            // Get vehicles count
            const vehiclesCount = await prisma.vehicle.count({
                where: {
                    organizationId: req.user.organizationId
                }
            });

            // Get active vehicles count
            const activeVehiclesCount = await prisma.vehicle.count({
                where: {
                    organizationId: req.user.organizationId,
                    status: 'ACTIVE'
                }
            });

            // Get recent drivers
            const recentDrivers = await prisma.user.findMany({
                where: {
                    organizationId: req.user.organizationId,
                    role: UserRole.DRIVER
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    isActive: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5
            });

            // Get recent vehicles
            const recentVehicles = await prisma.vehicle.findMany({
                where: {
                    organizationId: req.user.organizationId
                },
                select: {
                    id: true,
                    plateNumber: true,
                    type: true,
                    status: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 5
            });

            res.json({
                summary: {
                    totalDrivers: driversCount,
                    activeDrivers: activeDriversCount,
                    totalVehicles: vehiclesCount,
                    activeVehicles: activeVehiclesCount
                },
                recentDrivers,
                recentVehicles
            });
        } catch (error) {
            console.error('Get Organization dashboard data error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get Organization fleet performance data
     */
    static async getFleetPerformance(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get trips data for the organization's drivers
            const tripsData = await prisma.trip.findMany({
                where: {
                    user: {
                        organizationId: req.user.organizationId,
                        role: UserRole.DRIVER
                    }
                },
                select: {
                    id: true,
                    status: true,
                    finalPrice: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 100 // Limit for performance
            });

            // Calculate performance metrics
            const totalTrips = tripsData.length;
            const completedTrips = tripsData.filter(trip => trip.status === 'COMPLETED').length;
            const totalEarnings = tripsData
                .filter(trip => trip.status === 'COMPLETED')
                .reduce((sum, trip) => sum + (trip.finalPrice || 0), 0);

            // Group by driver
            const driverPerformance = tripsData.reduce((acc, trip) => {
                const driverId = trip.user.id;
                if (!acc[driverId]) {
                    acc[driverId] = {
                        driverId,
                        driverName: trip.user.name,
                        totalTrips: 0,
                        completedTrips: 0,
                        earnings: 0
                    };
                }
                acc[driverId].totalTrips++;
                if (trip.status === 'COMPLETED') {
                    acc[driverId].completedTrips++;
                    acc[driverId].earnings += trip.finalPrice || 0;
                }
                return acc;
            }, {} as Record<string, any>);

            res.json({
                summary: {
                    totalTrips,
                    completedTrips,
                    totalEarnings,
                    completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0
                },
                driverPerformance: Object.values(driverPerformance)
            });
        } catch (error) {
            console.error('Get Organization fleet performance error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Refresh Organization token
     */
    static async refreshToken(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({ error: 'Refresh token required' });
            }

            const tokens = await authService.refreshTokens(refreshToken);

            res.json({ tokens });
        } catch (error) {
            console.error('Organization refresh token error:', error);
            res.status(401).json({ error: 'Invalid refresh token' });
        }
    }

    /**
     * Logout Organization
     */
    static async logout(req: AuthRequest, res: Response) {
        try {
            if (!req.user || req.user.userType !== 'ORGANIZATION') {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Clear refresh token
            await prisma.organization.update({
                where: { id: req.user.id },
                data: { refreshToken: null }
            });

            res.json({ message: 'Logout successful' });
        } catch (error) {
            console.error('Organization logout error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}