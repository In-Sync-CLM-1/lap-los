import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Bell,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import type { LeadTemperature, QualificationStatus } from '@/lib/lead-scoring';
import { getTemperatureEmoji, getQualificationLabel } from '@/lib/lead-scoring';

interface LeadNurturingPanelProps {
  leadId: string;
  leadScore?: number | null;
  temperature?: LeadTemperature | string | null;
  qualificationStatus?: QualificationStatus | string | null;
  nextFollowupAt?: string | null;
  onScheduleFollowup?: (date: Date, notes: string) => void;
  onMarkAction?: (action: string) => void;
}

interface NurturingAction {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const nurturingActions: NurturingAction[] = [
  {
    id: 'call',
    label: 'Follow-up Call',
    icon: Phone,
    description: 'Schedule a follow-up call with the customer',
  },
  {
    id: 'sms',
    label: 'Send SMS',
    icon: MessageSquare,
    description: 'Send a reminder or update via SMS',
  },
  {
    id: 'reminder',
    label: 'Set Reminder',
    icon: Bell,
    description: 'Set a reminder for yourself',
  },
];

export function LeadNurturingPanel({
  leadId,
  leadScore,
  temperature,
  qualificationStatus,
  nextFollowupAt,
  onScheduleFollowup,
  onMarkAction,
}: LeadNurturingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [followupNotes, setFollowupNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const temp = (temperature || 'warm') as LeadTemperature;
  const qualification = (qualificationStatus || 'raw') as QualificationStatus;
  
  const isFollowupOverdue = nextFollowupAt && isBefore(new Date(nextFollowupAt), new Date());
  const isFollowupToday = nextFollowupAt && 
    format(new Date(nextFollowupAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const quickFollowupOptions = [
    { label: 'Tomorrow', date: addDays(new Date(), 1) },
    { label: 'In 3 days', date: addDays(new Date(), 3) },
    { label: 'Next week', date: addDays(new Date(), 7) },
  ];

  const handleScheduleFollowup = (date: Date) => {
    if (onScheduleFollowup) {
      onScheduleFollowup(date, followupNotes);
      setFollowupNotes('');
      setSelectedDate(null);
    }
  };

  const getStatusMessage = () => {
    if (qualification === 'los_ready') {
      return { message: 'Lead is ready to convert to application!', color: 'text-success' };
    }
    if (qualification === 'qualified') {
      return { message: 'Collect remaining documents to proceed', color: 'text-primary' };
    }
    if (temp === 'hot') {
      return { message: 'High-priority lead - act quickly!', color: 'text-destructive' };
    }
    if (temp === 'cold') {
      return { message: 'Needs nurturing - follow up regularly', color: 'text-info' };
    }
    return { message: 'Continue building relationship', color: 'text-warning' };
  };

  const statusMessage = getStatusMessage();

  return (
    <Card>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Lead Nurturing
          </div>
          <div className="flex items-center gap-2">
            {leadScore !== null && leadScore !== undefined && (
              <Badge variant="outline" className="font-mono">
                Score: {leadScore}
              </Badge>
            )}
            <span className="text-lg">{getTemperatureEmoji(temp)}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Status Message */}
          <div className={cn('text-sm font-medium', statusMessage.color)}>
            {statusMessage.message}
          </div>

          {/* Next Follow-up */}
          {nextFollowupAt && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg',
              isFollowupOverdue ? 'bg-destructive/10' : isFollowupToday ? 'bg-warning/10' : 'bg-muted'
            )}>
              <Clock className={cn(
                'w-4 h-4',
                isFollowupOverdue ? 'text-destructive' : isFollowupToday ? 'text-warning' : 'text-muted-foreground'
              )} />
              <span className="text-sm">
                {isFollowupOverdue && <strong>Overdue! </strong>}
                Next follow-up: {format(new Date(nextFollowupAt), 'dd MMM yyyy, hh:mm a')}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
            <div className="grid grid-cols-3 gap-2">
              {nurturingActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-3 gap-1"
                    onClick={() => onMarkAction?.(action.id)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Schedule Follow-up */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Schedule Follow-up</p>
            <div className="flex flex-wrap gap-2">
              {quickFollowupOptions.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleScheduleFollowup(option.date)}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Add notes for the follow-up..."
              value={followupNotes}
              onChange={(e) => setFollowupNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Qualification Progress */}
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">Qualification Journey</p>
            <div className="flex items-center gap-1">
              {['raw', 'scored', 'qualified', 'los_ready'].map((status, index) => (
                <div key={status} className="flex items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                    ['raw', 'scored', 'qualified', 'los_ready'].indexOf(qualification) >= index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {['raw', 'scored', 'qualified', 'los_ready'].indexOf(qualification) > index ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div className={cn(
                      'w-6 h-0.5',
                      ['raw', 'scored', 'qualified', 'los_ready'].indexOf(qualification) > index
                        ? 'bg-primary'
                        : 'bg-muted'
                    )} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">Raw</span>
              <span className="text-xs text-muted-foreground">Scored</span>
              <span className="text-xs text-muted-foreground">Qualified</span>
              <span className="text-xs text-muted-foreground">LOS Ready</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
