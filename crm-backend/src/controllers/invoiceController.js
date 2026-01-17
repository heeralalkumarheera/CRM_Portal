import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Quotation from '../models/Quotation.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHelper.js';
import { getPagination, buildSearchQuery, buildSortQuery } from '../utils/queryHelper.js';

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res, next) => {
  try {
    const { page, limit, search, status, paymentStatus, client, sortBy, sortOrder } = req.query;
    const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);

    let query = {};
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(['invoiceNumber', 'client'], search)
      };
    }
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (client) query.client = client;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort(buildSortQuery(sortBy, sortOrder))
      .skip(skip)
      .limit(itemsPerPage)
      .populate('client', 'clientName companyName email')
      .populate('quotation', 'quotationNumber')
      .populate('payments')
      .populate('createdBy', 'firstName lastName');

    paginatedResponse(res, invoices, currentPage, itemsPerPage, total, 'Invoices retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'clientName companyName email phone addresses gst pan')
      .populate('quotation', 'quotationNumber quotationDate')
      .populate('payments')
      .populate('createdBy', 'firstName lastName email');

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    successResponse(res, invoice, 'Invoice retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Create invoice from quotation
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res, next) => {
  try {
    const { quotationId, client, items, dueDate, paymentTerms, notes, bankDetails } = req.body;

    if (!client || !items || items.length === 0) {
      return errorResponse(res, 'client and items are required', 400);
    }

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const processedItems = items.map(item => {
      const lineAmount = item.quantity * item.unitPrice;
      const discountAmount = item.discountType === 'Percentage' 
        ? (lineAmount * item.discount) / 100 
        : item.discount;
      const taxableAmount = lineAmount - discountAmount;
      const cgstAmount = (taxableAmount * (item.cgst || 9)) / 100;
      const sgstAmount = (taxableAmount * (item.sgst || 9)) / 100;
      const igstAmount = (taxableAmount * (item.igst || 0)) / 100;
      const taxAmount = cgstAmount + sgstAmount + igstAmount;
      const totalAmount = taxableAmount + taxAmount;

      subtotal += lineAmount;
      totalDiscount += discountAmount;
      totalTax += taxAmount;

      return {
        ...item,
        cgst: item.cgst || 9,
        sgst: item.sgst || 9,
        igst: item.igst || 0,
        taxAmount,
        totalAmount
      };
    });

    const grandTotal = subtotal - totalDiscount + totalTax;
    const invoiceNumber = `INV${Date.now()}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      client,
      quotation: quotationId || null,
      items: processedItems,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      balanceAmount: grandTotal,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentTerms: paymentTerms || 'Net 30',
      notes,
      bankDetails,
      status: 'Sent',
      createdBy: req.user._id
    });

    const populated = await invoice.populate('client', 'clientName companyName')
      .populate('createdBy', 'firstName lastName');

    successResponse(res, populated, 'Invoice created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    if (invoice.paymentStatus === 'Paid') {
      return errorResponse(res, 'Cannot update fully paid invoice', 400);
    }

    const { items, notes, dueDate, bankDetails } = req.body;

    if (items && items.length > 0) {
      let subtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      const processedItems = items.map(item => {
        const lineAmount = item.quantity * item.unitPrice;
        const discountAmount = item.discountType === 'Percentage' 
          ? (lineAmount * item.discount) / 100 
          : item.discount;
        const taxableAmount = lineAmount - discountAmount;
        const cgstAmount = (taxableAmount * (item.cgst || 9)) / 100;
        const sgstAmount = (taxableAmount * (item.sgst || 9)) / 100;
        const igstAmount = (taxableAmount * (item.igst || 0)) / 100;
        const taxAmount = cgstAmount + sgstAmount + igstAmount;
        const totalAmount = taxableAmount + taxAmount;

        subtotal += lineAmount;
        totalDiscount += discountAmount;
        totalTax += taxAmount;

        return {
          ...item,
          cgst: item.cgst || 9,
          sgst: item.sgst || 9,
          igst: item.igst || 0,
          taxAmount,
          totalAmount
        };
      });

      invoice.items = processedItems;
      invoice.subtotal = subtotal;
      invoice.totalDiscount = totalDiscount;
      invoice.totalTax = totalTax;
      const newGrandTotal = subtotal - totalDiscount + totalTax;
      invoice.balanceAmount = newGrandTotal - invoice.amountPaid;
      invoice.grandTotal = newGrandTotal;
    }

    if (notes !== undefined) invoice.notes = notes;
    if (dueDate) invoice.dueDate = dueDate;
    if (bankDetails) invoice.bankDetails = bankDetails;

    invoice.updatedBy = req.user._id;
    await invoice.save();

    const updated = await invoice.populate('client', 'clientName companyName')
      .populate('createdBy', 'firstName lastName');

    successResponse(res, updated, 'Invoice updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    successResponse(res, null, 'Invoice deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Send invoice to client
// @route   POST /api/invoices/:id/send
// @access  Private
export const sendInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    invoice.status = 'Sent';
    invoice.sentDate = new Date();
    await invoice.save();

    successResponse(res, invoice, 'Invoice sent successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Record payment for invoice
// @route   POST /api/invoices/:id/record-payment
// @access  Private
export const recordPayment = async (req, res, next) => {
  try {
    const { amount, paymentMode, transactionId, chequeNumber, chequeDate, bankName, notes } = req.body;

    if (!amount || amount <= 0) {
      return errorResponse(res, 'Valid amount is required', 400);
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    if (invoice.paymentStatus === 'Paid') {
      return errorResponse(res, 'Invoice already fully paid', 400);
    }

    if (amount > invoice.balanceAmount) {
      return errorResponse(res, `Amount cannot exceed balance (${invoice.balanceAmount})`, 400);
    }

    const paymentNumber = `PAY${Date.now()}`;

    const payment = await Payment.create({
      paymentNumber,
      invoice: invoice._id,
      client: invoice.client,
      amount,
      paymentMode,
      paymentDate: new Date(),
      transactionId,
      chequeNumber,
      chequeDate,
      bankName,
      notes,
      status: 'Completed',
      createdBy: req.user._id
    });

    // Update invoice
    invoice.amountPaid += amount;
    invoice.balanceAmount = invoice.grandTotal - invoice.amountPaid;
    invoice.payments.push(payment._id);

    if (invoice.balanceAmount === 0) {
      invoice.paymentStatus = 'Paid';
      invoice.status = 'Paid';
    } else if (invoice.amountPaid > 0) {
      invoice.paymentStatus = 'Partial';
      invoice.status = 'Partial';
    }

    await invoice.save();

    const updated = await payment.populate('invoice', 'invoiceNumber').populate('client', 'clientName');

    successResponse(res, updated, 'Payment recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue & outstanding invoices
// @route   GET /api/invoices/alerts/outstanding
// @access  Private
export const getOutstandingInvoices = async (req, res, next) => {
  try {
    const now = new Date();

    const outstanding = await Invoice.aggregate([
      {
        $match: {
          paymentStatus: { $in: ['Unpaid', 'Partial'] }
        }
      },
      {
        $addFields: {
          isOverdue: { $lt: ['$dueDate', now] },
          daysOverdue: {
            $cond: [
              { $lt: ['$dueDate', now] },
              { $divide: [{ $subtract: [now, '$dueDate'] }, 86400000] },
              0
            ]
          }
        }
      },
      {
        $sort: { dueDate: 1 }
      }
    ]);

    const overdue = outstanding.filter(inv => inv.isOverdue);
    const upcoming = outstanding.filter(inv => !inv.isOverdue);

    successResponse(res, { overdue, upcoming, totalOutstanding: outstanding.length }, 'Outstanding invoices retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history for invoice
// @route   GET /api/invoices/:id/payments
// @access  Private
export const getInvoicePayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ invoice: req.params.id })
      .populate('createdBy', 'firstName lastName')
      .sort('-createdAt');

    if (payments.length === 0) {
      return errorResponse(res, 'No payments found for this invoice', 404);
    }

    successResponse(res, payments, 'Invoice payment history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats/overview
// @access  Private
export const getInvoiceStats = async (req, res, next) => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          totalDue: { $sum: '$balanceAmount' }
        }
      }
    ]);

    const statusStats = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    successResponse(res, { paymentStats: stats, statusStats }, 'Invoice statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
