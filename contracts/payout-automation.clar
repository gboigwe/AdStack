;; Payout Automation - Clarity v4
;; Automated settlement with batching, performance-weighted distribution, and gas optimization

;; ===================================
;; Constants
;; ===================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u5000))
(define-constant ERR_PAYOUT_NOT_FOUND (err u5001))
(define-constant ERR_INSUFFICIENT_FUNDS (err u5002))
(define-constant ERR_ALREADY_PAID (err u5003))
(define-constant ERR_INVALID_RECIPIENT (err u5004))
(define-constant ERR_BATCH_FULL (err u5005))
(define-constant ERR_PERFORMANCE_TOO_LOW (err u5006))

;; Payout thresholds
(define-constant MIN_PAYOUT_AMOUNT u100000) ;; 0.1 STX
(define-constant MAX_BATCH_SIZE u50)
(define-constant MIN_PERFORMANCE_SCORE u50) ;; 50/100

;; ===================================
;; Data Variables
;; ===================================

(define-data-var payout-nonce uint u0)
(define-data-var batch-nonce uint u0)
(define-data-var total-paid-out uint u0)

;; ===================================
;; Data Maps
;; ===================================

;; Individual payouts
(define-map payouts
  { payout-id: uint }
  {
    campaign-id: uint,
    recipient: principal,
    amount: uint,
    performance-weight: uint, ;; Basis points (10000 = 100%)
    created-at: uint,
    scheduled-for: uint, ;; stacks-block-time
    paid-at: (optional uint),
    tx-id: (optional (buff 32)),
    status: (string-ascii 20) ;; pending, processing, completed, failed
  }
)

;; Payout batches for gas optimization
(define-map payout-batches
  { batch-id: uint }
  {
    campaign-id: uint,
    total-amount: uint,
    recipient-count: uint,
    created-at: uint,
    executed-at: (optional uint),
    status: (string-ascii 20)
  }
)

;; Batch recipients
(define-map batch-recipients
  { batch-id: uint, recipient-index: uint }
  {
    recipient: principal,
    amount: uint,
    paid: bool
  }
)

;; Publisher earnings tracking
(define-map publisher-earnings
  { campaign-id: uint, publisher: principal }
  {
    total-earned: uint,
    total-paid: uint,
    pending-payout: uint,
    last-payout: (optional uint),
    payout-count: uint
  }
)

;; Campaign payout summary
(define-map campaign-payouts
  { campaign-id: uint }
  {
    total-allocated: uint,
    total-paid: uint,
    pending-amount: uint,
    publisher-count: uint,
    last-payout: (optional uint)
  }
)

;; Performance-based payout rules
(define-map payout-rules
  { campaign-id: uint }
  {
    base-rate: uint, ;; Per view/click
    performance-multiplier: uint, ;; Basis points
    min-quality-score: uint,
    payout-frequency: uint ;; Seconds between payouts
  }
)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-payout (payout-id uint))
  (map-get? payouts { payout-id: payout-id })
)

(define-read-only (get-batch (batch-id uint))
  (map-get? payout-batches { batch-id: batch-id })
)

(define-read-only (get-publisher-earnings (campaign-id uint) (publisher principal))
  (map-get? publisher-earnings { campaign-id: campaign-id, publisher: publisher })
)

(define-read-only (get-campaign-payouts (campaign-id uint))
  (map-get? campaign-payouts { campaign-id: campaign-id })
)

(define-read-only (get-pending-payout (campaign-id uint) (publisher principal))
  (match (get-publisher-earnings campaign-id publisher)
    earnings (ok (get pending-payout earnings))
    (ok u0)
  )
)

(define-read-only (get-total-paid-out)
  (ok (var-get total-paid-out))
)

;; ===================================
;; Private Helper Functions
;; ===================================

(define-private (calculate-payout-amount
  (views uint)
  (clicks uint)
  (performance-score uint)
  (base-rate uint)
  (multiplier uint)
)
  (let
    (
      (base-amount (* (+ views clicks) base-rate))
      (performance-bonus (* base-amount multiplier))
      (total (+ base-amount (/ performance-bonus u10000)))
    )
    total
  )
)

