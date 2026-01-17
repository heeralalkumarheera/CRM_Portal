import express from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  getClientInteractions,
  addClientDocument
} from '../controllers/clientController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes
router
  .route('/')
  .get(checkPermission('client:read'), getClients)
  .post(
    authorize('Super Admin', 'Admin', 'Sales Executive', 'Manager'),
    checkPermission('client:create'),
    auditLog('CREATE', 'Client'),
    createClient
  );

router.get('/stats', checkPermission('client:read'), getClientStats);

router
  .route('/:id')
  .get(checkPermission('client:read'), getClient)
  .put(
    authorize('Super Admin', 'Admin', 'Sales Executive', 'Manager'),
    checkPermission('client:update'),
    auditLog('UPDATE', 'Client'),
    updateClient
  )
  .delete(
    authorize('Super Admin', 'Admin'),
    checkPermission('client:delete'),
    auditLog('DELETE', 'Client'),
    deleteClient
  );

// Interactions and documents
router.get('/:id/interactions', checkPermission('client:read'), getClientInteractions);
router.post(
  '/:id/documents',
  authorize('Super Admin', 'Admin', 'Sales Executive', 'Manager'),
  checkPermission('client:update'),
  auditLog('UPDATE', 'Client'),
  addClientDocument
);

export default router;
