import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QueuedAction {
  id: string;
  entityType: string;
  entityId?: string;
  action: string;
  payload: unknown;
  createdAt: string;
  retryCount: number;
}

const DB_NAME = 'nc-los-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-queue';

export function useOfflineSync() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Initialize IndexedDB
  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }, []);
  
  // Load queued actions from IndexedDB
  const loadQueuedActions = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.getAll();
      request.onsuccess = () => {
        setQueuedActions(request.result || []);
      };
    } catch (error) {
      console.error('Failed to load queued actions:', error);
    }
  }, [openDB]);
  
  // Add action to offline queue
  const queueAction = useCallback(async (
    entityType: string,
    action: string,
    payload: unknown,
    entityId?: string
  ) => {
    const queuedAction: QueuedAction = {
      id: crypto.randomUUID(),
      entityType,
      entityId,
      action,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add(queuedAction);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      setQueuedActions(prev => [...prev, queuedAction]);
      
      // If online, try to sync immediately
      if (isOnline) {
        syncQueue();
      }
      
      return queuedAction.id;
    } catch (error) {
      console.error('Failed to queue action:', error);
      throw error;
    }
  }, [openDB, isOnline]);
  
  // Remove action from queue
  const removeFromQueue = useCallback(async (id: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      setQueuedActions(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to remove from queue:', error);
    }
  }, [openDB]);
  
  // Sync all queued actions
  const syncQueue = useCallback(async () => {
    if (!isOnline || !user || isSyncing || queuedActions.length === 0) return;
    
    setIsSyncing(true);
    
    for (const action of queuedActions) {
      try {
        // Process based on entity type and action
        if (action.entityType === 'lead') {
          if (action.action === 'create') {
            const payload = action.payload as Record<string, string | number | boolean | null>;
            const { error } = await supabase
              .from('leads')
              .insert([payload as never]);
            
            if (!error) {
              await removeFromQueue(action.id);
              
              // Also sync to offline_queue table
              await supabase.from('offline_queue').insert([{
                user_id: user.id,
                entity_type: action.entityType,
                entity_id: action.entityId || null,
                action: action.action,
                payload: payload as Record<string, string | number | boolean | null>,
                synced: true,
                synced_at: new Date().toISOString(),
              }]);
            }
          }
        } else if (action.entityType === 'document') {
          // Handle document uploads
          // Documents are typically handled differently due to file storage
        }
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
        
        // Update retry count in IndexedDB
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const updatedAction = { ...action, retryCount: action.retryCount + 1 };
        store.put(updatedAction);
        
        setQueuedActions(prev => 
          prev.map(a => a.id === action.id ? updatedAction : a)
        );
      }
    }
    
    setIsSyncing(false);
  }, [isOnline, user, isSyncing, queuedActions, openDB, removeFromQueue]);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue]);
  
  // Load queued actions on mount
  useEffect(() => {
    loadQueuedActions();
  }, [loadQueuedActions]);
  
  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);
  
  return {
    isOnline,
    queuedActions,
    isSyncing,
    queueAction,
    syncQueue,
    pendingCount: queuedActions.length,
  };
}
