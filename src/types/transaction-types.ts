// Typed transaction structures for Stacks
import type { TxId, StxAddress, BlockHeight, MicroStx, Nonce, HexString } from './stacks-primitives';

export type TransactionType =
  | 'token_transfer'
  | 'contract_call'
  | 'smart_contract'
  | 'coinbase'
  | 'poison_microblock';

export type TransactionStatus = 'pending' | 'success' | 'abort_by_response' | 'abort_by_post_condition';

export interface BaseTransaction {
  tx_id: TxId;
  nonce: Nonce;
  fee_rate: MicroStx;
  sender_address: StxAddress;
  tx_status: TransactionStatus;
  tx_type: TransactionType;
  block_height?: BlockHeight;
  burn_block_time?: number;
}

export interface TokenTransferTransaction extends BaseTransaction {
  tx_type: 'token_transfer';
  token_transfer: {
    recipient_address: StxAddress;
    amount: MicroStx;
    memo: string;
  };
}

export interface ContractCallTransaction extends BaseTransaction {
  tx_type: 'contract_call';
  contract_call: {
    contract_id: string;
    function_name: string;
    function_args: Array<{ hex: HexString; repr: string; name: string; type: string }>;
  };
}

export interface SmartContractTransaction extends BaseTransaction {
  tx_type: 'smart_contract';
  smart_contract: {
    contract_id: string;
    source_code: string;
  };
}
