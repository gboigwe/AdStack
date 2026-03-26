// Example: creating an ad campaign via Stacks contract call
import type { ContractWriteParams } from '../hooks/useContractWrite';
import { makeUint } from '../lib/clarity-v4/clarity-primitives';
import { makeStringAscii } from '../lib/clarity-v4/clarity-strings';

export const ADSTACK_CONTRACT_ADDRESS = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
export const ADSTACK_CONTRACT_NAME = 'adstack-core';
