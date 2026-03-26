// Hiro API contracts endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type ContractInfo = { tx_id: string; canonical: boolean; contract_id: string; block_height: number; source_code: string; abi: string };

export type ReadOnlyCallResult = { okay: boolean; result: string };

export type ContractEvent = { contract_log: { contract_id: string; topic: string; value: { hex: string; repr: string } } };

function getBase(network: Network): string {
  return network === 'mainnet' ? HIRO_API_BASE : HIRO_TESTNET_BASE;
}

export async function fetchContractInfo(contractId: string, network: Network = 'mainnet'): Promise<ContractInfo> {
  const url = `${getBase(network)}/extended/v1/contract/${contractId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Contract not found: ${contractId}`);
  return res.json();
}

export async function callReadOnlyFunction(
  contractId: string,
  functionName: string,
  args: string[],
  senderAddress: string,
  network: Network = 'mainnet'
): Promise<ReadOnlyCallResult> {
  const [contractAddress, contractName] = contractId.split('.');
  const url = `${getBase(network)}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: senderAddress, arguments: args }),
  });
  return res.json();
}

export async function fetchContractSource(contractId: string, network: Network = 'mainnet'): Promise<string> {
  const info = await fetchContractInfo(contractId, network);
  return info.source_code;
}

export async function fetchContractAbi(contractId: string, network: Network = 'mainnet'): Promise<unknown> {
  const info = await fetchContractInfo(contractId, network);
  try { return JSON.parse(info.abi); } catch { return null; }
}
