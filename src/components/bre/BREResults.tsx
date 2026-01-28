import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Shield,
  FileCheck
} from 'lucide-react';
import type { BREResult } from '@/lib/bre-engine';
import { cn } from '@/lib/utils';

interface BREResultsProps {
  result: BREResult | null;
  isProcessing?: boolean;
}

export function BREResults({ result, isProcessing }: BREResultsProps) {
  if (isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 animate-pulse" />
            Processing BRE...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={66} className="animate-pulse" />
            <p className="text-sm text-muted-foreground">
              Running eligibility checks and scoring...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            BRE Decision
          </CardTitle>
          <CardDescription>
            Complete FOIR calculation to generate BRE decision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Awaiting financial data input</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const decisionConfig = {
    stp_approved: {
      icon: CheckCircle2,
      label: 'STP Approved',
      description: 'Straight Through Processing - Auto Approved',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    non_stp: {
      icon: Clock,
      label: 'Non-STP',
      description: 'Requires Manual Underwriting Review',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    deviation: {
      icon: AlertTriangle,
      label: 'Deviation Required',
      description: 'Requires Higher Authority Approval',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    rejected: {
      icon: XCircle,
      label: 'Rejected',
      description: 'Does Not Meet Minimum Eligibility Criteria',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30',
    },
  };
  
  const config = decisionConfig[result.decision];
  const DecisionIcon = config.icon;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          BRE Decision
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Decision Banner */}
        <div className={cn(
          "p-4 rounded-lg border-2",
          config.bgColor,
          config.borderColor
        )}>
          <div className="flex items-center gap-3">
            <DecisionIcon className={cn("w-8 h-8", config.color)} />
            <div>
              <h3 className={cn("text-lg font-bold", config.color)}>
                {config.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
        </div>
        
        {/* Score Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">BRE Score</span>
            <span className="text-2xl font-bold">{result.score}/100</span>
          </div>
          <Progress 
            value={result.score} 
            className={cn(
              "h-3",
              result.score >= 80 && "[&>div]:bg-green-500",
              result.score >= 60 && result.score < 80 && "[&>div]:bg-amber-500",
              result.score >= 40 && result.score < 60 && "[&>div]:bg-orange-500",
              result.score < 40 && "[&>div]:bg-destructive"
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0-40: Reject</span>
            <span>40-60: Deviation</span>
            <span>60-80: Non-STP</span>
            <span>80+: STP</span>
          </div>
        </div>
        
        {/* Risk Category */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Risk Category</span>
          <Badge variant={
            result.riskCategory === 'low' ? 'default' :
            result.riskCategory === 'medium' ? 'secondary' : 'destructive'
          }>
            {result.riskCategory.toUpperCase()} RISK
          </Badge>
        </div>
        
        {/* Max Eligible */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">Max Eligible Amount</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(result.maxEligibleAmount)}
            </p>
          </div>
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">Max Eligible EMI</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(result.maxEligibleEMI)}
            </p>
          </div>
        </div>
        
        {/* Scoring Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Scoring Breakdown</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {result.reasons.map((reason, index) => (
              <div 
                key={index}
                className={cn(
                  "text-sm px-2 py-1 rounded",
                  reason.startsWith('✓') && "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300",
                  reason.startsWith('⚠') && "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
                  reason.startsWith('✗') && "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                )}
              >
                {reason}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
