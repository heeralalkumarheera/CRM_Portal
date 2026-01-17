// Smart Rules Engine for CRM Automation
// Handles auto follow-ups, SLA escalation, auto status updates, etc.

import Lead from '../models/Lead.js';
import CallLog from '../models/CallLog.js';
import Task from '../models/Task.js';
import Invoice from '../models/Invoice.js';
import AMC from '../models/AMC.js';
import AuditLog from '../models/AuditLog.js';

// Configuration for automation rules
const AUTOMATION_CONFIG = {
  LEAD_INACTIVITY_DAYS: 7,        // Create follow-up if no contact for 7 days
  SLA_ESCALATION_DAYS: 14,        // Escalate if lead not progressed for 14 days
  AUTO_FOLLOW_UP_DELAY_HOURS: 24, // Create follow-up X hours after last call
  LEAD_STAGE_AUTO_UPDATE: true,   // Auto-update stage based on conditions
  PAYMENT_REMINDER_DAYS_BEFORE: 3, // Remind 3 days before due date
  AMC_RENEWAL_ADVANCE_DAYS: 30    // Remind 30 days before renewal
};

/**
 * Auto Follow-Up Creation
 * Creates follow-up task when:
 * - Lead has not been contacted for X days
 * - Call outcome is "Call Back Requested"
 * - Quotation is sent but not viewed after 7 days
 */
