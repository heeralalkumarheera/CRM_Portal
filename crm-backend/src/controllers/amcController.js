import AMC from '../models/AMC.js';
import Client from '../models/Client.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHelper.js';
import { getPagination, buildSearchQuery, buildSortQuery } from '../utils/queryHelper.js';

// @desc    Get all AMCs
// @route   GET /api/amcs
// @access  Private
export const getAMCs = async (req, res, next) => {
  try {
    const { page, limit, search, status, client, sortBy, sortOrder } = req.query;
    const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);

    let query = {};
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(['amcNumber', 'contractName', 'serviceType'], search)
      };
    }
    if (status) query.status = status;
    if (client) query.client = client;

    const total = await AMC.countDocuments(query);
    const amcs = await AMC.find(query)
      .sort(buildSortQuery(sortBy, sortOrder))
      .skip(skip)
      .limit(itemsPerPage)
      .populate('client', 'clientName companyName')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    paginatedResponse(res, amcs, currentPage, itemsPerPage, total, 'AMCs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single AMC
// @route   GET /api/amcs/:id
// @access  Private
export const getAMC = async (req, res, next) => {
  try {
    const amc = await AMC.findById(req.params.id)
      .populate('client', 'clientName companyName email phone addresses')
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('renewedFrom', 'amcNumber')
      .populate('renewedTo', 'amcNumber');

    if (!amc) {
      return errorResponse(res, 'AMC not found', 404);
    }

    successResponse(res, amc, 'AMC retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new AMC
// @route   POST /api/amcs
// @access  Private
export const createAMC = async (req, res, next) => {
  try {
    const { client, contractName, serviceType, startDate, endDate, serviceFrequency, contractValue, paymentTerms, assignedTo, notes } = req.body;

    if (!client || !contractName || !serviceType || !startDate || !endDate || !serviceFrequency || !contractValue) {
      return errorResponse(res, 'All required fields must be provided', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return errorResponse(res, 'Start date must be before end date', 400);
    }

    // Calculate duration in months and number of services
    const durationMonths = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
    
    let numberOfServices = 0;
    switch (serviceFrequency) {
      case 'Weekly': numberOfServices = Math.ceil(durationMonths / 0.23); break;
      case 'Bi-Weekly': numberOfServices = Math.ceil(durationMonths / 0.46); break;
      case 'Monthly': numberOfServices = durationMonths; break;
      case 'Quarterly': numberOfServices = Math.ceil(durationMonths / 3); break;
      case 'Half-Yearly': numberOfServices = Math.ceil(durationMonths / 6); break;
      case 'Yearly': numberOfServices = Math.ceil(durationMonths / 12); break;
      default: numberOfServices = durationMonths;
    }

    const amcNumber = `AMC${Date.now()}`;

    const amc = await AMC.create({
      amcNumber,
      client,
      contractName,
      serviceType,
      startDate: start,
      endDate: end,
      duration: durationMonths,
      serviceFrequency,
      numberOfServices,
      contractValue,
      paymentTerms: paymentTerms || 'Advance',
      assignedTo,
      notes,
      status: 'Active',
      createdBy: req.user._id
    });

    const populated = await amc.populate('client', 'clientName companyName')
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    successResponse(res, populated, 'AMC created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update AMC
// @route   PUT /api/amcs/:id
// @access  Private
export const updateAMC = async (req, res, next) => {
  try {
    const amc = await AMC.findById(req.params.id);

    if (!amc) {
      return errorResponse(res, 'AMC not found', 404);
    }

    const { contractName, serviceType, assignedTo, paymentTerms, notes, autoRenewal } = req.body;

    if (contractName) amc.contractName = contractName;
    if (serviceType) amc.serviceType = serviceType;
    if (assignedTo) amc.assignedTo = assignedTo;
    if (paymentTerms) amc.paymentTerms = paymentTerms;
    if (notes !== undefined) amc.notes = notes;
    if (autoRenewal !== undefined) amc.autoRenewal = autoRenewal;

    amc.updatedBy = req.user._id;
    await amc.save();

    const updated = await amc.populate('client', 'clientName companyName')
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    successResponse(res, updated, 'AMC updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete AMC
// @route   DELETE /api/amcs/:id
// @access  Private
export const deleteAMC = async (req, res, next) => {
  try {
    const amc = await AMC.findByIdAndDelete(req.params.id);

    if (!amc) {
      return errorResponse(res, 'AMC not found', 404);
    }

    successResponse(res, null, 'AMC deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Schedule AMC service
// @route   POST /api/amcs/:id/services
// @access  Private
export const scheduleAMCService = async (req, res, next) => {
  try {
    const { scheduledDate, description, assignedTo } = req.body;

    if (!scheduledDate) {
      return errorResponse(res, 'scheduledDate is required', 400);
    }

    const amc = await AMC.findById(req.params.id);

    if (!amc) {
      return errorResponse(res, 'AMC not found', 404);
    }

    if (amc.status === 'Expired' || amc.status === 'Cancelled') {
      return errorResponse(res, `Cannot schedule service for ${amc.status} AMC`, 400);
    }

    const service = {
      serviceDate: new Date(),
      scheduledDate: new Date(scheduledDate),
      status: 'Scheduled',
      description,
      assignedTo: assignedTo || amc.assignedTo
    };

    amc.services.push(service);
    await amc.save();

    successResponse(res, amc, 'AMC service scheduled successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Complete AMC service
// @route   POST /api/amcs/:id/services/:serviceIndex/complete
// @access  Private
export const completeAMCService = async (req, res, next) => {
  try {
    const { workPerformed, feedback, rating } = req.body;
    const { id, serviceIndex } = req.params;

    const amc = await AMC.findById(id);

    if (!amc) {
      return errorResponse(res, 'AMC not found', 404);
    }

    if (!amc.services[serviceIndex]) {
      return errorResponse(res, 'Service not found', 404);
    }

    const service = amc.services[serviceIndex];
    service.status = 'Completed';
    service.completedAt = new Date();
    service.completedBy = req.user._id;
    service.workPerformed = workPerformed;
    service.feedback = feedback;
    service.rating = rating;

    amc.servicesCompleted = (amc.servicesCompleted || 0) + 1;
    await amc.save();

    successResponse(res, amc, 'AMC service completed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Renew AMC
// @route   POST /api/amcs/:id/renew
// @access  Private
export const renewAMC = async (req, res, next) => {
  try {
    const { newEndDate } = req.body;

    if (!newEndDate) {
      return errorResponse(res, 'newEndDate is required', 400);
    }

    const oldAMC = await AMC.findById(req.params.id);

    if (!oldAMC) {
      return errorResponse(res, 'AMC not found', 404);
    }

    const newStart = oldAMC.endDate;
    const newEnd = new Date(newEndDate);

    if (newStart >= newEnd) {
      return errorResponse(res, 'New end date must be after current end date', 400);
    }

    const durationMonths = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24 * 30));
    
    let numberOfServices = 0;
    switch (oldAMC.serviceFrequency) {
      case 'Weekly': numberOfServices = Math.ceil(durationMonths / 0.23); break;
      case 'Bi-Weekly': numberOfServices = Math.ceil(durationMonths / 0.46); break;
      case 'Monthly': numberOfServices = durationMonths; break;
      case 'Quarterly': numberOfServices = Math.ceil(durationMonths / 3); break;
      case 'Half-Yearly': numberOfServices = Math.ceil(durationMonths / 6); break;
      case 'Yearly': numberOfServices = Math.ceil(durationMonths / 12); break;
      default: numberOfServices = durationMonths;
    }

    const amcNumber = `AMC${Date.now()}`;

    const newAMC = await AMC.create({
      amcNumber,
      client: oldAMC.client,
      contractName: oldAMC.contractName,
      serviceType: oldAMC.serviceType,
      startDate: newStart,
      endDate: newEnd,
      duration: durationMonths,
      serviceFrequency: oldAMC.serviceFrequency,
      numberOfServices,
      contractValue: oldAMC.contractValue,
      paymentTerms: oldAMC.paymentTerms,
      assignedTo: oldAMC.assignedTo,
      renewedFrom: oldAMC._id,
      status: 'Active',
      createdBy: req.user._id
    });

    oldAMC.status = 'Renewed';
    oldAMC.renewedTo = newAMC._id;
    await oldAMC.save();

    const populated = await newAMC.populate('client', 'clientName companyName')
      .populate('assignedTo', 'firstName lastName')
      .populate('renewedFrom', 'amcNumber');

    successResponse(res, populated, 'AMC renewed successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get AMC renewal alerts
// @route   GET /api/amcs/alerts/renewal
// @access  Private
export const getAMCRenewalAlerts = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const renewalAlerts = await AMC.find({
      status: 'Active',
      endDate: { $lte: thirtyDaysFromNow, $gte: now },
      renewalNotificationSent: false
    })
      .populate('client', 'clientName companyName')
      .populate('assignedTo', 'firstName lastName email')
      .sort('endDate');

    successResponse(res, renewalAlerts, 'Renewal alerts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get AMC statistics & analytics
// @route   GET /api/amcs/stats/overview
// @access  Private
export const getAMCStats = async (req, res, next) => {
  try {
    const stats = await AMC.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$contractValue' }
        }
      }
    ]);

    const performanceStats = await AMC.aggregate([
      {
        $match: { status: { $in: ['Active', 'Renewed'] } }
      },
      {
        $group: {
          _id: null,
          totalAMCs: { $sum: 1 },
          totalServices: { $sum: '$numberOfServices' },
          completedServices: { $sum: '$servicesCompleted' },
          totalValue: { $sum: '$contractValue' }
        }
      }
    ]);

    successResponse(res, { statusStats: stats, performance: performanceStats[0] || {} }, 'AMC statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
