;; Wrapped Token Manager
;; Manages wrapped BTC/ETH/USDC on Stacks with SIP-010 trait

;; Implements SIP-010 fungible token trait
(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u400))
(define-constant err-not-authorized (err u401))
(define-constant err-insufficient-balance (err u402))
(define-constant err-invalid-amount (err u403))
(define-constant err-token-not-found (err u404))
(define-constant err-exceeds-supply (err u405))

;; Token data
(define-fungible-token wrapped-usdc)
(define-fungible-token wrapped-usdt)
(define-fungible-token wrapped-btc)
(define-fungible-token wrapped-eth)

;; Data Variables
(define-data-var token-name (string-ascii 32) "Wrapped USDC")
(define-data-var token-symbol (string-ascii 10) "wUSDC")
(define-data-var token-decimals uint u6)
(define-data-var token-uri (optional (string-utf8 256)) none)

;; Manager role
(define-data-var manager principal contract-owner)

;; Collateral tracking per token
(define-map collateral-reserves
  (string-ascii 10) ;; token symbol
  {
    total-minted: uint,
    total-burned: uint,
    total-locked: uint,
    redemption-queue: uint
  }
)

;; User balances per wrapped token
(define-map user-wrapped-balances
  { user: principal, token: (string-ascii 10) }
  uint
)

;; Redemption requests
(define-map redemption-requests
  uint ;; request-id
  {
    user: principal,
    token: (string-ascii 10),
    amount: uint,
    destination-chain: uint,
    destination-address: (string-ascii 128),
    status: (string-ascii 16), ;; "pending", "processing", "completed"
    requested-at: uint
  }
)

(define-data-var next-redemption-id uint u1)

;; SIP-010 Standard Functions

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) err-not-authorized)
    (try! (ft-transfer? wrapped-usdc amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

(define-read-only (get-name)
  (ok (var-get token-name))
)

(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
  (ok (var-get token-decimals))
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance wrapped-usdc who))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply wrapped-usdc))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Manager Functions

(define-public (set-manager (new-manager principal))
  (begin
    (asserts! (is-eq tx-sender (var-get manager)) err-owner-only)
    (ok (var-set manager new-manager))
  )
)

;; Mint wrapped tokens (when tokens are locked on source chain)
(define-public (mint-wrapped
  (token (string-ascii 10))
  (amount uint)
  (recipient principal)
)
  (begin
    (asserts! (is-eq tx-sender (var-get manager)) err-not-authorized)
    (asserts! (> amount u0) err-invalid-amount)

    ;; Mint based on token type
    (if (is-eq token "wUSDC")
      (try! (ft-mint? wrapped-usdc amount recipient))
      (if (is-eq token "wUSDT")
        (try! (ft-mint? wrapped-usdt amount recipient))
        (if (is-eq token "wBTC")
          (try! (ft-mint? wrapped-btc amount recipient))
          (if (is-eq token "wETH")
            (try! (ft-mint? wrapped-eth amount recipient))
            (err err-token-not-found)
          )
        )
      )
    )

    ;; Update reserves
    (let
      (
        (reserves (default-to
          { total-minted: u0, total-burned: u0, total-locked: u0, redemption-queue: u0 }
          (map-get? collateral-reserves token)
        ))
      )
      (map-set collateral-reserves token
        (merge reserves {
          total-minted: (+ (get total-minted reserves) amount),
          total-locked: (+ (get total-locked reserves) amount)
        })
      )
    )

    (ok true)
  )
)

;; Burn wrapped tokens (for redemption)
(define-public (burn-wrapped
  (token (string-ascii 10))
  (amount uint)
)
  (begin
    (asserts! (> amount u0) err-invalid-amount)

    ;; Burn based on token type
    (if (is-eq token "wUSDC")
      (try! (ft-burn? wrapped-usdc amount tx-sender))
      (if (is-eq token "wUSDT")
        (try! (ft-burn? wrapped-usdt amount tx-sender))
        (if (is-eq token "wBTC")
          (try! (ft-burn? wrapped-btc amount tx-sender))
          (if (is-eq token "wETH")
            (try! (ft-burn? wrapped-eth amount tx-sender))
            (err err-token-not-found)
          )
        )
      )
    )

    ;; Update reserves
    (let
      (
        (reserves (unwrap! (map-get? collateral-reserves token) err-token-not-found))
      )
      (map-set collateral-reserves token
        (merge reserves {
          total-burned: (+ (get total-burned reserves) amount),
          total-locked: (- (get total-locked reserves) amount)
        })
      )
    )

    (ok true)
  )
)

