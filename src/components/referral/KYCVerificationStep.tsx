import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { verifyPAN, verifyAadhaar } from '@/lib/mock-apis';
import { validatePAN, validateAadhaar, formatAadhaar } from '@/lib/referral-utils';

interface KYCData {
  customer_pan: string;
  customer_aadhaar: string;
  customer_name: string;
}

interface VerificationStatus {
  verified: boolean;
  message?: string;
  nameMatch?: boolean;
}

interface KYCVerificationStepProps {
  data: KYCData;
  onChange: (field: string, value: string) => void;
  onPanVerified: (verified: boolean, data?: { name?: string }) => void;
  onAadhaarVerified: (verified: boolean, data?: { name?: string; address?: string }) => void;
}

export function KYCVerificationStep({
  data,
  onChange,
  onPanVerified,
  onAadhaarVerified,
}: KYCVerificationStepProps) {
  const [panStatus, setPanStatus] = useState<VerificationStatus | null>(null);
  const [aadhaarStatus, setAadhaarStatus] = useState<VerificationStatus | null>(null);
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false);

  const handleVerifyPAN = async () => {
    if (!validatePAN(data.customer_pan)) {
      setPanStatus({ verified: false, message: 'Invalid PAN format' });
      return;
    }

    setVerifyingPan(true);
    try {
      const result = await verifyPAN({
        panNumber: data.customer_pan.toUpperCase(),
        name: data.customer_name,
      });

      if (result.success && result.data?.verified) {
        setPanStatus({
          verified: true,
          message: 'PAN verified successfully',
          nameMatch: result.data.nameMatch,
        });
        onPanVerified(true, { name: result.data.registeredName });
      } else {
        setPanStatus({
          verified: false,
          message: result.error || 'PAN verification failed',
        });
        onPanVerified(false);
      }
    } catch {
      setPanStatus({ verified: false, message: 'Verification error' });
      onPanVerified(false);
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleVerifyAadhaar = async () => {
    const cleanAadhaar = data.customer_aadhaar.replace(/\s/g, '');
    if (!validateAadhaar(cleanAadhaar)) {
      setAadhaarStatus({ verified: false, message: 'Invalid Aadhaar format' });
      return;
    }

    setVerifyingAadhaar(true);
    try {
      const result = await verifyAadhaar({
        aadhaarNumber: cleanAadhaar,
        name: data.customer_name,
      });

      if (result.success && result.data?.verified) {
        setAadhaarStatus({
          verified: true,
          message: 'Aadhaar verified successfully',
          nameMatch: result.data.nameMatch,
        });
        onAadhaarVerified(true, {
          name: data.customer_name,
          address: result.data.address,
        });
      } else {
        setAadhaarStatus({
          verified: false,
          message: result.error || 'Aadhaar verification failed',
        });
        onAadhaarVerified(false);
      }
    } catch {
      setAadhaarStatus({ verified: false, message: 'Verification error' });
      onAadhaarVerified(false);
    } finally {
      setVerifyingAadhaar(false);
    }
  };

  const renderVerificationBadge = (status: VerificationStatus | null) => {
    if (!status) return null;

    if (status.verified) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
          <CheckCircle className="w-3 h-3" />
          Verified
          {status.nameMatch === false && (
            <span className="text-yellow-600 ml-1">(Name mismatch)</span>
          )}
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        {status.message || 'Failed'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Verify Your Identity</h3>
        <p className="text-muted-foreground text-sm">
          Complete KYC verification to proceed with your application
        </p>
      </div>

      {/* PAN Verification */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="pan">PAN Number *</Label>
          {renderVerificationBadge(panStatus)}
        </div>
        <div className="flex gap-2">
          <Input
            id="pan"
            value={data.customer_pan}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().slice(0, 10);
              onChange('customer_pan', value);
              setPanStatus(null);
            }}
            placeholder="ABCDE1234F"
            className="uppercase"
            maxLength={10}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleVerifyPAN}
            disabled={verifyingPan || !data.customer_pan || data.customer_pan.length !== 10}
          >
            {verifyingPan ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Verify'
            )}
          </Button>
        </div>
        {!validatePAN(data.customer_pan) && data.customer_pan.length === 10 && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Invalid PAN format (e.g., ABCDE1234F)
          </p>
        )}
      </div>

      {/* Aadhaar Verification */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="aadhaar">Aadhaar Number *</Label>
          {renderVerificationBadge(aadhaarStatus)}
        </div>
        <div className="flex gap-2">
          <Input
            id="aadhaar"
            value={data.customer_aadhaar}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 12);
              onChange('customer_aadhaar', formatAadhaar(value));
              setAadhaarStatus(null);
            }}
            placeholder="1234 5678 9012"
            maxLength={14}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleVerifyAadhaar}
            disabled={verifyingAadhaar || data.customer_aadhaar.replace(/\s/g, '').length !== 12}
          >
            {verifyingAadhaar ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Verify'
            )}
          </Button>
        </div>
        {data.customer_aadhaar.replace(/\s/g, '').length === 12 && 
         !validateAadhaar(data.customer_aadhaar) && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Invalid Aadhaar format
          </p>
        )}
      </div>

      {/* Verification Note */}
      <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Both PAN and Aadhaar verification are required to proceed
        </p>
      </div>
    </div>
  );
}
