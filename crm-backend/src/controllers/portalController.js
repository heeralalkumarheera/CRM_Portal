import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import AMC from '../models/AMC.js';
import Payment from '../models/Payment.js';
import ServiceRequest from '../models/ServiceRequest.js';

export const me = async (req, res) => {
  const { client } = req.portal;
  res.json({ success: true, data: { id: client._id, name: client.clientName, email: client.portal?.email } });
};

export const myQuotations = async (req, res, next) => {
  try {
    const { client } = req.portal;
    const data = await Quotation.find({ client: client._id }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const myInvoices = async (req, res, next) => {
  try {
    const { client } = req.portal;
    const data = await Invoice.find({ client: client._id }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const myAMCs = async (req, res, next) => {
  try {
    const { client } = req.portal;
    const data = await AMC.find({ client: client._id }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const myPayments = async (req, res, next) => {
  try {
    const { client } = req.portal;
    const data = await Payment.find({ client: client._id }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createServiceRequest = async (req, res, next) => {
  try {
    const { client } = req.portal;
    const payload = { ...req.body, client: client._id, createdByPortal: true };
    const sr = await ServiceRequest.create(payload);
    res.status(201).json({ success: true, data: sr });
  } catch (err) { next(err); }
};

export const myServiceRequests = async (req, res, next) => {
  try {
    const { client } = req.portal;
    const data = await ServiceRequest.find({ client: client._id }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
