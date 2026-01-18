import { Router, Request, Response } from 'express';

const router = Router();

// Test route without authentication
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Profile route working' });
});

export default router;