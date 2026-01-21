;; Campaign Lifecycle Manager - Clarity v4
;; Complete state machine for campaign lifecycle management
;; Handles: draft > funded > active > paused > completed > cancelled

;; ===================================
;; Constants
;; ===================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_INVALID_STATE (err u1001))
(define-constant ERR_INSUFFICIENT_FUNDS (err u1002))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u1003))
(define-constant ERR_ALREADY_FUNDED (err u1004))
(define-constant ERR_FUNDING_THRESHOLD_NOT_MET (err u1005))
(define-constant ERR_CAMPAIGN_EXPIRED (err u1006))
(define-constant ERR_INVALID_TRANSITION (err u1007))

;; Campaign states
(define-constant STATE_DRAFT u0)
(define-constant STATE_FUNDED u1)
(define-constant STATE_ACTIVE u2)
(define-constant STATE_PAUSED u3)
(define-constant STATE_COMPLETED u4)
(define-constant STATE_CANCELLED u5)

;; ===================================
;; Data Variables
;; ===================================

(define-data-var campaign-nonce uint u0)
(define-data-var escrow-contract principal CONTRACT_OWNER) ;; Will be updated to escrow-vault contract

;; ===================================
;; Data Maps
;; ===================================

;; Main campaign data
(define-map campaigns
  { campaign-id: uint }
  {
    advertiser: principal,
    name: (string-ascii 100),
    state: uint,
    budget: uint,
    funded-amount: uint,
    spent: uint,
    daily-budget: uint,
    start-block: uint,
    end-block: uint,
    funding-threshold: uint, ;; Minimum funding required to activate
    created-at: uint, ;; stacks-block-time (Unix timestamp)
    last-updated: uint, ;; stacks-block-time (Unix timestamp)
    activated-at: (optional uint),
    paused-at: (optional uint),
    completed-at: (optional uint),
    cancelled-at: (optional uint),
    metadata-uri: (optional (string-ascii 256))
  }
)

;; State transition history
(define-map state-transitions
  { campaign-id: uint, transition-index: uint }
  {
    from-state: uint,
    to-state: uint,
    triggered-by: principal,
    timestamp: uint,
    reason: (optional (string-ascii 200))
  }
)

;; Track number of transitions per campaign
(define-map campaign-transition-count
  { campaign-id: uint }
  { count: uint }
)

;; Campaign funding tracking
(define-map campaign-funders
  { campaign-id: uint, funder: principal }
  { amount: uint, timestamp: uint }
)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-campaign (campaign-id uint))
  (map-get? campaigns { campaign-id: campaign-id })
)

(define-read-only (get-campaign-state (campaign-id uint))
  (match (map-get? campaigns { campaign-id: campaign-id })
    campaign (ok (get state campaign))
    ERR_CAMPAIGN_NOT_FOUND
  )
)

(define-read-only (get-transition-history (campaign-id uint) (transition-index uint))
  (map-get? state-transitions { campaign-id: campaign-id, transition-index: transition-index })
)

(define-read-only (get-transition-count (campaign-id uint))
  (default-to
    { count: u0 }
    (map-get? campaign-transition-count { campaign-id: campaign-id })
  )
)

(define-read-only (get-funder-contribution (campaign-id uint) (funder principal))
  (map-get? campaign-funders { campaign-id: campaign-id, funder: funder })
)

(define-read-only (can-transition (campaign-id uint) (to-state uint))
  (match (get-campaign campaign-id)
    campaign
      (let ((current-state (get state campaign)))
        (ok (is-valid-transition current-state to-state))
      )
    ERR_CAMPAIGN_NOT_FOUND
  )
)

(define-read-only (is-campaign-active (campaign-id uint))
  (match (get-campaign campaign-id)
    campaign (ok (is-eq (get state campaign) STATE_ACTIVE))
    ERR_CAMPAIGN_NOT_FOUND
  )
)

(define-read-only (get-current-nonce)
  (ok (var-get campaign-nonce))
)

;; ===================================
;; Private Helper Functions
;; ===================================

(define-private (is-valid-transition (from-state uint) (to-state uint))
  (if (is-eq from-state STATE_DRAFT)
    (or (is-eq to-state STATE_FUNDED) (is-eq to-state STATE_CANCELLED))
    (if (is-eq from-state STATE_FUNDED)
      (or (is-eq to-state STATE_ACTIVE) (is-eq to-state STATE_CANCELLED))
      (if (is-eq from-state STATE_ACTIVE)
        (or (is-eq to-state STATE_PAUSED) (is-eq to-state STATE_COMPLETED) (is-eq to-state STATE_CANCELLED))
        (if (is-eq from-state STATE_PAUSED)
          (or (is-eq to-state STATE_ACTIVE) (is-eq to-state STATE_CANCELLED))
          false
        )
      )
    )
  )
)

