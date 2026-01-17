import express from 'express';
import { getSettings, updateSettings, getPublicSettings } from '../controllers/settingsController.js';
import { protect, authorize, checkPermission, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public settings for frontend consumption
router.get('/public', optionalAuth, getPublicSettings);

// Admin-only settings management
router.use(protect);
router.use(authorize('Super Admin', 'Admin'));
router.use(checkPermission('system:settings'));

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
