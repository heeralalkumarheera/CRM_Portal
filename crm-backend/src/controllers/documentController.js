import fs from 'fs';
import path from 'path';
import Document from '../models/Document.js';
import Client from '../models/Client.js';

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });

    const { category, description, client, relatedModule, relatedId, tags } = req.body;

    const doc = await Document.create({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: path.join('uploads', String(client || 'general'), req.file.filename),
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      category,
      relatedTo: {
        module: relatedModule || 'None',
        recordId: relatedId || undefined
      },
      client: client || undefined,
      description,
      version: 1,
      isLatestVersion: true,
      tags: tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean)) : [],
      accessControl: {
        isPublic: false,
      },
      uploadedBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

export const listDocuments = async (req, res, next) => {
  try {
    const { client, category, module, recordId, search, latestOnly } = req.query;
    const q = {};
    if (client) q.client = client;
    if (category) q.category = category;
    if (module) q['relatedTo.module'] = module;
    if (recordId) q['relatedTo.recordId'] = recordId;
    if (latestOnly === 'true') q.isLatestVersion = true;

    if (search) {
      q.$or = [
        { fileName: new RegExp(search, 'i') },
        { originalName: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const docs = await Document.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
};

export const getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

export const updateDocument = async (req, res, next) => {
  try {
    const updates = (({ description, category, tags, accessControl }) => ({ description, category, tags, accessControl }))(req.body);
    const doc = await Document.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Remove file from disk
    try {
      const filePath = path.join(process.cwd(), doc.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}

    await doc.deleteOne();
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { next(err); }
};

export const uploadNewVersion = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    const prev = await Document.findById(req.params.id);
    if (!prev) return res.status(404).json({ success: false, message: 'Base document not found' });

    prev.isLatestVersion = false;
    await prev.save();

    const newDoc = await Document.create({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: path.join('uploads', String(prev.client || 'general'), req.file.filename),
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      category: prev.category,
      relatedTo: prev.relatedTo,
      client: prev.client,
      description: prev.description,
      version: prev.version + 1,
      isLatestVersion: true,
      previousVersion: prev._id,
      tags: prev.tags,
      accessControl: prev.accessControl,
      uploadedBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: newDoc });
  } catch (err) { next(err); }
};

export const downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Security: if accessControl specifies allowedRoles/users, enforce
    if (!doc.accessControl?.isPublic) {
      const role = req.user.role;
      const allowedRoles = doc.accessControl?.allowedRoles || [];
      const allowedUsers = (doc.accessControl?.allowedUsers || []).map(String);
      const isAllowed = allowedRoles.length === 0 || allowedRoles.includes(role) || allowedUsers.includes(String(req.user._id));
      if (!isAllowed) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });
    res.setHeader('Content-Type', doc.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) { next(err); }
};
