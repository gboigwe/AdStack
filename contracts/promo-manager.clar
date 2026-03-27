;; promo-manager.clar
;; Campaign management contract for AdStack -- Clarity 4
;; Handles creation, lifecycle management, and budget tracking
;; for advertising campaigns on the Stacks blockchain.
;;
;; Clarity 4 changes:
;; - as-contract removed: STX escrow uses CONTRACT_OWNER admin wallet
;; - stacks-block-time added: Unix timestamp for campaign expiry tracking
;; - Deposit routes STX through CONTRACT_OWNER; refunds require admin tx

;; --- Constants ---

(define-constant CONTRACT_VERSION "4.0.0")
(define-constant CONTRACT_OWNER tx-sender)

(define-constant ERR_NOT_AUTHORIZED (err u100))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u101))
(define-constant ERR_INVALID_BUDGET (err u102))
(define-constant ERR_CAMPAIGN_NOT_ACTIVE (err u103))
(define-constant ERR_CAMPAIGN_ALREADY_ACTIVE (err u104))
(define-constant ERR_INVALID_DURATION (err u105))
(define-constant ERR_BUDGET_EXCEEDED (err u106))
(define-constant ERR_INVALID_NAME (err u107))
(define-constant ERR_CAMPAIGN_EXPIRED (err u108))
(define-constant ERR_DAILY_BUDGET_EXCEEDED (err u109))
(define-constant ERR_CONTRACT_PAUSED (err u110))
(define-constant ERR_ZERO_AMOUNT (err u111))
(define-constant ERR_ALREADY_COMPLETED (err u112))
(define-constant ERR_ALREADY_CANCELLED (err u113))
(define-constant ERR_MAX_CAMPAIGNS_REACHED (err u114))
(define-constant ERR_BUDGET_OVERFLOW (err u115))
(define-constant ERR_CAMPAIGN_NOT_PAUSED (err u116))
(define-constant ERR_INVALID_DAILY_BUDGET (err u117))
(define-constant ERR_SELF_FUND (err u118))

;; Minimum budget: 1 STX (1,000,000 micro-STX)
(define-constant MIN_BUDGET u1000000)
;; Maximum campaign name length
(define-constant MAX_NAME_LENGTH u64)
;; Maximum campaign duration in blocks (~90 days)
(define-constant MAX_DURATION_BLOCKS u12960)
;; Minimum campaign duration in blocks (~1 day)
(define-constant MIN_DURATION_BLOCKS u144)
;; Blocks per day for daily budget reset calculation
(define-constant BLOCKS_PER_DAY u144)
;; Maximum campaigns per advertiser to prevent spam
(define-constant MAX_CAMPAIGNS_PER_ADVERTISER u50)

;; Status constants
(define-constant STATUS_DRAFT u0)
(define-constant STATUS_ACTIVE u1)
(define-constant STATUS_PAUSED u2)
(define-constant STATUS_COMPLETED u3)
(define-constant STATUS_CANCELLED u4)
(define-constant STATUS_EXPIRED u5)

;; --- Data Variables ---

(define-data-var campaign-nonce uint u0)
(define-data-var total-campaigns-created uint u0)
(define-data-var total-stx-locked uint u0)
(define-data-var contract-paused bool false)
(define-data-var deploy-time uint u0)
(define-data-var total-stx-spent uint u0)
(define-data-var total-campaigns-completed uint u0)
(define-data-var total-campaigns-cancelled uint u0)

;; --- Data Maps ---

(define-map campaigns
  { campaign-id: uint }
  {
    advertiser: principal,
    name: (string-ascii 64),
    budget: uint,
    spent: uint,
    daily-budget: uint,
    daily-spent: uint,
    last-spend-block: uint,
    start-height: uint,
    end-height: uint,
    status: uint,
    created-at: uint,
    last-updated: uint,
    created-timestamp: uint,
    last-updated-timestamp: uint,
  }
)

;; Track campaigns per advertiser for lookup
(define-map advertiser-campaign-count
  { advertiser: principal }
  { count: uint }
)

;; --- Private Functions ---

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

