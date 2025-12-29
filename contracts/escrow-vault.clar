;; Escrow Vault - Clarity v4
;; Advanced escrow with time-locked funds, performance triggers, and multi-party approval

;; ===================================
;; Constants
;; ===================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u2000))
(define-constant ERR_ESCROW_NOT_FOUND (err u2001))
(define-constant ERR_INSUFFICIENT_BALANCE (err u2002))
(define-constant ERR_TIME_LOCK_ACTIVE (err u2003))
(define-constant ERR_APPROVAL_REQUIRED (err u2004))
(define-constant ERR_ALREADY_RELEASED (err u2005))
(define-constant ERR_INVALID_AMOUNT (err u2006))
(define-constant ERR_ESCROW_EXPIRED (err u2007))

;; Escrow states
(define-constant ESCROW_PENDING u0)
(define-constant ESCROW_LOCKED u1)
(define-constant ESCROW_RELEASED u2)
(define-constant ESCROW_REFUNDED u3)
(define-constant ESCROW_PARTIALLY_RELEASED u4)

;; ===================================
;; Data Variables
;; ===================================

(define-data-var escrow-nonce uint u0)
(define-data-var min-approval-threshold uint u1) ;; Minimum approvals needed

;; ===================================
;; Data Maps
;; ===================================

;; Main escrow data
(define-map escrows
  { escrow-id: uint }
  {
    campaign-id: uint,
    depositor: principal,
    beneficiary: principal,
    amount: uint,
    locked-amount: uint,
    released-amount: uint,
    refunded-amount: uint,
    state: uint,
    time-lock-until: uint, ;; Unix timestamp
    performance-threshold: uint, ;; Minimum performance to unlock (percentage)
    created-at: uint, ;; stacks-block-time
    locked-at: (optional uint),
    released-at: (optional uint),
    expires-at: uint, ;; stacks-block-time
    metadata-uri: (optional (string-ascii 256))
  }
)

;; Approval tracking for multi-party releases
(define-map escrow-approvals
  { escrow-id: uint, approver: principal }
  { approved: bool, timestamp: uint }
)

;; Count approvals
(define-map escrow-approval-count
  { escrow-id: uint }
  { count: uint }
)

;; Required approvers list
(define-map required-approvers
  { escrow-id: uint, approver: principal }
  { required: bool }
)

;; Performance metrics (updated by oracle)
(define-map escrow-performance
  { escrow-id: uint }
  {
    current-performance: uint, ;; Percentage (0-100)
    views-delivered: uint,
    clicks-delivered: uint,
    last-updated: uint
  }
)

;; Release schedule for time-locked releases
(define-map release-schedule
  { escrow-id: uint, release-index: uint }
  {
    amount: uint,
    unlock-at: uint,
    released: bool,
    released-at: (optional uint)
  }
)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-escrow (escrow-id uint))
  (map-get? escrows { escrow-id: escrow-id })
)

(define-read-only (get-escrow-balance (escrow-id uint))
  (match (get-escrow escrow-id)
    escrow (ok (get locked-amount escrow))
    ERR_ESCROW_NOT_FOUND
  )
)

(define-read-only (get-approval-status (escrow-id uint) (approver principal))
  (map-get? escrow-approvals { escrow-id: escrow-id, approver: approver })
)

(define-read-only (get-approval-count (escrow-id uint))
  (default-to
    { count: u0 }
    (map-get? escrow-approval-count { escrow-id: escrow-id })
  )
)

(define-read-only (is-approver-required (escrow-id uint) (approver principal))
  (default-to
    { required: false }
    (map-get? required-approvers { escrow-id: escrow-id, approver: approver })
  )
)

(define-read-only (get-performance-metrics (escrow-id uint))
  (map-get? escrow-performance { escrow-id: escrow-id })
)

