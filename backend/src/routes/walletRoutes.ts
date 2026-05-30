import { Router } from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Wallet operations
router.get('/', WalletController.getWallet);
router.post('/topup', WalletController.topUp);
router.get('/transactions', WalletController.getTransactions);

// Tap operations
router.post('/tap-in', WalletController.tapIn);
router.post('/tap-out', WalletController.tapOut);
router.get('/active-session', WalletController.getActiveSession);
router.get('/tap-history', WalletController.getTapHistory);

export default router;
