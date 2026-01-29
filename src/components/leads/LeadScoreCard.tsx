import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  calculateLeadScore,
  getTemperatureColor,
  getTemperatureEmoji,
  getQualificationLabel,
  type LeadTemperature,
  type QualificationStatus,
} from '@/lib/lead-scoring';

interface LeadScoreCardProps {
  lead: {
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
    residence_status?: string | null;
    lead_score?: number | null;
    lead_temperature?: string | null;
    qualification_status?: string | null;
  };
  documentCounts?: { uploadedCount: number; requiredCount: number };
  compact?: boolean;
}

function getTemperatureBadgeClass(temperature: LeadTemperature): string {
  switch (temperature) {
    case 'hot':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'warm':
      return 'bg-warning/15 text-warning border-warning/30';
    case 'cold':
      return 'bg-info/15 text-info border-info/30';
  }
}

function getQualificationBadgeClass(status: QualificationStatus): string {
  switch (status) {
    case 'los_ready':
      return 'bg-success/15 text-success border-success/30';
    case 'qualified':
      return 'bg-primary/15 text-primary border-primary/30';
    case 'scored':
      return 'bg-warning/15 text-warning border-warning/30';
    case 'raw':
      return 'bg-muted text-muted-foreground border-muted-foreground/30';
  }
}

export function LeadScoreCard({ lead, documentCounts, compact = false }: LeadScoreCardProps) {
  const scoreResult = useMemo(() => {
    return calculateLeadScore(lead, documentCounts);
  }, [lead, documentCounts]);

  const { totalScore, temperature, qualificationStatus, factors, recommendations } = scoreResult;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold">{totalScore}</span>
          <span className={cn('text-sm', getTemperatureColor(temperature))}>
            {getTemperatureEmoji(temperature)}
          </span>
        </div>
        <Badge variant="outline" className={cn('text-xs', getTemperatureBadgeClass(temperature))}>
          {temperature.toUpperCase()}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Lead Score
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('border', getTemperatureBadgeClass(temperature))}>
              {getTemperatureEmoji(temperature)} {temperature.toUpperCase()}
            </Badge>
            <Badge variant="outline" className={cn('border', getQualificationBadgeClass(qualificationStatus))}>
              {getQualificationLabel(qualificationStatus)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{totalScore}</span>
            <span className="text-muted-foreground">/ 100</span>
          </div>
          <Progress value={totalScore} className="h-3" />
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown</h4>
          <div className="space-y-1">
            {factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between text-sm py-1">
                <div className="flex items-center gap-2">
                  {factor.achieved ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : factor.points > 0 ? (
                    <AlertCircle className="w-4 h-4 text-warning" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span>{factor.factor}</span>
                  <span className="text-xs text-muted-foreground">({factor.description})</span>
                </div>
                <span className={cn(
                  'font-medium',
                  factor.achieved ? 'text-success' : factor.points > 0 ? 'text-warning' : 'text-muted-foreground'
                )}>
                  +{factor.points}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple inline score badge for list views
export function LeadScoreBadge({ score, temperature }: { score?: number | null; temperature?: string | null }) {
  if (score === null || score === undefined) {
    return null;
  }

  const temp = (temperature || 'warm') as LeadTemperature;
  
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold">{score}</span>
      <span className={cn('text-xs', getTemperatureColor(temp))}>
        {getTemperatureEmoji(temp)}
      </span>
    </div>
  );
}
