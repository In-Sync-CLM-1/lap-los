// Mock OCR API for Aadhaar and PAN document extraction

import { supabase } from '@/integrations/supabase/client';

export interface OCRResult {
  documentType: 'aadhaar' | 'pan';
  extractedData: {
    name?: string;
    number: string;
    dateOfBirth?: string;
    address?: string;
    gender?: string;
    fatherName?: string;
  };
  confidence: number;
  rawText?: string;
  success: boolean;
  error?: string;
}

// Simulated delay
async function simulateProcessing(): Promise<void> {
  const delay = Math.random() * 1500 + 500; // 500-2000ms
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Mock names for realistic data
const mockNames = [
  'Rajesh Kumar',
  'Priya Sharma',
  'Amit Patel',
  'Sunita Devi',
  'Vikram Singh',
  'Anita Gupta',
  'Suresh Yadav',
  'Meera Iyer',
];

const mockAddresses = [
  '45, MG Road, Bangalore, Karnataka - 560001',
  '123, Anna Nagar, Chennai, Tamil Nadu - 600040',
  '78, Salt Lake, Kolkata, West Bengal - 700091',
  '56, Banjara Hills, Hyderabad, Telangana - 500034',
];

function generateMockPAN(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let pan = '';
  
  // First 5 characters: letters
  for (let i = 0; i < 5; i++) {
    pan += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // Next 4 characters: digits
  for (let i = 0; i < 4; i++) {
    pan += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  // Last character: letter
  pan += letters.charAt(Math.floor(Math.random() * letters.length));
  
  return pan;
}

function generateMockAadhaar(): string {
  let aadhaar = '';
  for (let i = 0; i < 12; i++) {
    aadhaar += Math.floor(Math.random() * 10);
  }
  return aadhaar;
}

function generateMockDOB(): string {
  const year = Math.floor(Math.random() * 30) + 1960; // 1960-1990
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

async function logOCRCall(
  documentType: string,
  leadId: string | null,
  success: boolean,
  extractedData: unknown,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('api_logs').insert([{
      api_name: `ocr_${documentType}`,
      lead_id: leadId,
      request_payload: { documentType } as Record<string, string>,
      response_payload: extractedData as Record<string, string | number | boolean | null>,
      is_success: success,
      status_code: success ? 200 : 400,
      response_time_ms: Math.floor(Math.random() * 1500) + 500,
      error_message: errorMessage || null,
      is_mock: true,
    }]);
  } catch (e) {
    console.error('Failed to log OCR call:', e);
  }
}

/**
 * Perform mock OCR on a document image
 * @param documentType - Type of document (aadhaar or pan)
 * @param imageFile - The image file (not actually processed in mock)
 * @param leadId - Optional lead ID for logging
 * @returns OCR result with extracted data
 */
export async function performOCR(
  documentType: 'aadhaar' | 'pan',
  imageFile: File,
  leadId?: string
): Promise<OCRResult> {
  await simulateProcessing();
  
  // 5% chance of OCR failure
  if (Math.random() < 0.05) {
    const error = 'Unable to extract text from image. Please ensure the document is clear and well-lit.';
    await logOCRCall(documentType, leadId || null, false, null, error);
    return {
      documentType,
      extractedData: { number: '' },
      confidence: 0,
      success: false,
      error,
    };
  }

  const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
  const confidence = Math.random() * 0.15 + 0.85; // 85-100% confidence

  if (documentType === 'aadhaar') {
    const extractedData = {
      name: randomName,
      number: generateMockAadhaar(),
      dateOfBirth: generateMockDOB(),
      address: mockAddresses[Math.floor(Math.random() * mockAddresses.length)],
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
    };
    
    await logOCRCall(documentType, leadId || null, true, extractedData);
    
    return {
      documentType,
      extractedData,
      confidence,
      rawText: `GOVERNMENT OF INDIA\n${randomName}\nDOB: ${extractedData.dateOfBirth}\n${extractedData.address}`,
      success: true,
    };
  } else {
    // PAN
    const extractedData = {
      name: randomName,
      number: generateMockPAN(),
      dateOfBirth: generateMockDOB(),
      fatherName: mockNames[Math.floor(Math.random() * mockNames.length)],
    };
    
    await logOCRCall(documentType, leadId || null, true, extractedData);
    
    return {
      documentType,
      extractedData,
      confidence,
      rawText: `INCOME TAX DEPARTMENT\nPERMANENT ACCOUNT NUMBER\n${extractedData.number}\n${randomName}`,
      success: true,
    };
  }
}

/**
 * Format Aadhaar number with spaces
 */
export function formatAadhaar(aadhaar: string): string {
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length !== 12) return aadhaar;
  return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
}

/**
 * Validate PAN format
 */
export function isValidPAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan);
}

/**
 * Validate Aadhaar format
 */
export function isValidAadhaar(aadhaar: string): boolean {
  const clean = aadhaar.replace(/\D/g, '');
  return clean.length === 12;
}
