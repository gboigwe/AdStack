import {
  makeContractCall,
  broadcastTransaction,
  callReadOnlyFunction,
  cvToValue,
  uintCV,
  stringAsciiCV,
  principalCV,
  boolCV,
  bufferCV,
  ClarityValue,
  PostConditionMode,
  AnchorMode,
  SignedContractCallOptions,
} from '@stacks/transactions';
import { StacksMainnet, StacksTestnet, StacksDevnet } from '@stacks/network';
import { config } from '../config/config';

type NetworkType = 'mainnet' | 'testnet' | 'devnet';

function getNetwork() {
  const networkType = (config.stacks?.network || 'devnet') as NetworkType;
  switch (networkType) {
    case 'mainnet':
      return new StacksMainnet();
    case 'testnet':
      return new StacksTestnet();
    default:
      return new StacksDevnet();
  }
}

function getContractAddress(contractName: string): string {
  const contracts = config.stacks?.contracts || {};
  const mapping: Record<string, string> = {
    'subscription-manager': contracts.subscriptionManager || '',
    'recurring-payment': contracts.recurringPayment || '',
    'subscription-benefits': contracts.subscriptionBenefits || '',
  };

  const address = mapping[contractName];
  if (!address) {
    throw new Error(`Contract address not configured: ${contractName}`);
  }

  return address;
}

function parseContractIdentifier(fullAddress: string): { address: string; name: string } {
  const parts = fullAddress.split('.');
  if (parts.length !== 2) {
    throw new Error(`Invalid contract identifier: ${fullAddress}`);
  }
  return { address: parts[0], name: parts[1] };
}

function convertArgToClarity(arg: unknown): ClarityValue {
  if (typeof arg === 'number') {
    return uintCV(arg);
  }
  if (typeof arg === 'boolean') {
    return boolCV(arg);
  }
  if (typeof arg === 'string') {
    if (arg.startsWith('SP') || arg.startsWith('SM') || arg.startsWith('ST')) {
      return principalCV(arg);
    }
    return stringAsciiCV(arg);
  }
  if (Buffer.isBuffer(arg)) {
    return bufferCV(arg);
  }
  throw new Error(`Cannot convert argument to Clarity value: ${typeof arg}`);
}

export async function contractCall(
  contractName: string,
  functionName: string,
  args: unknown[] = []
): Promise<string> {
  const fullAddress = getContractAddress(contractName);
  const { address, name } = parseContractIdentifier(fullAddress);
  const network = getNetwork();

  const senderKey = config.stacks?.senderKey;
  if (!senderKey) {
    throw new Error('Stacks sender key not configured');
  }

  const functionArgs = args.map(convertArgToClarity);

  const txOptions: SignedContractCallOptions = {
    contractAddress: address,
    contractName: name,
    functionName,
    functionArgs,
    senderKey,
    network,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  };

  const tx = await makeContractCall(txOptions);
  const result = await broadcastTransaction(tx, network);

  if ('error' in result) {
    throw new Error(`Transaction broadcast failed: ${result.error}`);
  }

  return result.txid;
}

export async function contractRead(
  contractName: string,
  functionName: string,
  args: unknown[] = []
): Promise<unknown> {
  const fullAddress = getContractAddress(contractName);
  const { address, name } = parseContractIdentifier(fullAddress);
  const network = getNetwork();

  const senderAddress = config.stacks?.senderAddress || address;
  const functionArgs = args.map(convertArgToClarity);

  try {
    const result = await callReadOnlyFunction({
      contractAddress: address,
      contractName: name,
      functionName,
      functionArgs,
      network,
      senderAddress,
    });

    return cvToValue(result);
  } catch (error) {
    console.error(`Contract read failed [${contractName}.${functionName}]:`, error);
    return null;
  }
}

export async function waitForTransaction(
  txId: string,
  maxAttempts: number = 30,
  intervalMs: number = 10000
): Promise<{ success: boolean; result?: unknown }> {
  const network = getNetwork();
  const apiUrl = (network as { coreApiUrl?: string }).coreApiUrl || 'http://localhost:3999';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
      const data = await response.json();

      if (data.tx_status === 'success') {
        return { success: true, result: data.tx_result };
      }

      if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
        return { success: false, result: data.tx_result };
      }
    } catch {
      // API might not be available yet, continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Transaction ${txId} did not confirm after ${maxAttempts} attempts`);
}

export async function getAccountBalance(address: string): Promise<{ stx: bigint }> {
  const network = getNetwork();
  const apiUrl = (network as { coreApiUrl?: string }).coreApiUrl || 'http://localhost:3999';

  const response = await fetch(`${apiUrl}/extended/v1/address/${address}/balances`);
  const data = await response.json();

  return {
    stx: BigInt(data.stx?.balance || '0'),
  };
}

export async function getTransactionStatus(txId: string): Promise<string> {
  const network = getNetwork();
  const apiUrl = (network as { coreApiUrl?: string }).coreApiUrl || 'http://localhost:3999';

  try {
    const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
    const data = await response.json();
    return data.tx_status || 'unknown';
  } catch {
    return 'unknown';
  }
}