(define-private (is-campaign-owner (campaign-id uint))
  (match (map-get? campaigns { campaign-id: campaign-id })
    campaign (is-eq tx-sender (get advertiser campaign))
    false
  )
)

(define-private (increment-nonce)
  (let ((current (var-get campaign-nonce)))
    (var-set campaign-nonce (+ current u1))
    current
  )
)

(define-private (reset-daily-spend-if-needed (campaign-id uint) (campaign-data {
    advertiser: principal,
    name: (string-ascii 64),
    budget: uint,
    spent: uint,
    daily-budget: uint,
    daily-spent: uint,
    last-spend-block: uint,
    start-height: uint,
    end-height: uint,
    status: uint,
    created-at: uint,
    last-updated: uint,
    created-timestamp: uint,
    last-updated-timestamp: uint,
  }))
  ;; Reset daily spend if we've passed a day boundary
  (if (>= (- stacks-block-height (get last-spend-block campaign-data)) BLOCKS_PER_DAY)
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign-data {
        daily-spent: u0,
        last-spend-block: stacks-block-height,
      })
    )
    true
  )
)

;; --- Read-Only Functions ---

(define-read-only (get-campaign (campaign-id uint))
  (map-get? campaigns { campaign-id: campaign-id })
)

(define-read-only (get-campaign-status (campaign-id uint))
  (match (map-get? campaigns { campaign-id: campaign-id })
    campaign (ok (get status campaign))
    ERR_CAMPAIGN_NOT_FOUND
  )
)

(define-read-only (get-remaining-budget (campaign-id uint))
  (match (map-get? campaigns { campaign-id: campaign-id })
    campaign (ok (- (get budget campaign) (get spent campaign)))
    ERR_CAMPAIGN_NOT_FOUND
  )
)

(define-read-only (get-campaign-count)
  (var-get total-campaigns-created)
)

(define-read-only (get-total-stx-locked)
  (var-get total-stx-locked)
)

(define-read-only (get-advertiser-campaigns (advertiser principal))
  (default-to { count: u0 } (map-get? advertiser-campaign-count { advertiser: advertiser }))
)

(define-read-only (is-campaign-active (campaign-id uint))
  (match (map-get? campaigns { campaign-id: campaign-id })
    campaign (and
      (is-eq (get status campaign) STATUS_ACTIVE)
      (<= stacks-block-height (get end-height campaign))
    )
    false
  )
)

(define-read-only (is-contract-paused)
  (var-get contract-paused)
)

;; Clarity 4: return Unix timestamp of deployment
(define-read-only (get-deploy-time)
  (var-get deploy-time)
)

;; Clarity 4: return version string
(define-read-only (get-contract-version)
  CONTRACT_VERSION
)

;; --- Public Functions ---

;; Create a new advertising campaign
;; Clarity 4: STX deposited into CONTRACT_OWNER wallet, tracked via map
(define-public (create-campaign
    (name (string-ascii 64))
    (budget uint)
    (daily-budget uint)
    (duration uint))
  (let (
    (campaign-id (increment-nonce))
    (end-block (+ stacks-block-height duration))
    (advertiser-count (get count (get-advertiser-campaigns tx-sender)))
  )
    ;; Validations
    (asserts! (not (var-get contract-paused)) ERR_NOT_AUTHORIZED)
    (asserts! (>= budget MIN_BUDGET) ERR_INVALID_BUDGET)
    (asserts! (> (len name) u0) ERR_INVALID_NAME)
    (asserts! (<= (len name) MAX_NAME_LENGTH) ERR_INVALID_NAME)
    (asserts! (>= duration MIN_DURATION_BLOCKS) ERR_INVALID_DURATION)
    (asserts! (<= duration MAX_DURATION_BLOCKS) ERR_INVALID_DURATION)
    (asserts! (<= daily-budget budget) ERR_INVALID_BUDGET)
    (asserts! (> daily-budget u0) ERR_INVALID_BUDGET)

    ;; Clarity 4: escrow through CONTRACT_OWNER admin wallet
    (try! (stx-transfer? budget tx-sender CONTRACT_OWNER))

    ;; Create campaign record with Clarity 4 timestamps
    (map-set campaigns
      { campaign-id: campaign-id }
      {
        advertiser: tx-sender,
        name: name,
        budget: budget,
        spent: u0,
        daily-budget: daily-budget,
        daily-spent: u0,
        last-spend-block: stacks-block-height,
        start-height: stacks-block-height,
        end-height: end-block,
        status: STATUS_ACTIVE,
        created-at: stacks-block-height,
        last-updated: stacks-block-height,
        created-timestamp: stacks-block-time,
        last-updated-timestamp: stacks-block-time,
      }
    )

    ;; Update counters
    (map-set advertiser-campaign-count
      { advertiser: tx-sender }
      { count: (+ advertiser-count u1) }
    )
    (var-set total-campaigns-created (+ (var-get total-campaigns-created) u1))
    (var-set total-stx-locked (+ (var-get total-stx-locked) budget))

    ;; Emit print event for indexers
    (print {
      event: "campaign-created",
      campaign-id: campaign-id,
      advertiser: tx-sender,
      budget: budget,
      duration: duration,
      timestamp: stacks-block-time,
    })

    (ok campaign-id)
  )
)

