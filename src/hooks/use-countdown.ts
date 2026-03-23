'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CountdownResult {
  /** Remaining seconds */
  remaining: number;
  /** Whether the countdown has finished */
  isComplete: boolean;
  /** Formatted as { days, hours, minutes, seconds } */
  parts: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  /** Restart the countdown with a new target */
  restart: (targetDate: Date) => void;
}

/**
 * Countdown timer that ticks every second until a target date.
 * Pauses when the tab is hidden and resumes on visibility change.
 *
 * @param targetDate — the date/time to count down to
 *
 * @example
 * const { parts, isComplete } = useCountdown(new Date('2026-04-01'));
 * return <span>{parts.days}d {parts.hours}h {parts.minutes}m {parts.seconds}s</span>;
 */
export function useCountdown(targetDate: Date | null): CountdownResult {
  const [target, setTarget] = useState(targetDate);
  const [remaining, setRemaining] = useState(() =>
    target ? Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000)) : 0,
  );
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const tick = useCallback(() => {
    if (!target) return;
    const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
    setRemaining(diff);
    if (diff === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [target]);

  useEffect(() => {
    if (!target) return;
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [target, tick]);

  // Re-sync when tab becomes visible (handles laptop sleep/resume)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') tick();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [tick]);

  const restart = useCallback((newTarget: Date) => {
    setTarget(newTarget);
  }, []);

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return {
    remaining,
    isComplete: remaining === 0,
    parts: { days, hours, minutes, seconds },
    restart,
  };
}
