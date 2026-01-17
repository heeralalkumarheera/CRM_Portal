import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHelper.js';
import { getPagination, buildSearchQuery, buildSortQuery } from '../utils/queryHelper.js';

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
export const getQuotations = async (req, res, next) => {
  try {
    const { page, limit, search, status, approvalStatus, client, sortBy, sortOrder } = req.query;
    const { page: currentPage, limit: itemsPerPage, skip } = getPagination(page, limit);

    let query = {};
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(['quotationNumber', 'subject'], search)
      };
    }
    if (status) query.status = status;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (client) query.client = client;

    const total = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query)
      .sort(buildSortQuery(sortBy, sortOrder))
      .skip(skip)
      .limit(itemsPerPage)
      .populate('client', 'clientName companyName')
      .populate('lead', 'contactName companyName')
      .populate('createdBy', 'firstName lastName');

    paginatedResponse(res, quotations, currentPage, itemsPerPage, total, 'Quotations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
export const getQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('client', 'clientName companyName email phone addresses')
      .populate('lead', 'contactName companyName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', 404);
    }

    successResponse(res, quotation, 'Quotation retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private
export const createQuotation = async (req, res, next) => {
  try {
    const { client, lead, subject, items, termsAndConditions, notes } = req.body;

    if (!client || !subject || !items || items.length === 0) {
      return errorResponse(res, 'client, subject, and items are required', 400);
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
      const taxAmount = (taxableAmount * item.taxRate) / 100;
      const totalAmount = taxableAmount + taxAmount;

      subtotal += lineAmount;
      totalDiscount += discountAmount;
      totalTax += taxAmount;

      return {
        ...item,
        taxAmount,
        totalAmount
      };
    });

    const grandTotal = subtotal - totalDiscount + totalTax;
    const quotationNumber = `QT${Date.now()}`;

    const quotation = await Quotation.create({
      quotationNumber,
      client,
      lead,
      subject,
      items: processedItems,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      termsAndConditions,
      notes,
      status: 'Draft',
      approvalStatus: 'Pending',
      createdBy: req.user._id,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    const populated = await quotation.populate('client', 'clientName companyName')
      .populate('createdBy', 'firstName lastName');

    successResponse(res, populated, 'Quotation created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
export const updateQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', 404);
    }

    if (quotation.status !== 'Draft') {
      return errorResponse(res, 'Can only update draft quotations', 400);
    }

    const { items, subject, termsAndConditions, notes } = req.body;

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
        const taxAmount = (taxableAmount * item.taxRate) / 100;
        const totalAmount = taxableAmount + taxAmount;

        subtotal += lineAmount;
        totalDiscount += discountAmount;
        totalTax += taxAmount;

        return {
          ...item,
          taxAmount,
          totalAmount
        };
      });

      quotation.items = processedItems;
      quotation.subtotal = subtotal;
      quotation.totalDiscount = totalDiscount;
      quotation.totalTax = totalTax;
      quotation.grandTotal = subtotal - totalDiscount + totalTax;
    }

    if (subject) quotation.subject = subject;
    if (termsAndConditions !== undefined) quotation.termsAndConditions = termsAndConditions;
    if (notes !== undefined) quotation.notes = notes;

    quotation.updatedBy = req.user._id;
    await quotation.save();

    const updated = await quotation.populate('client', 'clientName companyName')
      .populate('createdBy', 'firstName lastName');

    successResponse(res, updated, 'Quotation updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private
export const deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', 404);
    }

    successResponse(res, null, 'Quotation deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Send quotation to client
// @route   POST /api/quotations/:id/send
// @access  Private
export const sendQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', 404);
    }

    if (quotation.status === 'Converted') {
      return errorResponse(res, 'Converted quotation cannot be resent', 400);
    }

    quotation.status = 'Sent';
    quotation.sentDate = new Date();
    await quotation.save();

    successResponse(res, quotation, 'Quotation sent successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark quotation as viewed
// @route   POST /api/quotations/:id/view
// @access  Private
export const markQuotationViewed = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', 404);
    }

    quotation.status = 'Viewed';
    quotation.viewedDate = new Date();
    await quotation.save();

    successResponse(res, quotation, 'Quotation marked as viewed');
  } catch (error) {
    next(error);
  }
};

// @desc    Approve quotation (Admin/Manager)
// @route   POST /api/quotations/:id/approve
// @access  Private (Admin/Manager only)
export const approveQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', 404);
    }

    if (quotation.approvalStatus === 'Approved') {
      return errorResponse(res, 'Quotation already approved', 400);
    }

    quotation.approvalStatus = 'Approved';
    quotation.approvedBy = req.user._id;
    quotation.approvedDate = new Date();
    await quotation.save();

    successResponse(res, quotation, 'Quotation approved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Reject quotation
// @route   POST /api/quotations/:id/reject
// @access  Private (Admin/Manager only)
export const rejectQuotation = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return errorResponse(res, 'Rejection reason is required', 400);
    }

    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', 404);
    }

    quotation.approvalStatus = 'Rejected';
    quotation.rejectionReason = rejectionReason;
    quotation.approvedBy = req.user._id;
    quotation.approvedDate = new Date();
    await quotation.save();

    successResponse(res, quotation, 'Quotation rejected successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Convert quotation to invoice
// @route   POST /api/quotations/:id/convert
// @access  Private
export const convertQuotationToInvoice = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', 404);
    }

    if (quotation.status === 'Converted') {
      return errorResponse(res, 'Quotation already converted', 400);
    }

    if (quotation.approvalStatus !== 'Approved') {
      return errorResponse(res, 'Only approved quotations can be converted', 400);
    }

    const invoiceNumber = `INV${Date.now()}`;
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      invoiceNumber,
      client: quotation.client,
      quotation: quotation._id,
      items: quotation.items,
      subtotal: quotation.subtotal,
      totalDiscount: quotation.totalDiscount,
      totalTax: quotation.totalTax,
      grandTotal: quotation.grandTotal,
      dueDate,
      status: 'Sent',
      createdBy: req.user._id
    });

    quotation.status = 'Converted';
    quotation.convertedToInvoice = invoice._id;
    await quotation.save();

    const populated = await invoice.populate('client', 'clientName companyName')
      .populate('quotation', 'quotationNumber');

    successResponse(res, { quotation, invoice: populated }, 'Quotation converted to invoice successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get quotation version history
// @route   GET /api/quotations/:id/history
// @access  Private
export const getQuotationHistory = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('versionHistory.modifiedBy', 'firstName lastName email');

    if (!quotation) {
      return errorResponse(res, 'Quotation not found', 404);
    }

    successResponse(res, quotation.versionHistory || [], 'Version history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get quotation statistics
// @route   GET /api/quotations/stats/overview
// @access  Private
export const getQuotationStats = async (req, res, next) => {
  try {
    const stats = await Quotation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$grandTotal' }
        }
      }
    ]);

    const approvalStats = await Quotation.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    successResponse(res, { statusStats: stats, approvalStats }, 'Quotation statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