;; Request redemption (withdraw to original chain)
(define-public (request-redemption
  (token (string-ascii 10))
  (amount uint)
  (destination-chain uint)
  (destination-address (string-ascii 128))
)
  (let
    (
      (redemption-id (var-get next-redemption-id))
    )
    (asserts! (> amount u0) err-invalid-amount)

    ;; Burn wrapped tokens
    (try! (burn-wrapped token amount))

    ;; Create redemption request
    (map-set redemption-requests redemption-id {
      user: tx-sender,
      token: token,
      amount: amount,
      destination-chain: destination-chain,
      destination-address: destination-address,
      status: "pending",
      requested-at: block-height
    })

    ;; Update redemption queue
    (let
      (
        (reserves (unwrap! (map-get? collateral-reserves token) err-token-not-found))
      )
      (map-set collateral-reserves token
        (merge reserves {
          redemption-queue: (+ (get redemption-queue reserves) amount)
        })
      )
    )

    (var-set next-redemption-id (+ redemption-id u1))
    (ok redemption-id)
  )
)

;; Process redemption (manager only)
(define-public (process-redemption (redemption-id uint))
  (let
    (
      (request (unwrap! (map-get? redemption-requests redemption-id) err-token-not-found))
    )
    (asserts! (is-eq tx-sender (var-get manager)) err-not-authorized)
    (asserts! (is-eq (get status request) "pending") err-invalid-amount)

    ;; Update status
    (map-set redemption-requests redemption-id
      (merge request { status: "processing" })
    )

    (ok true)
  )
)

;; Complete redemption (after unlock on destination chain)
(define-public (complete-redemption (redemption-id uint))
  (let
    (
      (request (unwrap! (map-get? redemption-requests redemption-id) err-token-not-found))
    )
    (asserts! (is-eq tx-sender (var-get manager)) err-not-authorized)
    (asserts! (is-eq (get status request) "processing") err-invalid-amount)

    ;; Update status
    (map-set redemption-requests redemption-id
      (merge request { status: "completed" })
    )

    ;; Update redemption queue
    (let
      (
        (token (get token request))
        (reserves (unwrap! (map-get? collateral-reserves token) err-token-not-found))
      )
      (map-set collateral-reserves token
        (merge reserves {
          redemption-queue: (- (get redemption-queue reserves) (get amount request))
        })
      )
    )

    (ok true)
  )
)

;; Get balance for specific wrapped token
(define-public (get-wrapped-balance (user principal) (token (string-ascii 10)))
  (ok
    (if (is-eq token "wUSDC")
      (ft-get-balance wrapped-usdc user)
      (if (is-eq token "wUSDT")
        (ft-get-balance wrapped-usdt user)
        (if (is-eq token "wBTC")
          (ft-get-balance wrapped-btc user)
          (if (is-eq token "wETH")
            (ft-get-balance wrapped-eth user)
            u0
          )
        )
      )
    )
  )
)

;; Read-Only Functions

(define-read-only (get-collateral-info (token (string-ascii 10)))
  (map-get? collateral-reserves token)
)

(define-read-only (get-redemption-request (redemption-id uint))
  (map-get? redemption-requests redemption-id)
)

(define-read-only (get-total-minted (token (string-ascii 10)))
  (match (map-get? collateral-reserves token)
    reserves (ok (get total-minted reserves))
    (ok u0)
  )
)

(define-read-only (get-total-locked (token (string-ascii 10)))
  (match (map-get? collateral-reserves token)
    reserves (ok (get total-locked reserves))
    (ok u0)
  )
)

(define-read-only (get-redemption-queue-size (token (string-ascii 10)))
  (match (map-get? collateral-reserves token)
    reserves (ok (get redemption-queue reserves))
    (ok u0)
  )
)
