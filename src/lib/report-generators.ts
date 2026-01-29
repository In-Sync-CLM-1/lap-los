import { format, differenceInDays } from 'date-fns';
import type { ExportData } from './export-utils';

// Label mappings
const PRODUCT_LABELS: Record<string, string> = {
  business_loan: 'Business Loan',
  personal_loan: 'Personal Loan',
  stpl: 'Short Term Personal Loan',
  po_finance: 'PO Finance',
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_progress: 'In Progress',
  documents_pending: 'Documents Pending',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
  closed: 'Closed',
};

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  bre_processing: 'BRE Processing',
  underwriting: 'Underwriting',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  deviation: 'Deviation',
  disbursed: 'Disbursed',
  closed: 'Closed',
};

const BRE_DECISION_LABELS: Record<string, string> = {
  stp_approved: 'STP Approved',
  non_stp: 'Non-STP',
  rejected: 'Rejected',
  deviation: 'Deviation',
};

// Type definitions for report data
interface LeadReportData {
  lead_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  product_type: string;
  requested_amount: number;
  lead_score: number | null;
  lead_temperature: string | null;
  qualification_status: string | null;
  source_channel: string | null;
  status: string;
  created_at: string;
  ro_profile?: { full_name: string } | null;
}

interface ApplicationReportData {
  application_number: string;
  status: string;
  bre_score: number | null;
  bre_decision: string | null;
  final_amount: number | null;
  final_interest_rate: number | null;
  final_tenure_months: number | null;
  final_emi: number | null;
  created_at: string;
  approved_at: string | null;
  lead: {
    lead_number: string;
    customer_name: string;
    product_type: string;
    requested_amount: number;
  };
  ro_profile?: { full_name: string } | null;
  underwriter_profile?: { full_name: string } | null;
}

interface DisbursalReportData {
  application_number: string;
  final_amount: number | null;
  disbursed_amount: number | null;
  disbursed_at: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  lead: {
    lead_number: string;
    customer_name: string;
    product_type: string;
  };
  ro_profile?: { full_name: string } | null;
}

interface RejectionReportData {
  application_number: string;
  bre_score: number | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  lead: {
    lead_number: string;
    customer_name: string;
    product_type: string;
    requested_amount: number;
  };
  rejected_by_profile?: { full_name: string } | null;
}

interface PipelineReportData {
  application_number: string;
  status: string;
  final_amount: number | null;
  created_at: string;
  updated_at: string;
  lead: {
    lead_number: string;
    customer_name: string;
    product_type: string;
    requested_amount: number;
  };
  current_approver_profile?: { full_name: string } | null;
  assigned_underwriter_profile?: { full_name: string } | null;
}

/**
 * Format lead data for comprehensive report
 */
export function formatLeadReport(leads: LeadReportData[]): ExportData {
  return {
    headers: [
      'Lead Number',
      'Client Name',
      'Phone',
      'Email',
      'Product Type',
      'Requested Amount',
      'Lead Score',
      'Temperature',
      'Qualification',
      'Source Channel',
      'Status',
      'RO Name',
      'Created Date',
    ],
    rows: leads.map(lead => [
      lead.lead_number,
      lead.customer_name,
      lead.customer_phone,
      lead.customer_email || '',
      PRODUCT_LABELS[lead.product_type] || lead.product_type,
      lead.requested_amount,
      lead.lead_score || 0,
      lead.lead_temperature || 'N/A',
      lead.qualification_status || 'Raw',
      lead.source_channel || 'Physical',
      LEAD_STATUS_LABELS[lead.status] || lead.status,
      lead.ro_profile?.full_name || 'Unknown',
      format(new Date(lead.created_at), 'dd-MMM-yyyy'),
    ]),
  };
}

/**
 * Format application data for comprehensive report
 */
