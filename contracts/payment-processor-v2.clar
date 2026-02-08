;; Payment Processor V2
;; Multi-token payment support with auto-conversion and fee distribution

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u600))
(define-constant err-not-authorized (err u601))
(define-constant err-invalid-amount (err u602))
(define-constant err-token-not-whitelisted (err u603))
(define-constant err-payment-not-found (err u604))
(define-constant err-payment-already-processed (err u605))
(define-constant err-insufficient-balance (err u606))
(define-constant err-conversion-failed (err u607))
(define-constant err-invalid-recipient (err u608))

;; Platform fee: 2.5% = 250 basis points
(define-constant platform-fee-bps u250)

;; Data Variables
(define-data-var payment-admin principal contract-owner)
(define-data-var treasury-address principal contract-owner)
(define-data-var auto-conversion-enabled bool true)
(define-data-var next-payment-id uint u1)

;; Whitelisted tokens for payments
(define-map whitelisted-tokens
  (string-ascii 10) ;; token symbol
  {
    enabled: bool,
    min-amount: uint,
    conversion-rate: uint, ;; rate to STX (in basis points)
    daily-volume: uint,
    daily-limit: uint
  }
)

;; Payment records
(define-map payments
  uint ;; payment-id
  {
    payer: principal,
    recipient: principal,
    token: (string-ascii 10),
    amount: uint,
    stx-equivalent: uint,
    fee-charged: uint,
    status: (string-ascii 16), ;; "pending", "processing", "completed", "failed"
    created-at: uint,
    processed-at: (optional uint)
  }
)

;; User payment history
(define-map user-payment-count
  principal
  {
    total-payments: uint,
    total-spent: uint,
    last-payment: uint
  }
)

;; Token balances in escrow
(define-map escrow-balances
  { token: (string-ascii 10), user: principal }
  uint
)

;; Daily volume tracking per token
(define-map daily-volumes
  { token: (string-ascii 10), day: uint }
  uint
)

;; Revenue tracking
(define-map revenue-stats
  (string-ascii 10) ;; token
  {
    total-fees-collected: uint,
    total-volume: uint,
    payment-count: uint
  }
)

;; Admin Functions

(define-public (set-payment-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get payment-admin)) err-owner-only)
    (ok (var-set payment-admin new-admin))
  )
)

(define-public (set-treasury-address (new-treasury principal))
  (begin
    (asserts! (is-eq tx-sender (var-get payment-admin)) err-owner-only)
    (ok (var-set treasury-address new-treasury))
  )
)

(define-public (toggle-auto-conversion (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get payment-admin)) err-owner-only)
    (ok (var-set auto-conversion-enabled enabled))
  )
)

;; Whitelist management
(define-public (add-token-to-whitelist
  (token (string-ascii 10))
  (min-amount uint)
  (conversion-rate uint)
  (daily-limit uint)
)
  (begin
    (asserts! (is-eq tx-sender (var-get payment-admin)) err-owner-only)
    (asserts! (> conversion-rate u0) err-invalid-amount)
    (ok (map-set whitelisted-tokens token {
      enabled: true,
      min-amount: min-amount,
      conversion-rate: conversion-rate,
      daily-volume: u0,
      daily-limit: daily-limit
    }))
  )
)

(define-public (remove-token-from-whitelist (token (string-ascii 10)))
  (begin
    (asserts! (is-eq tx-sender (var-get payment-admin)) err-owner-only)
    (ok (map-delete whitelisted-tokens token))
  )
)

(define-public (update-conversion-rate (token (string-ascii 10)) (new-rate uint))
  (let
    (
      (token-info (unwrap! (map-get? whitelisted-tokens token) err-token-not-whitelisted))
    )
    (asserts! (is-eq tx-sender (var-get payment-admin)) err-owner-only)
    (asserts! (> new-rate u0) err-invalid-amount)
    (ok (map-set whitelisted-tokens token
      (merge token-info { conversion-rate: new-rate })
    ))
  )
)

;; Payment Functions

