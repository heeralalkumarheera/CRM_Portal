import express from 'express';
import * as quotationController from '../controllers/quotationController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// Get all quotations
router.get('/', checkPermission('quotation:read'), quotationController.getQuotations);

// Get quotation stats
router.get('/stats/overview', checkPermission('quotation:read'), quotationController.getQuotationStats);

// Get single quotation
router.get('/:id', checkPermission('quotation:read'), quotationController.getQuotation);

// Create quotation
router.post('/', checkPermission('quotation:create'), quotationController.createQuotation);

// Update quotation
router.put('/:id', checkPermission('quotation:update'), quotationController.updateQuotation);

// Delete quotation
router.delete('/:id', checkPermission('quotation:delete'), quotationController.deleteQuotation);

// Send quotation
router.post('/:id/send', checkPermission('quotation:update'), quotationController.sendQuotation);

// Mark quotation as viewed
router.post('/:id/view', checkPermission('quotation:update'), quotationController.markQuotationViewed);

// Approve quotation (Admin/Manager)
router.post('/:id/approve', authorize('Admin', 'Manager'), quotationController.approveQuotation);

// Reject quotation (Admin/Manager)
router.post('/:id/reject', authorize('Admin', 'Manager'), quotationController.rejectQuotation);

// Convert quotation to invoice
router.post('/:id/convert', checkPermission('quotation:update'), quotationController.convertQuotationToInvoice);

// Get quotation version history
router.get('/:id/history', checkPermission('quotation:read'), quotationController.getQuotationHistory);

export default router;
