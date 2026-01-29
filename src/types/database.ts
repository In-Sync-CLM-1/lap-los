// Type definitions for the LOS database schema

export type AppRole = 'ro' | 'credit_officer' | 'sales_manager' | 'regional_head' | 'zonal_head' | 'ceo' | 'admin';

export type ProductType = 'business_loan' | 'personal_loan' | 'stpl' | 'po_finance';

export type LeadStatus = 'new' | 'in_progress' | 'documents_pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'closed';

export type ApplicationStatus = 'draft' | 'submitted' | 'bre_processing' | 'underwriting' | 'pending_approval' | 'approved' | 'rejected' | 'deviation' | 'disbursed' | 'closed';

export type DecisionType = 'stp_approved' | 'non_stp' | 'rejected' | 'deviation';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  employee_id: string | null;
  branch_code: string | null;
  region: string | null;
  zone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  department_id: string | null;
  designation_id: string | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type QualificationStatus = 'raw' | 'scored' | 'qualified' | 'los_ready';
export type ResidenceStatus = 'owned' | 'rented' | 'family_owned' | 'company_provided';
export type SourceChannel = 'physical' | 'partnership' | 'whatsapp' | 'website';

export interface Lead {
  id: string;
  lead_number: string;
  ro_id: string;
  
  // Customer Details
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_pan: string | null;
  customer_aadhaar: string | null;
  date_of_birth: string | null;
  gender: string | null;
  residence_status: ResidenceStatus | null;
  
  // Co-applicant Details
  co_applicant_name: string | null;
  co_applicant_phone: string | null;
  co_applicant_pan: string | null;
  co_applicant_aadhaar: string | null;
  co_applicant_relation: string | null;
  
  // Business Details
  business_name: string | null;
  business_type: string | null;
  business_address: string | null;
  business_vintage_years: number | null;
  gst_number: string | null;
  udyam_number: string | null;
  
  // Property Details
  has_property: boolean;
  property_type: string | null;
  property_address: string | null;
  property_value: number | null;
  
  // Loan Request
  product_type: ProductType;
  requested_amount: number;
  requested_tenure_months: number | null;
  purpose_of_loan: string | null;
  
  // Lead Source
  source_channel: SourceChannel;
  partner_code: string | null;
  tech_source_reference: string | null;
  
  // Location Data
  capture_latitude: number | null;
  capture_longitude: number | null;
  capture_address: string | null;
  
  // Status
  status: LeadStatus;
  is_dedupe_clean: boolean | null;
  dedupe_checked_at: string | null;
  
  // Lead Scoring & Nurturing
  lead_score: number | null;
  lead_temperature: LeadTemperature | null;
  qualification_status: QualificationStatus | null;
  scoring_factors: Record<string, unknown> | null;
  next_followup_at: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  application_number: string;
  lead_id: string;
  
  // Assigned Users
  ro_id: string;
  assigned_underwriter_id: string | null;
  
  // BRE Results
  bre_score: number | null;
  bre_decision: DecisionType | null;
  bre_reasons: Record<string, unknown> | null;
  bre_processed_at: string | null;
  
  // FOIR Calculation
  monthly_turnover: number | null;
  gross_margin_percent: number | null;
  monthly_expenses: number | null;
  existing_obligations: number | null;
  calculated_foir: number | null;
  max_eligible_emi: number | null;
  
  // Offers
  offer1_amount: number | null;
  offer1_tenure_months: number | null;
  offer1_interest_rate: number | null;
  offer1_emi: number | null;
  
  offer2_amount: number | null;
  offer2_tenure_months: number | null;
  offer2_interest_rate: number | null;
  offer2_emi: number | null;
  
  counter_offer_amount: number | null;
  counter_offer_tenure_months: number | null;
  counter_offer_interest_rate: number | null;
  counter_offer_emi: number | null;
  counter_offer_approved_by: string | null;
  
  // Selected Offer
  selected_offer: string | null;
  final_amount: number | null;
  final_tenure_months: number | null;
  final_interest_rate: number | null;
  final_emi: number | null;
  
  // Approval Workflow
  status: ApplicationStatus;
  current_approver_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  
  // Deviation
  has_deviation: boolean;
  deviation_type: string | null;
  deviation_reason: string | null;
  deviation_approved_by: string | null;
  
  // CAM Sheet
  cam_notes: string | null;
  cam_recommendation: string | null;
  
  // Disbursal
  sanction_letter_generated_at: string | null;
  disbursed_amount: number | null;
  disbursed_at: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  lead_id: string | null;
  application_id: string | null;
  
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  
  // Geo-tagging for photos
  capture_latitude: number | null;
  capture_longitude: number | null;
  capture_address: string | null;
  captured_at: string | null;
  
  // Verification
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  
  // OCR/API Results
  ocr_data: Record<string, unknown> | null;
  api_validation_result: Record<string, unknown> | null;
  
  uploaded_by: string;
  created_at: string;
}

export interface WorkflowHistory {
  id: string;
  application_id: string;
  action: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus | null;
  performed_by: string;
  notes: string | null;
  created_at: string;
}

// UI Helper types
export const PRODUCT_LABELS: Record<ProductType, string> = {
  business_loan: 'Business Loan',
  personal_loan: 'Personal Loan',
  stpl: 'Short Term Personal Loan',
  po_finance: 'Purchase Order Finance',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
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

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
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

export const ROLE_LABELS: Record<AppRole, string> = {
  ro: 'Relationship Officer',
  credit_officer: 'Credit Officer',
  sales_manager: 'Sales Manager',
  regional_head: 'Regional Head',
  zonal_head: 'Zonal Head',
  ceo: 'CEO',
  admin: 'Administrator',
};
