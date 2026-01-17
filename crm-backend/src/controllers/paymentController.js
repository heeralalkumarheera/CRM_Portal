import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHelper.js';
import { getPagination, buildSearchQuery, buildSortQuery } from '../utils/queryHelper.js';

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getPayments = async (req, res, next) => {
  try {
    const { page, limit, search, status, paymentMode, client, sortBy, sortOrder } = req.query;
    const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);

    let query = {};
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(['paymentNumber', 'transactionId'], search)
      };
    }
    if (status) query.status = status;
    if (paymentMode) query.paymentMode = paymentMode;
    if (client) query.client = client;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort(buildSortQuery(sortBy, sortOrder))
      .skip(skip)
      .limit(itemsPerPage)
      .populate('invoice', 'invoiceNumber grandTotal')
      .populate('client', 'clientName companyName')
      .populate('createdBy', 'firstName lastName');

    paginatedResponse(res, payments, currentPage, itemsPerPage, total, 'Payments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('invoice', 'invoiceNumber grandTotal amountPaid balanceAmount client')
      .populate('client', 'clientName companyName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }

    successResponse(res, payment, 'Payment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
export const createPayment = async (req, res, next) => {
  try {
    const { invoice, amount, paymentMode, transactionId, chequeNumber, chequeDate, bankName, notes, receiptNumber } = req.body;

    if (!invoice || !amount || !paymentMode) {
      return errorResponse(res, 'invoice, amount, and paymentMode are required', 400);
    }

    const invoiceDoc = await Invoice.findById(invoice);
    if (!invoiceDoc) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    if (amount > invoiceDoc.balanceAmount) {
      return errorResponse(res, `Amount cannot exceed balance (${invoiceDoc.balanceAmount})`, 400);
    }

    const paymentNumber = `PAY${Date.now()}`;

    const payment = await Payment.create({
      paymentNumber,
      invoice,
      client: invoiceDoc.client,
      amount,
      paymentMode,
      transactionId,
      chequeNumber,
      chequeDate,
      bankName,
      notes,
      receiptNumber,
      status: 'Completed',
      createdBy: req.user._id
    });

    // Update invoice
    invoiceDoc.amountPaid += amount;
    invoiceDoc.balanceAmount = invoiceDoc.grandTotal - invoiceDoc.amountPaid;
    invoiceDoc.payments.push(payment._id);

    if (invoiceDoc.balanceAmount === 0) {
      invoiceDoc.paymentStatus = 'Paid';
      invoiceDoc.status = 'Paid';
    } else if (invoiceDoc.amountPaid > 0) {
      invoiceDoc.paymentStatus = 'Partial';
      invoiceDoc.status = 'Partial';
    }

    await invoiceDoc.save();

    const populated = await payment.populate('invoice', 'invoiceNumber')
      .populate('client', 'clientName companyName')
      .populate('createdBy', 'firstName lastName');

    successResponse(res, populated, 'Payment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }

    if (payment.status === 'Completed') {
      return errorResponse(res, 'Cannot update completed payment', 400);
    }

    const { notes, transactionId, chequeNumber, bankName } = req.body;

    if (notes !== undefined) payment.notes = notes;
    if (transactionId !== undefined) payment.transactionId = transactionId;
    if (chequeNumber !== undefined) payment.chequeNumber = chequeNumber;
    if (bankName !== undefined) payment.bankName = bankName;

    payment.updatedBy = req.user._id;
    await payment.save();

    const updated = await payment.populate('invoice', 'invoiceNumber')
      .populate('client', 'clientName')
      .populate('createdBy', 'firstName lastName');

    successResponse(res, updated, 'Payment updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
export const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return errorResponse(res, 'Payment not found', 404);
    }

    // Revert invoice payment amount
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      invoice.amountPaid -= payment.amount;
      invoice.balanceAmount = invoice.grandTotal - invoice.amountPaid;
      invoice.payments = invoice.payments.filter(p => p.toString() !== payment._id.toString());
      
      if (invoice.balanceAmount === invoice.grandTotal) {
        invoice.paymentStatus = 'Unpaid';
        invoice.status = 'Sent';
      } else if (invoice.amountPaid > 0) {
        invoice.paymentStatus = 'Partial';
        invoice.status = 'Partial';
      }
      
      await invoice.save();
    }

    successResponse(res, null, 'Payment deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment reconciliation report
// @route   GET /api/payments/reports/reconciliation
// @access  Private
export const getPaymentReconciliation = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMode',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const summary = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgPayment: { $avg: '$amount' }
        }
      }
    ]);

    successResponse(res, { byMode: payments, summary: summary[0] || {} }, 'Payment reconciliation retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats/overview
// @access  Private
export const getPaymentStats = async (req, res, next) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$paymentMode',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const statusStats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats = await Payment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    successResponse(res, { byMode: stats, byStatus: statusStats, byMonth: monthlyStats }, 'Payment statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