(define-read-only (can-release (escrow-id uint))
  (match (get-escrow escrow-id)
    escrow
      (let
        (
          (is-time-unlocked (>= stacks-block-time (get time-lock-until escrow)))
          (has-approvals (>= (get count (get-approval-count escrow-id)) (var-get min-approval-threshold)))
          (performance-met (match (get-performance-metrics escrow-id)
            perf (>= (get current-performance perf) (get performance-threshold escrow))
            true ;; No performance requirement
          ))
        )
        (ok (and is-time-unlocked (and has-approvals performance-met)))
      )
    ERR_ESCROW_NOT_FOUND
  )
)

;; ===================================
;; Public Functions
;; ===================================

;; Create escrow
(define-public (create-escrow
  (campaign-id uint)
  (beneficiary principal)
  (amount uint)
  (time-lock-duration uint) ;; seconds
  (performance-threshold uint)
  (expires-in uint) ;; seconds
  (required-approvers-list (list 10 principal))
)
  (let
    (
      (escrow-id (var-get escrow-nonce))
      (time-lock-until (+ stacks-block-time time-lock-duration))
      (expires-at (+ stacks-block-time expires-in))
    )
    ;; Validate
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (<= performance-threshold u100) ERR_INVALID_AMOUNT)

    ;; Transfer funds to escrow
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    ;; Create escrow
    (map-set escrows
      { escrow-id: escrow-id }
      {
        campaign-id: campaign-id,
        depositor: tx-sender,
        beneficiary: beneficiary,
        amount: amount,
        locked-amount: amount,
        released-amount: u0,
        refunded-amount: u0,
        state: ESCROW_LOCKED,
        time-lock-until: time-lock-until,
        performance-threshold: performance-threshold,
        created-at: stacks-block-time,
        locked-at: (some stacks-block-time),
        released-at: none,
        expires-at: expires-at,
        metadata-uri: none
      }
    )

    ;; Set required approvers
    (map set-required-approver required-approvers-list escrow-id)

    ;; Initialize approval count
    (map-set escrow-approval-count
      { escrow-id: escrow-id }
      { count: u0 }
    )

    ;; Increment nonce
    (var-set escrow-nonce (+ escrow-id u1))

    (ok escrow-id)
  )
)

;; Helper to set required approvers
(define-private (set-required-approver (approver principal) (escrow-id uint))
  (map-set required-approvers
    { escrow-id: escrow-id, approver: approver }
    { required: true }
  )
)

;; Approve escrow release
(define-public (approve-release (escrow-id uint))
  (let
    (
      (escrow (unwrap! (get-escrow escrow-id) ERR_ESCROW_NOT_FOUND))
      (is-required (get required (is-approver-required escrow-id tx-sender)))
      (current-count (get count (get-approval-count escrow-id)))
    )
    ;; Validate
    (asserts! is-required ERR_UNAUTHORIZED)
    (asserts! (not (is-eq (get state escrow) ESCROW_RELEASED)) ERR_ALREADY_RELEASED)

    ;; Record approval
    (map-set escrow-approvals
      { escrow-id: escrow-id, approver: tx-sender }
      { approved: true, timestamp: stacks-block-time }
    )

    ;; Increment approval count
    (map-set escrow-approval-count
      { escrow-id: escrow-id }
      { count: (+ current-count u1) }
    )

    (ok true)
  )
)

;; Release full escrow to beneficiary
(define-public (release-escrow (escrow-id uint))
  (let
    (
      (escrow (unwrap! (get-escrow escrow-id) ERR_ESCROW_NOT_FOUND))
      (locked (get locked-amount escrow))
      (beneficiary (get beneficiary escrow))
    )
    ;; Validate
    (asserts! (unwrap! (can-release escrow-id) ERR_APPROVAL_REQUIRED) ERR_TIME_LOCK_ACTIVE)
    (asserts! (> locked u0) ERR_INSUFFICIENT_BALANCE)

    ;; Transfer to beneficiary
    (try! (as-contract (stx-transfer? locked tx-sender beneficiary)))

    ;; Update escrow
    (map-set escrows
      { escrow-id: escrow-id }
      (merge escrow {
        locked-amount: u0,
        released-amount: (get amount escrow),
        state: ESCROW_RELEASED,
        released-at: (some stacks-block-time)
      })
    )

    (ok locked)
  )
)

