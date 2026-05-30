import { Router } from 'express';
import { SeedController } from '../controllers/seedController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Seed
 *   description: Database seeding endpoints (protected by SEED_KEY)
 */

/**
 * @swagger
 * /api/seed/status:
 *   get:
 *     tags: [Seed]
 *     summary: Check database status
 *     description: Returns counts of all entities in the database
 *     security: []
 *     responses:
 *       200:
 *         description: Database status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 database:
 *                   type: object
 *                 isEmpty:
 *                   type: boolean
 *                 needsSeeding:
 *                   type: boolean
 */
router.get('/status', SeedController.checkStatus);

/**
 * @swagger
 * /api/seed/super-admin:
 *   post:
 *     tags: [Seed]
 *     summary: Seed super admin account
 *     description: Creates the initial super admin account (requires SEED_KEY)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - seedKey
 *             properties:
 *               email:
 *                 type: string
 *                 example: superadmin@sptm.com
 *               password:
 *                 type: string
 *                 example: SuperAdmin123!
 *               name:
 *                 type: string
 *                 example: Super Administrator
 *               seedKey:
 *                 type: string
 *                 description: Must match SEED_KEY environment variable
 *     responses:
 *       201:
 *         description: Super admin created successfully
 *       400:
 *         description: Super admin already exists
 *       403:
 *         description: Invalid seed key
 */
router.post('/super-admin', SeedController.seedSuperAdmin);

/**
 * @swagger
 * /api/seed/demo-data:
 *   post:
 *     tags: [Seed]
 *     summary: Seed demo data
 *     description: Creates demo organizations, users, vehicles, and routes (requires SEED_KEY)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seedKey
 *             properties:
 *               seedKey:
 *                 type: string
 *                 description: Must match SEED_KEY environment variable
 *     responses:
 *       201:
 *         description: Demo data seeded successfully
 *       403:
 *         description: Invalid seed key
 */
router.post('/demo-data', SeedController.seedDemoData);

export default router;
