import { Router } from 'express';
import { BusController } from '../controllers/busController';

const router = Router();

/**
 * @swagger
 * /api/buses/nearby:
 *   get:
 *     summary: Find buses near passenger location
 *     tags: [Buses]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Passenger latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Passenger longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5
 *         description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: List of nearby buses
 *       400:
 *         description: Invalid parameters
 */
router.get('/nearby', BusController.getNearbyBuses);

/**
 * @swagger
 * /api/buses/{id}/location:
 *   get:
 *     summary: Get specific bus location
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver/Bus ID
 *     responses:
 *       200:
 *         description: Bus location details
 *       404:
 *         description: Bus not found
 */
router.get('/:id/location', BusController.getBusLocation);

/**
 * @swagger
 * /api/buses/route/{routeId}:
 *   get:
 *     summary: Get all buses on a specific route
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     responses:
 *       200:
 *         description: List of buses on route
 */
router.get('/route/:routeId', BusController.getBusesByRoute);

export default router;
