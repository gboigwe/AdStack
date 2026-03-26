// Hiro API contracts endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type ContractInfo = { tx_id: string; canonical: boolean; contract_id: string; block_height: number; source_code: string; abi: string };

export type ReadOnlyCallResult = { okay: boolean; result: string };
