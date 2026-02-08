;; Liquidity Pool for DEX Integration
;; Automated swaps with LP rewards and slippage protection

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u500))
(define-constant err-insufficient-liquidity (err u501))
(define-constant err-slippage-exceeded (err u502))
(define-constant err-invalid-amount (err u503))
(define-constant err-pool-not-found (err u504))

;; Pool fee: 0.3% = 30 basis points
(define-constant pool-fee-bps uint u30)

;; Data Variables
(define-data-var pool-admin principal contract-owner)

;; Liquidity pools (token-a/token-b pairs)
(define-map liquidity-pools
  { token-a: (string-ascii 10), token-b: (string-ascii 10) }
  {
    reserve-a: uint,
    reserve-b: uint,
    total-lp-tokens: uint,
    last-update: uint
  }
)

;; LP token balances
(define-map lp-balances
  { pool: (string-ascii 32), provider: principal }
  uint
)

;; LP provider rewards
(define-map provider-rewards
  { pool: (string-ascii 32), provider: principal }
  {
    total-earned: uint,
    unclaimed: uint
  }
)

;; Admin Functions

(define-public (set-pool-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get pool-admin)) err-owner-only)
    (ok (var-set pool-admin new-admin))
  )
)

;; Create new liquidity pool
(define-public (create-pool
  (token-a (string-ascii 10))
  (token-b (string-ascii 10))
  (amount-a uint)
  (amount-b uint)
)
  (begin
    (asserts! (> amount-a u0) err-invalid-amount)
    (asserts! (> amount-b u0) err-invalid-amount)
    (asserts! (is-none (get-pool-info token-a token-b)) err-pool-not-found)

    ;; Create pool
    (let
      (
        (initial-lp-tokens (* amount-a amount-b))
        (pool-id (get-pool-id token-a token-b))
      )
      (map-set liquidity-pools
        { token-a: token-a, token-b: token-b }
        {
          reserve-a: amount-a,
          reserve-b: amount-b,
          total-lp-tokens: initial-lp-tokens,
          last-update: block-height
        }
      )

      ;; Mint LP tokens to creator
      (map-set lp-balances
        { pool: pool-id, provider: tx-sender }
        initial-lp-tokens
      )

      (ok initial-lp-tokens)
    )
  )
)

;; Add liquidity to pool
(define-public (add-liquidity
  (token-a (string-ascii 10))
  (token-b (string-ascii 10))
  (amount-a uint)
  (amount-b uint)
)
  (let
    (
      (pool (unwrap! (get-pool-info token-a token-b) err-pool-not-found))
      (reserve-a (get reserve-a pool))
      (reserve-b (get reserve-b pool))
      (total-lp (get total-lp-tokens pool))
      (pool-id (get-pool-id token-a token-b))
    )
    (asserts! (> amount-a u0) err-invalid-amount)
    (asserts! (> amount-b u0) err-invalid-amount)

    ;; Calculate LP tokens to mint
    (let
      (
        (lp-tokens-a (/ (* amount-a total-lp) reserve-a))
        (lp-tokens-b (/ (* amount-b total-lp) reserve-b))
        (lp-tokens-to-mint (if (< lp-tokens-a lp-tokens-b) lp-tokens-a lp-tokens-b))
      )
      ;; Update pool reserves
      (map-set liquidity-pools
        { token-a: token-a, token-b: token-b }
        {
          reserve-a: (+ reserve-a amount-a),
          reserve-b: (+ reserve-b amount-b),
          total-lp-tokens: (+ total-lp lp-tokens-to-mint),
          last-update: block-height
        }
      )

      ;; Mint LP tokens
      (let
        (
          (current-balance (default-to u0
            (map-get? lp-balances { pool: pool-id, provider: tx-sender })
          ))
        )
        (map-set lp-balances
          { pool: pool-id, provider: tx-sender }
          (+ current-balance lp-tokens-to-mint)
        )
      )

      (ok lp-tokens-to-mint)
    )
  )
)

