// Stacks smart contract event types
export type ContractEventType = 'stx_asset' | 'non_fungible_token_asset' | 'fungible_token_asset' | 'data_var' | 'contract_log';

export interface BaseContractEvent {
  event_index: number;
  tx_id: string;
  event_type: ContractEventType;
}

export interface StxAssetEvent extends BaseContractEvent {
  event_type: 'stx_asset';
  asset: { asset_event_type: 'transfer' | 'mint' | 'burn'; sender?: string; recipient?: string; amount: string };
}
