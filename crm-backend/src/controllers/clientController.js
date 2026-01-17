import Client from '../models/Client.js';
import CallLog from '../models/CallLog.js';
import Invoice from '../models/Invoice.js';
import AMC from '../models/AMC.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHelper.js';
import { filterClient, filterClients } from '../utils/fieldFilter.js';
import { getPagination, buildSearchQuery, buildSortQuery } from '../utils/queryHelper.js';

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
export const getClients = async (req, res, next) => {
  try {
    const { page, limit, search, status, category, sortBy, sortOrder } = req.query;

    const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);

    // Build query
    let query = {};

    // Search
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(['clientName', 'companyName', 'email', 'phone'], search)
      };
    }

    // Filters
    if (status) query.status = status;
    if (category) query.category = category;

    // Count total documents
    const total = await Client.countDocuments(query);

    // Get clients with pagination
    const clients = await Client.find(query)
      .sort(buildSortQuery(sortBy, sortOrder))
      .skip(skip)
      .limit(itemsPerPage)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    const filtered = filterClients(clients, req.user.role);
    paginatedResponse(res, filtered, currentPage, itemsPerPage, total, 'Clients retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
export const getClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    const filtered = filterClient(client, req.user.role);
    successResponse(res, filtered, 'Client retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private
export const createClient = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user._id;

    const client = await Client.create(req.body);

    const filtered = filterClient(client, req.user.role);
    successResponse(res, filtered, 'Client created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
export const updateClient = async (req, res, next) => {
  try {
    req.body.updatedBy = req.user._id;

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    const filtered = filterClient(client, req.user.role);
    successResponse(res, filtered, 'Client updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
export const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return errorResponse(res, 'Client not found', 404);
    }

    successResponse(res, null, 'Client deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Private
export const getClientStats = async (req, res, next) => {
  try {
    const stats = await Client.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Client.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    successResponse(res, { statusStats: stats, categoryStats }, 'Client statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get client interaction history (calls, invoices, AMC)
// @route   GET /api/clients/:id/interactions
// @access  Private
export const getClientInteractions = async (req, res, next) => {
  try {
    const clientId = req.params.id;

    const [calls, invoices, amcs] = await Promise.all([
      CallLog.find({ client: clientId })
        .sort({ callDate: -1 })
        .limit(100),
      Invoice.find({ client: clientId })
        .sort({ createdAt: -1 })
        .limit(100),
      AMC.find({ client: clientId })
        .sort({ createdAt: -1 })
        .limit(100)
    ]);

    successResponse(res, { calls, invoices, amcs }, 'Client interactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Add a document metadata to client (URL-based)
// @route   POST /api/clients/:id/documents
// @access  Private
export const addClientDocument = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    const { fileName, fileUrl, fileType } = req.body;

    if (!fileName || !fileUrl) {
      return errorResponse(res, 'fileName and fileUrl are required', 400);
    }

    const update = {
      $push: {
        documents: {
          fileName,
          fileUrl,
          fileType,
          uploadedBy: req.user._id
        }
      }
    };

    const client = await Client.findByIdAndUpdate(clientId, update, { new: true });
    if (!client) return errorResponse(res, 'Client not found', 404);

    const filtered = filterClient(client, req.user.role);
    successResponse(res, filtered, 'Document added to client');
  } catch (error) {
    next(error);
  }
};
