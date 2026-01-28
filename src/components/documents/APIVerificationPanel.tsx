import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  CreditCard,
  Fingerprint,
  Building2,
  Search,
  AlertTriangle
} from 'lucide-react';
import { 
  verifyPAN, 
  verifyAadhaar, 
  verifyGST, 
  checkBureau, 
  checkAML,
  checkDedupe,
  type PANVerificationResponse,
  type AadhaarVerificationResponse,
  type GSTVerificationResponse,
  type BureauCheckResponse,
  type AMLCheckResponse,
  type DedupeCheckResponse,
} from '@/lib/mock-apis';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;

interface VerificationResult {
  status: 'pending' | 'running' | 'success' | 'failed';
  data?: unknown;
  error?: string;
  timestamp?: string;
}

interface APIVerificationPanelProps {
  lead: Lead;
  applicationId?: string;
  onVerificationComplete?: (verifications: Record<string, VerificationResult>) => void;
}

export function APIVerificationPanel({ 
  lead, 
  applicationId,
  onVerificationComplete 
}: APIVerificationPanelProps) {
  const [verifications, setVerifications] = useState<Record<string, VerificationResult>>({
    pan: { status: 'pending' },
    aadhaar: { status: 'pending' },
    gst: { status: 'pending' },
    bureau: { status: 'pending' },
    aml: { status: 'pending' },
    dedupe: { status: 'pending' },
  });
  
  const [isRunningAll, setIsRunningAll] = useState(false);
  
  const updateVerification = (key: string, result: VerificationResult) => {
    setVerifications(prev => {
      const updated = { ...prev, [key]: result };
      onVerificationComplete?.(updated);
      return updated;
    });
  };
  
  const runPANVerification = async () => {
    if (!lead.customer_pan) {
      updateVerification('pan', { status: 'failed', error: 'PAN not provided' });
      return;
    }
    
    updateVerification('pan', { status: 'running' });
    const result = await verifyPAN({
      panNumber: lead.customer_pan,
      name: lead.customer_name,
      dateOfBirth: lead.date_of_birth || undefined,
    }, lead.id);
    
    if (result.success && result.data) {
      updateVerification('pan', { 
        status: result.data.verified ? 'success' : 'failed', 
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      updateVerification('pan', { status: 'failed', error: result.error });
    }
  };
  
  const runAadhaarVerification = async () => {
    if (!lead.customer_aadhaar) {
      updateVerification('aadhaar', { status: 'failed', error: 'Aadhaar not provided' });
      return;
    }
    
    updateVerification('aadhaar', { status: 'running' });
    const result = await verifyAadhaar({
      aadhaarNumber: lead.customer_aadhaar,
      name: lead.customer_name,
    }, lead.id);
    
    if (result.success && result.data) {
      updateVerification('aadhaar', { 
        status: result.data.verified ? 'success' : 'failed', 
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      updateVerification('aadhaar', { status: 'failed', error: result.error });
    }
  };
  
  const runGSTVerification = async () => {
    if (!lead.gst_number) {
      updateVerification('gst', { status: 'failed', error: 'GST not provided' });
      return;
    }
    
    updateVerification('gst', { status: 'running' });
    const result = await verifyGST({
      gstNumber: lead.gst_number,
    }, lead.id);
    
    if (result.success && result.data) {
      updateVerification('gst', { 
        status: result.data.verified ? 'success' : 'failed', 
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      updateVerification('gst', { status: 'failed', error: result.error });
    }
  };
  
  const runBureauCheck = async () => {
    if (!lead.customer_pan) {
      updateVerification('bureau', { status: 'failed', error: 'PAN required for bureau check' });
      return;
    }
    
    updateVerification('bureau', { status: 'running' });
    const result = await checkBureau({
      panNumber: lead.customer_pan,
      name: lead.customer_name,
      dateOfBirth: lead.date_of_birth || '',
      mobile: lead.customer_phone,
    }, lead.id, applicationId);
    
    if (result.success && result.data) {
      updateVerification('bureau', { 
        status: 'success', 
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      updateVerification('bureau', { status: 'failed', error: result.error });
    }
  };
  
  const runAMLCheck = async () => {
    updateVerification('aml', { status: 'running' });
    const result = await checkAML({
      panNumber: lead.customer_pan || '',
      aadhaarNumber: lead.customer_aadhaar || '',
      name: lead.customer_name,
      mobile: lead.customer_phone,
    }, lead.id);
    
    if (result.success && result.data) {
      updateVerification('aml', { 
        status: result.data.isClean ? 'success' : 'failed', 
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      updateVerification('aml', { status: 'failed', error: result.error });
    }
  };
  
  const runDedupeCheck = async () => {
    updateVerification('dedupe', { status: 'running' });
    const result = await checkDedupe({
      panNumber: lead.customer_pan || undefined,
      aadhaarNumber: lead.customer_aadhaar || undefined,
      mobile: lead.customer_phone,
      email: lead.customer_email || undefined,
    }, lead.id);
    
    if (result.success && result.data) {
      updateVerification('dedupe', { 
        status: result.data.isDuplicate ? 'failed' : 'success', 
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      updateVerification('dedupe', { status: 'failed', error: result.error });
    }
  };
  
  const runAllVerifications = async () => {
    setIsRunningAll(true);
    await Promise.all([
      runPANVerification(),
      runAadhaarVerification(),
      runGSTVerification(),
      runBureauCheck(),
      runAMLCheck(),
      runDedupeCheck(),
    ]);
    setIsRunningAll(false);
  };
  
  const verificationConfigs = [
    {
      key: 'pan',
      name: 'PAN Verification',
      icon: CreditCard,
      run: runPANVerification,
      available: !!lead.customer_pan,
    },
    {
      key: 'aadhaar',
      name: 'Aadhaar Verification',
      icon: Fingerprint,
      run: runAadhaarVerification,
      available: !!lead.customer_aadhaar,
    },
    {
      key: 'gst',
      name: 'GST Verification',
      icon: Building2,
      run: runGSTVerification,
      available: !!lead.gst_number,
    },
    {
      key: 'bureau',
      name: 'Bureau Check',
      icon: Shield,
      run: runBureauCheck,
      available: !!lead.customer_pan,
    },
    {
      key: 'aml',
      name: 'AML/Fraud Check',
      icon: AlertTriangle,
      run: runAMLCheck,
      available: true,
    },
    {
      key: 'dedupe',
      name: 'Dedupe Check',
      icon: Search,
      run: runDedupeCheck,
      available: true,
    },
  ];
  
  const successCount = Object.values(verifications).filter(v => v.status === 'success').length;
  const failedCount = Object.values(verifications).filter(v => v.status === 'failed').length;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              API Verifications
            </CardTitle>
            <CardDescription>
              Mock third-party verification checks
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">{successCount} Passed</Badge>
            {failedCount > 0 && <Badge variant="destructive">{failedCount} Failed</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Run All Button */}
        <Button 
          className="w-full" 
          onClick={runAllVerifications}
          disabled={isRunningAll}
        >
          {isRunningAll ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Verifications...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run All Verifications
            </>
          )}
        </Button>
        
        {/* Individual Verifications */}
        <div className="space-y-2">
          {verificationConfigs.map((config) => {
            const verification = verifications[config.key];
            const Icon = config.icon;
            
            return (
              <div 
                key={config.key}
                className={cn(
                  "p-3 rounded-lg border flex items-center justify-between",
                  verification.status === 'success' && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
                  verification.status === 'failed' && "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
                  verification.status === 'running' && "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
                  verification.status === 'pending' && "bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "w-5 h-5",
                    verification.status === 'success' && "text-green-600",
                    verification.status === 'failed' && "text-red-600",
                    verification.status === 'running' && "text-blue-600 animate-pulse",
                    verification.status === 'pending' && "text-muted-foreground"
                  )} />
                  <div>
                    <p className="font-medium text-sm">{config.name}</p>
                    {verification.error && (
                      <p className="text-xs text-destructive">{verification.error}</p>
                    )}
                    {verification.status === 'success' && verification.data && (
                      <p className="text-xs text-green-600">Verified successfully</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {verification.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={config.run}
                      disabled={!config.available}
                    >
                      Run
                    </Button>
                  )}
                  {verification.status === 'running' && (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  )}
                  {verification.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {verification.status === 'failed' && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bureau Details (if available) */}
        {verifications.bureau.status === 'success' && verifications.bureau.data && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">Bureau Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(() => {
                const bureau = verifications.bureau.data as BureauCheckResponse;
                return (
                  <>
                    <div>Credit Score: <span className="font-semibold">{bureau.creditScore}</span></div>
                    <div>Score Range: <span className="font-semibold">{bureau.scoreRange}</span></div>
                    <div>Active Loans: <span className="font-semibold">{bureau.activeLoanCount}</span></div>
                    <div>Total Outstanding: <span className="font-semibold">₹{bureau.totalOutstanding.toLocaleString()}</span></div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
