import express from 'express';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import * as portalAuthController from '../controllers/portalAuthController.js';

const router = express.Router();

// Public portal login
router.post('/login', portalAuthController.portalLogin);

// Admin actions to enable/disable portal
router.use(protect);
router.post('/clients/:clientId/enable', authorize('Admin', 'Manager'), portalAuthController.enablePortalAccess);
router.post('/clients/:clientId/disable', authorize('Admin', 'Manager'), portalAuthController.disablePortalAccess);

export default router;
