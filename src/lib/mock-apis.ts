// Mock API Framework - Simulated Third-Party Integrations

import { supabase } from '@/integrations/supabase/client';

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  responseTime: number;
}

// Configurable mock settings
const MOCK_CONFIG = {
  simulateDelay: true,
  delayRange: { min: 500, max: 2000 },
  failureRate: 0.05, // 5% random failure rate
};

async function simulateDelay(): Promise<void> {
  if (MOCK_CONFIG.simulateDelay) {
    const delay = Math.random() * 
      (MOCK_CONFIG.delayRange.max - MOCK_CONFIG.delayRange.min) + 
      MOCK_CONFIG.delayRange.min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

function shouldFail(): boolean {
  return Math.random() < MOCK_CONFIG.failureRate;
}

async function logAPICall(
  apiName: string,
  leadId: string | null,
  applicationId: string | null,
  request: unknown,
  response: unknown,
  success: boolean,
  statusCode: number,
  responseTime: number,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('api_logs').insert([{
      api_name: apiName,
      lead_id: leadId,
      application_id: applicationId,
      request_payload: request as Record<string, string | number | boolean | null>,
      response_payload: response as Record<string, string | number | boolean | null>,
      is_success: success,
      status_code: statusCode,
      response_time_ms: responseTime,
      error_message: errorMessage || null,
      is_mock: true,
    }]);
  } catch (e) {
    console.error('Failed to log API call:', e);
  }
}

// ==================== PAN Verification ====================
export interface PANVerificationRequest {
  panNumber: string;
  name: string;
  dateOfBirth?: string;
}

export interface PANVerificationResponse {
  verified: boolean;
  nameMatch: boolean;
  panStatus: 'active' | 'inactive' | 'invalid';
  registeredName: string;
  panType: 'individual' | 'company' | 'trust';
}

export async function verifyPAN(
  request: PANVerificationRequest,
  leadId?: string
): Promise<APIResponse<PANVerificationResponse>> {
  const startTime = Date.now();
  await simulateDelay();
  
  if (shouldFail()) {
    const response: APIResponse<PANVerificationResponse> = {
      success: false,
      error: 'PAN verification service temporarily unavailable',
      statusCode: 503,
      responseTime: Date.now() - startTime,
    };
    await logAPICall('pan_verification', leadId || null, null, request, null, false, 503, response.responseTime, response.error);
    return response;
  }
  
  // Mock validation logic
  const isValidFormat = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(request.panNumber);
  const nameMatch = request.name.toLowerCase().includes(request.panNumber.slice(0, 5).toLowerCase()) || Math.random() > 0.2;
  
  const data: PANVerificationResponse = {
    verified: isValidFormat,
    nameMatch,
    panStatus: isValidFormat ? 'active' : 'invalid',
    registeredName: request.name.toUpperCase(),
    panType: 'individual',
  };
  
  const response: APIResponse<PANVerificationResponse> = {
    success: true,
    data,
    statusCode: 200,
    responseTime: Date.now() - startTime,
  };
  
  await logAPICall('pan_verification', leadId || null, null, request, data, true, 200, response.responseTime);
  return response;
}

// ==================== Aadhaar Verification ====================
export interface AadhaarVerificationRequest {
  aadhaarNumber: string;
  name: string;
  otp?: string;
}

export interface AadhaarVerificationResponse {
  verified: boolean;
  nameMatch: boolean;
  address: string;
  gender: string;
  maskedAadhaar: string;
}

export async function verifyAadhaar(
  request: AadhaarVerificationRequest,
  leadId?: string
): Promise<APIResponse<AadhaarVerificationResponse>> {
  const startTime = Date.now();
  await simulateDelay();
  
  if (shouldFail()) {
    const response: APIResponse<AadhaarVerificationResponse> = {
      success: false,
      error: 'Aadhaar verification service temporarily unavailable',
      statusCode: 503,
      responseTime: Date.now() - startTime,
    };
    await logAPICall('aadhaar_verification', leadId || null, null, request, null, false, 503, response.responseTime, response.error);
    return response;
  }
  
  const isValidFormat = /^\d{12}$/.test(request.aadhaarNumber);
  const maskedAadhaar = `XXXX-XXXX-${request.aadhaarNumber.slice(-4)}`;
  
  const data: AadhaarVerificationResponse = {
    verified: isValidFormat,
    nameMatch: Math.random() > 0.1,
    address: '123 Mock Street, Mock City, Mock State - 123456',
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    maskedAadhaar,
  };
  
  const response: APIResponse<AadhaarVerificationResponse> = {
    success: true,
    data,
    statusCode: 200,
    responseTime: Date.now() - startTime,
  };
  
  await logAPICall('aadhaar_verification', leadId || null, null, request, data, true, 200, response.responseTime);
  return response;
}

// ==================== GST Verification ====================
export interface GSTVerificationRequest {
  gstNumber: string;
}

export interface GSTVerificationResponse {
  verified: boolean;
  businessName: string;
  businessType: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'cancelled';
  address: string;
  annualTurnover: string;
}

export async function verifyGST(
  request: GSTVerificationRequest,
  leadId?: string
): Promise<APIResponse<GSTVerificationResponse>> {
  const startTime = Date.now();
  await simulateDelay();
  
  if (shouldFail()) {
    const response: APIResponse<GSTVerificationResponse> = {
      success: false,
      error: 'GST verification service temporarily unavailable',
      statusCode: 503,
      responseTime: Date.now() - startTime,
    };
    await logAPICall('gst_verification', leadId || null, null, request, null, false, 503, response.responseTime, response.error);
    return response;
  }
  
  const isValidFormat = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/.test(request.gstNumber);
  
  const data: GSTVerificationResponse = {
    verified: isValidFormat,
    businessName: 'Mock Business Enterprises',
    businessType: 'Proprietorship',
    registrationDate: '2020-04-01',
    status: isValidFormat ? 'active' : 'inactive',
    address: '456 Business Park, Commercial Area, City - 400001',
    annualTurnover: '₹50L - ₹1Cr',
  };
  
  const response: APIResponse<GSTVerificationResponse> = {
    success: true,
    data,
    statusCode: 200,
    responseTime: Date.now() - startTime,
  };
  
  await logAPICall('gst_verification', leadId || null, null, request, data, true, 200, response.responseTime);
  return response;
}

// ==================== Bureau Check ====================
export interface BureauCheckRequest {
  panNumber: string;
  name: string;
  dateOfBirth: string;
  mobile: string;
}

export interface BureauCheckResponse {
  creditScore: number;
  scoreRange: string;
  activeLoanCount: number;
  totalOutstanding: number;
  overdueAmount: number;
  enquiryCount30Days: number;
  enquiryCount90Days: number;
  oldestAccountAge: number;
  paymentHistory: 'good' | 'fair' | 'poor';
  riskCategory: 'low' | 'medium' | 'high';
}

export async function checkBureau(
  request: BureauCheckRequest,
  leadId?: string,
  applicationId?: string
): Promise<APIResponse<BureauCheckResponse>> {
  const startTime = Date.now();
  await simulateDelay();
  
  if (shouldFail()) {
    const response: APIResponse<BureauCheckResponse> = {
      success: false,
      error: 'Bureau service temporarily unavailable',
      statusCode: 503,
      responseTime: Date.now() - startTime,
    };
    await logAPICall('bureau_check', leadId || null, applicationId || null, request, null, false, 503, response.responseTime, response.error);
    return response;
  }
  
  // Generate mock credit score (600-850)
  const creditScore = Math.floor(Math.random() * 250) + 600;
  const riskCategory = creditScore >= 750 ? 'low' : creditScore >= 650 ? 'medium' : 'high';
  
  const data: BureauCheckResponse = {
    creditScore,
    scoreRange: creditScore >= 750 ? 'Excellent' : creditScore >= 700 ? 'Good' : creditScore >= 650 ? 'Fair' : 'Poor',
    activeLoanCount: Math.floor(Math.random() * 5),
    totalOutstanding: Math.floor(Math.random() * 500000),
    overdueAmount: Math.random() > 0.7 ? Math.floor(Math.random() * 50000) : 0,
    enquiryCount30Days: Math.floor(Math.random() * 3),
    enquiryCount90Days: Math.floor(Math.random() * 8),
    oldestAccountAge: Math.floor(Math.random() * 120) + 12,
    paymentHistory: creditScore >= 700 ? 'good' : creditScore >= 650 ? 'fair' : 'poor',
    riskCategory,
  };
  
  const response: APIResponse<BureauCheckResponse> = {
    success: true,
    data,
    statusCode: 200,
    responseTime: Date.now() - startTime,
  };
  
  await logAPICall('bureau_check', leadId || null, applicationId || null, request, data, true, 200, response.responseTime);
  return response;
}

// ==================== AML/Hunter Fraud Check ====================
export interface AMLCheckRequest {
  panNumber: string;
  aadhaarNumber: string;
  name: string;
  mobile: string;
}

export interface AMLCheckResponse {
  isClean: boolean;
  riskScore: number;
  pepMatch: boolean;
  sanctionMatch: boolean;
  adverseMediaHits: number;
  duplicateApplications: number;
  fraudIndicators: string[];
}

export async function checkAML(
  request: AMLCheckRequest,
  leadId?: string
): Promise<APIResponse<AMLCheckResponse>> {
  const startTime = Date.now();
  await simulateDelay();
  
  if (shouldFail()) {
    const response: APIResponse<AMLCheckResponse> = {
      success: false,
      error: 'AML service temporarily unavailable',
      statusCode: 503,
      responseTime: Date.now() - startTime,
    };
    await logAPICall('aml_check', leadId || null, null, request, null, false, 503, response.responseTime, response.error);
    return response;
  }
  
  // 95% clean, 5% with some flags
  const isClean = Math.random() > 0.05;
  const riskScore = isClean ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 50) + 50;
  
  const data: AMLCheckResponse = {
    isClean,
    riskScore,
    pepMatch: Math.random() < 0.01,
    sanctionMatch: false,
    adverseMediaHits: isClean ? 0 : Math.floor(Math.random() * 3),
    duplicateApplications: Math.random() < 0.1 ? 1 : 0,
    fraudIndicators: isClean ? [] : ['Multiple applications from same device'],
  };
  
  const response: APIResponse<AMLCheckResponse> = {
    success: true,
    data,
    statusCode: 200,
    responseTime: Date.now() - startTime,
  };
  
  await logAPICall('aml_check', leadId || null, null, request, data, true, 200, response.responseTime);
  return response;
}

