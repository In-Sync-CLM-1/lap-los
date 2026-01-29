/**
 * Notification Hooks - Event trigger points for notifications
 * 
 * This module defines the notification events that can be triggered
 * throughout the loan lifecycle. Actual notification delivery (Email/SMS)
 * would be implemented via edge functions or third-party services.
 */

export type NotificationEvent = 
  | 'lead_created'
  | 'lead_documents_pending'
  | 'lead_submitted'
  | 'application_created'
  | 'application_bre_complete'
  | 'application_assigned'
  | 'application_deviation_required'
  | 'application_approved'
  | 'application_rejected'
  | 'application_disbursed'
  | 'deviation_submitted'
  | 'deviation_approved'
  | 'deviation_rejected'
  | 'counter_offer_submitted'
  | 'document_verified'
  | 'sanction_letter_generated';

export interface NotificationPayload {
  event: NotificationEvent;
  recipientType: 'customer' | 'ro' | 'underwriter' | 'manager' | 'system';
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
}

export interface NotificationTemplate {
  subject: string;
  body: string;
  smsText?: string;
}

// Notification templates
const TEMPLATES: Record<NotificationEvent, NotificationTemplate> = {
  lead_created: {
    subject: 'New Lead Created - {{lead_number}}',
    body: 'A new lead has been created for {{customer_name}}. Lead Number: {{lead_number}}.',
    smsText: 'Niyara: New lead {{lead_number}} created for {{customer_name}}.',
  },
  lead_documents_pending: {
    subject: 'Documents Required - {{lead_number}}',
    body: 'Please upload the required documents for lead {{lead_number}}.',
    smsText: 'Niyara: Docs pending for lead {{lead_number}}. Please upload.',
  },
  lead_submitted: {
    subject: 'Lead Submitted for Processing - {{lead_number}}',
    body: 'Lead {{lead_number}} has been submitted for processing.',
    smsText: 'Niyara: Lead {{lead_number}} submitted for processing.',
  },
  application_created: {
    subject: 'Application Created - {{application_number}}',
    body: 'Application {{application_number}} has been created from lead {{lead_number}}.',
    smsText: 'Niyara: Application {{application_number}} created.',
  },
  application_bre_complete: {
    subject: 'BRE Processing Complete - {{application_number}}',
    body: 'Business Rule Engine has processed application {{application_number}}. Decision: {{decision}}.',
    smsText: 'Niyara: BRE complete for {{application_number}}. Decision: {{decision}}.',
  },
  application_assigned: {
    subject: 'Application Assigned - {{application_number}}',
    body: 'You have been assigned to underwrite application {{application_number}}.',
    smsText: 'Niyara: App {{application_number}} assigned to you for underwriting.',
  },
  application_deviation_required: {
    subject: 'Deviation Approval Required - {{application_number}}',
    body: 'Application {{application_number}} requires deviation approval. Reason: {{deviation_reason}}.',
    smsText: 'Niyara: Deviation approval needed for {{application_number}}.',
  },
  application_approved: {
    subject: 'Congratulations! Loan Approved - {{application_number}}',
    body: 'Your loan application {{application_number}} has been approved for {{approved_amount}}.',
    smsText: 'Niyara: Congrats! Loan {{application_number}} approved for Rs.{{approved_amount}}.',
  },
  application_rejected: {
    subject: 'Application Update - {{application_number}}',
    body: 'We regret to inform you that application {{application_number}} could not be approved. Reason: {{rejection_reason}}.',
    smsText: 'Niyara: App {{application_number}} could not be approved. Contact us for details.',
  },
  application_disbursed: {
    subject: 'Loan Disbursed - {{application_number}}',
    body: 'Loan {{application_number}} has been disbursed. Amount: {{disbursed_amount}}.',
    smsText: 'Niyara: Rs.{{disbursed_amount}} disbursed for loan {{application_number}}.',
  },
  deviation_submitted: {
    subject: 'Deviation Request Submitted - {{application_number}}',
    body: 'A deviation request has been submitted for {{application_number}}. Type: {{deviation_type}}.',
    smsText: 'Niyara: Deviation request submitted for {{application_number}}.',
  },
  deviation_approved: {
    subject: 'Deviation Approved - {{application_number}}',
    body: 'The deviation for application {{application_number}} has been approved.',
    smsText: 'Niyara: Deviation approved for {{application_number}}.',
  },
  deviation_rejected: {
    subject: 'Deviation Rejected - {{application_number}}',
    body: 'The deviation for application {{application_number}} has been rejected.',
    smsText: 'Niyara: Deviation rejected for {{application_number}}.',
  },
  counter_offer_submitted: {
    subject: 'Counter Offer Available - {{application_number}}',
    body: 'A counter offer has been provided for {{application_number}}. New amount: {{counter_amount}}.',
    smsText: 'Niyara: Counter offer of Rs.{{counter_amount}} for {{application_number}}.',
  },
  document_verified: {
    subject: 'Document Verified - {{document_type}}',
    body: 'Your {{document_type}} has been verified for application {{application_number}}.',
    smsText: 'Niyara: {{document_type}} verified for {{application_number}}.',
  },
  sanction_letter_generated: {
    subject: 'Sanction Letter Ready - {{application_number}}',
    body: 'Your sanction letter for application {{application_number}} is ready for download.',
    smsText: 'Niyara: Sanction letter ready for {{application_number}}. Check app.',
  },
};