;; Pause an active campaign
(define-public (pause-campaign (campaign-id uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get advertiser campaign)) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status campaign) STATUS_ACTIVE) ERR_CAMPAIGN_NOT_ACTIVE)

    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        status: STATUS_PAUSED,
        last-updated: stacks-block-height,
        last-updated-timestamp: stacks-block-time,
      })
    )

    (print { event: "campaign-paused", campaign-id: campaign-id, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Resume a paused campaign
(define-public (resume-campaign (campaign-id uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get advertiser campaign)) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status campaign) STATUS_PAUSED) ERR_CAMPAIGN_ALREADY_ACTIVE)
    (asserts! (<= stacks-block-height (get end-height campaign)) ERR_CAMPAIGN_EXPIRED)

    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        status: STATUS_ACTIVE,
        last-updated: stacks-block-height,
        last-updated-timestamp: stacks-block-time,
      })
    )

    (print { event: "campaign-resumed", campaign-id: campaign-id, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Cancel a campaign and mark for refund
;; Clarity 4: actual STX refund is issued by CONTRACT_OWNER in refund-campaign-budget
(define-public (cancel-campaign (campaign-id uint))
  (let (
    (campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    (remaining (- (get budget campaign) (get spent campaign)))
  )
    (asserts! (is-eq tx-sender (get advertiser campaign)) ERR_NOT_AUTHORIZED)
    (asserts! (or
      (is-eq (get status campaign) STATUS_ACTIVE)
      (is-eq (get status campaign) STATUS_PAUSED)
    ) ERR_CAMPAIGN_NOT_ACTIVE)

    ;; Update campaign status
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        status: STATUS_CANCELLED,
        last-updated: stacks-block-height,
        last-updated-timestamp: stacks-block-time,
      })
    )

    ;; Update total locked with underflow protection
    (if (>= (var-get total-stx-locked) remaining)
      (var-set total-stx-locked (- (var-get total-stx-locked) remaining))
      (var-set total-stx-locked u0)
    )

    (print {
      event: "campaign-cancelled",
      campaign-id: campaign-id,
      refunded: remaining,
      timestamp: stacks-block-time,
    })
    (ok remaining)
  )
)

;; Clarity 4: CONTRACT_OWNER issues actual STX refund on cancel/completion
(define-public (refund-campaign-budget (campaign-id uint))
  (let (
    (campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    (remaining (- (get budget campaign) (get spent campaign)))
  )
    ;; Only CONTRACT_OWNER (admin) can execute refunds from escrow wallet
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (or
      (is-eq (get status campaign) STATUS_CANCELLED)
      (is-eq (get status campaign) STATUS_COMPLETED)
    ) ERR_CAMPAIGN_NOT_ACTIVE)
    (asserts! (> remaining u0) ERR_INVALID_BUDGET)

    ;; Mark campaign spent to prevent double-refund before transfer
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        spent: (get budget campaign),
        last-updated: stacks-block-height,
        last-updated-timestamp: stacks-block-time,
      })
    )

    ;; Transfer AFTER state update to prevent reentrancy
    (try! (stx-transfer? remaining tx-sender (get advertiser campaign)))

    (print {
      event: "campaign-budget-refunded",
      campaign-id: campaign-id,
      amount: remaining,
      recipient: (get advertiser campaign),
      timestamp: stacks-block-time,
    })
    (ok remaining)
  )
)

