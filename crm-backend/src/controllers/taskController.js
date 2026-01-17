import Task from '../models/Task.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHelper.js';
import { getPagination, buildSearchQuery, buildSortQuery } from '../utils/queryHelper.js';

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const { page, limit, search, status, priority, taskType, sortBy, sortOrder } = req.query;

    const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);

    // Build query
    let query = {};

    // Search
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(['title', 'description', 'taskNumber'], search)
      };
    }

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (taskType) query.taskType = taskType;

    // Count total documents
    const total = await Task.countDocuments(query);

    // Get tasks with pagination
    const tasks = await Task.find(query)
      .sort(buildSortQuery(sortBy, sortOrder))
      .skip(skip)
      .limit(itemsPerPage)
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'relatedTo.recordId',
        select: 'clientName companyName contactName invoiceNumber quotationNumber amcNumber email phone',
        strictPopulate: false
      })
      .populate('createdBy', 'firstName lastName');

    paginatedResponse(res, tasks, currentPage, itemsPerPage, total, 'Tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'relatedTo.recordId',
        select: 'clientName companyName contactName invoiceNumber quotationNumber amcNumber email phone',
        strictPopulate: false
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!task) {
      return errorResponse(res, 'Task not found', 404);
    }

    successResponse(res, task, 'Task retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  try {
    // Generate task number
    const lastTask = await Task.findOne().sort({ createdAt: -1 });
    const taskNumber = lastTask 
      ? `TSK${String(parseInt(lastTask.taskNumber.replace('TSK', '')) + 1).padStart(5, '0')}`
      : 'TSK00001';

    const taskData = {
      ...req.body,
      taskNumber,
      createdBy: req.user.id
    };

    // If no assignedTo, assign to creator
    if (!taskData.assignedTo) {
      taskData.assignedTo = req.user.id;
    }

    const task = await Task.create(taskData);

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'relatedTo.recordId',
        select: 'clientName companyName contactName invoiceNumber quotationNumber amcNumber email phone',
        strictPopulate: false
      })
      .populate('createdBy', 'firstName lastName');

    successResponse(res, populatedTask, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return errorResponse(res, 'Task not found', 404);
    }

    // Update task
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    // If status is changed to Completed, set completedDate
    if (req.body.status === 'Completed' && task.status !== 'Completed') {
      updateData.completedDate = new Date();
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'relatedTo.recordId',
        select: 'clientName companyName contactName invoiceNumber quotationNumber amcNumber email phone',
        strictPopulate: false
      })
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    successResponse(res, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return errorResponse(res, 'Task not found', 404);
    }

    await task.deleteOne();

    successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats/overview
// @access  Private
export const getTaskStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          byPriority: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 }
              }
            }
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: new Date() },
                status: { $nin: ['Completed', 'Cancelled'] }
              }
            },
            {
              $count: 'count'
            }
          ],
          dueToday: [
            {
              $match: {
                dueDate: {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  $lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                status: { $nin: ['Completed', 'Cancelled'] }
              }
            },
            {
              $count: 'count'
            }
          ]
        }
      }
    ]);

    const formattedStats = {
      byStatus: stats[0].byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: stats[0].byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      overdue: stats[0].overdue[0]?.count || 0,
      dueToday: stats[0].dueToday[0]?.count || 0
    };

    successResponse(res, formattedStats, 'Task statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
