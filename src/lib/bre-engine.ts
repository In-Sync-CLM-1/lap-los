// Business Rule Engine - Eligibility and Decision Logic

import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;
type Application = Tables<'applications'>;

export type BREDecision = 'stp_approved' | 'non_stp' | 'rejected' | 'deviation';

export interface BREResult {
  score: number;
  decision: BREDecision;
  reasons: string[];
  maxEligibleAmount: number;
  maxEligibleEMI: number;
  riskCategory: 'low' | 'medium' | 'high';
}

export interface FOIRInput {
  monthlyTurnover: number;
  grossMarginPercent: number;
  monthlyExpenses: number;
  existingObligations: number;
}

export interface FOIRResult {
  netMonthlyIncome: number;
  availableForEMI: number;
  foir: number;
  maxEligibleEMI: number;
  isEligible: boolean;
}

// FOIR thresholds
const MAX_FOIR = 0.50; // 50% max FOIR allowed
const MIN_GROSS_MARGIN = 15; // 15% minimum gross margin

// BRE Scoring weights
const SCORING_WEIGHTS = {
  businessVintage: 20,
  gstRegistration: 15,
  propertyOwnership: 15,
  panVerification: 10,
  aadhaarVerification: 10,
  foirScore: 20,
  amountToIncomeRatio: 10,
};

/**
 * Calculate FOIR (Fixed Obligation to Income Ratio)
 */
export function calculateFOIR(input: FOIRInput): FOIRResult {
  const { monthlyTurnover, grossMarginPercent, monthlyExpenses, existingObligations } = input;
  
  // Calculate net monthly income
  const grossProfit = monthlyTurnover * (grossMarginPercent / 100);
  const netMonthlyIncome = grossProfit - monthlyExpenses;
  
  // Calculate available EMI capacity
  const maxAllowedObligation = netMonthlyIncome * MAX_FOIR;
  const availableForEMI = Math.max(0, maxAllowedObligation - existingObligations);
  
  // Calculate current FOIR
  const foir = netMonthlyIncome > 0 ? existingObligations / netMonthlyIncome : 1;
  
  return {
    netMonthlyIncome: Math.round(netMonthlyIncome),
    availableForEMI: Math.round(availableForEMI),
    foir: Math.round(foir * 100) / 100,
    maxEligibleEMI: Math.round(availableForEMI),
    isEligible: availableForEMI > 5000 && grossMarginPercent >= MIN_GROSS_MARGIN,
  };
}

/**
 * Calculate loan amount from EMI
 */
export function calculateLoanFromEMI(
  emi: number,
  interestRate: number,
  tenureMonths: number
): number {
  const monthlyRate = interestRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const loanAmount = emi * ((factor - 1) / (monthlyRate * factor));
  return Math.round(loanAmount);
}

/**
 * Calculate EMI from loan amount
 */
