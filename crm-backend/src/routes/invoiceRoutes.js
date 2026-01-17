import express from 'express';
import * as invoiceController from '../controllers/invoiceController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// Get all invoices
router.get('/', checkPermission('invoice:read'), invoiceController.getInvoices);

// Get invoice stats
router.get('/stats/overview', checkPermission('invoice:read'), invoiceController.getInvoiceStats);

// Get outstanding & overdue invoices
router.get('/alerts/outstanding', checkPermission('invoice:read'), invoiceController.getOutstandingInvoices);

// Get single invoice
router.get('/:id', checkPermission('invoice:read'), invoiceController.getInvoice);

// Create invoice
router.post('/', checkPermission('invoice:create'), invoiceController.createInvoice);

// Update invoice
router.put('/:id', checkPermission('invoice:update'), invoiceController.updateInvoice);

// Delete invoice
router.delete('/:id', checkPermission('invoice:delete'), invoiceController.deleteInvoice);

// Send invoice
router.post('/:id/send', checkPermission('invoice:update'), invoiceController.sendInvoice);

// Record payment for invoice
router.post('/:id/record-payment', checkPermission('invoice:update'), invoiceController.recordPayment);

// Get invoice payments history
router.get('/:id/payments', checkPermission('invoice:read'), invoiceController.getInvoicePayments);

export default router;
