import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import CallLog from '../models/CallLog.js';
import Settings from '../models/Settings.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHelper.js';
import { filterLead, filterLeads } from '../utils/fieldFilter.js';
import { getPagination, buildSearchQuery, buildSortQuery } from '../utils/queryHelper.js';
import { autoAssignLead } from '../utils/assignment.js';

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
export const getLeads = async (req, res, next) => {
  try {
    const { page, limit, search, status, stage, assignedTo, sortBy, sortOrder } = req.query;

    const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);

    // Build query
    let query = {};

    // Search
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(['contactName', 'companyName', 'email', 'phone'], search)
      };
    }

    // Filters
    if (status) query.status = status;
    if (stage) query.stage = stage;
    if (assignedTo) query.assignedTo = assignedTo;

    // Role-based filtering
    if (req.user.role === 'Sales Executive') {
      query.assignedTo = req.user._id;
    }

    const total = await Lead.countDocuments(query);

    const leads = await Lead.find(query)
      .sort(buildSortQuery(sortBy, sortOrder))
      .skip(skip)
      .limit(itemsPerPage)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('convertedToClient', 'clientName companyName');

    const filtered = filterLeads(leads, req.user.role);
    paginatedResponse(res, filtered, currentPage, itemsPerPage, total, 'Leads retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
export const getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('convertedToClient');

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    const filtered = filterLead(lead, req.user.role);
    successResponse(res, filtered, 'Lead retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private
export const createLead = async (req, res, next) => {
  try {
    // Generate lead number
    const lastLead = await Lead.findOne().sort({ createdAt: -1 });
    const leadNumber = lastLead 
      ? `LD${String(parseInt(lastLead.leadNumber.replace('LD', '')) + 1).padStart(5, '0')}`
      : 'LD00001';

    req.body.leadNumber = leadNumber;
    req.body.createdBy = req.user._id;
    
    // Auto-assign to a Sales Executive if not specified
    if (!req.body.assignedTo) {
      req.body.assignedTo = await autoAssignLead(req.user?._id);
    }

    const settings = await Settings.getSingleton();
    let allowedStages = settings?.salesStages?.length ? [...settings.salesStages] : ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
    if (!allowedStages.includes('Won')) allowedStages.push('Won');
    if (!allowedStages.includes('Lost')) allowedStages.push('Lost');

    if (req.body.stage) {
      if (!allowedStages.includes(req.body.stage)) {
        return errorResponse(res, `Invalid stage. Allowed: ${allowedStages.join(', ')}`, 400);
      }
    } else {
      req.body.stage = allowedStages[0] || 'New';
    }

    const lead = await Lead.create(req.body);

    const filtered = filterLead(lead, req.user.role);
    successResponse(res, filtered, 'Lead created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
export const updateLead = async (req, res, next) => {
  try {
    req.body.updatedBy = req.user._id;

    if (req.body.stage) {
      const settings = await Settings.getSingleton();
      let allowedStages = settings?.salesStages?.length ? [...settings.salesStages] : ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
      if (!allowedStages.includes('Won')) allowedStages.push('Won');
      if (!allowedStages.includes('Lost')) allowedStages.push('Lost');
      if (!allowedStages.includes(req.body.stage)) {
        return errorResponse(res, `Invalid stage. Allowed: ${allowedStages.join(', ')}`, 400);
      }
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    const filtered = filterLead(lead, req.user.role);
    successResponse(res, filtered, 'Lead updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    successResponse(res, null, 'Lead deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark lead as lost with reason
// @route   POST /api/leads/:id/lost
// @access  Private
export const markLeadLost = async (req, res, next) => {
  try {
    const { lostReason, lostReasonDetails } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return errorResponse(res, 'Lead not found', 404);

    lead.status = 'Lost';
    lead.stage = 'Lost';
    lead.lostReason = lostReason || lead.lostReason;
    lead.lostReasonDetails = lostReasonDetails || lead.lostReasonDetails;
    lead.updatedBy = req.user._id;
    await lead.save();

    const filtered = filterLead(lead, req.user.role);
    successResponse(res, filtered, 'Lead marked as lost');
  } catch (error) {
    next(error);
  }
};

// @desc    Public website lead capture
// @route   POST /api/leads/capture
// @access  Public
export const captureLead = async (req, res, next) => {
  try {
    const { contactName, email, phone, companyName, sourceDetails } = req.body;
    if (!contactName || (!email && !phone)) {
      return errorResponse(res, 'contactName and email or phone are required', 400);
    }
    const assignedTo = await autoAssignLead(null);

    const settings = await Settings.getSingleton();
    let allowedStages = settings?.salesStages?.length ? [...settings.salesStages] : ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
    if (!allowedStages.includes('Won')) allowedStages.push('Won');
    if (!allowedStages.includes('Lost')) allowedStages.push('Lost');

    const lead = await Lead.create({
      contactName,
      email,
      phone,
      companyName,
      source: 'Website',
      sourceDetails,
      stage: allowedStages[0] || 'New',
      status: 'Open',
      assignedTo,
      createdBy: req.user?._id
    });
    successResponse(res, filterLead(lead, req.user?.role || 'Support Staff'), 'Lead captured from website', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Call-based lead capture (also logs the call)
// @route   POST /api/leads/capture/call
// @access  Private (Support/Sales)
export const captureLeadFromCall = async (req, res, next) => {
  try {
    const { contactName, phone, companyName, summary, outcome, purpose } = req.body;
    if (!contactName || !phone) {
      return errorResponse(res, 'contactName and phone are required', 400);
    }
    const assignedTo = await autoAssignLead(req.user?._id);

    const settings = await Settings.getSingleton();
    let allowedStages = settings?.salesStages?.length ? [...settings.salesStages] : ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
    if (!allowedStages.includes('Won')) allowedStages.push('Won');
    if (!allowedStages.includes('Lost')) allowedStages.push('Lost');

    const lead = await Lead.create({
      contactName,
      phone,
      companyName,
      source: 'Call',
      stage: allowedStages[0] || 'New',
      status: 'Open',
      assignedTo,
      createdBy: req.user._id
    });

    await CallLog.create({
      callType: 'Incoming',
      lead: lead._id,
      contactPerson: contactName,
      phoneNumber: phone,
      purpose: purpose || 'Sales',
      outcome: outcome || 'Connected',
      summary: summary || 'Lead captured via call',
      createdBy: req.user._id
    });

    successResponse(res, filterLead(lead, req.user.role), 'Lead captured from call', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Sales forecasting (expected revenue)
// @route   GET /api/leads/forecast
// @access  Private
export const getLeadForecast = async (req, res, next) => {
  try {
    const match = {};
    if (req.user.role === 'Sales Executive') {
      match.assignedTo = req.user._id;
    }

    const forecast = await Lead.aggregate([
      { $match: { ...match, expectedRevenue: { $gt: 0 }, expectedClosureDate: { $ne: null } } },
      {
        $project: {
          year: { $year: '$expectedClosureDate' },
          month: { $month: '$expectedClosureDate' },
          expectedRevenue: 1,
          probability: { $ifNull: ['$probability', 0] }
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          deals: { $sum: 1 },
          totalExpected: { $sum: '$expectedRevenue' },
          weightedExpected: { $sum: { $multiply: ['$expectedRevenue', { $divide: ['$probability', 100] }] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    successResponse(res, forecast, 'Lead forecast retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Convert lead to client
// @route   POST /api/leads/:id/convert
// @access  Private
export const convertLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    if (lead.status === 'Converted') {
      return errorResponse(res, 'Lead already converted', 400);
    }

    // Create client from lead
    const client = await Client.create({
      clientType: lead.companyName ? 'Company' : 'Individual',
      companyName: lead.companyName,
      clientName: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      alternatePhone: lead.alternatePhone,
      addresses: lead.address ? [lead.address] : [],
      source: lead.source,
      assignedTo: lead.assignedTo,
      createdBy: req.user._id
    });

    // Update lead
    lead.status = 'Converted';
    lead.stage = 'Won';
    lead.convertedToClient = client._id;
    lead.convertedDate = new Date();
    await lead.save();

    const filteredLead = filterLead(lead, req.user.role);
    successResponse(res, { lead: filteredLead, client }, 'Lead converted to client successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get lead statistics
// @route   GET /api/leads/stats
// @access  Private
export const getLeadStats = async (req, res, next) => {
  try {
    let matchQuery = {};
    
    // Filter by user for sales executives
    if (req.user.role === 'Sales Executive') {
      matchQuery.assignedTo = req.user._id;
    }

    const stageStats = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$expectedRevenue' }
        }
      }
    ]);

    const sourceStats = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    const conversionRate = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] }
          }
        }
      }
    ]);

    successResponse(res, { stageStats, sourceStats, conversionRate }, 'Lead statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
