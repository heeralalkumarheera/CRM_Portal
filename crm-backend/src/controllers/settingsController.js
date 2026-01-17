import Settings from '../models/Settings.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

export const getSettings = async (req, res, next) => {
  try {
    const doc = await Settings.getSingleton();
    successResponse(res, doc, 'Settings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const allowed = ['salesStages', 'leadSources', 'lostReasons'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key]) update[key] = req.body[key];
    }
    if (Object.keys(update).length === 0) {
      return errorResponse(res, 'No updatable fields provided', 400);
    }
    update.updatedBy = req.user?._id;
    const settings = await Settings.getSingleton();
    Object.assign(settings, update);
    await settings.save();
    successResponse(res, settings, 'Settings updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getPublicSettings = async (req, res, next) => {
  try {
    const doc = await Settings.getSingleton();
    const { salesStages, leadSources, lostReasons, updatedAt } = doc;
    successResponse(res, { salesStages, leadSources, lostReasons, updatedAt }, 'Public settings retrieved');
  } catch (error) {
    next(error);
  }
};
