import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

export function NetworkStatus() {
  const { isOnline, pendingCount, isSyncing, syncQueue } = useOfflineSync();
  
  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <Badge 
        variant={isOnline ? 'default' : 'destructive'}
        className={cn(
          "flex items-center gap-1 text-xs",
          isOnline ? "bg-green-600" : "bg-red-600"
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            Offline
          </>
        )}
      </Badge>
      
      {/* Pending Sync */}
      {pendingCount > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <CloudOff className="w-3 h-3" />
          {pendingCount} pending
        </Badge>
      )}
      
      {/* Sync Button */}
      {isOnline && pendingCount > 0 && (
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-6 px-2"
          onClick={() => syncQueue()}
          disabled={isSyncing}
        >
          <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
        </Button>
      )}
      
      {/* Synced indicator */}
      {isOnline && pendingCount === 0 && (
        <Badge variant="outline" className="flex items-center gap-1 text-xs text-green-600 border-green-200">
          <Cloud className="w-3 h-3" />
          Synced
        </Badge>
      )}
    </div>
  );
}
