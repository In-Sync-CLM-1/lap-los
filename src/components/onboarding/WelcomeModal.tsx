import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { ROLE_DESCRIPTIONS } from '@/lib/tour-steps';
import { ROLE_LABELS } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Sparkles } from 'lucide-react';

export function WelcomeModal() {
  const { profile, primaryRole } = useAuth();
  const { showWelcomeModal, startTour, skipTour } = useOnboarding();

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const roleDescription = primaryRole ? ROLE_DESCRIPTIONS[primaryRole] : '';
  const roleLabel = primaryRole ? ROLE_LABELS[primaryRole] : '';

  return (
    <Dialog open={showWelcomeModal} onOpenChange={(open) => !open && skipTour()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">
            Welcome to Niyara Capital, {firstName}!
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            You're logged in as{' '}
            <Badge variant="secondary" className="ml-1 font-medium">
              {roleLabel}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {roleDescription}
          </p>
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" />
              Quick Tour
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Take a 2-minute guided tour to learn the essentials and get started quickly.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={skipTour} className="w-full sm:w-auto">
            Skip for now
          </Button>
          <Button onClick={startTour} className="w-full sm:w-auto gap-2">
            <Rocket className="w-4 h-4" />
            Start Tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