;; Remove liquidity from pool
(define-public (remove-liquidity
  (token-a (string-ascii 10))
  (token-b (string-ascii 10))
  (lp-tokens uint)
)
  (let
    (
      (pool (unwrap! (get-pool-info token-a token-b) err-pool-not-found))
      (pool-id (get-pool-id token-a token-b))
      (user-lp-balance (default-to u0
        (map-get? lp-balances { pool: pool-id, provider: tx-sender })
      ))
    )
    (asserts! (>= user-lp-balance lp-tokens) err-insufficient-liquidity)

    (let
      (
        (reserve-a (get reserve-a pool))
        (reserve-b (get reserve-b pool))
        (total-lp (get total-lp-tokens pool))
        (amount-a (/ (* lp-tokens reserve-a) total-lp))
        (amount-b (/ (* lp-tokens reserve-b) total-lp))
      )
      ;; Update pool reserves
      (map-set liquidity-pools
        { token-a: token-a, token-b: token-b }
        {
          reserve-a: (- reserve-a amount-a),
          reserve-b: (- reserve-b amount-b),
          total-lp-tokens: (- total-lp lp-tokens),
          last-update: block-height
        }
      )

      ;; Burn LP tokens
      (map-set lp-balances
        { pool: pool-id, provider: tx-sender }
        (- user-lp-balance lp-tokens)
      )

      (ok { amount-a: amount-a, amount-b: amount-b })
    )
  )
)

;; Swap tokens with slippage protection
(define-public (swap
  (token-in (string-ascii 10))
  (token-out (string-ascii 10))
  (amount-in uint)
  (min-amount-out uint)
)
  (let
    (
      (pool (unwrap! (get-pool-info token-in token-out) err-pool-not-found))
    )
    (asserts! (> amount-in u0) err-invalid-amount)

    (let
      (
        (reserve-in (get reserve-a pool))
        (reserve-out (get reserve-b pool))
        (amount-out (calculate-swap-output amount-in reserve-in reserve-out))
      )
      ;; Check slippage
      (asserts! (>= amount-out min-amount-out) err-slippage-exceeded)

      ;; Update reserves
      (map-set liquidity-pools
        { token-a: token-in, token-b: token-out }
        {
          reserve-a: (+ reserve-in amount-in),
          reserve-b: (- reserve-out amount-out),
          total-lp-tokens: (get total-lp-tokens pool),
          last-update: block-height
        }
      )

      ;; Distribute fees to LPs
      (let
        (
          (fee (calculate-fee amount-in))
        )
        (distribute-fees token-in token-out fee)
      )

      (ok amount-out)
    )
  )
)

;; Helper Functions

;; Calculate swap output using constant product formula (x * y = k)
(define-private (calculate-swap-output
  (amount-in uint)
  (reserve-in uint)
  (reserve-out uint)
)
  (let
    (
      (amount-in-with-fee (- amount-in (calculate-fee amount-in)))
      (numerator (* amount-in-with-fee reserve-out))
      (denominator (+ reserve-in amount-in-with-fee))
    )
    (/ numerator denominator)
  )
)

;; Calculate fee
(define-private (calculate-fee (amount uint))
  (/ (* amount pool-fee-bps) u10000)
)

;; Get pool ID
(define-private (get-pool-id (token-a (string-ascii 10)) (token-b (string-ascii 10)))
  (concat (concat token-a "-") token-b)
)

;; Distribute fees to LPs
(define-private (distribute-fees
  (token-a (string-ascii 10))
  (token-b (string-ascii 10))
  (fee-amount uint)
)
  ;; TODO: Implement proportional fee distribution to all LPs
  ;; For now, fees are added back to the pool reserves
  true
)

;; Read-Only Functions

(define-read-only (get-pool-info
  (token-a (string-ascii 10))
  (token-b (string-ascii 10))
)
  (map-get? liquidity-pools { token-a: token-a, token-b: token-b })
)

(define-read-only (get-lp-balance
  (token-a (string-ascii 10))
  (token-b (string-ascii 10))
  (provider principal)
)
  (let
    (
      (pool-id (get-pool-id token-a token-b))
    )
    (ok (default-to u0 (map-get? lp-balances { pool: pool-id, provider: provider })))
  )
)

(define-read-only (get-swap-estimate
  (token-in (string-ascii 10))
  (token-out (string-ascii 10))
  (amount-in uint)
)
  (match (get-pool-info token-in token-out)
    pool
      (let
        (
          (reserve-in (get reserve-a pool))
          (reserve-out (get reserve-b pool))
          (amount-out (calculate-swap-output amount-in reserve-in reserve-out))
        )
        (ok {
          amount-out: amount-out,
          price-impact: (calculate-price-impact amount-in reserve-in),
          fee: (calculate-fee amount-in)
        })
      )
    (err err-pool-not-found)
  )
)

;; Calculate price impact percentage (basis points)
(define-private (calculate-price-impact (amount-in uint) (reserve-in uint))
  (/ (* amount-in u10000) reserve-in)
)

;; Get reserves
(define-read-only (get-reserves
  (token-a (string-ascii 10))
  (token-b (string-ascii 10))
)
  (match (get-pool-info token-a token-b)
    pool (ok {
      reserve-a: (get reserve-a pool),
      reserve-b: (get reserve-b pool)
    })
    (err err-pool-not-found)
  )
)
