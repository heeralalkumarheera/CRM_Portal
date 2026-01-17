import { successResponse, errorResponse } from '../utils/responseHelper.js';
import aiAssisted from '../utils/aiAssisted.js';
import Lead from '../models/Lead.js';
import CallLog from '../models/CallLog.js';
import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import AMC from '../models/AMC.js';
import Payment from '../models/Payment.js';

// @desc    Generate follow-up message draft
// @route   POST /api/ai/follow-up-draft
// @access  Private
export const generateFollowUpMessage = async (req, res, next) => {
  try {
    const { leadId, callLogId, outcome } = req.body;

    if (!leadId || !outcome) {
      return errorResponse(res, 'leadId and outcome are required', 400);
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    const callLog = callLogId ? await CallLog.findById(callLogId) : null;

    const draftMessage = aiAssisted.generateFollowUpDraft(lead, callLog, outcome);

    successResponse(res, {
      leadId,
      contactName: lead.contactName,
      companyName: lead.companyName,
      outcome,
      draftMessage,
      note: 'This is an AI-generated suggestion. Feel free to customize it before sending.'
    }, 'Follow-up draft generated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Generate personalized sales pitch
// @route   POST /api/ai/sales-pitch
// @access  Private
export const generateSalesPitch = async (req, res, next) => {
  try {
    const { leadId, clientId } = req.body;

    if (!leadId && !clientId) {
      return errorResponse(res, 'Either leadId or clientId is required', 400);
    }

    let lead = null;
    let client = null;

    if (leadId) {
      lead = await Lead.findById(leadId);
      if (!lead) {
        return errorResponse(res, 'Lead not found', 404);
      }
    }

    if (clientId) {
      client = await Client.findById(clientId);
      if (!client) {
        return errorResponse(res, 'Client not found', 404);
      }
    }

    const pitchSuggestion = aiAssisted.generateSalesPitchSuggestion(lead, client);

    successResponse(res, {
      contactName: lead?.contactName || client?.clientName,
      companyName: lead?.companyName || client?.companyName,
      pitchSuggestion,
      note: 'This is a suggested pitch. Customize based on your knowledge and latest developments.'
    }, 'Sales pitch generated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Generate professional invoice description
// @route   POST /api/ai/invoice-description
// @access  Private
export const generateInvoiceDescription = async (req, res, next) => {
  try {
    const { invoiceItems } = req.body;

    if (!invoiceItems || !Array.isArray(invoiceItems) || invoiceItems.length === 0) {
      return errorResponse(res, 'invoiceItems array is required', 400);
    }

    const description = aiAssisted.generateInvoiceDescription(invoiceItems);

    successResponse(res, {
      description,
      itemCount: invoiceItems.length,
      note: 'Generated description can be used in invoices for professional presentation.'
    }, 'Invoice description generated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Assess client churn risk
// @route   GET /api/ai/client-churn-risk/:clientId
// @access  Private
export const assessChurnRisk = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.clientId);

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    // Get recent interactions (calls, invoices)
    const callLogs = await CallLog.find({ client: client._id })
      .sort('-createdAt')
      .limit(10);

    const payments = await Payment.find({ client: client._id })
      .sort('-paymentDate')
      .limit(10);

    const amc = await AMC.findOne({ client: client._id, status: 'Active' });

    const churnAssessment = aiAssisted.assessClientChurnRisk(
      client,
      callLogs,
      payments,
      amc
    );

    successResponse(res, {
      clientId: client._id,
      clientName: client.clientName,
      companyName: client.companyName,
      ...churnAssessment
    }, 'Client churn risk assessment completed');
  } catch (error) {
    next(error);
  }
};

// @desc    Get AMC renewal probability insights
// @route   GET /api/ai/amc-renewal-probability/:amcId
// @access  Private
export const getAMCRenewalInsights = async (req, res, next) => {
  try {
    const amc = await AMC.findById(req.params.amcId);

    if (!amc) {
      return errorResponse(res, 'AMC not found', 404);
    }

    // Get previous AMCs for same client
    const previousAMCs = await AMC.find({
      client: amc.client,
      _id: { $ne: amc._id }
    }).sort('-endDate');

    // Get client payment history
    const payments = await Payment.find({ client: amc.client }).sort('-paymentDate');

    const renewalInsights = aiAssisted.assessAMCRenewalProbability(
      amc,
      previousAMCs,
      payments
    );

    successResponse(res, {
      amcId: amc._id,
      amcNumber: amc.amcNumber,
      contractName: amc.contractName,
      ...renewalInsights
    }, 'AMC renewal probability assessed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all client churn risks (dashboard)
// @route   GET /api/ai/churn-risks
// @access  Private
export const getAllChurnRisks = async (req, res, next) => {
  try {
    const { riskLevel } = req.query; // Filter by risk level: Low, Medium, High, Critical

    const clients = await Client.find().limit(50);

    const churnRisks = [];

    for (const client of clients) {
      const callLogs = await CallLog.find({ client: client._id }).sort('-createdAt').limit(5);
      const payments = await Payment.find({ client: client._id }).sort('-paymentDate').limit(5);
      const amc = await AMC.findOne({ client: client._id, status: 'Active' });

      const assessment = aiAssisted.assessClientChurnRisk(client, callLogs, payments, amc);

      if (!riskLevel || assessment.riskLevel === riskLevel) {
        churnRisks.push({
          clientId: client._id,
          clientName: client.clientName,
          companyName: client.companyName,
          ...assessment
        });
      }
    }

    // Sort by risk score (highest first)
    churnRisks.sort((a, b) => b.riskScore - a.riskScore);

    successResponse(res, {
      total: churnRisks.length,
      critical: churnRisks.filter(c => c.riskLevel === 'Critical').length,
      high: churnRisks.filter(c => c.riskLevel === 'High').length,
      medium: churnRisks.filter(c => c.riskLevel === 'Medium').length,
      low: churnRisks.filter(c => c.riskLevel === 'Low').length,
      risks: churnRisks
    }, 'Churn risks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all AMC renewal probabilities (dashboard)
// @route   GET /api/ai/amc-renewal-insights
// @access  Private
export const getAllAMCRenewalInsights = async (req, res, next) => {
  try {
    const { probability } = req.query; // Filter by probability: Low, Moderate, High

    const amcs = await AMC.find({ status: 'Active' }).limit(50);

    const renewalInsights = [];

    for (const amc of amcs) {
      const previousAMCs = await AMC.find({
        client: amc.client,
        _id: { $ne: amc._id }
      }).sort('-endDate');

      const payments = await Payment.find({ client: amc.client }).sort('-paymentDate');

      const insights = aiAssisted.assessAMCRenewalProbability(amc, previousAMCs, payments);

      renewalInsights.push({
        amcId: amc._id,
        amcNumber: amc.amcNumber,
        contractName: amc.contractName,
        clientName: amc.client?.clientName || 'Unknown',
        ...insights
      });
    }

    // Sort by probability (highest first)
    renewalInsights.sort((a, b) => b.renewalProbability - a.renewalProbability);

    const highProb = renewalInsights.filter(r => r.renewalProbability >= 75).length;
    const modProb = renewalInsights.filter(r => r.renewalProbability >= 50 && r.renewalProbability < 75).length;
    const lowProb = renewalInsights.filter(r => r.renewalProbability < 50).length;

    successResponse(res, {
      total: renewalInsights.length,
      highProbability: highProb,
      moderateProbability: modProb,
      lowProbability: lowProb,
      insights: renewalInsights
    }, 'AMC renewal insights retrieved successfully');
  } catch (error) {
    next(error);
  }
};
