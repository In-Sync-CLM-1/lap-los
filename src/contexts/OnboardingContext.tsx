import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getStepsForRole, TourStep } from '@/lib/tour-steps';
import type { AppRole } from '@/types/database';

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentStepIndex: number;
  steps: TourStep[];
  currentStep: TourStep | null;
  showWelcomeModal: boolean;
  showCompletionModal: boolean;
  startTour: () => void;
  skipTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  restartTour: () => void;
  closeWelcomeModal: () => void;
  closeCompletionModal: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = 'los-onboarding-completed';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { profile, roles, user } = useAuth();
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  const steps = getStepsForRole(roles as AppRole[]);
  const currentStep = isOnboardingActive && steps[currentStepIndex] ? steps[currentStepIndex] : null;

  // Check if user needs onboarding
  useEffect(() => {
    if (!user || !profile || hasCheckedOnboarding) return;

    const localCompleted = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}-${user.id}`);
    
    // Check both local storage and database
    if (!localCompleted && !profile.onboarding_completed) {
      // Show welcome modal for new users after a brief delay
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    setHasCheckedOnboarding(true);
  }, [user, profile, hasCheckedOnboarding]);

  const markOnboardingComplete = useCallback(async () => {
    if (!user) return;
    
    // Update local storage
    localStorage.setItem(`${ONBOARDING_STORAGE_KEY}-${user.id}`, 'true');
    
    // Update database
    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  }, [user]);

  const startTour = useCallback(() => {
    setShowWelcomeModal(false);
    setCurrentStepIndex(0);
    setIsOnboardingActive(true);
    setHasCheckedOnboarding(true);
  }, []);

  const skipTour = useCallback(() => {
    setShowWelcomeModal(false);
    setIsOnboardingActive(false);
    setHasCheckedOnboarding(true);
    markOnboardingComplete();
  }, [markOnboardingComplete]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Tour completed
      setIsOnboardingActive(false);
      setShowCompletionModal(true);
      markOnboardingComplete();
    }
  }, [currentStepIndex, steps.length, markOnboardingComplete]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const endTour = useCallback(() => {
    setIsOnboardingActive(false);
    setCurrentStepIndex(0);
    markOnboardingComplete();
  }, [markOnboardingComplete]);

  const restartTour = useCallback(() => {
    setShowCompletionModal(false);
    setCurrentStepIndex(0);
    setShowWelcomeModal(true);
  }, []);

  const closeWelcomeModal = useCallback(() => {
    setShowWelcomeModal(false);
  }, []);

  const closeCompletionModal = useCallback(() => {
    setShowCompletionModal(false);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingActive,
        currentStepIndex,
        steps,
        currentStep,
        showWelcomeModal,
        showCompletionModal,
        startTour,
        skipTour,
        nextStep,
        prevStep,
        endTour,
        restartTour,
        closeWelcomeModal,
        closeCompletionModal,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