;; Process payment in any whitelisted token
(define-public (process-payment
  (recipient principal)
  (token (string-ascii 10))
  (amount uint)
)
  (let
    (
      (payment-id (var-get next-payment-id))
      (token-info (unwrap! (map-get? whitelisted-tokens token) err-token-not-whitelisted))
      (current-day (/ block-height u144)) ;; Approximate blocks per day
    )
    ;; Validations
    (asserts! (get enabled token-info) err-token-not-whitelisted)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= amount (get min-amount token-info)) err-invalid-amount)
    (asserts! (not (is-eq recipient tx-sender)) err-invalid-recipient)

    ;; Check daily limit
    (let
      (
        (daily-vol (default-to u0
          (map-get? daily-volumes { token: token, day: current-day })
        ))
      )
      (asserts!
        (<= (+ daily-vol amount) (get daily-limit token-info))
        err-invalid-amount
      )

      ;; Calculate STX equivalent and fees
      (let
        (
          (stx-equivalent (convert-to-stx amount (get conversion-rate token-info)))
          (fee (calculate-fee amount))
          (net-amount (- amount fee))
        )
        ;; Create payment record
        (map-set payments payment-id {
          payer: tx-sender,
          recipient: recipient,
          token: token,
          amount: amount,
          stx-equivalent: stx-equivalent,
          fee-charged: fee,
          status: "pending",
          created-at: block-height,
          processed-at: none
        })

        ;; Update user payment history
        (let
          (
            (user-stats (default-to
              { total-payments: u0, total-spent: u0, last-payment: u0 }
              (map-get? user-payment-count tx-sender)
            ))
          )
          (map-set user-payment-count tx-sender {
            total-payments: (+ (get total-payments user-stats) u1),
            total-spent: (+ (get total-spent user-stats) amount),
            last-payment: block-height
          })
        )

        ;; Update daily volume
        (map-set daily-volumes
          { token: token, day: current-day }
          (+ daily-vol amount)
        )

        ;; Update revenue stats
        (let
          (
            (revenue (default-to
              { total-fees-collected: u0, total-volume: u0, payment-count: u0 }
              (map-get? revenue-stats token)
            ))
          )
          (map-set revenue-stats token {
            total-fees-collected: (+ (get total-fees-collected revenue) fee),
            total-volume: (+ (get total-volume revenue) amount),
            payment-count: (+ (get payment-count revenue) u1)
          })
        )

        ;; Transfer fee to treasury
        (try! (transfer-tokens token fee tx-sender (var-get treasury-address)))

        ;; Transfer net amount to recipient
        (try! (transfer-tokens token net-amount tx-sender recipient))

        ;; Mark as completed
        (map-set payments payment-id
          (merge (unwrap-panic (map-get? payments payment-id)) {
            status: "completed",
            processed-at: (some block-height)
          })
        )

        (var-set next-payment-id (+ payment-id u1))
        (ok payment-id)
      )
    )
  )
)

;; Deposit tokens to escrow
(define-public (deposit-to-escrow
  (token (string-ascii 10))
  (amount uint)
)
  (let
    (
      (token-info (unwrap! (map-get? whitelisted-tokens token) err-token-not-whitelisted))
      (current-balance (default-to u0
        (map-get? escrow-balances { token: token, user: tx-sender })
      ))
    )
    (asserts! (get enabled token-info) err-token-not-whitelisted)
    (asserts! (> amount u0) err-invalid-amount)

    ;; Transfer tokens to contract
    (try! (transfer-tokens token amount tx-sender (as-contract tx-sender)))

    ;; Update escrow balance
    (ok (map-set escrow-balances
      { token: token, user: tx-sender }
      (+ current-balance amount)
    ))
  )
)

;; Withdraw from escrow
(define-public (withdraw-from-escrow
  (token (string-ascii 10))
  (amount uint)
)
  (let
    (
      (current-balance (default-to u0
        (map-get? escrow-balances { token: token, user: tx-sender })
      ))
    )
    (asserts! (>= current-balance amount) err-insufficient-balance)
    (asserts! (> amount u0) err-invalid-amount)

    ;; Update escrow balance
    (map-set escrow-balances
      { token: token, user: tx-sender }
      (- current-balance amount)
    )

    ;; Transfer tokens from contract
    (as-contract (transfer-tokens token amount tx-sender (var-get payment-admin)))
  )
)

