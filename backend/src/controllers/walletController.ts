import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

export class WalletController {
  // Get or create wallet
  static async getWallet(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      let wallet = await prisma.wallet.findUnique({ where: { userId } });
      
      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: { userId, balance: 0 },
        });
      }

      return res.json({ success: true, wallet });
    } catch (error) {
      console.error('Get wallet error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Top up wallet
  static async topUp(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const wallet = await prisma.wallet.upsert({
        where: { userId },
        create: { userId, balance: amount },
        update: { balance: { increment: amount } },
      });

      const transaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'TOP_UP',
          amount,
          balanceBefore: wallet.balance - amount,
          balanceAfter: wallet.balance,
          status: 'COMPLETED',
          description: 'Wallet top-up',
        },
      });

      return res.json({ success: true, wallet, transaction });
    } catch (error) {
      console.error('Top up error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get transactions
  static async getTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const transactions = await prisma.walletTransaction.findMany({
        where: { userId },
        include: {
          route: { select: { name: true, routeNumber: true } },
          vehicle: { select: { plateNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.json({ success: true, transactions });
    } catch (error) {
      console.error('Get transactions error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Tap in
  static async tapIn(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { routeId, vehicleId, driverId, latitude, longitude, location } = req.body;

      // Check for active session
      const activeSession = await prisma.tapSession.findFirst({
        where: { userId, status: 'ACTIVE' },
      });

      if (activeSession) {
        return res.status(400).json({ error: 'You have an active tap session. Please tap out first.' });
      }

      // Get route and wallet
      const [route, wallet] = await Promise.all([
        prisma.route.findUnique({ where: { id: routeId } }),
        prisma.wallet.findUnique({ where: { userId } }),
      ]);

      if (!route) return res.status(404).json({ error: 'Route not found' });
      if (!wallet || wallet.balance < route.basePrice) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Create tap in transaction (hold amount)
      const tapInTransaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'TAP_IN',
          amount: 0, // No deduction yet
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance,
          status: 'COMPLETED',
          description: `Tap in - ${route.name}`,
          routeId,
          vehicleId,
          driverId,
        },
      });

      // Create tap session
      const session = await prisma.tapSession.create({
        data: {
          userId,
          routeId,
          vehicleId,
          driverId,
          tapInTransactionId: tapInTransaction.id,
          tapInLocation: location,
          tapInLatitude: latitude,
          tapInLongitude: longitude,
          estimatedFare: route.basePrice,
          status: 'ACTIVE',
        },
        include: {
          route: true,
          vehicle: true,
        },
      });

      return res.json({ success: true, session, message: 'Tapped in successfully' });
    } catch (error) {
      console.error('Tap in error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Tap out
  static async tapOut(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { latitude, longitude, location } = req.body;

      // Find active session
      const session = await prisma.tapSession.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { route: true, tapInTransaction: true },
      });

      if (!session) {
        return res.status(400).json({ error: 'No active tap session found' });
      }

      // Calculate fare and duration
      const duration = Math.floor((Date.now() - session.tapInAt.getTime()) / 60000); // minutes
      const actualFare = session.estimatedFare; // Simplified - use base price

      // Get wallet
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < actualFare) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Deduct fare
      await prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: actualFare } },
      });

      // Create tap out transaction
      const tapOutTransaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'TAP_OUT',
          amount: -actualFare,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance - actualFare,
          status: 'COMPLETED',
          description: `Tap out - ${session.route.name}`,
          routeId: session.routeId,
          vehicleId: session.vehicleId,
          driverId: session.driverId,
          tapInTransactionId: session.tapInTransactionId,
        },
      });

      // Update session
      const updatedSession = await prisma.tapSession.update({
        where: { id: session.id },
        data: {
          tapOutTransactionId: tapOutTransaction.id,
          tapOutLocation: location,
          tapOutLatitude: latitude,
          tapOutLongitude: longitude,
          actualFare,
          duration,
          status: 'COMPLETED',
          tapOutAt: new Date(),
        },
        include: {
          route: true,
          vehicle: true,
          tapInTransaction: true,
          tapOutTransaction: true,
        },
      });

      return res.json({ 
        success: true, 
        session: updatedSession, 
        message: `Tapped out successfully. Fare: Rs. ${actualFare}` 
      });
    } catch (error) {
      console.error('Tap out error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get active session
  static async getActiveSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const session = await prisma.tapSession.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: {
          route: true,
          vehicle: true,
          driver: { select: { name: true } },
        },
      });

      return res.json({ success: true, session });
    } catch (error) {
      console.error('Get active session error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get tap history
  static async getTapHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const sessions = await prisma.tapSession.findMany({
        where: { userId },
        include: {
          route: { select: { name: true, routeNumber: true } },
          vehicle: { select: { plateNumber: true } },
        },
        orderBy: { tapInAt: 'desc' },
        take: 50,
      });

      return res.json({ success: true, sessions });
    } catch (error) {
      console.error('Get tap history error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
