import express from 'express';
import * as amcController from '../controllers/amcController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// Get all AMCs
router.get('/', checkPermission('amc:read'), amcController.getAMCs);

// Get AMC stats
router.get('/stats/overview', checkPermission('amc:read'), amcController.getAMCStats);

// Get renewal alerts
router.get('/alerts/renewal', checkPermission('amc:read'), amcController.getAMCRenewalAlerts);

// Get single AMC
router.get('/:id', checkPermission('amc:read'), amcController.getAMC);

// Create AMC
router.post('/', checkPermission('amc:create'), amcController.createAMC);

// Update AMC
router.put('/:id', checkPermission('amc:update'), amcController.updateAMC);

// Delete AMC
router.delete('/:id', checkPermission('amc:delete'), amcController.deleteAMC);

// Schedule service
router.post('/:id/services', checkPermission('amc:update'), amcController.scheduleAMCService);

// Complete service
router.post('/:id/services/:serviceIndex/complete', checkPermission('amc:update'), amcController.completeAMCService);

// Renew AMC
router.post('/:id/renew', checkPermission('amc:create'), amcController.renewAMC);

export default router;
