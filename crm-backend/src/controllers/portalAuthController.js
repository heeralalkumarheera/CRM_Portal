import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Client from '../models/Client.js';
import { getSecrets } from '../utils/jwtHelper.js';

export const portalLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const client = await Client.findOne({ 'portal.email': email.toLowerCase(), 'portal.isEnabled': true });
    if (!client) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, client.portal.passwordHash || '');
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const { JWT_SECRET } = getSecrets();
    const token = jwt.sign({ id: client._id, type: 'portal' }, JWT_SECRET, { expiresIn: '7d' });
    client.portal.lastLoginAt = new Date();
    await client.save();
    res.json({ success: true, data: { token, client: { id: client._id, name: client.clientName, email: client.portal.email } } });
  } catch (err) { next(err); }
};

export const enablePortalAccess = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { email, password } = req.body;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    const hash = await bcrypt.hash(password, 10);
    client.portal = { isEnabled: true, email: email.toLowerCase(), passwordHash: hash };
    await client.save();
    res.json({ success: true, message: 'Portal access enabled' });
  } catch (err) { next(err); }
};

export const disablePortalAccess = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    client.portal = { isEnabled: false };
    await client.save();
    res.json({ success: true, message: 'Portal access disabled' });
  } catch (err) { next(err); }
};
