'use client';

import { useState, useCallback } from 'react';
import type { TargetingRule, AudienceSegment, MatchResult } from './types';

interface UseTargetingReturn {
  rules: TargetingRule[];
  addRule: (rule: TargetingRule) => void;
  removeRule: (id: string) => void;
  updateRule: (id: string, updates: Partial<TargetingRule>) => void;
  clearRules: () => void;
}

export function useTargetingRules(initialRules: TargetingRule[] = []): UseTargetingReturn {
  const [rules, setRules] = useState<TargetingRule[]>(initialRules);

  const addRule = useCallback((rule: TargetingRule) => {
    setRules((prev) => [...prev, rule]);
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRule = useCallback((id: string, updates: Partial<TargetingRule>) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const clearRules = useCallback(() => {
    setRules([]);
  }, []);

  return { rules, addRule, removeRule, updateRule, clearRules };
}

interface UseSegmentsReturn {
  segments: AudienceSegment[];
  activeSegment: AudienceSegment | null;
  setActiveSegment: (segment: AudienceSegment | null) => void;
  addSegment: (segment: AudienceSegment) => void;
  removeSegment: (id: string) => void;
}

export function useSegments(initialSegments: AudienceSegment[] = []): UseSegmentsReturn {
  const [segments, setSegments] = useState<AudienceSegment[]>(initialSegments);
  const [activeSegment, setActiveSegment] = useState<AudienceSegment | null>(null);

  const addSegment = useCallback((segment: AudienceSegment) => {
    setSegments((prev) => [...prev, segment]);
  }, []);

  const removeSegment = useCallback((id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
    setActiveSegment((prev) => (prev?.id === id ? null : prev));
  }, []);

  return { segments, activeSegment, setActiveSegment, addSegment, removeSegment };
}

interface UseMatchResultsReturn {
  results: MatchResult[];
  isCalculating: boolean;
  calculate: (segmentId: string, userIds: string[]) => void;
  clearResults: () => void;
}

export function useMatchResults(): UseMatchResultsReturn {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculate = useCallback((segmentId: string, userIds: string[]) => {
    setIsCalculating(true);
    const simulated: MatchResult[] = userIds.map((userId) => ({
      userId,
      segmentId,
      score: Math.floor(Math.random() * 100),
      tier: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
      matchedCriteria: ['age', 'location', 'interests'].filter(() => Math.random() > 0.3),
      timestamp: Date.now(),
    }));
    setResults(simulated);
    setIsCalculating(false);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return { results, isCalculating, calculate, clearResults };
}
