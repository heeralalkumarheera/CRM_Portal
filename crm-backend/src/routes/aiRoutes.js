import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require authentication

// Generate follow-up message draft
router.post('/follow-up-draft', checkPermission('lead:read'), aiController.generateFollowUpMessage);

// Generate personalized sales pitch
router.post('/sales-pitch', checkPermission('lead:read'), aiController.generateSalesPitch);

// Generate professional invoice description
router.post('/invoice-description', checkPermission('invoice:read'), aiController.generateInvoiceDescription);

// Assess client churn risk (single client)
router.get('/client-churn-risk/:clientId', checkPermission('client:read'), aiController.assessChurnRisk);

// Get all clients with churn risks (dashboard)
router.get('/churn-risks', checkPermission('client:read'), aiController.getAllChurnRisks);

// Get AMC renewal probability insights (single AMC)
router.get('/amc-renewal-probability/:amcId', checkPermission('amc:read'), aiController.getAMCRenewalInsights);

// Get all AMCs with renewal insights (dashboard)
router.get('/amc-renewal-insights', checkPermission('amc:read'), aiController.getAllAMCRenewalInsights);

export default router;
