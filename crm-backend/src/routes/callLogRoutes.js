import express from 'express';
import * as callLogController from '../controllers/callLogController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// Get all call logs
router.get('/', checkPermission('calllog:read'), callLogController.getCallLogs);

// Get call stats
router.get('/stats/overview', checkPermission('calllog:read'), callLogController.getCallStats);

// Get pending follow-ups
router.get('/pending/followups', callLogController.getPendingFollowUps);

// Get executive call performance
router.get('/performance/executives', checkPermission('calllog:read'), callLogController.getExecutiveCallPerformance);

// Get single call log
router.get('/:id', checkPermission('calllog:read'), callLogController.getCallLog);

// Create call log
router.post('/', checkPermission('calllog:create'), callLogController.createCallLog);

// Update call log
router.put('/:id', checkPermission('calllog:update'), callLogController.updateCallLog);

// Delete call log
router.delete('/:id', checkPermission('calllog:delete'), callLogController.deleteCallLog);

// Complete follow-up
router.post('/:id/complete-followup', checkPermission('calllog:update'), callLogController.completeFollowUp);

export default router;