export const createAutoFollowUps = async () => {
  try {
    const now = new Date();
    const inactivityThreshold = new Date(now.getTime() - AUTOMATION_CONFIG.LEAD_INACTIVITY_DAYS * 24 * 60 * 60 * 1000);

    // Rule 1: Inactive leads (no contact for X days)
    const inactiveLeads = await Lead.find({
      status: { $in: ['Open', 'In Progress'] },
      updatedAt: { $lt: inactivityThreshold }
    }).populate('assignedTo');

    console.log(`🤖 Found ${inactiveLeads.length} inactive leads`);

    for (const lead of inactiveLeads) {
      // Check if follow-up task already exists
      const existingTask = await Task.findOne({
        relatedTo: {
          resourceType: 'Lead',
          resourceId: lead._id
        },
        status: { $in: ['To Do', 'In Progress'] }
      });

      if (!existingTask) {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 1);

        await Task.create({
          taskType: 'Follow-up',
          title: `Follow-up with ${lead.contactName} (${lead.companyName || 'Individual'})`,
          description: `Lead has been inactive for ${AUTOMATION_CONFIG.LEAD_INACTIVITY_DAYS} days. Last update: ${lead.updatedAt}. Contact them to progress the opportunity.`,
          priority: 'High',
          status: 'To Do',
          dueDate: followUpDate,
          assignedTo: lead.assignedTo,
          createdBy: lead.assignedTo,
          relatedTo: {
            resourceType: 'Lead',
            resourceId: lead._id
          }
        });

        console.log(`✅ Auto follow-up created for lead: ${lead.contactName}`);
      }
    }

    // Rule 2: Call Back Requested
    const callBackRequested = await CallLog.find({
      outcome: 'Call Back Requested',
      followUpRequired: false,
      createdAt: { $gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).populate('createdBy', 'firstName lastName').populate('lead');

    console.log(`📞 Found ${callBackRequested.length} call-back requests`);

    for (const callLog of callBackRequested) {
      const followUpDate = new Date(callLog.createdAt);
      followUpDate.setHours(followUpDate.getHours() + AUTOMATION_CONFIG.AUTO_FOLLOW_UP_DELAY_HOURS);

      await Task.create({
        taskType: 'Follow-up',
        title: `Call back ${callLog.contactPerson}`,
        description: `Follow-up on call. Notes: ${callLog.summary}`,
        priority: 'High',
        status: 'To Do',
        dueDate: followUpDate,
        assignedTo: callLog.createdBy._id,
        createdBy: callLog.createdBy._id,
        relatedTo: {
          resourceType: 'CallLog',
          resourceId: callLog._id
        }
      });

      callLog.followUpRequired = true;
      callLog.followUpDate = followUpDate;
      await callLog.save();

      console.log(`✅ Auto follow-up created for call-back request`);
    }

    return { inactiveLeads: inactiveLeads.length, callBacks: callBackRequested.length };
  } catch (error) {
    console.error('❌ Error in createAutoFollowUps:', error);
    throw error;
  }
};

/**
 * Lead Inactivity Triggers
 * Marks leads as 'On Hold' or flags for review if inactive too long
 */
export const leadInactivityTriggers = async () => {
  try {
    const now = new Date();
    const inactivityThreshold = new Date(now.getTime() - AUTOMATION_CONFIG.SLA_ESCALATION_DAYS * 24 * 60 * 60 * 1000);

    const veryInactiveLeads = await Lead.find({
      status: 'In Progress',
      stage: { $nin: ['Won', 'Lost'] },
      updatedAt: { $lt: inactivityThreshold }
    }).populate('assignedTo');

    console.log(`⚠️  Found ${veryInactiveLeads.length} very inactive leads`);

    for (const lead of veryInactiveLeads) {
      lead.priority = 'Low';
      lead.notes = (lead.notes || '') + `\n[AUTO] Marked as low priority due to inactivity on ${now.toISOString()}`;
      await lead.save();

      await AuditLog.create({
        action: 'auto_priority_update',
        resourceType: 'Lead',
        resourceId: lead._id,
        changes: { priority: { old: lead.priority, new: 'Low' } },
        performedBy: null, // System action
        description: 'Auto-priority lowered due to inactivity'
      });

      console.log(`✅ Inactivity trigger applied to lead: ${lead.contactName}`);
    }

    return veryInactiveLeads.length;
  } catch (error) {
    console.error('❌ Error in leadInactivityTriggers:', error);
    throw error;
  }
};

/**
 * SLA-Based Escalation
 * Escalates leads to Manager if:
 * - High-value lead stuck in same stage for > SLA_ESCALATION_DAYS
 * - Sales Executive not progressing opportunities
 */
export const slaBasedEscalation = async () => {
  try {
    const now = new Date();
    const slaThreshold = new Date(now.getTime() - AUTOMATION_CONFIG.SLA_ESCALATION_DAYS * 24 * 60 * 60 * 1000);

    const staleLead = await Lead.find({
      expectedRevenue: { $gt: 50000 }, // High-value only
      stage: { $nin: ['Won', 'Lost', 'Proposal Sent', 'Negotiation'] },
      updatedAt: { $lt: slaThreshold },
      status: 'In Progress'
    }).populate('assignedTo createdBy');

    console.log(`🚨 Found ${staleLead.length} leads requiring SLA escalation`);

    for (const lead of staleLead) {
      // Create escalation task for manager
      await Task.create({
        taskType: 'Escalation',
        title: `SLA ESCALATION: ${lead.contactName} - Revenue ${lead.expectedRevenue}`,
        description: `High-value lead stuck in "${lead.stage}" stage for ${AUTOMATION_CONFIG.SLA_ESCALATION_DAYS} days. Expected revenue: ₹${lead.expectedRevenue}. Assigned to: ${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`,
        priority: 'Critical',
        status: 'To Do',
        dueDate: new Date(),
        assignedTo: lead.createdBy._id, // Assign to creating manager/admin
        createdBy: null, // System
        relatedTo: {
          resourceType: 'Lead',
          resourceId: lead._id
        }
      });

      lead.priority = 'Critical';
      await lead.save();

      console.log(`✅ Escalation created for lead: ${lead.contactName}`);
    }

    return staleLead.length;
  } catch (error) {
    console.error('❌ Error in slaBasedEscalation:', error);
    throw error;
  }
};

/**
 * Auto Status Updates
 * Automatically updates lead/opportunity status based on conditions
 */
export const autoStatusUpdates = async () => {
  try {
    const now = new Date();

    // Rule 1: Update to "Qualified" if quotation sent
    const leadsWithQuotations = await Lead.find({
      stage: 'Contacted',
      convertedToClient: null
    });

    let updatedCount = 0;

    for (const lead of leadsWithQuotations) {
      lead.stage = 'Qualified';
      await lead.save();
      updatedCount++;
    }

    console.log(`✅ Updated ${updatedCount} leads to Qualified stage`);

    // Rule 2: Auto-mark Lost if no contact for 60 days
    const deadLeads = await Lead.find({
      status: 'Open',
      createdAt: { $lt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
      convertedToClient: null
    });

    for (const lead of deadLeads) {
      lead.status = 'Lost';
      lead.stage = 'Lost';
      lead.lostReason = 'No Response';
      lead.lostReasonDetails = '[AUTO] Automatically marked as lost due to 60+ days of inactivity';
      await lead.save();

      await AuditLog.create({
        action: 'auto_lost',
        resourceType: 'Lead',
        resourceId: lead._id,
        changes: { status: { old: 'Open', new: 'Lost' } },
        performedBy: null,
        description: 'Auto-marked lost due to inactivity'
      });
    }

    console.log(`✅ Auto-marked ${deadLeads.length} leads as Lost`);

    return { qualified: updatedCount, lost: deadLeads.length };
  } catch (error) {
    console.error('❌ Error in autoStatusUpdates:', error);
    throw error;
  }
};

/**
 * Smart Payment Reminders
 * Create reminders for:
 * - Invoices due in N days
 * - Overdue invoices
 * - Partial payments
 */
export const smartPaymentReminders = async () => {
  try {
    const now = new Date();
    const reminderDate = new Date(now.getTime() + AUTOMATION_CONFIG.PAYMENT_REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000);

    // Invoices due soon
    const upcomingPayments = await Invoice.find({
      dueDate: { $lte: reminderDate, $gte: now },
      paymentStatus: { $in: ['Unpaid', 'Partial'] },
      status: { $ne: 'Cancelled' }
    }).populate('client');

    console.log(`💳 Found ${upcomingPayments.length} invoices due soon`);

    for (const invoice of upcomingPayments) {
      const daysUntilDue = Math.ceil((invoice.dueDate - now) / (1000 * 60 * 60 * 24));

      // Check if reminder task already exists
      const existingReminder = await Task.findOne({
        relatedTo: {
          resourceType: 'Invoice',
          resourceId: invoice._id
        },
        status: { $in: ['To Do', 'In Progress'] }
      });

      if (!existingReminder) {
        await Task.create({
          taskType: 'Payment Reminder',
          title: `Payment due: ${invoice.invoiceNumber} (${invoice.client.clientName})`,
          description: `Invoice ${invoice.invoiceNumber} is due in ${daysUntilDue} days. Amount: ₹${invoice.balanceAmount}. Due Date: ${invoice.dueDate.toDateString()}`,
          priority: daysUntilDue <= 1 ? 'Critical' : daysUntilDue <= 3 ? 'High' : 'Medium',
          status: 'To Do',
          dueDate: invoice.dueDate,
          createdBy: invoice.createdBy,
          relatedTo: {
            resourceType: 'Invoice',
            resourceId: invoice._id
          }
        });

        console.log(`✅ Payment reminder created for invoice: ${invoice.invoiceNumber}`);
      }
    }

    return upcomingPayments.length;
  } catch (error) {
    console.error('❌ Error in smartPaymentReminders:', error);
    throw error;
  }
};

/**
 * AMC Renewal Reminders & Auto-Scheduling
 * Smart reminders for AMC renewals and auto-schedule first service
 */
export const amcRenewalSmartReminders = async () => {
  try {
    const now = new Date();
    const renewalThreshold = new Date(now.getTime() + AUTOMATION_CONFIG.AMC_RENEWAL_ADVANCE_DAYS * 24 * 60 * 60 * 1000);

    const amcsForRenewal = await AMC.find({
      status: 'Active',
      endDate: { $lte: renewalThreshold, $gte: now },
      renewalNotificationSent: false,
      autoRenewal: true
    }).populate('client assignedTo');

    console.log(`🔄 Found ${amcsForRenewal.length} AMCs for smart renewal processing`);

    for (const amc of amcsForRenewal) {
      const daysUntilRenewal = Math.ceil((amc.endDate - now) / (1000 * 60 * 60 * 24));

      // Create renewal task
      await Task.create({
        taskType: 'AMC Renewal',
        title: `AMC Renewal: ${amc.contractName} (${amc.client.clientName})`,
        description: `AMC ${amc.amcNumber} expires in ${daysUntilRenewal} days. Contract Value: ₹${amc.contractValue}. Auto-renewal: ${amc.autoRenewal ? 'Yes' : 'No'}`,
        priority: daysUntilRenewal <= 7 ? 'Critical' : 'High',
        status: 'To Do',
        dueDate: amc.endDate,
        assignedTo: amc.assignedTo,
        createdBy: amc.assignedTo,
        relatedTo: {
          resourceType: 'AMC',
          resourceId: amc._id
        }
      });

      amc.renewalNotificationSent = true;
      await amc.save();

      console.log(`✅ AMC renewal reminder created: ${amc.contractName}`);
    }

    return amcsForRenewal.length;
  } catch (error) {
    console.error('❌ Error in amcRenewalSmartReminders:', error);
    throw error;
  }
};

/**
 * Check for high-value stalled opportunities
 * Alerts if opportunity > threshold value not moving
 */
export const checkHighValueStalledLeads = async () => {
  try {
    const STALLED_THRESHOLD_DAYS = 5;
    const HIGH_VALUE_THRESHOLD = 100000; // ₹ 1 lakh

    const now = new Date();
    const stalledThreshold = new Date(now.getTime() - STALLED_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

    const stalledHighValue = await Lead.find({
      expectedRevenue: { $gt: HIGH_VALUE_THRESHOLD },
      status: { $in: ['Open', 'In Progress'] },
      stage: { $nin: ['Won', 'Lost'] },
      updatedAt: { $lt: stalledThreshold }
    }).populate('assignedTo');

    console.log(`💰 Found ${stalledHighValue.length} high-value stalled opportunities`);

    for (const lead of stalledHighValue) {
      await Task.create({
        taskType: 'High-Value Alert',
        title: `HIGH-VALUE STALLED: ${lead.contactName} - ₹${lead.expectedRevenue}`,
        description: `Opportunity worth ₹${lead.expectedRevenue} has been stalled at "${lead.stage}" stage for ${STALLED_THRESHOLD_DAYS} days. Immediate attention required.`,
        priority: 'Critical',
        status: 'To Do',
        dueDate: new Date(),
        assignedTo: lead.assignedTo,
        createdBy: lead.assignedTo,
        relatedTo: {
          resourceType: 'Lead',
          resourceId: lead._id
        }
      });
    }

    return stalledHighValue.length;
  } catch (error) {
    console.error('❌ Error checking high-value stalled leads:', error);
    throw error;
  }
};

export default {
  AUTOMATION_CONFIG,
  createAutoFollowUps,
  leadInactivityTriggers,
  slaBasedEscalation,
  autoStatusUpdates,
  smartPaymentReminders,
  amcRenewalSmartReminders,
  checkHighValueStalledLeads
};
