;; Refund Processor - Clarity v4
;; Handle conditional refunds with pro-rata calculations and fraud slashing

;; ===================================
;; Constants
;; ===================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u7000))
(define-constant ERR_REFUND_NOT_FOUND (err u7001))
(define-constant ERR_ALREADY_PROCESSED (err u7002))
(define-constant ERR_INSUFFICIENT_BALANCE (err u7003))
(define-constant ERR_INVALID_REASON (err u7004))
(define-constant ERR_PENALTY_TOO_HIGH (err u7005))
(define-constant ERR_DISPUTE_REQUIRED (err u7006))

;; Refund reasons
(define-constant REFUND_CAMPAIGN_CANCELLED u0)
(define-constant REFUND_PERFORMANCE_FAILED u1)
(define-constant REFUND_FRAUD_DETECTED u2)
(define-constant REFUND_DISPUTE_RESOLVED u3)
(define-constant REFUND_EARLY_TERMINATION u4)

;; Slashing percentages (basis points)
(define-constant FRAUD_SLASH_RATE u5000) ;; 50%
(define-constant POOR_PERFORMANCE_SLASH u1000) ;; 10%
(define-constant MAX_SLASH_RATE u7500) ;; 75%

;; ===================================
;; Data Variables
;; ===================================

(define-data-var refund-nonce uint u0)
(define-data-var total-refunded uint u0)
(define-data-var total-slashed uint u0)

;; ===================================
;; Data Maps
;; ===================================

;; Refund requests
(define-map refunds
  { refund-id: uint }
  {
    campaign-id: uint,
    requester: principal,
    amount-requested: uint,
    amount-approved: uint,
    refund-reason: uint,
    penalty-rate: uint, ;; Basis points
    slashed-amount: uint,
    created-at: uint,
    processed-at: (optional uint),
    status: (string-ascii 20), ;; pending, approved, processed, rejected
    evidence-uri: (optional (string-ascii 256))
  }
)

;; Pro-rata refund calculations
(define-map prorata-refunds
  { campaign-id: uint }
  {
    total-budget: uint,
    amount-spent: uint,
    amount-refundable: uint,
    time-elapsed: uint,
    total-duration: uint,
    performance-delivered: uint, ;; Percentage
    calculated-at: uint
  }
)

;; Penalty assessments
(define-map penalty-assessments
  { campaign-id: uint, publisher: principal }
  {
    total-earned: uint,
    penalty-amount: uint,
    penalty-reason: (string-ascii 100),
    assessed-at: uint,
    applied: bool
  }
)

;; Dispute-based refunds
(define-map dispute-refunds
  { dispute-id: uint }
  {
    campaign-id: uint,
    claimant: principal,
    defendant: principal,
    requested-amount: uint,
    awarded-amount: uint,
    ruling: (optional (string-ascii 200)),
    processed: bool
  }
)

;; Slashing history
(define-map slashing-history
  { slash-id: uint }
  {
    campaign-id: uint,
    slashed-party: principal,
    amount: uint,
    reason: (string-ascii 100),
    timestamp: uint
  }
)

(define-data-var slash-nonce uint u0)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-refund (refund-id uint))
  (map-get? refunds { refund-id: refund-id })
)

(define-read-only (get-prorata-refund (campaign-id uint))
  (map-get? prorata-refunds { campaign-id: campaign-id })
)

(define-read-only (get-penalty-assessment (campaign-id uint) (publisher principal))
  (map-get? penalty-assessments { campaign-id: campaign-id, publisher: publisher })
)

(define-read-only (get-total-refunded)
  (ok (var-get total-refunded))
)

(define-read-only (get-total-slashed)
  (ok (var-get total-slashed))
)

;; ===================================
;; Private Helper Functions
;; ===================================

(define-private (calculate-prorata-amount
  (total-budget uint)
  (amount-spent uint)
  (time-elapsed uint)
  (total-duration uint)
)
  (let
    (
      (time-based-refund (- total-budget (/ (* total-budget time-elapsed) total-duration)))
      (usage-based-refund (- total-budget amount-spent))
      (refundable (if (< time-based-refund usage-based-refund)
        time-based-refund
        usage-based-refund
      ))
    )
    refundable
  )
)

