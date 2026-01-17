import express from 'express';
import { protect, checkPermission } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import Invoice from '../models/Invoice.js';

const router = express.Router();

router.use(protect);

// Send email via SMTP settings
router.post('/email/send', checkPermission('system:settings'), async (req, res, next) => {
  try {
    const { to, subject, html, text } = req.body;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@atpl-crm', to, subject, html, text });
    res.json({ success: true, data: { messageId: info.messageId } });
  } catch (err) { next(err); }
});

// Export invoices to CSV (Tally/Zoho-friendly)
router.get('/export/invoices.csv', checkPermission('report:financial'), async (req, res, next) => {
  try {
    const invoices = await Invoice.find().limit(5000);
    const header = ['InvoiceNumber,Client,Date,Subtotal,Tax,Total,Status'];
    const rows = invoices.map(i => [i.invoiceNumber, i.client, (i.issueDate||'').toISOString?.() || '', i.subtotal||0, i.tax||0, i.total||0, i.status||''].join(','));
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices_export.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

// Placeholder endpoints for WhatsApp and Payments
router.post('/whatsapp/send', checkPermission('system:settings'), async (req, res) => {
  res.json({ success: true, message: 'WhatsApp integration placeholder' });
});

router.post('/payments/create-link', checkPermission('payment:create'), async (req, res) => {
  res.json({ success: true, data: { url: 'https://payments.example.com/placeholder' } });
});

export default router;
