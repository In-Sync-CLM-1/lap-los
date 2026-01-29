import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  FileText,
  Send,
  UserCheck,
  Banknote
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type WorkflowHistory = Tables<'workflow_history'>;

interface WorkflowTimelineProps {
  applicationId: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  create: FileText,
  submit: Send,
  approve: CheckCircle2,
  reject: XCircle,
  deviation: AlertTriangle,
  assign: UserCheck,
  disburse: Banknote,
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-info/15 text-info',
  bre_processing: 'bg-warning/15 text-warning',
  underwriting: 'bg-primary/15 text-primary',
  pending_approval: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  deviation: 'bg-warning/15 text-warning',
  disbursed: 'bg-success/15 text-success',
  closed: 'bg-muted text-muted-foreground',
};

export function WorkflowTimeline({ applicationId }: WorkflowTimelineProps) {
  const [history, setHistory] = useState<WorkflowHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  
  useEffect(() => {
    fetchHistory();
  }, [applicationId]);
  
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_history')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setHistory(data || []);
      
      // Fetch profile names for performers
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(h => h.performed_by))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        if (profilesData) {
          const profileMap: Record<string, string> = {};
          profilesData.forEach(p => {
            profileMap[p.user_id] = p.full_name;
          });
          setProfiles(profileMap);
        }
      }
    } catch (error) {
      console.error('Error fetching workflow history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatStatus = (status: string | null) => {
    if (!status) return '';
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No workflow history yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Workflow History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-6">
            {history.map((item, index) => {
              const Icon = ACTION_ICONS[item.action] || Clock;
              const isLast = index === history.length - 1;
              
              return (
                <div key={item.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 border-background ${
                    item.action === 'approve' ? 'bg-success/15 text-success' :
                    item.action === 'reject' ? 'bg-destructive/15 text-destructive' :
                    item.action === 'deviation' ? 'bg-warning/15 text-warning' :
                    'bg-primary/15 text-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm capitalize">{item.action}</span>
                      {item.from_status && item.to_status && (
                        <div className="flex items-center gap-1 text-xs">
                          <Badge variant="outline" className={STATUS_COLORS[item.from_status] || ''}>
                            {formatStatus(item.from_status)}
                          </Badge>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <Badge variant="outline" className={STATUS_COLORS[item.to_status] || ''}>
                            {formatStatus(item.to_status)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-1">
                      by {profiles[item.performed_by] || 'Unknown'} • {' '}
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                    
                    {item.notes && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                        {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
