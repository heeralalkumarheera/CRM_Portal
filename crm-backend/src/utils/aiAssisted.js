// AI-Assisted Features Utility
// Provides AI/template-based suggestions for CRM workflows

/**
 * Follow-up Message Draft Generator
 * Generates suggested follow-up messages based on lead/call context
 */
export const generateFollowUpDraft = (lead, lastCallLog, callOutcome) => {
  const templates = {
    'Connected': `Hi ${lead.contactName},

Thank you for taking the time to speak with us today. We appreciated discussing your requirements for ${lead.companyName || 'your organization'}.

As discussed, we believe our ${lead.serviceInterested?.[0] || 'solutions'} can help you achieve your goals efficiently.

I'll be reaching out next week with a detailed proposal tailored to your needs. In the meantime, if you have any questions, please don't hesitate to contact me.

Best regards`,

    'Not Connected': `Hi ${lead.contactName},

I attempted to reach you earlier but couldn't connect. I wanted to follow up regarding ${lead.companyName || 'your business'} and how our services might benefit you.

Would you prefer if I reached out at a different time? I'm happy to adjust to your schedule.

Looking forward to connecting with you soon.

Best regards`,

    'Call Back Requested': `Hi ${lead.contactName},

Thank you for requesting a callback. I'm following up as promised.

I'd like to discuss how we can help ${lead.companyName || 'your organization'} with ${lead.serviceInterested?.[0] || 'our solutions'}. 

Can we schedule a brief call this week? I'm available at your convenience.

Best regards`,

    'Voicemail': `Hi ${lead.contactName},

I left you a voicemail earlier regarding an opportunity we identified for ${lead.companyName || 'your business'}.

I'll try reaching you again tomorrow. If you'd like to schedule a time to talk, here's my calendar link: [Calendar Link]

Thanks!

Best regards`,

    'No Answer': `Hi ${lead.contactName},

I've tried reaching you multiple times but haven't been able to connect. This is important for ${lead.companyName || 'your organization'}.

Could you please confirm the best time and number to reach you? Or feel free to call me back at your earliest convenience.

Looking forward to connecting with you.

Best regards`
  };

  return templates[callOutcome] || templates['Connected'];
};

/**
 * Sales Pitch Suggestion Generator
 * Provides personalized pitch suggestions based on lead profile
 */
export const generateSalesPitchSuggestion = (lead, client) => {
  const pitchTemplates = {
    highValue: {
      prospect: `Dear ${lead.contactName},

We help enterprise clients like ${lead.companyName} reduce operational costs by 30-40% through ${lead.serviceInterested?.[0] || 'our specialized services'}.

Our clients have reported:
• 40% cost reduction
• 95% uptime guarantee
• Average ROI of 180% in first year

I'd like to show you how we've done this for similar companies. Can we schedule 15 minutes this week?

Best regards`,
      
      existing: `Hi ${client?.clientName},

Following our successful engagement, I wanted to introduce our new ${lead.serviceInterested?.[0] || 'service offering'} that complements your current setup.

Based on your usage patterns, we estimate this could save you ₹${Math.round(client?.estimatedMonthlySpend * 0.2 || 50000)} monthly.

Shall we explore this together?

Best regards`
    },
    
    midMarket: {
      prospect: `Hello ${lead.contactName},

I'm reaching out to ${lead.companyName} because we specialize in helping mid-size businesses like yours streamline ${lead.serviceInterested?.[0] || 'operations'}.

Three quick wins we typically deliver:
1. Time savings: 20+ hours/week
2. Cost optimization: 25%+
3. Process automation: 60%+

Would you be open to a 20-minute call to explore?

Best regards`,

      existing: `Hi ${client?.clientName},

We've got an exciting update on ${lead.serviceInterested?.[0] || 'your current service'} that we think you'll love. Recent upgrades include [Feature 1], [Feature 2], and [Feature 3].

Happy to walk you through it. When works for you?

Best regards`
    },

    startup: {
      prospect: `Hey ${lead.contactName}!

We work with awesome startups like ${lead.companyName} to help them scale without breaking the bank.

Here's what we've done for similar founders:
• Reduced tech debt by 50%
• Improved team productivity by 35%
• Cut infrastructure costs by 45%

Interested in a chat? Let's grab coffee (or Zoom!) ☕

Best regards`,

      existing: `Hi ${client?.clientName},

We'd love to help ${lead.companyName} scale even faster! We've got some new capabilities that align perfectly with your roadmap.

Free strategy session? Let me know!

Best regards`
    }
  };

  // Determine company size based on expected revenue
  let segment = 'midMarket';
  if (lead.expectedRevenue > 500000) segment = 'highValue';
  if (lead.expectedRevenue < 100000) segment = 'startup';

  const prospectType = client ? 'existing' : 'prospect';
  return pitchTemplates[segment][prospectType] || pitchTemplates.midMarket.prospect;
};