// ==================== Bank Account Verification ====================
export interface BankVerificationRequest {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface BankVerificationResponse {
  verified: boolean;
  nameMatch: boolean;
  accountExists: boolean;
  bankName: string;
  branchName: string;
  accountType: string;
}

export async function verifyBankAccount(
  request: BankVerificationRequest,
  applicationId?: string
): Promise<APIResponse<BankVerificationResponse>> {
  const startTime = Date.now();
  await simulateDelay();
  
  if (shouldFail()) {
    const response: APIResponse<BankVerificationResponse> = {
      success: false,
      error: 'Bank verification service temporarily unavailable',
      statusCode: 503,
      responseTime: Date.now() - startTime,
    };
    await logAPICall('bank_verification', null, applicationId || null, request, null, false, 503, response.responseTime, response.error);
    return response;
  }
  
  const isValidIFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(request.ifscCode);
  const bankCode = request.ifscCode.slice(0, 4);
  
  const bankNames: Record<string, string> = {
    'HDFC': 'HDFC Bank',
    'ICIC': 'ICICI Bank',
    'SBIN': 'State Bank of India',
    'AXIS': 'Axis Bank',
    'KKBK': 'Kotak Mahindra Bank',
  };
  
  const data: BankVerificationResponse = {
    verified: isValidIFSC,
    nameMatch: Math.random() > 0.1,
    accountExists: isValidIFSC,
    bankName: bankNames[bankCode] || 'Unknown Bank',
    branchName: 'Main Branch',
    accountType: 'Savings',
  };
  
  const response: APIResponse<BankVerificationResponse> = {
    success: true,
    data,
    statusCode: 200,
    responseTime: Date.now() - startTime,
  };
  
  await logAPICall('bank_verification', null, applicationId || null, request, data, true, 200, response.responseTime);
  return response;
}

// ==================== Dedupe Check ====================
export interface DedupeCheckRequest {
  panNumber?: string;
  aadhaarNumber?: string;
  mobile: string;
  email?: string;
}

export interface DedupeCheckResponse {
  isDuplicate: boolean;
  existingLeadId?: string;
  existingApplicationId?: string;
  matchType?: 'pan' | 'aadhaar' | 'mobile' | 'email';
  previousApplicationStatus?: string;
}

export async function checkDedupe(
  request: DedupeCheckRequest,
  leadId?: string
): Promise<APIResponse<DedupeCheckResponse>> {
  const startTime = Date.now();
  await simulateDelay();
  
  // 10% chance of finding a duplicate
  const isDuplicate = Math.random() < 0.1;
  
  const data: DedupeCheckResponse = {
    isDuplicate,
    existingLeadId: isDuplicate ? 'NC-L-20250101-00001' : undefined,
    matchType: isDuplicate ? 'mobile' : undefined,
    previousApplicationStatus: isDuplicate ? 'rejected' : undefined,
  };
  
  const response: APIResponse<DedupeCheckResponse> = {
    success: true,
    data,
    statusCode: 200,
    responseTime: Date.now() - startTime,
  };
  
  await logAPICall('dedupe_check', leadId || null, null, request, data, true, 200, response.responseTime);
  return response;
}