;; ===================================
;; Public Functions
;; ===================================

;; Schedule payout for publisher
(define-public (schedule-payout
  (campaign-id uint)
  (recipient principal)
  (amount uint)
  (performance-weight uint)
  (schedule-delay uint)
)
  (let
    (
      (payout-id (var-get payout-nonce))
      (scheduled-time (+ stacks-block-time schedule-delay))
    )
    ;; Validate
    (asserts! (> amount MIN_PAYOUT_AMOUNT) ERR_INSUFFICIENT_FUNDS)
    (asserts! (<= performance-weight u10000) ERR_UNAUTHORIZED)

    ;; Create payout
    (map-set payouts
      { payout-id: payout-id }
      {
        campaign-id: campaign-id,
        recipient: recipient,
        amount: amount,
        performance-weight: performance-weight,
        created-at: stacks-block-time,
        scheduled-for: scheduled-time,
        paid-at: none,
        tx-id: none,
        status: "pending"
      }
    )

    ;; Update publisher earnings
    (update-publisher-pending campaign-id recipient amount)

    ;; Increment nonce
    (var-set payout-nonce (+ payout-id u1))

    (ok payout-id)
  )
)

;; Update publisher pending amount
(define-private (update-publisher-pending (campaign-id uint) (publisher principal) (amount uint))
  (let
    (
      (current (default-to {
        total-earned: u0,
        total-paid: u0,
        pending-payout: u0,
        last-payout: none,
        payout-count: u0
      } (get-publisher-earnings campaign-id publisher)))
    )
    (map-set publisher-earnings
      { campaign-id: campaign-id, publisher: publisher }
      (merge current {
        total-earned: (+ (get total-earned current) amount),
        pending-payout: (+ (get pending-payout current) amount)
      })
    )
  )
)

;; Execute single payout
(define-public (execute-payout (payout-id uint))
  (let
    (
      (payout (unwrap! (get-payout payout-id) ERR_PAYOUT_NOT_FOUND))
      (amount (get amount payout))
      (recipient (get recipient payout))
    )
    ;; Validate
    (asserts! (>= stacks-block-time (get scheduled-for payout)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status payout) "pending") ERR_ALREADY_PAID)

    ;; Transfer funds
    ;; TODO: Fix as-contract - clarinet v3.11 parser issue with Clarity v4
    ;; (try! (as-contract (stx-transfer? amount tx-sender recipient)))

    ;; Update payout status
    (map-set payouts
      { payout-id: payout-id }
      (merge payout {
        paid-at: (some stacks-block-time),
        status: "completed"
      })
    )

    ;; Update publisher earnings
    (update-publisher-paid (get campaign-id payout) recipient amount)

    ;; Update total paid
    (var-set total-paid-out (+ (var-get total-paid-out) amount))

    (ok true)
  )
)

;; Update publisher paid amount
(define-private (update-publisher-paid (campaign-id uint) (publisher principal) (amount uint))
  (let
    (
      (current (unwrap-panic (get-publisher-earnings campaign-id publisher)))
    )
    (map-set publisher-earnings
      { campaign-id: campaign-id, publisher: publisher }
      (merge current {
        total-paid: (+ (get total-paid current) amount),
        pending-payout: (- (get pending-payout current) amount),
        last-payout: (some stacks-block-time),
        payout-count: (+ (get payout-count current) u1)
      })
    )
  )
)

;; Create payout batch
(define-public (create-payout-batch
  (campaign-id uint)
  (recipients (list 50 { recipient: principal, amount: uint }))
)
  (let
    (
      (batch-id (var-get batch-nonce))
      (total-amount (fold sum-amounts recipients u0))
      (recipient-count (len recipients))
    )
    ;; Validate
    (asserts! (<= recipient-count MAX_BATCH_SIZE) ERR_BATCH_FULL)

    ;; Create batch
    (map-set payout-batches
      { batch-id: batch-id }
      {
        campaign-id: campaign-id,
        total-amount: total-amount,
        recipient-count: recipient-count,
        created-at: stacks-block-time,
        executed-at: none,
        status: "pending"
      }
    )

    ;; Add recipients
    (map add-batch-recipient recipients batch-id)

    ;; Increment nonce
    (var-set batch-nonce (+ batch-id u1))

    (ok batch-id)
  )
)

