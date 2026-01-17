import cron from 'node-cron';
import AMC from '../models/AMC.js';
import Invoice from '../models/Invoice.js';
import Task from '../models/Task.js';
import CallLog from '../models/CallLog.js';
import smartRules from '../utils/smartRules.js';

// AMC Renewal Reminders - Daily at 9 AM
export const amcRenewalReminders = cron.schedule('0 9 * * *', async () => {
  try {
    console.log('🔄 Running AMC renewal reminder job...');

    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() + 30); // 30 days before expiry

    const amcsForRenewal = await AMC.find({
      status: 'Active',
      endDate: { $lte: reminderDate, $gte: today },
      renewalNotificationSent: false
    }).populate('client assignedTo');

    console.log(`📧 Found ${amcsForRenewal.length} AMCs requiring renewal reminders`);

    for (const amc of amcsForRenewal) {
      // Here you would send email/notification
      console.log(`Reminder: AMC ${amc.amcNumber} for ${amc.client.clientName} expiring on ${amc.endDate}`);
      
      // Mark notification as sent
      amc.renewalNotificationSent = true;
      await amc.save();
    }

    console.log('✅ AMC renewal reminders completed');
  } catch (error) {
    console.error('❌ Error in AMC renewal reminder job:', error);
  }
});

// Payment Overdue Alerts - Daily at 10 AM
export const paymentOverdueAlerts = cron.schedule('0 10 * * *', async () => {
  try {
    console.log('🔄 Running payment overdue alert job...');

    const today = new Date();

    const overdueInvoices = await Invoice.find({
      dueDate: { $lt: today },
      paymentStatus: { $in: ['Unpaid', 'Partial'] },
      status: { $ne: 'Cancelled' }
    }).populate('client createdBy');

    console.log(`📧 Found ${overdueInvoices.length} overdue invoices`);

    for (const invoice of overdueInvoices) {
      // Update status to Overdue
      if (invoice.status !== 'Overdue') {
        invoice.status = 'Overdue';
        await invoice.save();
      }

      // Here you would send email/notification
      console.log(`Overdue: Invoice ${invoice.invoiceNumber} for ${invoice.client.clientName}`);
    }

    console.log('✅ Payment overdue alerts completed');
  } catch (error) {
    console.error('❌ Error in payment overdue alert job:', error);
  }
});

// Task Deadline Reminders - Daily at 8 AM
export const taskDeadlineReminders = cron.schedule('0 8 * * *', async () => {
  try {
    console.log('🔄 Running task deadline reminder job...');

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const upcomingTasks = await Task.find({
      dueDate: { $lte: tomorrow, $gte: today },
      status: { $in: ['To Do', 'In Progress'] }
    }).populate('assignedTo createdBy');

    console.log(`📧 Found ${upcomingTasks.length} tasks with upcoming deadlines`);

    for (const task of upcomingTasks) {
      // Here you would send email/notification
      console.log(`Reminder: Task ${task.taskNumber} "${task.title}" due on ${task.dueDate}`);
    }

    console.log('✅ Task deadline reminders completed');
  } catch (error) {
    console.error('❌ Error in task deadline reminder job:', error);
  }
});

// Follow-up Reminders - Every hour
export const followUpReminders = cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔄 Running follow-up reminder job...');

    const now = new Date();
    const nextHour = new Date();
    nextHour.setHours(now.getHours() + 1);

    const pendingFollowUps = await CallLog.find({
      followUpRequired: true,
      followUpCompleted: false,
      followUpDate: { $lte: nextHour, $gte: now }
    }).populate('assignedTo client lead');

    console.log(`📧 Found ${pendingFollowUps.length} pending follow-ups`);

    for (const followUp of pendingFollowUps) {
      // Here you would send email/notification
      console.log(`Follow-up required for call ${followUp.callNumber}`);
    }

    console.log('✅ Follow-up reminders completed');
  } catch (error) {
    console.error('❌ Error in follow-up reminder job:', error);
  }
});

// AMC Status Update - Daily at midnight
export const amcStatusUpdate = cron.schedule('0 0 * * *', async () => {
  try {
    console.log('🔄 Running AMC status update job...');

    const today = new Date();

    // Mark expired AMCs
    const expiredAMCs = await AMC.updateMany(
      {
        endDate: { $lt: today },
        status: 'Active'
      },
      {
        $set: { status: 'Expired' }
      }
    );

    console.log(`✅ Updated ${expiredAMCs.modifiedCount} AMCs to Expired status`);
  } catch (error) {
    console.error('❌ Error in AMC status update job:', error);
  }
});

// Smart Automation Rules - Daily at 7 AM
export const smartAutomationRules = cron.schedule('0 7 * * *', async () => {
  try {
    console.log('🤖 Running smart automation rules...');

    // Create auto follow-ups
    const autoFollowUps = await smartRules.createAutoFollowUps();
    console.log(`✅ Auto follow-ups: ${autoFollowUps.inactiveLeads} inactive leads, ${autoFollowUps.callBacks} call-backs`);

    // Lead inactivity triggers
    const inactiveCount = await smartRules.leadInactivityTriggers();
    console.log(`✅ Inactivity triggers applied: ${inactiveCount} leads`);

    // SLA-based escalation
    const escalatedCount = await smartRules.slaBasedEscalation();
    console.log(`✅ SLA escalations: ${escalatedCount} leads`);

    // Auto status updates
    const statusUpdates = await smartRules.autoStatusUpdates();
    console.log(`✅ Auto status updates: ${statusUpdates.qualified} qualified, ${statusUpdates.lost} lost`);

    // Smart payment reminders
    const paymentReminders = await smartRules.smartPaymentReminders();
    console.log(`✅ Payment reminders created: ${paymentReminders}`);

    // AMC renewal smart reminders
    const amcRenewals = await smartRules.amcRenewalSmartReminders();
    console.log(`✅ AMC renewal reminders: ${amcRenewals}`);

    // Check high-value stalled leads
    const stalledHighValue = await smartRules.checkHighValueStalledLeads();
    console.log(`✅ High-value stalled alerts: ${stalledHighValue}`);

    console.log('🤖 Smart automation rules completed successfully');
  } catch (error) {
    console.error('❌ Error in smart automation rules:', error);
  }
});

// Start all cron jobs
export const startCronJobs = () => {
  console.log('🚀 Starting cron jobs...');
  
  amcRenewalReminders.start();
  paymentOverdueAlerts.start();
  taskDeadlineReminders.start();
  followUpReminders.start();
  amcStatusUpdate.start();
  smartAutomationRules.start();
  
  console.log('✅ All cron jobs started successfully');
};

// Stop all cron jobs
export const stopCronJobs = () => {
  console.log('🛑 Stopping cron jobs...');
  
  amcRenewalReminders.stop();
  paymentOverdueAlerts.stop();
  taskDeadlineReminders.stop();
  followUpReminders.stop();
  amcStatusUpdate.stop();
  smartAutomationRules.stop();
  
  console.log('✅ All cron jobs stopped');
};
