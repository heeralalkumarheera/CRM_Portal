import express from 'express';
import { protect, authorize, checkPermission } from '../middleware/auth.js';
import { createUser, listUsers, updateUser } from '../controllers/userController.js';

const router = express.Router();

// All routes protected and restricted to Super Admin/Admin
router.use(protect);
router.use(authorize('Super Admin', 'Admin'));

router.post('/', checkPermission('user:create'), createUser);
router.get('/', checkPermission('user:read'), listUsers);
router.put('/:id', checkPermission('user:update'), updateUser);

export default router;
