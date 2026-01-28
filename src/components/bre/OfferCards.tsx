import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Gift, 
  Sparkles, 
  Check, 
  Calculator,
  Edit3,
  Send
} from 'lucide-react';
import type { LoanOffer } from '@/lib/bre-engine';
import { cn } from '@/lib/utils';

interface OfferCardsProps {
  offer1: LoanOffer | null;
  offer2: LoanOffer | null;
  onSelectOffer: (offer: LoanOffer) => void;
  onRequestCounterOffer?: (counterOffer: Partial<LoanOffer>) => void;
  selectedOfferId?: string;
  showCounterOffer?: boolean;
}

export function OfferCards({ 
  offer1, 
  offer2, 
  onSelectOffer, 
  onRequestCounterOffer,
  selectedOfferId,
  showCounterOffer = true
}: OfferCardsProps) {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterTenure, setCounterTenure] = useState('');
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const handleSubmitCounter = () => {
    if (onRequestCounterOffer && counterAmount) {
      onRequestCounterOffer({
        amount: parseFloat(counterAmount),
        tenureMonths: counterTenure ? parseInt(counterTenure) : undefined,
      });
      setShowCounterForm(false);
    }
  };
  
  if (!offer1 && !offer2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Loan Offers
          </CardTitle>
          <CardDescription>
            Complete BRE processing to generate offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Offers will be generated after eligibility assessment</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Gift className="w-5 h-5" />
        Available Offers
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Offer 1 - Standard */}
        {offer1 && (
          <Card className={cn(
            "relative overflow-hidden transition-all",
            selectedOfferId === 'offer1' && "ring-2 ring-primary"
          )}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{offer1.name}</CardTitle>
                <Badge variant="secondary">FOIR Based</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-2">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(offer1.amount)}
                </p>
                <p className="text-sm text-muted-foreground">Loan Amount</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold">{offer1.interestRate}% p.a.</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Tenure</p>
                  <p className="font-semibold">{offer1.tenureMonths} months</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">EMI</p>
                  <p className="font-semibold">{formatCurrency(offer1.emi)}</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Processing Fee</p>
                  <p className="font-semibold">{formatCurrency(offer1.processingFee)}</p>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                variant={selectedOfferId === 'offer1' ? 'default' : 'outline'}
                onClick={() => onSelectOffer(offer1)}
              >
                {selectedOfferId === 'offer1' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Selected
                  </>
                ) : (
                  'Select This Offer'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Offer 2 - Enhanced */}
        {offer2 && (
          <Card className={cn(
            "relative overflow-hidden transition-all",
            selectedOfferId === 'offer2' && "ring-2 ring-primary"
          )}>
            <div className="absolute top-0 right-0">
              <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-amber-500 to-orange-500">
                <Sparkles className="w-3 h-3 mr-1" />
                Enhanced
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{offer2.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-2">
                <p className="text-3xl font-bold text-amber-600">
                  {formatCurrency(offer2.amount)}
                </p>
                <p className="text-sm text-muted-foreground">Loan Amount (+30%)</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold">{offer2.interestRate}% p.a.</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Tenure</p>
                  <p className="font-semibold">{offer2.tenureMonths} months</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">EMI</p>
                  <p className="font-semibold">{formatCurrency(offer2.emi)}</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Processing Fee</p>
                  <p className="font-semibold">{formatCurrency(offer2.processingFee)}</p>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                variant={selectedOfferId === 'offer2' ? 'default' : 'outline'}
                onClick={() => onSelectOffer(offer2)}
              >
                {selectedOfferId === 'offer2' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Selected
                  </>
                ) : (
                  'Select This Offer'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Counter Offer Section */}
      {showCounterOffer && onRequestCounterOffer && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Request Counter Offer
            </CardTitle>
            <CardDescription>
              Request a custom offer (requires HO approval)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showCounterForm ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowCounterForm(true)}
              >
                Request Different Amount
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="counterAmount">Requested Amount (₹)</Label>
                    <Input
                      id="counterAmount"
                      type="number"
                      placeholder="e.g., 750000"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="counterTenure">Tenure (months)</Label>
                    <Input
                      id="counterTenure"
                      type="number"
                      placeholder="e.g., 48"
                      value={counterTenure}
                      onChange={(e) => setCounterTenure(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowCounterForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSubmitCounter}
                    disabled={!counterAmount}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
