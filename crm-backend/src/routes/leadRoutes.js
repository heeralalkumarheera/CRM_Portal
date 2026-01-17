import express from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  getLeadStats,
  markLeadLost,
  captureLead,
  captureLeadFromCall,
  getLeadForecast
} from '../controllers/leadController.js';
import { protect, authorize, checkPermission, optionalAuth } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes
router
  .route('/')
  .get(checkPermission('lead:read'), getLeads)
  .post(
    authorize('Super Admin', 'Admin', 'Sales Executive', 'Manager'),
    checkPermission('lead:create'),
    auditLog('CREATE', 'Lead'),
    createLead
  );

router.get('/stats', checkPermission('lead:read'), getLeadStats);

router
  .route('/:id')
  .get(checkPermission('lead:read'), getLead)
  .put(
    authorize('Super Admin', 'Admin', 'Sales Executive', 'Manager'),
    checkPermission('lead:update'),
    auditLog('UPDATE', 'Lead'),
    updateLead
  )
  .delete(
    authorize('Super Admin', 'Admin'),
    checkPermission('lead:delete'),
    auditLog('DELETE', 'Lead'),
    deleteLead
  );

router.post('/:id/convert',
  authorize('Super Admin', 'Admin', 'Manager'),
  checkPermission('lead:update'),
  auditLog('UPDATE', 'Lead'),
  convertLead
);

// Mark lead as lost
router.post('/:id/lost',
  authorize('Super Admin', 'Admin', 'Sales Executive', 'Manager'),
  checkPermission('lead:update'),
  auditLog('UPDATE', 'Lead'),
  markLeadLost
);

// Public website capture (no auth required)
router.post('/capture', optionalAuth, captureLead);

// Call-based capture (Support, Sales, Manager, Admin)
router.post('/capture/call',
  protect,
  authorize('Super Admin', 'Admin', 'Sales Executive', 'Support Staff', 'Manager'),
  checkPermission('lead:create'),
  auditLog('CREATE', 'Lead'),
  captureLeadFromCall
);

// Forecasting report
router.get('/forecast', protect, checkPermission('report:sales'), getLeadForecast);

export default router;
