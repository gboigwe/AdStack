// Hiro API token endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type FtInfo = { name: string; symbol: string; decimals: number; total_supply: string; token_uri: string; contract_id: string };

export type NftInfo = { asset_identifier: string; value: { hex: string; repr: string }; block_height: number; tx_id: string };

export type NftHoldingsResponse = { limit: number; offset: number; total: number; results: NftInfo[] };
