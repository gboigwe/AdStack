// Unit tests for post condition builders
import { describe, it, expect } from 'vitest';
import { makeStxCondition, makeStxEqCondition, FungibleConditionCode } from '../lib/transactions/post-condition-builder';

describe('makeStxCondition', () => {
  it('creates STX post condition with correct fields', () => {
    const cond = makeStxCondition('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7', FungibleConditionCode.Equal, 1000000n);
    expect(cond.type).toBe('stx');
    expect(cond.amount).toBe(1000000n);
    expect(cond.conditionCode).toBe(FungibleConditionCode.Equal);
  });