(define-private (calculate-slash-amount (amount uint) (slash-rate uint))
  (/ (* amount slash-rate) u10000)
)

;; ===================================
;; Public Functions
;; ===================================

;; Request refund
(define-public (request-refund
  (campaign-id uint)
  (amount-requested uint)
  (refund-reason uint)
  (evidence-uri (optional (string-ascii 256)))
)
  (let
    (
      (refund-id (var-get refund-nonce))
    )
    ;; Validate reason
    (asserts! (<= refund-reason REFUND_EARLY_TERMINATION) ERR_INVALID_REASON)

    ;; Create refund request
    (map-set refunds
      { refund-id: refund-id }
      {
        campaign-id: campaign-id,
        requester: tx-sender,
        amount-requested: amount-requested,
        amount-approved: u0,
        refund-reason: refund-reason,
        penalty-rate: u0,
        slashed-amount: u0,
        created-at: stacks-block-time,
        processed-at: none,
        status: "pending",
        evidence-uri: evidence-uri
      }
    )

    ;; Increment nonce
    (var-set refund-nonce (+ refund-id u1))

    (ok refund-id)
  )
)

;; Calculate pro-rata refund
(define-public (calculate-prorata-refund
  (campaign-id uint)
  (total-budget uint)
  (amount-spent uint)
  (time-elapsed uint)
  (total-duration uint)
  (performance-delivered uint)
)
  (let
    (
      (refundable (calculate-prorata-amount total-budget amount-spent time-elapsed total-duration))
    )
    ;; Store calculation
    (map-set prorata-refunds
      { campaign-id: campaign-id }
      {
        total-budget: total-budget,
        amount-spent: amount-spent,
        amount-refundable: refundable,
        time-elapsed: time-elapsed,
        total-duration: total-duration,
        performance-delivered: performance-delivered,
        calculated-at: stacks-block-time
      }
    )

    (ok refundable)
  )
)

;; Process refund with penalty deduction
(define-public (process-refund (refund-id uint) (approved-amount uint) (penalty-rate uint))
  (let
    (
      (refund (unwrap! (get-refund refund-id) ERR_REFUND_NOT_FOUND))
      (requester (get requester refund))
      (slashed (calculate-slash-amount approved-amount penalty-rate))
      (net-refund (- approved-amount slashed))
    )
    ;; Validate
    (asserts! (is-eq (get status refund) "pending") ERR_ALREADY_PROCESSED)
    (asserts! (<= penalty-rate MAX_SLASH_RATE) ERR_PENALTY_TOO_HIGH)

    ;; Transfer net refund from contract to requester
    ;; TODO: Fix as-contract - clarinet v3.11 parser issue with Clarity v4
    ;; (unwrap! (as-contract (stx-transfer? net-refund tx-sender requester)) ERR_TRANSFER_FAILED)

    ;; Update refund
    (map-set refunds
      { refund-id: refund-id }
      (merge refund {
        amount-approved: approved-amount,
        penalty-rate: penalty-rate,
        slashed-amount: slashed,
        processed-at: (some stacks-block-time),
        status: "processed"
      })
    )

    ;; Update totals
    (var-set total-refunded (+ (var-get total-refunded) net-refund))
    (var-set total-slashed (+ (var-get total-slashed) slashed))

    (ok net-refund)
  )
)

;; Process fraud-based refund with maximum slashing
(define-public (process-fraud-refund (refund-id uint))
  (let
    (
      (refund (unwrap! (get-refund refund-id) ERR_REFUND_NOT_FOUND))
    )
    ;; Validate fraud reason
    (asserts! (is-eq (get refund-reason refund) REFUND_FRAUD_DETECTED) ERR_INVALID_REASON)

    ;; Process with fraud slash rate
    (process-refund refund-id (get amount-requested refund) FRAUD_SLASH_RATE)
  )
)

;; Assess penalty on publisher
(define-public (assess-penalty
  (campaign-id uint)
  (publisher principal)
  (total-earned uint)
  (penalty-amount uint)
  (reason (string-ascii 100))
)
  (begin
    ;; Validate
    (asserts! (<= penalty-amount total-earned) ERR_PENALTY_TOO_HIGH)

    ;; Record assessment
    (map-set penalty-assessments
      { campaign-id: campaign-id, publisher: publisher }
      {
        total-earned: total-earned,
        penalty-amount: penalty-amount,
        penalty-reason: reason,
        assessed-at: stacks-block-time,
        applied: false
      }
    )

    (ok true)
  )
)

