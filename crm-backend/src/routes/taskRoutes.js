import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
} from '../controllers/taskController.js';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Stats route (must be before :id route)
router
  .route('/stats/overview')
  .get(checkPermission('task:read'), getTaskStats);

// Routes
router
  .route('/')
  .get(checkPermission('task:read'), getTasks)
  .post(
    authorize('Super Admin', 'Admin', 'Sales Executive', 'Manager', 'Service Engineer'),
    checkPermission('task:create'),
    auditLog('CREATE', 'Task'),
    createTask
  );

router
  .route('/:id')
  .get(checkPermission('task:read'), getTask)
  .put(
    authorize('Super Admin', 'Admin', 'Sales Executive', 'Manager', 'Service Engineer'),
    checkPermission('task:update'),
    auditLog('UPDATE', 'Task'),
    updateTask
  )
  .delete(
    authorize('Super Admin', 'Admin', 'Manager'),
    checkPermission('task:delete'),
    auditLog('DELETE', 'Task'),
    deleteTask
  );

export default router;
