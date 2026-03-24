;; promo-manager.clar
;; Campaign management contract for AdStack
;; Handles creation, lifecycle management, and budget tracking
;; for advertising campaigns on the Stacks blockchain.

;; --- Constants ---

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

;; Minimum budget: 1 STX (1,000,000 micro-STX)
(define-constant MIN_BUDGET u1000000)
;; Maximum campaign name length
(define-constant MAX_NAME_LENGTH u64)
;; Maximum campaign duration in blocks (~90 days)
(define-constant MAX_DURATION_BLOCKS u12960)
;; Minimum campaign duration in blocks (~1 day)
(define-constant MIN_DURATION_BLOCKS u144)

;; Status constants
(define-constant STATUS_DRAFT u0)
(define-constant STATUS_ACTIVE u1)
(define-constant STATUS_PAUSED u2)
(define-constant STATUS_COMPLETED u3)
(define-constant STATUS_CANCELLED u4)

;; --- Data Variables ---

(define-data-var campaign-nonce uint u0)
(define-data-var total-campaigns-created uint u0)
(define-data-var total-stx-locked uint u0)
(define-data-var contract-paused bool false)

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
  }))
  ;; Reset daily spend if we've passed a day boundary (144 blocks)
  (if (>= (- stacks-block-height (get last-spend-block campaign-data)) u144)
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

;; --- Public Functions ---

;; Create a new advertising campaign
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

    ;; Transfer STX from advertiser to contract (escrow)
    (try! (stx-transfer? budget tx-sender (as-contract tx-sender)))

    ;; Create campaign record
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
      })
    )

    (print { event: "campaign-paused", campaign-id: campaign-id })
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
      })
    )

    (print { event: "campaign-resumed", campaign-id: campaign-id })
    (ok true)
  )
)

;; Cancel a campaign and refund remaining budget
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

    ;; Refund remaining budget
    (if (> remaining u0)
      (try! (as-contract (stx-transfer? remaining tx-sender (get advertiser campaign))))
      true
    )

    ;; Update campaign status
    (map-set campaigns
      { campaign-id: campaign-id }
      (merge campaign {
        status: STATUS_CANCELLED,
        last-updated: stacks-block-height,
      })
    )

    ;; Update total locked
    (var-set total-stx-locked (- (var-get total-stx-locked) remaining))

    (print {
      event: "campaign-cancelled",
      campaign-id: campaign-id,
      refunded: remaining,
    })
    (ok remaining)
  )
)

;; Record spending against a campaign (called by stats-tracker)
(define-public (record-spend (campaign-id uint) (amount uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND)))
    ;; Only contract owner or authorized contracts can record spending
    (asserts! (or (is-contract-owner) (is-eq contract-caller CONTRACT_OWNER)) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status campaign) STATUS_ACTIVE) ERR_CAMPAIGN_NOT_ACTIVE)
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
    })
    (ok true)
  )
)

;; --- Admin Functions ---

;; Emergency pause contract
(define-public (set-contract-paused (paused bool))
  (begin
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (var-set contract-paused paused)
    (print { event: "contract-pause-toggled", paused: paused })
    (ok true)
  )
)

;; Complete expired campaigns (can be called by anyone)
(define-public (complete-expired-campaign (campaign-id uint))
  (let ((campaign (unwrap! (map-get? campaigns { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND)))
    (asserts! (is-eq (get status campaign) STATUS_ACTIVE) ERR_CAMPAIGN_NOT_ACTIVE)
    (asserts! (> stacks-block-height (get end-height campaign)) ERR_CAMPAIGN_NOT_ACTIVE)

    (let ((remaining (- (get budget campaign) (get spent campaign))))
      ;; Refund remaining to advertiser
      (if (> remaining u0)
        (try! (as-contract (stx-transfer? remaining tx-sender (get advertiser campaign))))
        true
      )

      (map-set campaigns
        { campaign-id: campaign-id }
        (merge campaign {
          status: STATUS_COMPLETED,
          last-updated: stacks-block-height,
        })
      )

      (var-set total-stx-locked (- (var-get total-stx-locked) remaining))

      (print {
        event: "campaign-completed",
        campaign-id: campaign-id,
        refunded: remaining,
      })
      (ok remaining)
    )
  )
)
