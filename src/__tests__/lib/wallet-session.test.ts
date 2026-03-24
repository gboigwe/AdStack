import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveWalletSession,
  loadWalletSession,
  isSessionValid,
  clearWalletSession,
  updateSessionActivity,
  getSessionInfo,
  type WalletSession,
} from '@/lib/wallet-session';

function createSession(overrides: Partial<WalletSession> = {}): WalletSession {
  return {
    address: 'SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02',
    walletId: 'leather',
    network: 'testnet',
    connectedAt: Date.now(),
    lastActiveAt: Date.now(),
    ...overrides,
  };
}

describe('wallet-session', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isSessionValid', () => {
    it('returns true for a fresh session', () => {
      const session = createSession();
      expect(isSessionValid(session)).toBe(true);
    });

    it('returns false for a session older than 30 days', () => {
      const thirtyOneDays = 31 * 24 * 60 * 60 * 1000;
      const session = createSession({
        lastActiveAt: Date.now() - thirtyOneDays,
      });
      expect(isSessionValid(session)).toBe(false);
    });
  });

  describe('saveWalletSession / loadWalletSession', () => {
    it('saves and loads a session', () => {
      const session = createSession();
      saveWalletSession(session);

      const loaded = loadWalletSession();
      expect(loaded).not.toBeNull();
      expect(loaded!.address).toBe(session.address);
      expect(loaded!.walletId).toBe('leather');
    });

    it('returns null when no session is saved', () => {
      expect(loadWalletSession()).toBeNull();
    });

    it('returns null for expired sessions and clears storage', () => {
      const expired = createSession({
        lastActiveAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
      });
      saveWalletSession(expired);

      expect(loadWalletSession()).toBeNull();
      expect(localStorage.getItem('adstack_wallet_session')).toBeNull();
    });

    it('saves individual keys for quick lookup', () => {
      const session = createSession();
      saveWalletSession(session);

      expect(localStorage.getItem('adstack_wallet_address')).toBe(session.address);
      expect(localStorage.getItem('adstack_wallet_id')).toBe(session.walletId);
    });

    it('saves and removes signature key', () => {
      const withSig = createSession({ signature: 'abc123' });
      saveWalletSession(withSig);
      expect(localStorage.getItem('adstack_session_signature')).toBe('abc123');

      const noSig = createSession({ signature: undefined });
      saveWalletSession(noSig);
      expect(localStorage.getItem('adstack_session_signature')).toBeNull();
    });
  });

  describe('clearWalletSession', () => {
    it('removes all session keys from localStorage', () => {
      saveWalletSession(createSession());
      clearWalletSession();

      expect(localStorage.getItem('adstack_wallet_session')).toBeNull();
      expect(localStorage.getItem('adstack_wallet_address')).toBeNull();
      expect(localStorage.getItem('adstack_wallet_id')).toBeNull();
    });
  });

  describe('updateSessionActivity', () => {
    it('updates lastActiveAt timestamp', () => {
      const session = createSession({ lastActiveAt: 1000 });
      saveWalletSession(session);

      updateSessionActivity();

      const raw = localStorage.getItem('adstack_wallet_session');
      const updated = JSON.parse(raw!) as WalletSession;
      expect(updated.lastActiveAt).toBeGreaterThan(1000);
    });

    it('does nothing when no session exists', () => {
      // Should not throw
      updateSessionActivity();
    });
  });

  describe('getSessionInfo', () => {
    it('returns session info for active session', () => {
      saveWalletSession(createSession());

      const info = getSessionInfo();
      expect(info).not.toBeNull();
      expect(info!.isActive).toBe(true);
      expect(info!.address).toBe('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02');
    });

    it('returns null when no session exists', () => {
      expect(getSessionInfo()).toBeNull();
    });
  });
});