;; Record spending against a campaign (called by stats-tracker)
(define-public (record-spend (campaign-id uint) (amount uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND)))
    ;; Reject spend recording when contract is paused
    (asserts! (not (var-get contract-paused)) ERR_NOT_AUTHORIZED)
    ;; Only contract owner or authorized contracts can record spending
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status campaign) STATUS_ACTIVE) ERR_CAMPAIGN_NOT_ACTIVE)
    (asserts! (> amount u0) ERR_INVALID_BUDGET)
    ;; Check campaign has not expired
    (asserts! (<= stacks-block-height (get end-height campaign)) ERR_CAMPAIGN_EXPIRED)
    (asserts! (<= (+ (get spent campaign) amount) (get budget campaign)) ERR_BUDGET_EXCEEDED)

    ;; Check daily budget
    (let ((effective-daily-spent
            (if (>= (- stacks-block-height (get last-spend-block campaign)) u144)
              u0
              (get daily-spent campaign))))
      (asserts! (<= (+ effective-daily-spent amount) (get daily-budget campaign)) ERR_DAILY_BUDGET_EXCEEDED)

      (map-set campaigns
        { campaign-id: campaign-id }
        (merge campaign {
          spent: (+ (get spent campaign) amount),
          daily-spent: (+ effective-daily-spent amount),
          last-spend-block: stacks-block-height,
          last-updated: stacks-block-height,
          last-updated-timestamp: stacks-block-time,
        })
      )

      ;; Auto-complete if budget is fully spent
      (if (>= (+ (get spent campaign) amount) (get budget campaign))
        (map-set campaigns
          { campaign-id: campaign-id }
          (merge campaign {
            spent: (+ (get spent campaign) amount),
            daily-spent: (+ effective-daily-spent amount),
            last-spend-block: stacks-block-height,
            last-updated: stacks-block-height,
            last-updated-timestamp: stacks-block-time,
            status: STATUS_COMPLETED,
          })
        )
        true
      )
    )

    (print {
      event: "spend-recorded",
      campaign-id: campaign-id,
      amount: amount,
      timestamp: stacks-block-time,
    })
    (ok true)
  )
)

;; --- Admin Functions ---

;; Initialize deploy time (call once after deployment)
(define-public (init)
  (begin
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (var-get deploy-time) u0) ERR_NOT_AUTHORIZED)
    (var-set deploy-time stacks-block-time)
    (ok stacks-block-time)
  )
)

;; Emergency pause contract
(define-public (set-contract-paused (paused bool))
  (begin
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (var-set contract-paused paused)
    (print { event: "contract-pause-toggled", paused: paused, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Complete expired campaigns (can be called by anyone)
(define-public (complete-expired-campaign (campaign-id uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND)))
    (asserts! (is-eq (get status campaign) STATUS_ACTIVE) ERR_CAMPAIGN_NOT_ACTIVE)
    (asserts! (> stacks-block-height (get end-height campaign)) ERR_CAMPAIGN_NOT_ACTIVE)

    (let ((remaining (- (get budget campaign) (get spent campaign))))
      (map-set campaigns
        { campaign-id: campaign-id }
        (merge campaign {
          status: STATUS_COMPLETED,
          last-updated: stacks-block-height,
          last-updated-timestamp: stacks-block-time,
        })
      )

      ;; Underflow protection
      (if (>= (var-get total-stx-locked) remaining)
        (var-set total-stx-locked (- (var-get total-stx-locked) remaining))
        (var-set total-stx-locked u0)
      )

      (print {
        event: "campaign-completed",
        campaign-id: campaign-id,
        refundable: remaining,
        timestamp: stacks-block-time,
      })
      (ok remaining)
    )
  )
)
