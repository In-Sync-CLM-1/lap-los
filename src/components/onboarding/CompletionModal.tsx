import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RotateCcw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CompletionModal() {
  const { showCompletionModal, closeCompletionModal, restartTour } = useOnboarding();
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    closeCompletionModal();
    navigate('/settings');
  };

  return (
    <Dialog open={showCompletionModal} onOpenChange={(open) => !open && closeCompletionModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <DialogTitle className="text-2xl">
            You're All Set!
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            You've completed the onboarding tour. You're ready to start working.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              Need a refresher?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can restart this tour anytime from the Settings page.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={restartTour} className="w-full sm:w-auto gap-2">
            <RotateCcw className="w-4 h-4" />
            Restart Tour
          </Button>
          <Button onClick={closeCompletionModal} className="w-full sm:w-auto">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