export function calculateEMI(
  principal: number,
  interestRate: number,
  tenureMonths: number
): number {
  const monthlyRate = interestRate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = principal * (monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

/**
 * Run Business Rule Engine
 */
export function runBRE(lead: Lead, foirResult: FOIRResult): BREResult {
  let score = 0;
  const reasons: string[] = [];
  
  // 1. Business Vintage Score (0-20)
  const vintageYears = lead.business_vintage_years || 0;
  if (vintageYears >= 5) {
    score += SCORING_WEIGHTS.businessVintage;
    reasons.push('✓ Business vintage 5+ years');
  } else if (vintageYears >= 3) {
    score += SCORING_WEIGHTS.businessVintage * 0.7;
    reasons.push('✓ Business vintage 3+ years');
  } else if (vintageYears >= 1) {
    score += SCORING_WEIGHTS.businessVintage * 0.4;
    reasons.push('⚠ Business vintage 1-3 years');
  } else {
    reasons.push('✗ Business vintage less than 1 year');
  }
  
  // 2. GST Registration Score (0-15)
  if (lead.gst_number) {
    score += SCORING_WEIGHTS.gstRegistration;
    reasons.push('✓ GST registered');
  } else if (lead.udyam_number) {
    score += SCORING_WEIGHTS.gstRegistration * 0.6;
    reasons.push('⚠ Udyam registered (no GST)');
  } else {
    reasons.push('✗ No GST/Udyam registration');
  }
  
  // 3. Property Ownership Score (0-15)
  if (lead.has_property && lead.property_value && lead.property_value > 0) {
    score += SCORING_WEIGHTS.propertyOwnership;
    reasons.push('✓ Property ownership verified');
  } else if (lead.has_property) {
    score += SCORING_WEIGHTS.propertyOwnership * 0.5;
    reasons.push('⚠ Property claimed but value not verified');
  } else {
    reasons.push('✗ No property ownership');
  }
  
  // 4. PAN Verification Score (0-10)
  if (lead.customer_pan) {
    score += SCORING_WEIGHTS.panVerification;
    reasons.push('✓ PAN verified');
  } else {
    reasons.push('✗ PAN not provided');
  }
  
  // 5. Aadhaar Verification Score (0-10)
  if (lead.customer_aadhaar) {
    score += SCORING_WEIGHTS.aadhaarVerification;
    reasons.push('✓ Aadhaar verified');
  } else {
    reasons.push('✗ Aadhaar not provided');
  }
  
  // 6. FOIR Score (0-20)
  if (foirResult.isEligible) {
    if (foirResult.foir <= 0.3) {
      score += SCORING_WEIGHTS.foirScore;
      reasons.push('✓ Excellent FOIR (≤30%)');
    } else if (foirResult.foir <= 0.4) {
      score += SCORING_WEIGHTS.foirScore * 0.7;
      reasons.push('✓ Good FOIR (≤40%)');
    } else {
      score += SCORING_WEIGHTS.foirScore * 0.4;
      reasons.push('⚠ Moderate FOIR (≤50%)');
    }
  } else {
    reasons.push('✗ FOIR exceeds threshold or insufficient income');
  }
  
  // 7. Amount to Income Ratio (0-10)
  const requestedAmount = lead.requested_amount || 0;
  const annualIncome = foirResult.netMonthlyIncome * 12;
  const ratio = annualIncome > 0 ? requestedAmount / annualIncome : 10;
  
  if (ratio <= 2) {
    score += SCORING_WEIGHTS.amountToIncomeRatio;
    reasons.push('✓ Loan amount within 2x annual income');
  } else if (ratio <= 4) {
    score += SCORING_WEIGHTS.amountToIncomeRatio * 0.6;
    reasons.push('⚠ Loan amount 2-4x annual income');
  } else {
    reasons.push('✗ Loan amount exceeds 4x annual income');
  }
  
  // Calculate max eligible amount based on FOIR
  const defaultInterestRate = 18; // 18% p.a.
  const defaultTenure = lead.requested_tenure_months || 36;
  const maxEligibleAmount = calculateLoanFromEMI(
    foirResult.maxEligibleEMI,
    defaultInterestRate,
    defaultTenure
  );
  
  // Determine decision
  let decision: BREDecision;
  let riskCategory: 'low' | 'medium' | 'high';
  
  if (score >= 80 && foirResult.isEligible) {
    decision = 'stp_approved';
    riskCategory = 'low';
  } else if (score >= 60 && foirResult.isEligible) {
    decision = 'non_stp';
    riskCategory = 'medium';
  } else if (score >= 40) {
    decision = 'deviation';
    riskCategory = 'high';
  } else {
    decision = 'rejected';
    riskCategory = 'high';
  }
  
  return {
    score: Math.round(score),
    decision,
    reasons,
    maxEligibleAmount,
    maxEligibleEMI: foirResult.maxEligibleEMI,
    riskCategory,
  };
}

/**
 * Generate loan offers based on BRE result
 */
export interface LoanOffer {
  id: string;
  name: string;
  amount: number;
  tenureMonths: number;
  interestRate: number;
  emi: number;
  processingFee: number;
  totalPayable: number;
}

export function generateOffers(
  lead: Lead,
  breResult: BREResult
): { offer1: LoanOffer; offer2: LoanOffer } {
  const requestedAmount = lead.requested_amount || 0;
  const requestedTenure = lead.requested_tenure_months || 36;
  
  // Offer 1: Conservative (FOIR-based)
  const offer1Amount = Math.min(requestedAmount, breResult.maxEligibleAmount);
  const offer1Rate = breResult.riskCategory === 'low' ? 16 : 
                     breResult.riskCategory === 'medium' ? 18 : 21;
  const offer1Tenure = requestedTenure;
  const offer1EMI = calculateEMI(offer1Amount, offer1Rate, offer1Tenure);
  const offer1ProcessingFee = Math.round(offer1Amount * 0.02); // 2% processing
  
  // Offer 2: Enhanced (+30% amount, +3 months tenure)
  const offer2Amount = Math.min(
    Math.round(requestedAmount * 1.3),
    Math.round(breResult.maxEligibleAmount * 1.2)
  );
  const offer2Rate = offer1Rate + 1; // Slightly higher rate
  const offer2Tenure = Math.min(requestedTenure + 3, 60);
  const offer2EMI = calculateEMI(offer2Amount, offer2Rate, offer2Tenure);
  const offer2ProcessingFee = Math.round(offer2Amount * 0.025); // 2.5% processing
  
  return {
    offer1: {
      id: 'offer1',
      name: 'Standard Offer',
      amount: offer1Amount,
      tenureMonths: offer1Tenure,
      interestRate: offer1Rate,
      emi: offer1EMI,
      processingFee: offer1ProcessingFee,
      totalPayable: offer1EMI * offer1Tenure,
    },
    offer2: {
      id: 'offer2',
      name: 'Enhanced Offer',
      amount: offer2Amount,
      tenureMonths: offer2Tenure,
      interestRate: offer2Rate,
      emi: offer2EMI,
      processingFee: offer2ProcessingFee,
      totalPayable: offer2EMI * offer2Tenure,
    },
  };
}
