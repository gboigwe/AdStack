'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCase,
  getCaseMetadata,
  isSlaBreached,
  getArbitrator,
  getArbitratorPerformance,
  isArbitratorAvailable,
  getEvidence,
  getCaseEvidenceIndex,
  getJudgmentByCase,
  canAppealJudgment,
  getAppeal,
} from './contract-calls';
import type {
  DisputeCase,
  CaseMetadata,
  Arbitrator,
  ArbitratorPerformance,
  EvidenceItem,
  Judgment,
  Appeal,
} from './types';

interface UseDisputeCaseResult {
  disputeCase: DisputeCase | null;
  metadata: CaseMetadata | null;
  slaBreached: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDisputeCase(caseId: number | null): UseDisputeCaseResult {
  const [disputeCase, setDisputeCase] = useState<DisputeCase | null>(null);
  const [metadata, setMetadata] = useState<CaseMetadata | null>(null);
  const [slaBreached, setSlaBreached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (caseId === null) return;
    setLoading(true);
    setError(null);

    try {
      const [caseResult, metaResult, slaResult] = await Promise.all([
        getCase(caseId),
        getCaseMetadata(caseId),
        isSlaBreached(caseId),
      ]);

      if (caseResult.success) setDisputeCase(caseResult.data);
      if (metaResult.success) setMetadata(metaResult.data);
      if (slaResult.success) setSlaBreached(!!slaResult.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { disputeCase, metadata, slaBreached, loading, error, refresh: fetch };
}

interface UseArbitratorResult {
  arbitrator: Arbitrator | null;
  performance: ArbitratorPerformance | null;
  available: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useArbitrator(address: string | null): UseArbitratorResult {
  const [arbitrator, setArbitrator] = useState<Arbitrator | null>(null);
  const [performance, setPerformance] = useState<ArbitratorPerformance | null>(null);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    try {
      const [arbResult, perfResult, availResult] = await Promise.all([
        getArbitrator(address),
        getArbitratorPerformance(address),
        isArbitratorAvailable(address),
      ]);

      if (arbResult.success) setArbitrator(arbResult.data);
      if (perfResult.success) setPerformance(perfResult.data);
      if (availResult.success) setAvailable(!!availResult.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load arbitrator');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { arbitrator, performance, available, loading, error, refresh: fetch };
}

interface UseCaseEvidenceResult {
  evidenceItems: EvidenceItem[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCaseEvidence(caseId: number | null): UseCaseEvidenceResult {
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (caseId === null) return;
    setLoading(true);
    setError(null);

    try {
      const indexResult = await getCaseEvidenceIndex(caseId);
      if (indexResult.success && indexResult.data) {
        const count = indexResult.data.totalItems || 0;
        setTotalCount(count);

        const items: EvidenceItem[] = [];
        for (let i = 1; i <= Math.min(count, 50); i++) {
          const result = await getEvidence(i);
          if (result.success && result.data) {
            items.push(result.data);
          }
        }
        setEvidenceItems(items);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { evidenceItems, totalCount, loading, error, refresh: fetch };
}

interface UseCaseJudgmentResult {
  judgment: Judgment | null;
  canAppeal: boolean;
  appeals: Appeal[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCaseJudgment(caseId: number | null): UseCaseJudgmentResult {
  const [judgment, setJudgment] = useState<Judgment | null>(null);
  const [canAppealFlag, setCanAppealFlag] = useState(false);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (caseId === null) return;
    setLoading(true);
    setError(null);

    try {
      const [judgmentResult, appealResult] = await Promise.all([
        getJudgmentByCase(caseId),
        canAppealJudgment(caseId),
      ]);

      if (judgmentResult.success && judgmentResult.data) {
        setJudgment(judgmentResult.data);
      }
      if (appealResult.success) {
        setCanAppealFlag(!!appealResult.data);
      }

      const loadedAppeals: Appeal[] = [];
      for (let round = 1; round <= 5; round++) {
        const result = await getAppeal(caseId, round);
        if (result.success && result.data) {
          loadedAppeals.push(result.data);
        } else {
          break;
        }
      }
      setAppeals(loadedAppeals);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load judgment');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { judgment, canAppeal: canAppealFlag, appeals, loading, error, refresh: fetch };
}