/**
 * Invoice Description Generator
 * Generates professional invoice descriptions from item data
 */
export const generateInvoiceDescription = (invoiceItems) => {
  if (!invoiceItems || invoiceItems.length === 0) {
    return 'Professional Services';
  }

  const itemList = invoiceItems
    .map((item, idx) => `${idx + 1}. ${item.itemName} (${item.quantity} × ${item.unit})`)
    .join('\n');

  const services = invoiceItems.filter(i => i.itemType === 'Service').length;
  const products = invoiceItems.filter(i => i.itemType === 'Product').length;

  let description = '';
  if (services > 0 && products === 0) {
    description = `Delivery of professional services as per agreement:\n${itemList}`;
  } else if (products > 0 && services === 0) {
    description = `Supply of goods and materials:\n${itemList}`;
  } else {
    description = `Supply of goods and professional services:\n${itemList}`;
  }

  return description;
};

/**
 * Client Churn Risk Alert Generator
 * Analyzes client engagement and predicts churn risk
 */
export const assessClientChurnRisk = (client, interactions, payments, amc) => {
  let riskScore = 0;
  const riskFactors = [];

  // Factor 1: Payment timeliness (40%)
  if (payments && payments.length > 0) {
    const overduePayments = payments.filter(p => {
      const invoice = p.invoice;
      return new Date(invoice.dueDate) < new Date() && p.status !== 'Completed';
    }).length;

    const overdueRatio = overduePayments / payments.length;
    if (overdueRatio > 0.3) {
      riskScore += 25;
      riskFactors.push('Multiple overdue payments');
    } else if (overdueRatio > 0.1) {
      riskScore += 10;
      riskFactors.push('Some overdue payments');
    }
  }

  // Factor 2: Interaction frequency (30%)
  if (interactions && interactions.length > 0) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInteractions = interactions.filter(i => new Date(i.date) > thirtyDaysAgo).length;

    if (recentInteractions === 0) {
      riskScore += 20;
      riskFactors.push('No recent interactions (30+ days)');
    } else if (recentInteractions < 2) {
      riskScore += 10;
      riskFactors.push('Low interaction frequency');
    }
  }

  // Factor 3: AMC status (20%)
  if (amc) {
    if (amc.status === 'Cancelled') {
      riskScore += 15;
      riskFactors.push('AMC cancelled');
    } else if (amc.status === 'On Hold') {
      riskScore += 10;
      riskFactors.push('AMC on hold');
    }
  }

  // Factor 4: Contract value trend (10%)
  if (client.estimatedAnnualValue && client.previousAnnualValue) {
    const valueTrend = (client.estimatedAnnualValue - client.previousAnnualValue) / client.previousAnnualValue;
    if (valueTrend < -0.2) {
      riskScore += 8;
      riskFactors.push('Contract value declining (>20%)');
    }
  }

  let riskLevel = 'Low';
  if (riskScore >= 60) riskLevel = 'Critical';
  else if (riskScore >= 40) riskLevel = 'High';
  else if (riskScore >= 20) riskLevel = 'Medium';

  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    riskFactors,
    recommendations: generateChurnRecoveryRecommendations(riskLevel, riskFactors)
  };
};

/**
 * Generate churn recovery recommendations
 */
export const generateChurnRecoveryRecommendations = (riskLevel, riskFactors) => {
  const recommendations = [];

  if (riskFactors.includes('Multiple overdue payments')) {
    recommendations.push({
      action: 'Immediate payment follow-up',
      description: 'Contact client regarding outstanding invoices. Offer payment plan if needed.',
      priority: 'Critical'
    });
  }

  if (riskFactors.includes('No recent interactions (30+ days)')) {
    recommendations.push({
      action: 'Schedule executive review call',
      description: 'High-touch engagement call with decision-maker to understand satisfaction and concerns.',
      priority: 'High'
    });
  }

  if (riskFactors.includes('AMC cancelled')) {
    recommendations.push({
      action: 'Renewal conversation',
      description: 'Understand reasons for cancellation. Propose revised terms or alternative offerings.',
      priority: 'High'
    });
  }

  if (riskFactors.includes('Low interaction frequency')) {
    recommendations.push({
      action: 'Increase engagement touchpoints',
      description: 'Schedule monthly check-ins, provide updates on new features, invite to webinars.',
      priority: 'Medium'
    });
  }

  if (riskFactors.includes('Contract value declining (>20%)')) {
    recommendations.push({
      action: 'Value realization review',
      description: 'Present ROI analysis, success metrics, and expansion opportunities.',
      priority: 'Medium'
    });
  }

  return recommendations;
};