;; Apply assessed penalty
(define-public (apply-penalty (campaign-id uint) (publisher principal))
  (let
    (
      (assessment (unwrap! (get-penalty-assessment campaign-id publisher) ERR_REFUND_NOT_FOUND))
      (penalty (get penalty-amount assessment))
    )
    ;; Validate
    (asserts! (not (get applied assessment)) ERR_ALREADY_PROCESSED)

    ;; Deduct penalty from publisher earnings
    ;; TODO: Integrate with payout-automation contract

    ;; Mark as applied
    (map-set penalty-assessments
      { campaign-id: campaign-id, publisher: publisher }
      (merge assessment { applied: true })
    )

    ;; Record slashing
    (record-slash campaign-id publisher penalty (get penalty-reason assessment))

    (ok true)
  )
)

;; Record slashing event
(define-private (record-slash
  (campaign-id uint)
  (slashed-party principal)
  (amount uint)
  (reason (string-ascii 100))
)
  (let
    (
      (slash-id (var-get slash-nonce))
    )
    (map-set slashing-history
      { slash-id: slash-id }
      {
        campaign-id: campaign-id,
        slashed-party: slashed-party,
        amount: amount,
        reason: reason,
        timestamp: stacks-block-time
      }
    )

    (var-set slash-nonce (+ slash-id u1))
    (var-set total-slashed (+ (var-get total-slashed) amount))
    (ok true)
  )
)

;; Process dispute-based refund
(define-public (process-dispute-refund
  (dispute-id uint)
  (campaign-id uint)
  (claimant principal)
  (defendant principal)
  (awarded-amount uint)
  (ruling (string-ascii 200))
)
  (begin
    ;; TODO: Add dispute resolution contract authorization

    ;; Record dispute refund
    (map-set dispute-refunds
      { dispute-id: dispute-id }
      {
        campaign-id: campaign-id,
        claimant: claimant,
        defendant: defendant,
        requested-amount: awarded-amount,
        awarded-amount: awarded-amount,
        ruling: (some ruling),
        processed: false
      }
    )

    ;; Execute refund
    ;; TODO: Fix as-contract - clarinet v3.11 parser issue with Clarity v4
    ;; (try! (as-contract (stx-transfer? awarded-amount tx-sender claimant)))

    ;; Mark as processed
    (map-set dispute-refunds
      { dispute-id: dispute-id }
      (merge (unwrap-panic (map-get? dispute-refunds { dispute-id: dispute-id })) {
        processed: true
      })
    )

    (ok true)
  )
)

;; Partial refund for early termination
(define-public (process-early-termination-refund
  (campaign-id uint)
  (total-budget uint)
  (amount-spent uint)
  (blocks-elapsed uint)
  (total-blocks uint)
)
  (let
    (
      (time-based (/ (* total-budget blocks-elapsed) total-blocks))
      (usage-based amount-spent)
      (charged (if (> time-based usage-based) time-based usage-based))
      (refundable (- total-budget charged))
      (refund-id (var-get refund-nonce))
    )
    ;; Create and process refund
    (try! (request-refund campaign-id refundable REFUND_EARLY_TERMINATION none))
    (process-refund refund-id refundable u0) ;; No penalty for early termination
  )
)

;; Approve refund request
(define-public (approve-refund (refund-id uint) (approved-amount uint))
  (let
    (
      (refund (unwrap! (get-refund refund-id) ERR_REFUND_NOT_FOUND))
    )
    ;; Only contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)

    ;; Update status
    (map-set refunds
      { refund-id: refund-id }
      (merge refund {
        amount-approved: approved-amount,
        status: "approved"
      })
    )

    (ok true)
  )
)

;; Reject refund request
(define-public (reject-refund (refund-id uint))
  (let
    (
      (refund (unwrap! (get-refund refund-id) ERR_REFUND_NOT_FOUND))
    )
    ;; Only contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)

    ;; Update status
    (map-set refunds
      { refund-id: refund-id }
      (merge refund { status: "rejected" })
    )

    (ok true)
  )
)
