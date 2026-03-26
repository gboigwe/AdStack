// Typed transaction structures for Stacks
import type { TxId, StxAddress, BlockHeight, MicroStx, Nonce, HexString } from './stacks-primitives';

export type TransactionType =
  | 'token_transfer'
  | 'contract_call'
  | 'smart_contract'
  | 'coinbase'
  | 'poison_microblock';
