import User from '../models/User.js';

let rrIndex = 0;

export const autoAssignLead = async (fallbackUserId = null) => {
  try {
    const salesExecs = await User.find({ role: 'Sales Executive', isActive: true }).select('_id').lean();
    if (!salesExecs || salesExecs.length === 0) {
      return fallbackUserId; // no sales execs, fall back to creator
    }
    const pick = salesExecs[rrIndex % salesExecs.length]._id;
    rrIndex = (rrIndex + 1) % salesExecs.length;
    return pick;
  } catch {
    return fallbackUserId;
  }
};