/**
 * AMC Renewal Probability Insight
 * Predicts likelihood of AMC renewal based on historical patterns
 */
export const assessAMCRenewalProbability = (amc, previousAMCs, clientPaymentHistory) => {
  let renewalProbability = 50; // Base 50%
  const factors = [];

  // Factor 1: Service completion rate (25%)
  if (amc.numberOfServices && amc.servicesCompleted) {
    const completionRate = (amc.servicesCompleted / amc.numberOfServices) * 100;
    if (completionRate >= 95) {
      renewalProbability += 15;
      factors.push({ factor: 'Excellent service delivery (95%+)', impact: '+15%' });
    } else if (completionRate >= 80) {
      renewalProbability += 8;
      factors.push({ factor: 'Good service completion', impact: '+8%' });
    } else if (completionRate < 60) {
      renewalProbability -= 20;
      factors.push({ factor: 'Poor service completion', impact: '-20%' });
    }
  }

  // Factor 2: Historical renewal pattern (20%)
  if (previousAMCs && previousAMCs.length > 0) {
    const renewedCount = previousAMCs.filter(a => a.status === 'Renewed').length;
    const renewalRate = (renewedCount / previousAMCs.length) * 100;

    if (renewalRate >= 80) {
      renewalProbability += 12;
      factors.push({ factor: 'Strong renewal history (80%+)', impact: '+12%' });
    } else if (renewalRate >= 50) {
      renewalProbability += 5;
      factors.push({ factor: 'Moderate renewal history', impact: '+5%' });
    } else if (renewalRate < 30) {
      renewalProbability -= 15;
      factors.push({ factor: 'Weak renewal history', impact: '-15%' });
    }
  }

  // Factor 3: Payment behavior (20%)
  if (clientPaymentHistory && clientPaymentHistory.length > 0) {
    const onTimePayments = clientPaymentHistory.filter(p => {
      const daysLate = (new Date() - new Date(p.dueDate)) / (1000 * 60 * 60 * 24);
      return daysLate <= 0;
    }).length;

    const paymentPunctuality = (onTimePayments / clientPaymentHistory.length) * 100;

    if (paymentPunctuality >= 90) {
      renewalProbability += 10;
      factors.push({ factor: 'Excellent payment track record', impact: '+10%' });
    } else if (paymentPunctuality < 60) {
      renewalProbability -= 10;
      factors.push({ factor: 'Payment delays', impact: '-10%' });
    }
  }

  // Factor 4: Contract value growth (15%)
  if (amc.contractValue && previousAMCs && previousAMCs.length > 0) {
    const prevValue = previousAMCs[previousAMCs.length - 1].contractValue || 0;
    const valueChange = ((amc.contractValue - prevValue) / prevValue) * 100;

    if (valueChange > 20) {
      renewalProbability += 10;
      factors.push({ factor: 'Contract value increased 20%+', impact: '+10%' });
    } else if (valueChange < -20) {
      renewalProbability -= 8;
      factors.push({ factor: 'Contract value decreased 20%+', impact: '-8%' });
    }
  }

  // Factor 5: Auto-renewal setting (10%)
  if (amc.autoRenewal) {
    renewalProbability += 5;
    factors.push({ factor: 'Auto-renewal enabled', impact: '+5%' });
  }

  renewalProbability = Math.min(Math.max(renewalProbability, 0), 100); // Clamp 0-100

  let recommendation = 'Monitor regularly';
  if (renewalProbability >= 75) recommendation = 'High probability - proactive renewal discussions recommended';
  else if (renewalProbability >= 50) recommendation = 'Moderate probability - standard renewal outreach';
  else if (renewalProbability >= 25) recommendation = 'Low probability - understand concerns and offer alternatives';
  else recommendation = 'At risk - immediate intervention required';

  return {
    renewalProbability: Math.round(renewalProbability),
    factors,
    recommendation
  };
};

export default {
  generateFollowUpDraft,
  generateSalesPitchSuggestion,
  generateInvoiceDescription,
  assessClientChurnRisk,
  generateChurnRecoveryRecommendations,
  assessAMCRenewalProbability
};
