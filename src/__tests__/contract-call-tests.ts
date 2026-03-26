// Tests for contract call request building
import { describe, it, expect } from 'vitest';
import { buildContractCallRequest, withNetwork, withFee } from '../lib/connect/contract-call-request';
