;; Cross-Chain Token Bridge
;; Lock/unlock mechanism with multi-sig validators

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u300))
(define-constant err-not-validator (err u301))
(define-constant err-insufficient-signatures (err u302))
(define-constant err-invalid-amount (err u303))
(define-constant err-bridge-paused (err u304))
(define-constant err-already-processed (err u305))
(define-constant err-invalid-chain (err u306))
(define-constant err-token-not-supported (err u307))

;; Supported chains
(define-constant chain-ethereum u1)
(define-constant chain-polygon u137)
(define-constant chain-bsc u56)
(define-constant chain-avalanche u43114)

;; Data Variables
(define-data-var bridge-admin principal contract-owner)
(define-data-var bridge-paused bool false)
(define-data-var min-validators uint u3)
(define-data-var bridge-fee-bps uint u30) ;; 0.3% = 30 basis points

;; Validator registry
(define-map validators principal bool)
(define-data-var validator-count uint u0)

;; Supported tokens
(define-map supported-tokens
  { chain-id: uint, token-address: (string-ascii 128) }
  {
    enabled: bool,
    min-amount: uint,
    max-amount: uint,
    daily-limit: uint,
    total-locked: uint
  }
)

;; Bridge transactions
(define-map bridge-transactions
  (buff 32) ;; transaction hash
  {
    from-chain: uint,
    to-chain: uint,
    sender: principal,
    recipient: (string-ascii 128),
    token: (string-ascii 128),
    amount: uint,
    fee: uint,
    block-height: uint,
    status: (string-ascii 16), ;; "pending", "completed", "failed"
    signatures-count: uint
  }
)

;; Transaction signatures
(define-map transaction-signatures
  { tx-hash: (buff 32), validator: principal }
  bool
)

;; Locked balances per token
(define-map locked-balances
  (string-ascii 128) ;; token address
  uint ;; amount locked
)

;; Daily limits tracking
(define-map daily-volumes
  { token: (string-ascii 128), day: uint }
  uint
)

;; Admin Functions

;; Set bridge admin
(define-public (set-bridge-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get bridge-admin)) err-owner-only)
    (ok (var-set bridge-admin new-admin))
  )
)

;; Add validator
(define-public (add-validator (validator principal))
  (begin
    (asserts! (is-eq tx-sender (var-get bridge-admin)) err-owner-only)
    (map-set validators validator true)
    (var-set validator-count (+ (var-get validator-count) u1))
    (ok true)
  )
)

;; Remove validator
(define-public (remove-validator (validator principal))
  (begin
    (asserts! (is-eq tx-sender (var-get bridge-admin)) err-owner-only)
    (map-delete validators validator)
    (var-set validator-count (- (var-get validator-count) u1))
    (ok true)
  )
)

;; Pause bridge (emergency)
(define-public (pause-bridge)
  (begin
    (asserts! (is-eq tx-sender (var-get bridge-admin)) err-owner-only)
    (var-set bridge-paused true)
    (ok true)
  )
)

;; Resume bridge
(define-public (resume-bridge)
  (begin
    (asserts! (is-eq tx-sender (var-get bridge-admin)) err-owner-only)
    (var-set bridge-paused false)
    (ok true)
  )
)

;; Configure supported token
(define-public (configure-token
  (chain-id uint)
  (token-address (string-ascii 128))
  (enabled bool)
  (min-amount uint)
  (max-amount uint)
  (daily-limit uint)
)
  (begin
    (asserts! (is-eq tx-sender (var-get bridge-admin)) err-owner-only)
    (ok (map-set supported-tokens
      { chain-id: chain-id, token-address: token-address }
      {
        enabled: enabled,
        min-amount: min-amount,
        max-amount: max-amount,
        daily-limit: daily-limit,
        total-locked: u0
      }
    ))
  )
)

;; Bridge Functions

;; Lock tokens (outgoing bridge transaction)
(define-public (lock-tokens
  (to-chain uint)
  (recipient (string-ascii 128))
  (token (string-ascii 128))
  (amount uint)
  (tx-hash (buff 32))
)
  (let
    (
      (token-config (unwrap! (get-token-config chain-ethereum token) err-token-not-supported))
      (fee (calculate-fee amount))
      (net-amount (- amount fee))
      (current-day (/ block-height u144)) ;; ~1 day
    )
    (asserts! (not (var-get bridge-paused)) err-bridge-paused)
    (asserts! (get enabled token-config) err-token-not-supported)
    (asserts! (>= amount (get min-amount token-config)) err-invalid-amount)
    (asserts! (<= amount (get max-amount token-config)) err-invalid-amount)
    (asserts! (is-none (map-get? bridge-transactions tx-hash)) err-already-processed)

    ;; Check daily limit
    (let
      (
        (daily-volume (default-to u0 (map-get? daily-volumes
          { token: token, day: current-day }
        )))
        (new-volume (+ daily-volume amount))
      )
      (asserts! (<= new-volume (get daily-limit token-config)) err-invalid-amount)
      (map-set daily-volumes { token: token, day: current-day } new-volume)
    )

    ;; Record transaction
    (map-set bridge-transactions tx-hash {
      from-chain: chain-ethereum,
      to-chain: to-chain,
      sender: tx-sender,
      recipient: recipient,
      token: token,
      amount: net-amount,
      fee: fee,
      block-height: block-height,
      status: "pending",
      signatures-count: u0
    })

    ;; Update locked balance
    (let
      (
        (current-locked (default-to u0 (map-get? locked-balances token)))
      )
      (map-set locked-balances token (+ current-locked net-amount))
    )

    (ok { tx-hash: tx-hash, fee: fee, net-amount: net-amount })
  )
)

