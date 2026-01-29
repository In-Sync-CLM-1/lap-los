import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, Share2, QrCode, ExternalLink } from 'lucide-react';
import { generateReferralUrl } from '@/lib/referral-utils';

interface ReferralQRCardProps {
  referralCode: string | null;
  userName?: string;
}

export function ReferralQRCard({ referralCode, userName }: ReferralQRCardProps) {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  if (!referralCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            My Referral Link
          </CardTitle>
          <CardDescription>Loading your referral code...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const referralUrl = generateReferralUrl(referralCode);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({ title: 'Link copied!', description: 'Referral link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const link = document.createElement('a');
      link.download = `niyara-referral-${referralCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Apply for a loan with Niyara Capital! Use my referral link: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleOpenLink = () => {
    window.open(referralUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          My Referral Link
        </CardTitle>
        <CardDescription>
          Share this link with potential customers to submit loan applications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral URL Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Share this link with potential customers:
          </label>
          <div className="flex gap-2">
            <Input
              value={referralUrl}
              readOnly
              className="font-mono text-sm bg-muted"
            />
            <Button
              variant={copied ? 'secondary' : 'outline'}
              size="icon"
              onClick={handleCopyLink}
              title="Copy link"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenLink}
              title="Open link"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* QR Code and Actions */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* QR Code */}
          <div 
            ref={qrRef}
            className="p-4 bg-white rounded-lg border shadow-sm"
          >
            <QRCodeSVG
              value={referralUrl}
              size={160}
              level="H"
              includeMargin
              imageSettings={{
                src: "/favicon.ico",
                height: 24,
                width: 24,
                excavate: true,
              }}
            />
          </div>

          {/* Info and Actions */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <p className="text-sm text-muted-foreground">Scan to Apply</p>
              <p className="text-lg font-semibold mt-1">
                Referral Code: <span className="text-primary">{referralCode}</span>
              </p>
              {userName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Referred by: {userName}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadQR}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download QR
              </Button>
              <Button
                variant="outline"
                onClick={handleShareWhatsApp}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share via WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <p className="font-medium mb-2">How it works:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Share your referral link or QR code with potential customers</li>
            <li>They fill out the loan application form</li>
            <li>The lead is automatically assigned to you</li>
            <li>You can track all referral leads in your leads dashboard</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
