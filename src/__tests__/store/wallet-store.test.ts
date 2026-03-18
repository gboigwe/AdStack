import { describe, it, expect, beforeEach } from 'vitest';
import { useWalletStore } from '@/store/wallet-store';

describe('wallet-store', () => {
  beforeEach(() => {
    useWalletStore.setState({
      address: null,
      isConnected: false,
    });
  });

  it('starts with no address and not connected', () => {
    const state = useWalletStore.getState();
    expect(state.address).toBeNull();
    expect(state.isConnected).toBe(false);
  });

  it('setAddress updates the address', () => {
    useWalletStore.getState().setAddress('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02');
    expect(useWalletStore.getState().address).toBe('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02');
  });

  it('setConnected updates the connection state', () => {
    useWalletStore.getState().setConnected(true);
    expect(useWalletStore.getState().isConnected).toBe(true);
  });

  it('disconnect clears address and sets connected to false', () => {
    useWalletStore.getState().setAddress('SP2JXKMSH007NPYAQHKJPQMAQYAD90NQGTVJVQ02');
    useWalletStore.getState().setConnected(true);

    useWalletStore.getState().disconnect();

    expect(useWalletStore.getState().address).toBeNull();
    expect(useWalletStore.getState().isConnected).toBe(false);
  });

  it('setAddress to null clears the address', () => {
    useWalletStore.getState().setAddress('SP123');
    useWalletStore.getState().setAddress(null);
    expect(useWalletStore.getState().address).toBeNull();
  });

  it('multiple state updates work independently', () => {
    useWalletStore.getState().setAddress('SP_ADDR');
    useWalletStore.getState().setConnected(true);

    expect(useWalletStore.getState().address).toBe('SP_ADDR');
    expect(useWalletStore.getState().isConnected).toBe(true);

    useWalletStore.getState().setConnected(false);
    expect(useWalletStore.getState().address).toBe('SP_ADDR');
    expect(useWalletStore.getState().isConnected).toBe(false);
  });
});
