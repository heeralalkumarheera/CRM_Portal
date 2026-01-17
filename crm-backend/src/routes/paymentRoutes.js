import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// Get all payments
router.get('/', checkPermission('payment:read'), paymentController.getPayments);

// Get payment stats
router.get('/stats/overview', checkPermission('payment:read'), paymentController.getPaymentStats);

// Get payment reconciliation report
router.get('/reports/reconciliation', checkPermission('payment:read'), paymentController.getPaymentReconciliation);

// Get single payment
router.get('/:id', checkPermission('payment:read'), paymentController.getPayment);

// Create payment
router.post('/', checkPermission('payment:create'), paymentController.createPayment);

// Update payment
router.put('/:id', checkPermission('payment:update'), paymentController.updatePayment);

// Delete payment
router.delete('/:id', checkPermission('payment:delete'), paymentController.deletePayment);

export default router;
