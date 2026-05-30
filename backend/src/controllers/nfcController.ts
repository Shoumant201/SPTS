import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

/**
 * Handle NFC tap from ESP32 reader
 * First tap: Start ride (BOARD)
 * Second tap: End ride (EXIT)
 */
export const handleNFCTap = async (req: Request, res: Response) => {
  try {
    const { nfcId, busId } = req.body;

    // Validate input
    if (!nfcId || !busId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'nfcId and busId are required'
      });
    }

    console.log(`📱 NFC Tap: ${nfcId} on bus ${busId}`);

    // Find passenger by NFC ID
    const passenger = await prisma.user.findFirst({
      where: {
        nfcId: nfcId,
        role: 'PASSENGER',
        isActive: true,
      },
    });

    if (!passenger) {
      return res.status(404).json({ 
        error: 'Passenger not found',
        message: 'Please register your NFC card in the app',
        action: 'ERROR'
      });
    }

    // Get passenger wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: passenger.id },
    });

    // Find vehicle by bus ID
    const vehicle = await prisma.vehicle.findFirst({
      where: { 
        OR: [
          { plateNumber: busId },
          { id: busId }
        ]
      },
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
          include: { route: true },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ 
        error: 'Bus not found',
        message: 'Bus not registered in system',
        action: 'ERROR'
      });
    }


    const activeAssignment = vehicle.assignments[0];
    if (!activeAssignment) {
      return res.status(400).json({ 
        error: 'Bus not in service',
        message: 'This bus is not currently active',
        action: 'ERROR'
      });
    }

    // Check for active tap session (ride in progress)
    const activeTap = await prisma.tapSession.findFirst({
      where: {
        userId: passenger.id,
        status: 'ACTIVE',
      },
      include: {
        vehicle: true,
        route: true,
      },
    });

    if (activeTap) {
      // ===== SECOND TAP - END RIDE =====
      const rideDuration = Date.now() - activeTap.tapInAt.getTime();
      const rideDurationMinutes = rideDuration / (1000 * 60);
      
      // Calculate fare
      const baseFare = activeAssignment.route?.basePrice || 20;
      const perMinuteRate = 0.5;
      const calculatedFare = Math.max(baseFare, baseFare + (rideDurationMinutes * perMinuteRate));

      // Check wallet balance
      if (!wallet || wallet.balance < calculatedFare) {
        return res.status(400).json({
          error: 'Insufficient balance',
          message: `Fare: NPR ${calculatedFare.toFixed(2)}. Please recharge wallet.`,
          action: 'ERROR',
          fare: calculatedFare,
        });
      }

      // Get current wallet balance
      const currentWallet = await prisma.wallet.findUnique({
        where: { id: wallet.id },
      });

      // Create tap-out transaction
      const tapOutTransaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: passenger.id,
          type: 'TAP_OUT',
          amount: calculatedFare,
          balanceBefore: currentWallet?.balance || 0,
          balanceAfter: (currentWallet?.balance || 0) - calculatedFare,
          description: `Bus fare - ${activeAssignment.route?.name || 'Route'}`,
          status: 'COMPLETED',
          routeId: activeAssignment.routeId,
          vehicleId: vehicle.id,
          driverId: activeAssignment.driverId,
        },
      });

      // Update tap session
      const completedTap = await prisma.tapSession.update({
        where: { id: activeTap.id },
        data: {
          tapOutAt: new Date(),
          actualFare: calculatedFare,
          status: 'COMPLETED',
          duration: Math.round(rideDurationMinutes),
          tapOutTransactionId: tapOutTransaction.id,
        },
      });

      // Deduct from wallet
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: calculatedFare },
        },
      });

      console.log(`🔴 EXIT: ${passenger.name} - Fare: NPR ${calculatedFare.toFixed(2)}`);

      return res.json({
        action: 'EXIT',
        message: `Ride ended. Fare: NPR ${calculatedFare.toFixed(2)}`,
        passenger: {
          name: passenger.name,
          phone: passenger.phone,
        },
        tap: completedTap,
        fare: calculatedFare,
        duration: Math.round(rideDurationMinutes),
        remainingBalance: (currentWallet?.balance || 0) - calculatedFare,
      });
    } else {
      // ===== FIRST TAP - START RIDE =====
      
      // Check wallet balance
      const minimumBalance = 20; // Minimum balance required
      if (!wallet || wallet.balance < minimumBalance) {
        return res.status(400).json({
          error: 'Insufficient balance',
          message: `Minimum balance required: NPR ${minimumBalance}. Please recharge your wallet.`,
          action: 'ERROR',
          currentBalance: wallet?.balance || 0,
        });
      }

      // Create tap-in transaction
      const tapInTransaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: passenger.id,
          type: 'TAP_IN',
          amount: 0, // No charge on tap-in
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance,
          description: `Boarded - ${activeAssignment.route?.name || 'Route'}`,
          status: 'COMPLETED',
          routeId: activeAssignment.routeId,
          vehicleId: vehicle.id,
          driverId: activeAssignment.driverId,
        },
      });

      // Create new tap session
      const newTap = await prisma.tapSession.create({
        data: {
          userId: passenger.id,
          vehicleId: vehicle.id,
          routeId: activeAssignment.routeId,
          driverId: activeAssignment.driverId,
          tapInTransactionId: tapInTransaction.id,
          estimatedFare: activeAssignment.route?.basePrice || 20,
          status: 'ACTIVE',
        },
        include: {
          route: true,
        },
      });

      console.log(`🟢 BOARD: ${passenger.name} - Route: ${activeAssignment.route?.name}`);

      return res.json({
        action: 'BOARD',
        message: `Welcome aboard! Route: ${activeAssignment.route?.name || 'Unknown'}`,
        passenger: {
          name: passenger.name,
          phone: passenger.phone,
        },
        tap: newTap,
        route: activeAssignment.route?.name,
        currentBalance: wallet.balance,
      });
    }
  } catch (error) {
    console.error('NFC tap error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process tap',
      action: 'ERROR'
    });
  }
};

/**
 * Get passenger's active ride (for passenger app)
 */
export const getActiveRide = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const activeTap = await prisma.tapSession.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        vehicle: true,
        route: true,
      },
    });

    return res.json({ activeRide: activeTap });
  } catch (error) {
    console.error('Get active ride error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Register NFC ID for passenger (from passenger app)
 */
export const registerNFC = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { nfcId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!nfcId) {
      return res.status(400).json({ error: 'NFC ID is required' });
    }

    // Check if NFC ID already registered
    const existing = await prisma.user.findFirst({
      where: { nfcId },
    });

    if (existing && existing.id !== userId) {
      return res.status(400).json({ 
        error: 'NFC ID already registered',
        message: 'This NFC card/phone is already linked to another account'
      });
    }

    // Update user with NFC ID
    const user = await prisma.user.update({
      where: { id: userId },
      data: { nfcId },
    });

    return res.json({
      message: 'NFC registered successfully',
      nfcId: user.nfcId,
    });
  } catch (error) {
    console.error('Register NFC error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
