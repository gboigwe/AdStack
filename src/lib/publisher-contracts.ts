import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  callReadOnlyFunction,
  cvToValue,
  stringAsciiCV,
  uintCV,
  bufferCV,
  principalCV,
  PostConditionMode
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';

// Contract addresses (update these for mainnet)
export const PUBLISHER_VERIFICATION_CONTRACT = {
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  name: 'publisher-verification'
};

export const KYC_REGISTRY_CONTRACT = {
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  name: 'kyc-registry'
};

export const PUBLISHER_REPUTATION_CONTRACT = {
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  name: 'publisher-reputation'
};

// Publisher Verification Functions
export async function registerPublisher(
  domain: string,
  senderKey: string,
  network: StacksNetwork
) {
  const txOptions = {
    contractAddress: PUBLISHER_VERIFICATION_CONTRACT.address,
    contractName: PUBLISHER_VERIFICATION_CONTRACT.name,
    functionName: 'register-publisher',
    functionArgs: [stringAsciiCV(domain)],
    senderKey,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction(transaction, network);
}

export async function createDomainChallenge(
  publisherId: number,
  verificationMethod: string,
  senderKey: string,
  network: StacksNetwork
) {
  const txOptions = {
    contractAddress: PUBLISHER_VERIFICATION_CONTRACT.address,
    contractName: PUBLISHER_VERIFICATION_CONTRACT.name,
    functionName: 'create-domain-challenge',
    functionArgs: [
      uintCV(publisherId),
      stringAsciiCV(verificationMethod)
    ],
    senderKey,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction(transaction, network);
}

export async function stakeForTier(
  publisherId: number,
  targetTier: number,
  amount: number,
  senderKey: string,
  network: StacksNetwork
) {
  const txOptions = {
    contractAddress: PUBLISHER_VERIFICATION_CONTRACT.address,
    contractName: PUBLISHER_VERIFICATION_CONTRACT.name,
    functionName: 'stake-for-tier',
    functionArgs: [
      uintCV(publisherId),
      uintCV(targetTier),
      uintCV(amount)
    ],
    senderKey,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction(transaction, network);
}

export async function requestTierUpgrade(
  publisherId: number,
  targetTier: number,
  senderKey: string,
  network: StacksNetwork
) {
  const txOptions = {
    contractAddress: PUBLISHER_VERIFICATION_CONTRACT.address,
    contractName: PUBLISHER_VERIFICATION_CONTRACT.name,
    functionName: 'request-tier-upgrade',
    functionArgs: [
      uintCV(publisherId),
      uintCV(targetTier)
    ],
    senderKey,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction(transaction, network);
}

// KYC Registry Functions
export async function submitKYCVerification(
  complianceLevel: number,
  documentHash: Buffer,
  countryCode: string,
  riskScore: number,
  validityDays: number,
  senderKey: string,
  network: StacksNetwork
) {
  const txOptions = {
    contractAddress: KYC_REGISTRY_CONTRACT.address,
    contractName: KYC_REGISTRY_CONTRACT.name,
    functionName: 'submit-kyc-verification',
    functionArgs: [
      principalCV(senderKey), // user
      uintCV(complianceLevel),
      bufferCV(documentHash),
      stringAsciiCV(countryCode),
      uintCV(riskScore),
      uintCV(validityDays)
    ],
    senderKey,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction(transaction, network);
}

export async function getKYCRecord(
  userAddress: string,
  network: StacksNetwork
) {
  const result = await callReadOnlyFunction({
    contractAddress: KYC_REGISTRY_CONTRACT.address,
    contractName: KYC_REGISTRY_CONTRACT.name,
    functionName: 'get-kyc-record',
    functionArgs: [principalCV(userAddress)],
    senderAddress: userAddress,
    network
  });

  return cvToValue(result);
}

export async function isKYCValid(
  userAddress: string,
  network: StacksNetwork
): Promise<boolean> {
  const result = await callReadOnlyFunction({
    contractAddress: KYC_REGISTRY_CONTRACT.address,
    contractName: KYC_REGISTRY_CONTRACT.name,
    functionName: 'is-kyc-valid',
    functionArgs: [principalCV(userAddress)],
    senderAddress: userAddress,
    network
  });

  return cvToValue(result);
}

// Publisher Reputation Functions
export async function initializeReputation(
  publisher: string,
  senderKey: string,
  network: StacksNetwork
) {
  const txOptions = {
    contractAddress: PUBLISHER_REPUTATION_CONTRACT.address,
    contractName: PUBLISHER_REPUTATION_CONTRACT.name,
    functionName: 'initialize-reputation',
    functionArgs: [principalCV(publisher)],
    senderKey,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow
  };

  const transaction = await makeContractCall(txOptions);
  return broadcastTransaction(transaction, network);
}

export async function getReputation(
  publisher: string,
  network: StacksNetwork
) {
  const result = await callReadOnlyFunction({
    contractAddress: PUBLISHER_REPUTATION_CONTRACT.address,
    contractName: PUBLISHER_REPUTATION_CONTRACT.name,
    functionName: 'get-reputation',
    functionArgs: [principalCV(publisher)],
    senderAddress: publisher,
    network
  });

  return cvToValue(result);
}

export async function getReputationScore(
  publisher: string,
  network: StacksNetwork
): Promise<number> {
  const result = await callReadOnlyFunction({
    contractAddress: PUBLISHER_REPUTATION_CONTRACT.address,
    contractName: PUBLISHER_REPUTATION_CONTRACT.name,
    functionName: 'get-reputation-score',
    functionArgs: [principalCV(publisher)],
    senderAddress: publisher,
    network
  });

  return cvToValue(result);
}

export async function getSuccessRate(
  publisher: string,
  network: StacksNetwork
): Promise<number> {
  const result = await callReadOnlyFunction({
    contractAddress: PUBLISHER_REPUTATION_CONTRACT.address,
    contractName: PUBLISHER_REPUTATION_CONTRACT.name,
    functionName: 'get-success-rate',
    functionArgs: [principalCV(publisher)],
    senderAddress: publisher,
    network
  });

  return cvToValue(result);
}

// Read-only helper functions
export async function getPublisher(
  publisherId: number,
  network: StacksNetwork
) {
  const result = await callReadOnlyFunction({
    contractAddress: PUBLISHER_VERIFICATION_CONTRACT.address,
    contractName: PUBLISHER_VERIFICATION_CONTRACT.name,
    functionName: 'get-publisher',
    functionArgs: [uintCV(publisherId)],
    senderAddress: PUBLISHER_VERIFICATION_CONTRACT.address,
    network
  });

  return cvToValue(result);
}

export async function getPublisherByAddress(
  ownerAddress: string,
  network: StacksNetwork
) {
  const result = await callReadOnlyFunction({
    contractAddress: PUBLISHER_VERIFICATION_CONTRACT.address,
    contractName: PUBLISHER_VERIFICATION_CONTRACT.name,
    functionName: 'get-publisher-by-address',
    functionArgs: [principalCV(ownerAddress)],
    senderAddress: ownerAddress,
    network
  });

  return cvToValue(result);
}

export async function getTierName(
  tier: number,
  network: StacksNetwork
): Promise<string> {
  const result = await callReadOnlyFunction({
    contractAddress: PUBLISHER_VERIFICATION_CONTRACT.address,
    contractName: PUBLISHER_VERIFICATION_CONTRACT.name,
    functionName: 'get-tier-name',
    functionArgs: [uintCV(tier)],
    senderAddress: PUBLISHER_VERIFICATION_CONTRACT.address,
    network
  });

  return cvToValue(result);
}
