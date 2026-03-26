// useStacksSession: manage Stacks wallet session state
import { useState, useEffect, useCallback } from 'react';

export type StacksNetwork = 'mainnet' | 'testnet' | 'devnet';

export interface SessionUser {
  stxAddress: string;
  network: StacksNetwork;
  publicKey?: string;
}