(define-private (record-transition (campaign-id uint) (from-state uint) (to-state uint) (reason (optional (string-ascii 200))))
  (let
    (
      (transition-count (get count (get-transition-count campaign-id)))
      (new-count (+ transition-count u1))
    )
    (map-set state-transitions
      { campaign-id: campaign-id, transition-index: transition-count }
      {
        from-state: from-state,
        to-state: to-state,
        triggered-by: tx-sender,
        timestamp: stacks-block-time,
        reason: reason
      }
    )
    (map-set campaign-transition-count
      { campaign-id: campaign-id }
      { count: new-count }
    )
    (ok true)
  )
)

;; ===================================
;; Public Functions
;; ===================================

;; Create new campaign in DRAFT state
(define-public (create-campaign
  (name (string-ascii 100))
  (budget uint)
  (daily-budget uint)
  (duration-blocks uint)
  (funding-threshold uint)
  (metadata-uri (optional (string-ascii 256)))
)
  (let
    (
      (campaign-id (var-get campaign-nonce))
      (start-block block-height)
      (end-block (+ block-height duration-blocks))
    )
    ;; Validate inputs
    (asserts! (> budget u0) ERR_INSUFFICIENT_FUNDS)
    (asserts! (> daily-budget u0) ERR_INSUFFICIENT_FUNDS)
    (asserts! (<= funding-threshold budget) ERR_INSUFFICIENT_FUNDS)

    ;; Create campaign
    (map-set campaigns
      { campaign-id: campaign-id }
      {
        advertiser: tx-sender,
        name: name,
        state: STATE_DRAFT,
        budget: budget,
        funded-amount: u0,
        spent: u0,
        daily-budget: daily-budget,
        start-block: start-block,
        end-block: end-block,
        funding-threshold: funding-threshold,
        created-at: stacks-block-time,
        last-updated: stacks-block-time,
        activated-at: none,
        paused-at: none,
        completed-at: none,
        cancelled-at: none,
        metadata-uri: metadata-uri
      }
    )

    ;; Record initial transition
    (try! (record-transition campaign-id STATE_DRAFT STATE_DRAFT none))

    ;; Increment nonce
    (var-set campaign-nonce (+ campaign-id u1))

    (ok campaign-id)
  )
)

;; Fund campaign (moves from DRAFT to FUNDED)
(define-public (fund-campaign (campaign-id uint) (amount uint))
  (let
    (
      (campaign (unwrap! (get-campaign campaign-id) ERR_CAMPAIGN_NOT_FOUND))
      (current-state (get state campaign))
      (current-funded (get funded-amount campaign))
      (new-funded (+ current-funded amount))
      (threshold (get funding-threshold campaign))
    )
    ;; Validate state
    (asserts! (is-eq current-state STATE_DRAFT) ERR_INVALID_STATE)
    (asserts! (is-eq (get advertiser campaign) tx-sender) ERR_UNAUTHORIZED)

    ;; Transfer funds to escrow
    ;; TODO: Integrate with escrow-vault contract
    (try! (stx-transfer? amount tx-sender (var-get escrow-contract)))

    ;; Record funder contribution
    (map-set campaign-funders
      { campaign-id: campaign-id, funder: tx-sender }
      { amount: amount, timestamp: stacks-block-time }
    )

    ;; Update campaign
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        funded-amount: new-funded,
        state: (if (>= new-funded threshold) STATE_FUNDED STATE_DRAFT),
        last-updated: stacks-block-time
      })
    )

    ;; Record transition if threshold met
    (if (>= new-funded threshold)
      (try! (record-transition campaign-id STATE_DRAFT STATE_FUNDED (some "Funding threshold met")))
      true
    )

    (ok new-funded)
  )
)

;; Activate campaign (moves from FUNDED to ACTIVE)
(define-public (activate-campaign (campaign-id uint))
  (let
    (
      (campaign (unwrap! (get-campaign campaign-id) ERR_CAMPAIGN_NOT_FOUND))
      (current-state (get state campaign))
    )
    ;; Validate
    (asserts! (is-eq current-state STATE_FUNDED) ERR_INVALID_STATE)
    (asserts! (is-eq (get advertiser campaign) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (>= (get funded-amount campaign) (get funding-threshold campaign)) ERR_FUNDING_THRESHOLD_NOT_MET)

    ;; Update state
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        state: STATE_ACTIVE,
        activated-at: (some stacks-block-time),
        last-updated: stacks-block-time
      })
    )

    ;; Record transition
    (try! (record-transition campaign-id STATE_FUNDED STATE_ACTIVE (some "Campaign activated")))

    (ok true)
  )
)

