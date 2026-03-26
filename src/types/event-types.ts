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

export interface ContractLogEvent extends BaseContractEvent {
  event_type: 'contract_log';
  contract_log: { contract_id: string; topic: string; value: { hex: string; repr: string } };
}

export type StacksEvent = StxAssetEvent | FtAssetEvent | NftAssetEvent | ContractLogEvent;

export function isStxEvent(e: StacksEvent): e is StxAssetEvent { return e.event_type === 'stx_asset'; }
export function isFtEvent(e: StacksEvent): e is FtAssetEvent { return e.event_type === 'fungible_token_asset'; }
export function isNftEvent(e: StacksEvent): e is NftAssetEvent { return e.event_type === 'non_fungible_token_asset'; }
export function isLogEvent(e: StacksEvent): e is ContractLogEvent { return e.event_type === 'contract_log'; }
