import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

export function PWAInstallBanner() {
  const { isInstalled, isInstallable, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  
  useEffect(() => {
    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedAt = dismissed ? new Date(dismissed).getTime() : 0;
    const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    
    // Show banner if installable and not recently dismissed (within 7 days)
    if (isInstallable && !isInstalled && daysSinceDismissed > 7) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);
  
  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setShowBanner(false);
    }
  };
  
  const handleDismiss = () => {
    setIsDismissed(true);
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };
  
  if (!showBanner || isDismissed || isInstalled) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up sm:left-auto sm:right-4 sm:max-w-sm">
      <Card className="shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Install Loan-Sync LOS</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add to home screen for faster access and offline support
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="gap-1.5 flex-1"
                  onClick={handleInstall}
                >
                  <Download className="w-4 h-4" />
                  Install App
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