;; Pause campaign
(define-public (pause-campaign (campaign-id uint) (reason (optional (string-ascii 200))))
  (let
    (
      (campaign (unwrap! (get-campaign campaign-id) ERR_CAMPAIGN_NOT_FOUND))
      (current-state (get state campaign))
    )
    ;; Validate
    (asserts! (is-eq current-state STATE_ACTIVE) ERR_INVALID_STATE)
    (asserts! (is-eq (get advertiser campaign) tx-sender) ERR_UNAUTHORIZED)

    ;; Update state
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        state: STATE_PAUSED,
        paused-at: (some stacks-block-time),
        last-updated: stacks-block-time
      })
    )

    ;; Record transition
    (try! (record-transition campaign-id STATE_ACTIVE STATE_PAUSED reason))

    (ok true)
  )
)

;; Resume campaign
(define-public (resume-campaign (campaign-id uint))
  (let
    (
      (campaign (unwrap! (get-campaign campaign-id) ERR_CAMPAIGN_NOT_FOUND))
      (current-state (get state campaign))
    )
    ;; Validate
    (asserts! (is-eq current-state STATE_PAUSED) ERR_INVALID_STATE)
    (asserts! (is-eq (get advertiser campaign) tx-sender) ERR_UNAUTHORIZED)

    ;; Update state
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        state: STATE_ACTIVE,
        paused-at: none,
        last-updated: stacks-block-time
      })
    )

    ;; Record transition
    (try! (record-transition campaign-id STATE_PAUSED STATE_ACTIVE (some "Campaign resumed")))

    (ok true)
  )
)

;; Complete campaign
(define-public (complete-campaign (campaign-id uint))
  (let
    (
      (campaign (unwrap! (get-campaign campaign-id) ERR_CAMPAIGN_NOT_FOUND))
      (current-state (get state campaign))
    )
    ;; Validate
    (asserts! (is-eq current-state STATE_ACTIVE) ERR_INVALID_STATE)
    (asserts! (or
      (is-eq (get advertiser campaign) tx-sender)
      (>= block-height (get end-block campaign))
    ) ERR_UNAUTHORIZED)

    ;; Update state
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        state: STATE_COMPLETED,
        completed-at: (some stacks-block-time),
        last-updated: stacks-block-time
      })
    )

    ;; Record transition
    (try! (record-transition campaign-id STATE_ACTIVE STATE_COMPLETED (some "Campaign completed")))

    (ok true)
  )
)

;; Cancel campaign
(define-public (cancel-campaign (campaign-id uint) (reason (optional (string-ascii 200))))
  (let
    (
      (campaign (unwrap! (get-campaign campaign-id) ERR_CAMPAIGN_NOT_FOUND))
      (current-state (get state campaign))
    )
    ;; Validate
    (asserts! (not (is-eq current-state STATE_COMPLETED)) ERR_INVALID_STATE)
    (asserts! (not (is-eq current-state STATE_CANCELLED)) ERR_INVALID_STATE)
    (asserts! (is-eq (get advertiser campaign) tx-sender) ERR_UNAUTHORIZED)

    ;; Update state
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        state: STATE_CANCELLED,
        cancelled-at: (some stacks-block-time),
        last-updated: stacks-block-time
      })
    )

    ;; Record transition
    (try! (record-transition campaign-id current-state STATE_CANCELLED reason))

    (ok true)
  )
)

;; Update escrow contract reference
(define-public (set-escrow-contract (new-escrow principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set escrow-contract new-escrow)
    (ok true)
  )
)

;; Administrative function to force state change (emergency only)
(define-public (force-state-change (campaign-id uint) (new-state uint) (reason (string-ascii 200)))
  (let
    (
      (campaign (unwrap! (get-campaign campaign-id) ERR_CAMPAIGN_NOT_FOUND))
      (current-state (get state campaign))
    )
    ;; Only contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)

    ;; Update state
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        state: new-state,
        last-updated: stacks-block-time
      })
    )

    ;; Record transition
    (try! (record-transition campaign-id current-state new-state (some reason)))

    (ok true)
  )
)
