'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { FeatureSection } from './features-v2';

const FeatureSectionsContext = createContext<FeatureSection[] | null>(null);

export function FeatureSectionsProvider({
  value,
  children,
}: {
  value: FeatureSection[];
  children: ReactNode;
}) {
  return (
    <FeatureSectionsContext.Provider value={value}>
      {children}
    </FeatureSectionsContext.Provider>
  );
}

export function useFeatureSections(): FeatureSection[] {
  const ctx = useContext(FeatureSectionsContext);
  if (!ctx) {
    throw new Error('useFeatureSections must be used inside <FeatureSectionsProvider>');
  }
  return ctx;
}