export function formatApplicationReport(applications: ApplicationReportData[]): ExportData {
  return {
    headers: [
      'Application Number',
      'Lead Number',
      'Client Name',
      'Product Type',
      'Requested Amount',
      'Final Amount',
      'BRE Score',
      'BRE Decision',
      'Status',
      'Interest Rate (%)',
      'Tenure (Months)',
      'EMI',
      'RO Name',
      'Underwriter Name',
      'Created Date',
      'Approved Date',
    ],
    rows: applications.map(app => [
      app.application_number,
      app.lead.lead_number,
      app.lead.customer_name,
      PRODUCT_LABELS[app.lead.product_type] || app.lead.product_type,
      app.lead.requested_amount,
      app.final_amount || '',
      app.bre_score || '',
      app.bre_decision ? (BRE_DECISION_LABELS[app.bre_decision] || app.bre_decision) : '',
      APPLICATION_STATUS_LABELS[app.status] || app.status,
      app.final_interest_rate || '',
      app.final_tenure_months || '',
      app.final_emi || '',
      app.ro_profile?.full_name || 'Unknown',
      app.underwriter_profile?.full_name || '',
      format(new Date(app.created_at), 'dd-MMM-yyyy'),
      app.approved_at ? format(new Date(app.approved_at), 'dd-MMM-yyyy') : '',
    ]),
  };
}

/**
 * Format disbursal data for report
 */
export function formatDisbursalReport(disbursals: DisbursalReportData[]): ExportData {
  return {
    headers: [
      'Application Number',
      'Lead Number',
      'Client Name',
      'Product Type',
      'Sanctioned Amount',
      'Disbursed Amount',
      'Bank Name',
      'Account Number',
      'IFSC Code',
      'Disbursed Date',
      'RO Name',
    ],
    rows: disbursals.map(d => [
      d.application_number,
      d.lead.lead_number,
      d.lead.customer_name,
      PRODUCT_LABELS[d.lead.product_type] || d.lead.product_type,
      d.final_amount || '',
      d.disbursed_amount || '',
      d.bank_name || '',
      d.bank_account_number || '',
      d.bank_ifsc || '',
      d.disbursed_at ? format(new Date(d.disbursed_at), 'dd-MMM-yyyy') : '',
      d.ro_profile?.full_name || 'Unknown',
    ]),
  };
}

/**
 * Format rejection analysis data for report
 */
export function formatRejectionReport(rejections: RejectionReportData[]): ExportData {
  return {
    headers: [
      'Application Number',
      'Lead Number',
      'Client Name',
      'Product Type',
      'Requested Amount',
      'BRE Score',
      'Rejection Reason',
      'Rejected By',
      'Rejected Date',
    ],
    rows: rejections.map(r => [
      r.application_number,
      r.lead.lead_number,
      r.lead.customer_name,
      PRODUCT_LABELS[r.lead.product_type] || r.lead.product_type,
      r.lead.requested_amount,
      r.bre_score || '',
      r.rejection_reason || 'Not specified',
      r.rejected_by_profile?.full_name || 'System',
      r.rejected_at ? format(new Date(r.rejected_at), 'dd-MMM-yyyy') : '',
    ]),
  };
}

/**
 * Format pipeline data for report with TAT tracking
 */
export function formatPipelineReport(pipeline: PipelineReportData[]): ExportData {
  const today = new Date();
  
  return {
    headers: [
      'Application Number',
      'Lead Number',
      'Client Name',
      'Product Type',
      'Amount',
      'Status',
      'Days in Stage',
      'Current Assignee',
      'Created Date',
    ],
    rows: pipeline.map(p => {
      const daysInStage = differenceInDays(today, new Date(p.updated_at));
      const assignee = p.current_approver_profile?.full_name || 
                       p.assigned_underwriter_profile?.full_name || 
                       'Unassigned';
      
      return [
        p.application_number,
        p.lead.lead_number,
        p.lead.customer_name,
        PRODUCT_LABELS[p.lead.product_type] || p.lead.product_type,
        p.final_amount || p.lead.requested_amount,
        APPLICATION_STATUS_LABELS[p.status] || p.status,
        daysInStage,
        assignee,
        format(new Date(p.created_at), 'dd-MMM-yyyy'),
      ];
    }),
  };
}

/**
 * Calculate total disbursed amount
 */
export function calculateTotalDisbursed(disbursals: DisbursalReportData[]): number {
  return disbursals.reduce((sum, d) => sum + (d.disbursed_amount || 0), 0);
}

/**
 * Calculate average TAT for pipeline
 */
export function calculateAverageTAT(pipeline: PipelineReportData[]): number {
  if (pipeline.length === 0) return 0;
  
  const today = new Date();
  const totalDays = pipeline.reduce((sum, p) => {
    return sum + differenceInDays(today, new Date(p.updated_at));
  }, 0);
  
  return Number((totalDays / pipeline.length).toFixed(1));
}
