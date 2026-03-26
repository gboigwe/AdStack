// useStacksSearch: search the Stacks blockchain by address, txid, or contract
import { useState, useCallback } from 'react';

export type SearchResultType = 'tx_id' | 'contract_address' | 'standard_address' | 'block_hash' | 'unknown';
