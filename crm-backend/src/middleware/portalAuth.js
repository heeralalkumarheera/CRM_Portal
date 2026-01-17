import jwt from 'jsonwebtoken';
import Client from '../models/Client.js';
import { getSecrets } from '../utils/jwtHelper.js';

export const portalProtect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
    const { JWT_SECRET } = getSecrets();
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await Client.findById(decoded.id);
    if (!client || !client.portal?.isEnabled) return res.status(401).json({ success: false, message: 'Invalid portal token' });
    req.portal = { client };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

export default portalProtect;
