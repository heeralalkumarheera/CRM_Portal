import express from 'express';
import * as documentController from '../controllers/documentController.js';
import { protect, checkPermission } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

// List & create
router.get('/', checkPermission('document:read'), documentController.listDocuments);
router.post('/', checkPermission('document:create'), upload.single('file'), documentController.uploadDocument);

// Versioning
router.post('/:id/version', checkPermission('document:update'), upload.single('file'), documentController.uploadNewVersion);

// Read/update/delete single
router.get('/:id', checkPermission('document:read'), documentController.getDocument);
router.put('/:id', checkPermission('document:update'), documentController.updateDocument);
router.delete('/:id', checkPermission('document:delete'), documentController.deleteDocument);

// Secure download
router.get('/:id/download', checkPermission('document:read'), documentController.downloadDocument);

export default router;
