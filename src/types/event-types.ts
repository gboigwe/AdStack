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

export interface FtAssetEvent extends BaseContractEvent {
  event_type: 'fungible_token_asset';
  asset: { asset_event_type: string; asset_id: string; sender?: string; recipient?: string; amount: string };
}

export interface NftAssetEvent extends BaseContractEvent {
  event_type: 'non_fungible_token_asset';
  asset: { asset_event_type: string; asset_id: string; sender?: string; recipient?: string; value: { hex: string; repr: string } };
}
