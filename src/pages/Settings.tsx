import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, User, Shield, RotateCcw, Sparkles } from 'lucide-react';
import { ROLE_LABELS } from '@/types/database';

export function Settings() {
  const { profile, primaryRole, isManager } = useAuth();
  const { restartTour } = useOnboarding();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const { error } = await supabase.functions.invoke('seed-demo-data');
      if (error) throw error;
      toast({ title: 'Demo data created', description: 'Sample leads and applications have been added' });
    } catch (error) {
      toast({ title: 'Error seeding data', description: 'Please try again', variant: 'destructive' });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{profile?.full_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge>{primaryRole ? ROLE_LABELS[primaryRole] : 'No role'}</Badge></div>
        </CardContent>
      </Card>

      {/* Onboarding Tour */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" />Onboarding Tour</CardTitle>
          <CardDescription>Take a guided tour of the platform features</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={restartTour} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Restart Onboarding Tour
          </Button>
        </CardContent>
      </Card>

      {isManager() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" />Demo Data</CardTitle>
            <CardDescription>Seed database with sample data for demonstrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSeedData} disabled={isSeeding}>
              {isSeeding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Seed Demo Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
