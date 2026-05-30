import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

// Apply for discount
export const applyForDiscount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      type,
      idNumber,
      institutionName,
      expiryDate,
      reason,
      documentUrl,
      documentType,
    } = req.body;

    // Validate discount type
    const validTypes = ['STUDENT', 'ELDERLY', 'DISABLED', 'VETERAN', 'LOW_INCOME'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid discount type' });
    }

    // Check for existing pending or approved application
    const existingApplication = await prisma.discountApplication.findFirst({
      where: {
        userId,
        type,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${existingApplication.status.toLowerCase()} application for this discount type`,
      });
    }

    // Set discount percentage based on type
    const discountPercentages: Record<string, number> = {
      STUDENT: 50,
      ELDERLY: 50,
      DISABLED: 75,
      VETERAN: 60,
      LOW_INCOME: 40,
    };

    const application = await prisma.discountApplication.create({
      data: {
        userId,
        type,
        discountPercentage: discountPercentages[type] || 0,
        idNumber,
        institutionName,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        reason,
        documentUrl,
        documentType,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Discount application submitted successfully',
      application,
    });
  } catch (error: any) {
    console.error('Apply for discount error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};

// Get user's discount applications
export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const applications = await prisma.discountApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ success: true, applications });
  } catch (error: any) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

// Get active discount
export const getActiveDiscount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const activeDiscount = await prisma.discountApplication.findFirst({
      where: {
        userId,
        status: 'APPROVED',
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } },
        ],
      },
      orderBy: { approvedAt: 'desc' },
    });

    res.json({
      success: true,
      discount: activeDiscount,
      hasActiveDiscount: !!activeDiscount,
    });
  } catch (error: any) {
    console.error('Get active discount error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active discount' });
  }
};

// Get application by ID
export const getApplicationById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const application = await prisma.discountApplication.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, application });
  } catch (error: any) {
    console.error('Get application error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch application' });
  }
};

// Cancel application (only if pending)
export const cancelApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const application = await prisma.discountApplication.findFirst({
      where: {
        id,
        userId,
        status: 'PENDING',
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or cannot be cancelled',
      });
    }

    const updated = await prisma.discountApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewNotes: 'Cancelled by user',
        reviewedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Application cancelled successfully',
      application: updated,
    });
  } catch (error: any) {
    console.error('Cancel application error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel application' });
  }
};

// Admin: Get all applications (with filters)
export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const { status, type, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [applications, total] = await Promise.all([
      prisma.discountApplication.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.discountApplication.count({ where }),
    ]);

    res.json({
      success: true,
      applications,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    console.error('Get all applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

// Admin: Review application
export const reviewApplication = async (req: AuthRequest, res: Response) => {
  try {
    const reviewerId = req.user?.id;
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!reviewerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await prisma.discountApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been reviewed',
      });
    }

    const updated = await prisma.discountApplication.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      application: updated,
    });
  } catch (error: any) {
    console.error('Review application error:', error);
    res.status(500).json({ success: false, message: 'Failed to review application' });
  }
};

// Calculate fare with discount
export const calculateFareWithDiscount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { baseFare } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!baseFare || baseFare <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid base fare' });
    }

    // Get active discount
    const activeDiscount = await prisma.discountApplication.findFirst({
      where: {
        userId,
        status: 'APPROVED',
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } },
        ],
      },
      orderBy: { approvedAt: 'desc' },
    });

    let finalFare = baseFare;
    let discountAmount = 0;
    let discountPercentage = 0;

    if (activeDiscount) {
      discountPercentage = activeDiscount.discountPercentage;
      discountAmount = (baseFare * discountPercentage) / 100;
      finalFare = baseFare - discountAmount;
    }

    res.json({
      success: true,
      baseFare,
      discountPercentage,
      discountAmount,
      finalFare,
      discountType: activeDiscount?.type || null,
      hasDiscount: !!activeDiscount,
    });
  } catch (error: any) {
    console.error('Calculate fare error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate fare' });
  }
};
