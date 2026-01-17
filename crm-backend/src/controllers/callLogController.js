import CallLog from '../models/CallLog.js';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHelper.js';
import { getPagination, buildSearchQuery, buildSortQuery } from '../utils/queryHelper.js';

// @desc    Get all call logs
// @route   GET /api/calls
// @access  Private
export const getCallLogs = async (req, res, next) => {
  try {
    const { page, limit, search, callType, outcome, createdBy, sortBy, sortOrder } = req.query;
    const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);

    let query = {};
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(['callNumber', 'contactPerson', 'phoneNumber'], search)
      };
    }
    if (callType) query.callType = callType;
    if (outcome) query.outcome = outcome;
    if (createdBy) query.createdBy = createdBy;

    // Sales Executive sees only their calls
    if (req.user.role === 'Sales Executive') {
      query.createdBy = req.user._id;
    }

    const total = await CallLog.countDocuments(query);
    const callLogs = await CallLog.find(query)
      .sort(buildSortQuery(sortBy, sortOrder))
      .skip(skip)
      .limit(itemsPerPage)
      .populate('client', 'clientName companyName')
      .populate('lead', 'contactName companyName')
      .populate('createdBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName');

    paginatedResponse(res, callLogs, currentPage, itemsPerPage, total, 'Call logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single call log
// @route   GET /api/calls/:id
// @access  Private
export const getCallLog = async (req, res, next) => {
  try {
    const callLog = await CallLog.findById(req.params.id)
      .populate('client', 'clientName companyName email phone')
      .populate('lead', 'contactName companyName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName');

    if (!callLog) {
      return errorResponse(res, 'Call log not found', 404);
    }

    successResponse(res, callLog, 'Call log retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Create call log
// @route   POST /api/calls
// @access  Private
export const createCallLog = async (req, res, next) => {
  try {
    const { callType, client, lead, contactPerson, phoneNumber, purpose, outcome, summary, duration, followUpRequired, followUpDate, priority, tags } = req.body;

    if (!callType || !contactPerson || !phoneNumber || !purpose || !outcome || !summary) {
      return errorResponse(res, 'Required fields missing', 400);
    }

    const callLogNumber = `CL${Date.now()}`;

    const callLog = await CallLog.create({
      callNumber: callLogNumber,
      callType,
      client,
      lead,
      contactPerson,
      phoneNumber,
      callDate: new Date(),
      duration: duration || 0,
      purpose,
      outcome,
      summary,
      nextAction: followUpRequired ? 'Follow-up required' : null,
      followUpRequired: followUpRequired || false,
      followUpDate,
      priority: priority || 'Medium',
      tags,
      createdBy: req.user._id
    });

    // If follow-up is required, create a task
    if (followUpRequired && followUpDate) {
      await Task.create({
        taskType: 'Follow-up',
        title: `Follow-up on call with ${contactPerson}`,
        description: `Follow-up for call: ${summary}`,
        dueDate: followUpDate,
        priority: priority || 'Medium',
        assignedTo: req.user._id,
        createdBy: req.user._id,
        relatedTo: {
          resourceType: 'CallLog',
          resourceId: callLog._id
        }
      });
    }

    const populated = await callLog.populate('createdBy', 'firstName lastName')
      .populate('client', 'clientName companyName')
      .populate('lead', 'contactName companyName');

    successResponse(res, populated, 'Call log created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update call log
// @route   PUT /api/calls/:id
// @access  Private
export const updateCallLog = async (req, res, next) => {
  try {
    const callLog = await CallLog.findById(req.params.id);

    if (!callLog) {
      return errorResponse(res, 'Call log not found', 404);
    }

    const { outcome, summary, workDone, followUpRequired, followUpDate, followUpCompleted, tags, priority } = req.body;

    if (outcome) callLog.outcome = outcome;
    if (summary) callLog.summary = summary;
    if (followUpRequired !== undefined) callLog.followUpRequired = followUpRequired;
    if (followUpDate) callLog.followUpDate = followUpDate;
    if (followUpCompleted !== undefined) callLog.followUpCompleted = followUpCompleted;
    if (tags) callLog.tags = tags;
    if (priority) callLog.priority = priority;

    callLog.updatedBy = req.user._id;
    await callLog.save();

    const updated = await callLog.populate('createdBy', 'firstName lastName')
      .populate('client', 'clientName')
      .populate('lead', 'contactName');

    successResponse(res, updated, 'Call log updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete call log
// @route   DELETE /api/calls/:id
// @access  Private
export const deleteCallLog = async (req, res, next) => {
  try {
    const callLog = await CallLog.findByIdAndDelete(req.params.id);

    if (!callLog) {
      return errorResponse(res, 'Call log not found', 404);
    }

    successResponse(res, null, 'Call log deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark follow-up as completed
// @route   POST /api/calls/:id/complete-followup
// @access  Private
export const completeFollowUp = async (req, res, next) => {
  try {
    const { outcome, notes } = req.body;

    const callLog = await CallLog.findById(req.params.id);

    if (!callLog) {
      return errorResponse(res, 'Call log not found', 404);
    }

    if (!callLog.followUpRequired) {
      return errorResponse(res, 'Follow-up not required for this call', 400);
    }

    callLog.followUpCompleted = true;
    callLog.outcome = outcome || callLog.outcome;
    callLog.summary = notes || callLog.summary;
    callLog.updatedBy = req.user._id;
    await callLog.save();

    successResponse(res, callLog, 'Follow-up completed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending follow-ups
// @route   GET /api/calls/pending/followups
// @access  Private
export const getPendingFollowUps = async (req, res, next) => {
  try {
    let query = {
      followUpRequired: true,
      followUpCompleted: false,
      followUpDate: { $lte: new Date() }
    };

    if (req.user.role === 'Sales Executive') {
      query.createdBy = req.user._id;
    }

    const followUps = await CallLog.find(query)
      .sort('followUpDate')
      .populate('client', 'clientName companyName')
      .populate('lead', 'contactName companyName')
      .populate('createdBy', 'firstName lastName');

    successResponse(res, followUps, 'Pending follow-ups retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get calling performance by executive
// @route   GET /api/calls/performance/executives
// @access  Private
export const getExecutiveCallPerformance = async (req, res, next) => {
  try {
    const performance = await CallLog.aggregate([
      {
        $group: {
          _id: '$createdBy',
          totalCalls: { $sum: 1 },
          incomingCalls: {
            $sum: { $cond: [{ $eq: ['$callType', 'Incoming'] }, 1, 0] }
          },
          outgoingCalls: {
            $sum: { $cond: [{ $eq: ['$callType', 'Outgoing'] }, 1, 0] }
          },
          connectedCalls: {
            $sum: { $cond: [{ $eq: ['$outcome', 'Connected'] }, 1, 0] }
          },
          failedCalls: {
            $sum: { $cond: [{ $ne: ['$outcome', 'Connected'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' },
          followUpRequired: {
            $sum: { $cond: ['$followUpRequired', 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'executive'
        }
      },
      {
        $unwind: {
          path: '$executive',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          executiveId: '$_id',
          executiveName: { $concat: ['$executive.firstName', ' ', '$executive.lastName'] },
          totalCalls: 1,
          incomingCalls: 1,
          outgoingCalls: 1,
          connectedCalls: 1,
          failedCalls: 1,
          successRate: {
            $cond: [
              { $eq: ['$totalCalls', 0] },
              0,
              { $multiply: [{ $divide: ['$connectedCalls', '$totalCalls'] }, 100] }
            ]
          },
          avgDuration: { $round: ['$avgDuration', 2] },
          followUpRequired: 1,
          _id: 0
        }
      },
      { $sort: { totalCalls: -1 } }
    ]);

    successResponse(res, performance, 'Executive call performance retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get call statistics
// @route   GET /api/calls/stats/overview
// @access  Private
export const getCallStats = async (req, res, next) => {
  try {
    const callTypeStats = await CallLog.aggregate([
      {
        $group: {
          _id: '$callType',
          count: { $sum: 1 }
        }
      }
    ]);

    const outcomeStats = await CallLog.aggregate([
      {
        $group: {
          _id: '$outcome',
          count: { $sum: 1 }
        }
      }
    ]);

    const purposeStats = await CallLog.aggregate([
      {
        $group: {
          _id: '$purpose',
          count: { $sum: 1 }
        }
      }
    ]);

    const followUpStats = {
      followUpRequired: await CallLog.countDocuments({ followUpRequired: true }),
      followUpCompleted: await CallLog.countDocuments({ followUpCompleted: true }),
      followUpPending: await CallLog.countDocuments({ followUpRequired: true, followUpCompleted: false })
    };

    successResponse(res, { callTypeStats, outcomeStats, purposeStats, followUpStats }, 'Call statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
