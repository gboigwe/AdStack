// useContractWrite: submit a Clarity contract call transaction
import { useState, useCallback } from 'react';

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';