/**
 * Queue a notification for delivery
 * In production, this would call an edge function or notification service
 */
export async function queueNotification(payload: NotificationPayload): Promise<boolean> {
  const template = TEMPLATES[payload.event];
  
  if (!template) {
    console.warn(`No template found for event: ${payload.event}`);
    return false;
  }
  
  // Interpolate template with data
  const interpolate = (text: string, data: Record<string, any>) => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  };
  
  const notification = {
    ...payload,
    subject: interpolate(template.subject, payload.data),
    body: interpolate(template.body, payload.data),
    smsText: template.smsText ? interpolate(template.smsText, payload.data) : undefined,
    queuedAt: new Date().toISOString(),
  };
  
  // Log notification (in production, send to notification service)
  console.log('[Notification Queued]', notification);
  
  // TODO: In production, call edge function to send notification
  // await supabase.functions.invoke('send-notification', { body: notification });
  
  return true;
}

/**
 * Trigger notification for lead events
 */
export async function notifyLeadEvent(
  event: Extract<NotificationEvent, 'lead_created' | 'lead_documents_pending' | 'lead_submitted'>,
  leadData: {
    lead_number: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    ro_id: string;
  }
) {
  // Notify RO
  await queueNotification({
    event,
    recipientType: 'ro',
    recipientId: leadData.ro_id,
    data: leadData,
    priority: 'normal',
    channels: ['in_app'],
  });
  
  // Notify customer for certain events
  if (event === 'lead_submitted' && leadData.customer_phone) {
    await queueNotification({
      event,
      recipientType: 'customer',
      recipientPhone: leadData.customer_phone,
      recipientEmail: leadData.customer_email,
      data: leadData,
      priority: 'normal',
      channels: ['sms'],
    });
  }
}

/**
 * Trigger notification for application events
 */
export async function notifyApplicationEvent(
  event: NotificationEvent,
  applicationData: {
    application_number: string;
    lead_number?: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    ro_id: string;
    underwriter_id?: string;
    [key: string]: any;
  }
) {
  const priority: NotificationPayload['priority'] = 
    ['application_approved', 'application_disbursed'].includes(event) ? 'high' :
    ['application_rejected', 'application_deviation_required'].includes(event) ? 'urgent' :
    'normal';
  
  // Notify RO
  await queueNotification({
    event,
    recipientType: 'ro',
    recipientId: applicationData.ro_id,
    data: applicationData,
    priority,
    channels: ['in_app', 'email'],
  });
  
  // Notify customer for key events
  const customerEvents: NotificationEvent[] = [
    'application_approved',
    'application_rejected',
    'application_disbursed',
    'counter_offer_submitted',
    'sanction_letter_generated',
  ];
  
  if (customerEvents.includes(event) && applicationData.customer_phone) {
    await queueNotification({
      event,
      recipientType: 'customer',
      recipientPhone: applicationData.customer_phone,
      recipientEmail: applicationData.customer_email,
      data: applicationData,
      priority,
      channels: ['sms', 'email'],
    });
  }
  
  // Notify underwriter for assignment
  if (event === 'application_assigned' && applicationData.underwriter_id) {
    await queueNotification({
      event,
      recipientType: 'underwriter',
      recipientId: applicationData.underwriter_id,
      data: applicationData,
      priority: 'high',
      channels: ['in_app', 'email'],
    });
  }
}

/**
 * Trigger notification for deviation events
 */
export async function notifyDeviationEvent(
  event: Extract<NotificationEvent, 'deviation_submitted' | 'deviation_approved' | 'deviation_rejected'>,
  deviationData: {
    application_number: string;
    deviation_type: string;
    deviation_reason: string;
    requester_id: string;
    approver_id?: string;
    [key: string]: any;
  }
) {
  // Notify requester
  await queueNotification({
    event,
    recipientType: 'ro',
    recipientId: deviationData.requester_id,
    data: deviationData,
    priority: 'high',
    channels: ['in_app', 'email'],
  });
  
  // Notify managers for new deviation requests
  if (event === 'deviation_submitted') {
    await queueNotification({
      event,
      recipientType: 'manager',
      data: deviationData,
      priority: 'urgent',
      channels: ['in_app', 'email'],
    });
  }
}
