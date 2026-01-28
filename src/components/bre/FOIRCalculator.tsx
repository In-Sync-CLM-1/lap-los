import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { calculateFOIR, type FOIRInput, type FOIRResult } from '@/lib/bre-engine';
import { cn } from '@/lib/utils';

interface FOIRCalculatorProps {
  onCalculate: (result: FOIRResult, input: FOIRInput) => void;
  initialValues?: Partial<FOIRInput>;
}

export function FOIRCalculator({ onCalculate, initialValues }: FOIRCalculatorProps) {
  const [input, setInput] = useState<FOIRInput>({
    monthlyTurnover: initialValues?.monthlyTurnover || 0,
    grossMarginPercent: initialValues?.grossMarginPercent || 25,
    monthlyExpenses: initialValues?.monthlyExpenses || 0,
    existingObligations: initialValues?.existingObligations || 0,
  });
  
  const [result, setResult] = useState<FOIRResult | null>(null);
  
  useEffect(() => {
    if (input.monthlyTurnover > 0) {
      const foirResult = calculateFOIR(input);
      setResult(foirResult);
      onCalculate(foirResult, input);
    }
  }, [input, onCalculate]);
  
  const handleChange = (field: keyof FOIRInput, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInput(prev => ({ ...prev, [field]: numValue }));
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const foirPercentage = result ? Math.min(result.foir * 100, 100) : 0;
  const foirStatus = result ? (
    result.foir <= 0.3 ? 'excellent' :
    result.foir <= 0.4 ? 'good' :
    result.foir <= 0.5 ? 'moderate' : 'high'
  ) : 'unknown';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          FOIR Calculator
        </CardTitle>
        <CardDescription>
          Fixed Obligation to Income Ratio Analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyTurnover">Monthly Turnover (₹)</Label>
            <Input
              id="monthlyTurnover"
              type="number"
              placeholder="e.g., 500000"
              value={input.monthlyTurnover || ''}
              onChange={(e) => handleChange('monthlyTurnover', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="grossMarginPercent">Gross Margin (%)</Label>
            <Input
              id="grossMarginPercent"
              type="number"
              placeholder="e.g., 25"
              min="0"
              max="100"
              value={input.grossMarginPercent || ''}
              onChange={(e) => handleChange('grossMarginPercent', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="monthlyExpenses">Monthly Business Expenses (₹)</Label>
            <Input
              id="monthlyExpenses"
              type="number"
              placeholder="e.g., 50000"
              value={input.monthlyExpenses || ''}
              onChange={(e) => handleChange('monthlyExpenses', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="existingObligations">Existing EMI Obligations (₹)</Label>
            <Input
              id="existingObligations"
              type="number"
              placeholder="e.g., 20000"
              value={input.existingObligations || ''}
              onChange={(e) => handleChange('existingObligations', e.target.value)}
            />
          </div>
        </div>
        
        {/* Results */}
        {result && input.monthlyTurnover > 0 && (
          <div className="space-y-4 pt-4 border-t">
            {/* FOIR Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">FOIR</span>
                <Badge variant={
                  foirStatus === 'excellent' ? 'default' :
                  foirStatus === 'good' ? 'default' :
                  foirStatus === 'moderate' ? 'secondary' : 'destructive'
                }>
                  {(result.foir * 100).toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                value={foirPercentage} 
                className={cn(
                  "h-3",
                  foirStatus === 'excellent' && "[&>div]:bg-green-500",
                  foirStatus === 'good' && "[&>div]:bg-emerald-500",
                  foirStatus === 'moderate' && "[&>div]:bg-amber-500",
                  foirStatus === 'high' && "[&>div]:bg-destructive"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Max allowed: 50% | Current obligations vs net income
              </p>
            </div>
            
            {/* Computed Values */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  Net Monthly Income
                </div>
                <p className="text-lg font-semibold mt-1">
                  {formatCurrency(result.netMonthlyIncome)}
                </p>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown className="w-4 h-4" />
                  Available for EMI
                </div>
                <p className="text-lg font-semibold mt-1">
                  {formatCurrency(result.availableForEMI)}
                </p>
              </div>
            </div>
            
            {/* Max Eligible EMI */}
            <div className={cn(
              "p-4 rounded-lg border-2",
              result.isEligible ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Maximum Eligible EMI</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(result.maxEligibleEMI)}
                  </p>
                </div>
                {result.isEligible ? (
                  <Badge className="bg-primary">Eligible</Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Not Eligible
                  </Badge>
                )}
              </div>
              {!result.isEligible && (
                <p className="text-sm text-destructive mt-2">
                  Minimum EMI capacity of ₹5,000 or gross margin of 15% required
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
