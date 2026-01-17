import express from 'express';
import { portalProtect } from '../middleware/portalAuth.js';
import * as portalController from '../controllers/portalController.js';

const router = express.Router();

router.use(portalProtect);

router.get('/me', portalController.me);
router.get('/quotations', portalController.myQuotations);
router.get('/invoices', portalController.myInvoices);
router.get('/amcs', portalController.myAMCs);
router.get('/payments', portalController.myPayments);
router.get('/service-requests', portalController.myServiceRequests);
router.post('/service-requests', portalController.createServiceRequest);

export default router;
