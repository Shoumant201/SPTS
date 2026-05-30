import { Router } from 'express';
import { handleNFCTap, getActiveRide, registerNFC } from '../controllers/nfcController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/nfc/tap:
 *   post:
 *     tags: [NFC]
 *     summary: Handle NFC tap from ESP32 reader
 *     description: Process NFC tap for boarding (first tap) or exiting (second tap)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nfcId
 *               - busId
 *             properties:
 *               nfcId:
 *                 type: string
 *                 description: NFC card/phone unique identifier
 *               busId:
 *                 type: string
 *                 description: Bus plate number or vehicle ID
 *     responses:
 *       200:
 *         description: Tap processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 action:
 *                   type: string
 *                   enum: [BOARD, EXIT, ERROR]
 *                 message:
 *                   type: string
 *                 passenger:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                 fare:
 *                   type: number
 *                 currentBalance:
 *                   type: number
 *       400:
 *         description: Invalid request or insufficient balance
 *       404:
 *         description: Passenger or bus not found
 */
router.post('/tap', handleNFCTap);

/**
 * @swagger
 * /api/nfc/active-ride:
 *   get:
 *     tags: [NFC]
 *     summary: Get passenger's active ride
 *     description: Returns the current active tap session for the authenticated passenger
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active ride information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeRide:
 *                   type: object
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 */
router.get('/active-ride', authenticate, getActiveRide);

/**
 * @swagger
 * /api/nfc/register:
 *   post:
 *     tags: [NFC]
 *     summary: Register NFC ID for passenger
 *     description: Link an NFC card/phone to the authenticated passenger account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nfcId
 *             properties:
 *               nfcId:
 *                 type: string
 *                 description: NFC card/phone unique identifier
 *     responses:
 *       200:
 *         description: NFC registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 nfcId:
 *                   type: string
 *       400:
 *         description: NFC ID already registered or invalid
 *       401:
 *         description: Unauthorized
 */
router.post('/register', authenticate, registerNFC);

export default router;