;; Partial release
(define-public (release-partial (escrow-id uint) (amount uint))
  (let
    (
      (escrow (unwrap! (get-escrow escrow-id) ERR_ESCROW_NOT_FOUND))
      (locked (get locked-amount escrow))
      (released (get released-amount escrow))
      (beneficiary (get beneficiary escrow))
    )
    ;; Validate
    (asserts! (unwrap! (can-release escrow-id) ERR_APPROVAL_REQUIRED) ERR_TIME_LOCK_ACTIVE)
    (asserts! (<= amount locked) ERR_INSUFFICIENT_BALANCE)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)

    ;; Transfer partial amount
    (try! (as-contract (stx-transfer? amount tx-sender beneficiary)))

    ;; Update escrow
    (map-set escrows
      { escrow-id: escrow-id }
      (merge escrow {
        locked-amount: (- locked amount),
        released-amount: (+ released amount),
        state: ESCROW_PARTIALLY_RELEASED
      })
    )

    (ok amount)
  )
)

;; Refund escrow (only if expired or cancelled)
(define-public (refund-escrow (escrow-id uint))
  (let
    (
      (escrow (unwrap! (get-escrow escrow-id) ERR_ESCROW_NOT_FOUND))
      (locked (get locked-amount escrow))
      (depositor (get depositor escrow))
      (is-expired (>= stacks-block-time (get expires-at escrow)))
    )
    ;; Validate
    (asserts! is-expired ERR_UNAUTHORIZED)
    (asserts! (> locked u0) ERR_INSUFFICIENT_BALANCE)

    ;; Transfer back to depositor
    (try! (as-contract (stx-transfer? locked tx-sender depositor)))

    ;; Update escrow
    (map-set escrows
      { escrow-id: escrow-id }
      (merge escrow {
        locked-amount: u0,
        refunded-amount: locked,
        state: ESCROW_REFUNDED
      })
    )

    (ok locked)
  )
)

;; Update performance metrics (called by oracle)
(define-public (update-performance
  (escrow-id uint)
  (performance uint)
  (views uint)
  (clicks uint)
)
  (begin
    ;; TODO: Add oracle authorization
    (asserts! (<= performance u100) ERR_INVALID_AMOUNT)

    (map-set escrow-performance
      { escrow-id: escrow-id }
      {
        current-performance: performance,
        views-delivered: views,
        clicks-delivered: clicks,
        last-updated: stacks-block-time
      }
    )

    (ok true)
  )
)

;; Create release schedule (for vesting-like releases)
(define-public (create-release-schedule
  (escrow-id uint)
  (schedule (list 10 { amount: uint, unlock-at: uint }))
)
  (let
    (
      (escrow (unwrap! (get-escrow escrow-id) ERR_ESCROW_NOT_FOUND))
    )
    ;; Only depositor can create schedule
    (asserts! (is-eq tx-sender (get depositor escrow)) ERR_UNAUTHORIZED)

    ;; Create schedule entries
    (ok (map-create-schedule-entry schedule escrow-id))
  )
)

(define-private (map-create-schedule-entry (entry { amount: uint, unlock-at: uint }) (escrow-id uint))
  (let
    (
      (index u0) ;; TODO: Track proper index
    )
    (map-set release-schedule
      { escrow-id: escrow-id, release-index: index }
      {
        amount: (get amount entry),
        unlock-at: (get unlock-at entry),
        released: false,
        released-at: none
      }
    )
    true
  )
)

;; Administrative functions
(define-public (set-min-approval-threshold (new-threshold uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set min-approval-threshold new-threshold)
    (ok true)
  )
)
