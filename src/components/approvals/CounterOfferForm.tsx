import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Loader2, Calculator, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CounterOfferFormProps {
  applicationId: string;
  currentAmount: number;
  currentTenure: number;
  currentRate: number;
  onSuccess?: () => void;
}

export function CounterOfferForm({
  applicationId,
  currentAmount,
  currentTenure,
  currentRate,
  onSuccess,
}: CounterOfferFormProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [counterAmount, setCounterAmount] = useState(currentAmount);
  const [counterTenure, setCounterTenure] = useState(currentTenure);
  const [counterRate, setCounterRate] = useState(currentRate);
  const [notes, setNotes] = useState('');
  
  // Calculate EMI
  const calculateEMI = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) return principal / months;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  };
  
  const counterEMI = calculateEMI(counterAmount, counterRate, counterTenure);
  
  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Update application with counter offer
      const { error } = await supabase
        .from('applications')
        .update({
          counter_offer_amount: counterAmount,
          counter_offer_tenure_months: counterTenure,
          counter_offer_interest_rate: counterRate,
          counter_offer_emi: counterEMI,
          counter_offer_approved_by: user.id,
          status: 'pending_approval',
          has_deviation: true,
          deviation_type: 'Counter Offer',
          deviation_reason: notes || 'Manager counter offer provided',
        })
        .eq('id', applicationId);
      
      if (error) throw error;
      
      // Log workflow history
      await supabase.from('workflow_history').insert([{
        application_id: applicationId,
        action: 'counter_offer',
        from_status: 'deviation',
        to_status: 'pending_approval',
        performed_by: user.id,
        notes: `Counter offer: ₹${(counterAmount / 100000).toFixed(2)}L @ ${counterRate}% for ${counterTenure}M. ${notes}`,
      }]);
      
      toast.success('Counter offer submitted');
      setIsOpen(false);
      onSuccess?.();
      
    } catch (error) {
      console.error('Error submitting counter offer:', error);
      toast.error('Failed to submit counter offer');
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calculator className="w-4 h-4" />
          Counter Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Counter Offer</DialogTitle>
          <DialogDescription>
            Provide an alternative offer for this application
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current Offer Summary */}
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Current Requested</p>
              <p className="font-semibold">
                {formatCurrency(currentAmount)} @ {currentRate}% for {currentTenure}M
              </p>
            </CardContent>
          </Card>
          
          {/* Counter Offer Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="counter-amount">Counter Amount (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="counter-amount"
                  type="number"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(Number(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="counter-tenure">Tenure (Months)</Label>
                <Input
                  id="counter-tenure"
                  type="number"
                  value={counterTenure}
                  onChange={(e) => setCounterTenure(Number(e.target.value))}
                  min={6}
                  max={60}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="counter-rate">Interest Rate (%)</Label>
                <Input
                  id="counter-rate"
                  type="number"
                  step="0.1"
                  value={counterRate}
                  onChange={(e) => setCounterRate(Number(e.target.value))}
                  min={10}
                  max={36}
                />
              </div>
            </div>
            
            {/* EMI Preview */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Counter Offer EMI</span>
                  <span className="font-bold text-lg text-primary">{formatCurrency(counterEMI)}</span>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-2">
              <Label htmlFor="counter-notes">Justification Notes</Label>
              <Textarea
                id="counter-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for counter offer..."
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Counter Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
