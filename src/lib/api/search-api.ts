// Hiro API search endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type SearchResultType = 'tx' | 'block' | 'contract_address' | 'standard_address';

export type SearchResult = { found: boolean; result: { entity_type: SearchResultType; entity_id: string } | null };