;; Helper to sum amounts
(define-private (sum-amounts (item { recipient: principal, amount: uint }) (total uint))
  (+ total (get amount item))
)

;; Helper to add batch recipient
(define-private (add-batch-recipient (item { recipient: principal, amount: uint }) (batch-id uint))
  (let
    (
      (index u0) ;; TODO: Track proper index
    )
    (map-set batch-recipients
      { batch-id: batch-id, recipient-index: index }
      {
        recipient: (get recipient item),
        amount: (get amount item),
        paid: false
      }
    )
    true
  )
)

;; Execute payout batch
(define-public (execute-batch (batch-id uint))
  (let
    (
      (batch (unwrap! (get-batch batch-id) ERR_PAYOUT_NOT_FOUND))
    )
    ;; Validate
    (asserts! (is-eq (get status batch) "pending") ERR_ALREADY_PAID)

    ;; TODO: Execute all payments in batch
    ;; For now, mark as completed
    (map-set payout-batches
      { batch-id: batch-id }
      (merge batch {
        executed-at: (some stacks-block-time),
        status: "completed"
      })
    )

    (ok true)
  )
)

;; Calculate and schedule performance-based payout
(define-public (calculate-performance-payout
  (campaign-id uint)
  (publisher principal)
  (views uint)
  (clicks uint)
  (quality-score uint)
)
  (let
    (
      (rules (unwrap! (map-get? payout-rules { campaign-id: campaign-id }) ERR_PAYOUT_NOT_FOUND))
      (base-rate (get base-rate rules))
      (multiplier (get performance-multiplier rules))
      (min-quality (get min-quality-score rules))
      (payout-amount (calculate-payout-amount views clicks quality-score base-rate multiplier))
    )
    ;; Validate quality
    (asserts! (>= quality-score min-quality) ERR_PERFORMANCE_TOO_LOW)

    ;; Schedule payout
    (schedule-payout
      campaign-id
      publisher
      payout-amount
      quality-score
      (get payout-frequency rules)
    )
  )
)

;; Set payout rules for campaign
(define-public (set-payout-rules
  (campaign-id uint)
  (base-rate uint)
  (performance-multiplier uint)
  (min-quality-score uint)
  (payout-frequency uint)
)
  (begin
    ;; TODO: Add campaign owner authorization
    (map-set payout-rules
      { campaign-id: campaign-id }
      {
        base-rate: base-rate,
        performance-multiplier: performance-multiplier,
        min-quality-score: min-quality-score,
        payout-frequency: payout-frequency
      }
    )

    (ok true)
  )
)

;; Claim pending payout (publisher-initiated)
(define-public (claim-payout (campaign-id uint))
  (let
    (
      (earnings (unwrap! (get-publisher-earnings campaign-id tx-sender) ERR_PAYOUT_NOT_FOUND))
      (pending (get pending-payout earnings))
    )
    ;; Validate
    (asserts! (>= pending MIN_PAYOUT_AMOUNT) ERR_INSUFFICIENT_FUNDS)

    ;; Create immediate payout
    (schedule-payout campaign-id tx-sender pending u10000 u0)
  )
)

;; Administrative functions
(define-public (cancel-payout (payout-id uint))
  (let
    (
      (payout (unwrap! (get-payout payout-id) ERR_PAYOUT_NOT_FOUND))
    )
    ;; Only contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status payout) "pending") ERR_ALREADY_PAID)

    ;; Update status
    (map-set payouts
      { payout-id: payout-id }
      (merge payout { status: "cancelled" })
    )

    (ok true)
  )
)
