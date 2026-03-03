// Lead Scoring Engine for Loan-Sync LOS

export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type QualificationStatus = 'raw' | 'scored' | 'qualified' | 'los_ready';

export interface ScoringFactor {
  factor: string;
  points: number;
  maxPoints: number;
  description: string;
  achieved: boolean;
}

export interface LeadScoreResult {
  totalScore: number;
  maxScore: number;
  temperature: LeadTemperature;
  qualificationStatus: QualificationStatus;
  factors: ScoringFactor[];
  recommendations: string[];
}

interface LeadData {
  business_vintage_years?: number | null;
  has_property?: boolean;
  property_value?: number | null;
  gst_number?: string | null;
  udyam_number?: string | null;
  customer_pan?: string | null;
  customer_aadhaar?: string | null;
  is_dedupe_clean?: boolean | null;
  requested_amount?: number;
  product_type?: string;
  business_name?: string | null;
  business_type?: string | null;
  residence_status?: string | null;
}

interface DocumentCounts {
  uploadedCount: number;
  requiredCount: number;
}

export function calculateLeadScore(
  lead: LeadData,
  documentCounts?: DocumentCounts
): LeadScoreResult {
  const factors: ScoringFactor[] = [];
  let totalScore = 0;
  const maxScore = 100;
  const recommendations: string[] = [];

  // Base score
  totalScore = 30;

  // 1. Business Vintage (+20 max)
  const vintageYears = lead.business_vintage_years || 0;
  let vintagePoints = 0;
  if (vintageYears >= 5) {
    vintagePoints = 20;
  } else if (vintageYears >= 3) {
    vintagePoints = 15;
  } else if (vintageYears >= 2) {
    vintagePoints = 10;
  } else if (vintageYears >= 1) {
    vintagePoints = 5;
  }
  factors.push({
    factor: 'Business Vintage',
    points: vintagePoints,
    maxPoints: 20,
    description: vintageYears >= 5 ? '5+ years' : vintageYears >= 2 ? `${vintageYears} years` : 'Less than 2 years',
    achieved: vintagePoints > 0,
  });
  totalScore += vintagePoints;
  if (vintageYears < 2) {
    recommendations.push('Business with 2+ years vintage scores higher');
  }

  // 2. Property Available (+15)
  const propertyPoints = lead.has_property ? 15 : 0;
  factors.push({
    factor: 'Property Available',
    points: propertyPoints,
    maxPoints: 15,
    description: lead.has_property ? 'Collateral available' : 'No property',
    achieved: lead.has_property || false,
  });
  totalScore += propertyPoints;
  if (!lead.has_property) {
    recommendations.push('Property as collateral improves eligibility');
  }

  // 3. GST/Udyam Registration (+10)
  const hasGstOrUdyam = !!(lead.gst_number || lead.udyam_number);
  const registrationPoints = hasGstOrUdyam ? 10 : 0;
  factors.push({
    factor: 'GST/Udyam Registration',
    points: registrationPoints,
    maxPoints: 10,
    description: hasGstOrUdyam ? 'Registered business' : 'Not registered',
    achieved: hasGstOrUdyam,
  });
  totalScore += registrationPoints;
  if (!hasGstOrUdyam) {
    recommendations.push('GST or Udyam registration adds credibility');
  }

  // 4. KYC Documents (+10)
  const hasKyc = !!(lead.customer_pan && lead.customer_aadhaar);
  const kycPoints = lead.customer_pan ? 5 : 0;
  const aadhaarPoints = lead.customer_aadhaar ? 5 : 0;
  factors.push({
    factor: 'KYC Documents',
    points: kycPoints + aadhaarPoints,
    maxPoints: 10,
    description: hasKyc ? 'PAN & Aadhaar provided' : 'Partial/Missing KYC',
    achieved: hasKyc,
  });
  totalScore += kycPoints + aadhaarPoints;
  if (!hasKyc) {
    recommendations.push('Complete KYC (PAN & Aadhaar) is required');
  }

  // 5. Document Completeness (+15)
  if (documentCounts) {
    const docRatio = documentCounts.requiredCount > 0 
      ? documentCounts.uploadedCount / documentCounts.requiredCount 
      : 0;
    const docPoints = Math.round(docRatio * 15);
    factors.push({
      factor: 'Document Completeness',
      points: docPoints,
      maxPoints: 15,
      description: `${documentCounts.uploadedCount}/${documentCounts.requiredCount} documents`,
      achieved: docRatio >= 0.8,
    });
    totalScore += docPoints;
    if (docRatio < 0.8) {
      recommendations.push('Upload all required documents to proceed');
    }
  }

  // 6. Dedupe Clean (+5)
  const dedupeClean = lead.is_dedupe_clean === true;
  const dedupePoints = dedupeClean ? 5 : (lead.is_dedupe_clean === false ? -10 : 0);
  if (lead.is_dedupe_clean !== null) {
    factors.push({
      factor: 'Dedupe Check',
      points: Math.max(0, dedupePoints),
      maxPoints: 5,
      description: dedupeClean ? 'No duplicates found' : 'Duplicate detected',
      achieved: dedupeClean,
    });
    totalScore += dedupePoints;
  }

  // 7. Residence Status (+5)
  const residenceOwned = lead.residence_status === 'owned' || lead.residence_status === 'family_owned';
  const residencePoints = residenceOwned ? 5 : 0;
  if (lead.residence_status) {
    factors.push({
      factor: 'Residence Status',
      points: residencePoints,
      maxPoints: 5,
      description: residenceOwned ? 'Owned residence' : 'Rented',
      achieved: residenceOwned,
    });
    totalScore += residencePoints;
  }

  // Clamp score
  totalScore = Math.min(maxScore, Math.max(0, totalScore));

  // Determine temperature
  let temperature: LeadTemperature;
  if (totalScore >= 75) {
    temperature = 'hot';
  } else if (totalScore >= 50) {
    temperature = 'warm';
  } else {
    temperature = 'cold';
  }

  // Determine qualification status
  let qualificationStatus: QualificationStatus;
  if (totalScore >= 80 && hasKyc && (documentCounts?.uploadedCount || 0) >= 3) {
    qualificationStatus = 'los_ready';
  } else if (totalScore >= 60) {
    qualificationStatus = 'qualified';
  } else if (factors.length > 0) {
    qualificationStatus = 'scored';
  } else {
    qualificationStatus = 'raw';
  }

  return {
    totalScore,
    maxScore,
    temperature,
    qualificationStatus,
    factors,
    recommendations,
  };
}

export function getTemperatureColor(temperature: LeadTemperature): string {
  switch (temperature) {
    case 'hot':
      return 'text-destructive';
    case 'warm':
      return 'text-warning';
    case 'cold':
      return 'text-info';
  }
}

export function getTemperatureEmoji(temperature: LeadTemperature): string {
  switch (temperature) {
    case 'hot':
      return '🔥';
    case 'warm':
      return '🌡️';
    case 'cold':
      return '❄️';
  }
}

export function getQualificationLabel(status: QualificationStatus): string {
  switch (status) {
    case 'raw':
      return 'Raw Lead';
    case 'scored':
      return 'Scored';
    case 'qualified':
      return 'Qualified';
    case 'los_ready':
      return 'Ready for LOS';
  }
}
