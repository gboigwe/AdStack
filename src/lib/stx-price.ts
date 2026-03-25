/**
 * stx-price.ts
 * STX/USD price oracle integration for AdStack.
 * Fetches real-time and historical STX prices from CoinGecko and Hiro APIs.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface STXPrice {
  usd: number;
  usd_24h_change: number;
  usd_market_cap: number;
  last_updated_at: number;
}

export interface PriceConversion {
  microStx: bigint;
  stx: number;
  usd: number;
  formattedStx: string;
  formattedUsd: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MICRO_STX_DECIMALS = 6;
export const MICRO_STX_PER_STX = 1_000_000;

// Simple in-memory cache with TTL
let priceCache: { price: STXPrice; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

// ---------------------------------------------------------------------------
// Price Fetching
// ---------------------------------------------------------------------------

/**
 * Fetch the current STX/USD price from CoinGecko.
 * Falls back to a cached value if the request fails.
 */
export async function fetchSTXPrice(): Promise<STXPrice> {
  const now = Date.now();

  if (priceCache && now - priceCache.fetchedAt < CACHE_TTL_MS) {
    return priceCache.price;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true',
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      throw new Error(`CoinGecko error: ${response.status}`);
    }

    const data = await response.json();
    const stxData = data.blockstack;

    const price: STXPrice = {
      usd: stxData.usd,
      usd_24h_change: stxData.usd_24h_change ?? 0,
      usd_market_cap: stxData.usd_market_cap ?? 0,
      last_updated_at: stxData.last_updated_at ?? Math.floor(now / 1000),
    };

    priceCache = { price, fetchedAt: now };
    return price;
  } catch {
    // Return cached price or default on failure
    if (priceCache) return priceCache.price;
    return { usd: 0, usd_24h_change: 0, usd_market_cap: 0, last_updated_at: 0 };
  }
}

// ---------------------------------------------------------------------------
// Conversion Utilities
// ---------------------------------------------------------------------------

/**
 * Convert micro-STX to a human-readable STX amount.
 */
export function microStxToStx(microStx: bigint | number): number {
  return Number(microStx) / MICRO_STX_PER_STX;
}

/**
 * Convert STX to micro-STX.
 */
export function stxToMicroStx(stx: number): bigint {
  return BigInt(Math.floor(stx * MICRO_STX_PER_STX));
}

/**
 * Format a micro-STX amount with optional USD conversion.
 */
export function formatMicroStx(
  microStx: bigint | number,
  usdPrice?: number,
): PriceConversion {
  const stx = microStxToStx(microStx);
  const usd = usdPrice ? stx * usdPrice : 0;

  return {
    microStx: BigInt(microStx),
    stx,
    usd,
    formattedStx: stx.toLocaleString('en-US', { maximumFractionDigits: 6 }),
    formattedUsd: usd.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }),
  };
}

/**
 * Convert USD amount to micro-STX at the given price.
 */
export function usdToMicroStx(usd: number, stxPriceUsd: number): bigint {
  if (stxPriceUsd === 0) return 0n;
  const stxAmount = usd / stxPriceUsd;
  return stxToMicroStx(stxAmount);
}

/**
 * Invalidate the price cache (forces re-fetch on next call).
 */
export function invalidatePriceCache(): void {
  priceCache = null;
}