;; Validator signs transaction
(define-public (sign-bridge-transaction (tx-hash (buff 32)))
  (let
    (
      (tx (unwrap! (map-get? bridge-transactions tx-hash) err-already-processed))
      (is-validator (default-to false (map-get? validators tx-sender)))
    )
    (asserts! is-validator err-not-validator)
    (asserts! (is-none (map-get? transaction-signatures
      { tx-hash: tx-hash, validator: tx-sender }
    )) err-already-processed)

    ;; Record signature
    (map-set transaction-signatures
      { tx-hash: tx-hash, validator: tx-sender }
      true
    )

    ;; Update signature count
    (let
      (
        (new-sig-count (+ (get signatures-count tx) u1))
      )
      (map-set bridge-transactions tx-hash
        (merge tx { signatures-count: new-sig-count })
      )

      ;; Auto-complete if threshold reached
      (if (>= new-sig-count (var-get min-validators))
        (try! (complete-bridge-transaction tx-hash))
        (ok true)
      )
    )
  )
)

;; Complete bridge transaction
(define-private (complete-bridge-transaction (tx-hash (buff 32)))
  (let
    (
      (tx (unwrap! (map-get? bridge-transactions tx-hash) err-already-processed))
    )
    (asserts! (>= (get signatures-count tx) (var-get min-validators)) err-insufficient-signatures)

    ;; Mark as completed
    (map-set bridge-transactions tx-hash
      (merge tx { status: "completed" })
    )

    (ok true)
  )
)

;; Unlock tokens (incoming bridge transaction)
(define-public (unlock-tokens
  (tx-hash (buff 32))
  (recipient principal)
  (token (string-ascii 128))
  (amount uint)
)
  (let
    (
      (tx (unwrap! (map-get? bridge-transactions tx-hash) err-already-processed))
    )
    (asserts! (is-eq tx-sender (var-get bridge-admin)) err-owner-only)
    (asserts! (is-eq (get status tx) "completed") err-insufficient-signatures)

    ;; Update locked balance
    (let
      (
        (current-locked (default-to u0 (map-get? locked-balances token)))
      )
      (asserts! (>= current-locked amount) err-invalid-amount)
      (map-set locked-balances token (- current-locked amount))
    )

    ;; TODO: Transfer tokens to recipient
    ;; This would integrate with SIP-010 token contract

    (ok true)
  )
)

;; Helper Functions

;; Calculate bridge fee
(define-private (calculate-fee (amount uint))
  (/ (* amount (var-get bridge-fee-bps)) u10000)
)

;; Get token configuration
(define-private (get-token-config (chain-id uint) (token (string-ascii 128)))
  (map-get? supported-tokens { chain-id: chain-id, token-address: token })
)

;; Read-Only Functions

;; Get transaction details
(define-read-only (get-transaction (tx-hash (buff 32)))
  (map-get? bridge-transactions tx-hash)
)

;; Check if validator
(define-read-only (is-validator (address principal))
  (default-to false (map-get? validators address))
)

;; Get locked balance
(define-read-only (get-locked-balance (token (string-ascii 128)))
  (default-to u0 (map-get? locked-balances token))
)

;; Check if transaction is signed by validator
(define-read-only (has-signed (tx-hash (buff 32)) (validator principal))
  (default-to false (map-get? transaction-signatures
    { tx-hash: tx-hash, validator: validator }
  ))
)

;; Get bridge status
(define-read-only (get-bridge-status)
  (ok {
    paused: (var-get bridge-paused),
    validator-count: (var-get validator-count),
    min-validators: (var-get min-validators),
    bridge-fee-bps: (var-get bridge-fee-bps)
  })
)

;; Get daily volume
(define-read-only (get-daily-volume (token (string-ascii 128)) (day uint))
  (default-to u0 (map-get? daily-volumes { token: token, day: day }))
)

;; Calculate transaction fee
(define-read-only (estimate-fee (amount uint))
  (ok (calculate-fee amount))
)