;; Pay from escrow balance
(define-public (pay-from-escrow
  (recipient principal)
  (token (string-ascii 10))
  (amount uint)
)
  (let
    (
      (escrow-balance (default-to u0
        (map-get? escrow-balances { token: token, user: tx-sender })
      ))
      (fee (calculate-fee amount))
      (total-needed (+ amount fee))
    )
    (asserts! (>= escrow-balance total-needed) err-insufficient-balance)
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (not (is-eq recipient tx-sender)) err-invalid-recipient)

    ;; Deduct from escrow
    (map-set escrow-balances
      { token: token, user: tx-sender }
      (- escrow-balance total-needed)
    )

    ;; Process payment (simplified, no double fee)
    (let
      (
        (payment-id (var-get next-payment-id))
        (token-info (unwrap! (map-get? whitelisted-tokens token) err-token-not-whitelisted))
        (stx-equivalent (convert-to-stx amount (get conversion-rate token-info)))
      )
      ;; Create payment record
      (map-set payments payment-id {
        payer: tx-sender,
        recipient: recipient,
        token: token,
        amount: amount,
        stx-equivalent: stx-equivalent,
        fee-charged: fee,
        status: "completed",
        created-at: block-height,
        processed-at: (some block-height)
      })

      ;; Transfer from contract to recipient
      (try! (as-contract (transfer-tokens token amount tx-sender recipient)))

      ;; Transfer fee to treasury
      (try! (as-contract (transfer-tokens token fee tx-sender (var-get treasury-address))))

      (var-set next-payment-id (+ payment-id u1))
      (ok payment-id)
    )
  )
)

;; Helper Functions

;; Calculate platform fee
(define-private (calculate-fee (amount uint))
  (/ (* amount platform-fee-bps) u10000)
)

;; Convert amount to STX equivalent
(define-private (convert-to-stx (amount uint) (rate uint))
  (/ (* amount rate) u10000)
)

;; Generic token transfer helper (simplified for demo)
(define-private (transfer-tokens
  (token (string-ascii 10))
  (amount uint)
  (sender principal)
  (recipient principal)
)
  ;; In production, this would call actual token contracts
  ;; For now, we'll return success
  (ok true)
)

;; Batch payment processing
(define-public (batch-process-payments
  (recipients (list 10 principal))
  (token (string-ascii 10))
  (amounts (list 10 uint))
)
  (begin
    (asserts! (is-eq tx-sender (var-get payment-admin)) err-not-authorized)
    ;; TODO: Implement batch processing logic
    (ok true)
  )
)

;; Read-Only Functions

(define-read-only (get-payment-info (payment-id uint))
  (map-get? payments payment-id)
)

(define-read-only (get-token-info (token (string-ascii 10)))
  (map-get? whitelisted-tokens token)
)

(define-read-only (is-token-whitelisted (token (string-ascii 10)))
  (match (map-get? whitelisted-tokens token)
    info (get enabled info)
    false
  )
)

(define-read-only (get-escrow-balance (user principal) (token (string-ascii 10)))
  (ok (default-to u0 (map-get? escrow-balances { token: token, user: user })))
)

(define-read-only (get-user-payment-stats (user principal))
  (map-get? user-payment-count user)
)

(define-read-only (get-revenue-stats (token (string-ascii 10)))
  (map-get? revenue-stats token)
)

(define-read-only (get-daily-volume (token (string-ascii 10)) (day uint))
  (ok (default-to u0 (map-get? daily-volumes { token: token, day: day })))
)

(define-read-only (estimate-payment-cost
  (token (string-ascii 10))
  (amount uint)
)
  (match (map-get? whitelisted-tokens token)
    token-info
      (let
        (
          (fee (calculate-fee amount))
          (stx-equivalent (convert-to-stx amount (get conversion-rate token-info)))
        )
        (ok {
          total-cost: (+ amount fee),
          fee: fee,
          net-amount: amount,
          stx-equivalent: stx-equivalent
        })
      )
    (err err-token-not-whitelisted)
  )
)

(define-read-only (get-current-day)
  (ok (/ block-height u144))
)

(define-read-only (get-treasury-address)
  (ok (var-get treasury-address))
)

(define-read-only (is-auto-conversion-enabled)
  (ok (var-get auto-conversion-enabled))
)
