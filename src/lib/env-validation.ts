/**
 * Environment Variable Validation
 * Validates required env vars at startup and provides typed access.
 */

/** Valid network names that map to Stacks SDK network objects. */
const VALID_NETWORKS = ['mainnet', 'testnet', 'devnet'] as const;
type ValidNetwork = (typeof VALID_NETWORKS)[number];

/** Validated environment configuration. */
export interface EnvConfig {
  network: ValidNetwork;
  contractAddress: string;
  apiUrl: string;
  walletConnectProjectId: string;
}

/**
 * Validate and return the environment configuration.
 * Logs warnings for missing or invalid values in development.
 */
export function validateEnv(): EnvConfig {
  const rawNetwork = process.env.NEXT_PUBLIC_NETWORK;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const walletConnectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  // Validate network
  let network: ValidNetwork = 'mainnet';
  if (rawNetwork) {
    if (VALID_NETWORKS.includes(rawNetwork as ValidNetwork)) {
      network = rawNetwork as ValidNetwork;
    } else {
      console.warn(
        `[env] Invalid NEXT_PUBLIC_NETWORK="${rawNetwork}". ` +
        `Must be one of: ${VALID_NETWORKS.join(', ')}. Defaulting to mainnet.`,
      );
    }
  }

  // Validate contract address format
  if (contractAddress && !contractAddress.startsWith('SP') && !contractAddress.startsWith('ST')) {
    console.warn(
      `[env] NEXT_PUBLIC_CONTRACT_ADDRESS="${contractAddress}" does not ` +
      `start with SP (mainnet) or ST (testnet). This may cause transaction failures.`,
    );
  }

  // Warn about default API URL
  if (!apiUrl && process.env.NODE_ENV === 'development') {
    console.warn(
      '[env] NEXT_PUBLIC_API_URL not set. Using default https://api.hiro.so',
    );
  }

  // Warn about missing WalletConnect project ID
  if (!walletConnectId || walletConnectId === 'demo-project-id') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[env] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID not set or using demo ID. ' +
        'Get a project ID at https://cloud.reown.com/',
      );
    }
  }

  // Validate contract address matches network prefix
  if (contractAddress) {
    const expectedPrefix = network === 'mainnet' ? 'SP' : 'ST';
    if (!contractAddress.startsWith(expectedPrefix)) {
      console.warn(
        `[env] Contract address "${contractAddress}" uses wrong prefix for ${network}. ` +
        `Expected "${expectedPrefix}" prefix.`
      );
    }
  }

  return {
    network,
    contractAddress: contractAddress || (network === 'devnet' ? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' : 'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD'),
    apiUrl: apiUrl || (network === 'devnet' ? 'http://localhost:3999' : 'https://api.hiro.so'),
    walletConnectProjectId: walletConnectId || '',
  };
}

/** Cached config so validation only runs once. */
let _cachedConfig: EnvConfig | null = null;

/**
 * Get the validated environment config (cached after first call).
 */
export function getEnvConfig(): EnvConfig {
  if (!_cachedConfig) {
    _cachedConfig = validateEnv();
  }
  return _cachedConfig;
}
