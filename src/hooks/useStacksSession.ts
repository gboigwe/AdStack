// useStacksSession: manage Stacks wallet session state
import { useState, useEffect, useCallback } from 'react';

export type StacksNetwork = 'mainnet' | 'testnet' | 'devnet';
