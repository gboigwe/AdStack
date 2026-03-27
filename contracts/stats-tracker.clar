;; stats-tracker.clar
;; Analytics and view tracking for AdStack campaigns
;; Records ad views, validates uniqueness, and provides
;; aggregate metrics for campaign performance reporting.

;; --- Constants ---

(define-constant CONTRACT_VERSION "4.0.0")
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u300))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u301))
(define-constant ERR_ALREADY_VIEWED (err u302))
(define-constant ERR_INVALID_VIEWER (err u303))
(define-constant ERR_CAMPAIGN_INACTIVE (err u304))
(define-constant ERR_RATE_LIMIT (err u305))
(define-constant ERR_ZERO_AMOUNT (err u306))
(define-constant ERR_ZERO_CAMPAIGN_ID (err u307))
(define-constant ERR_PUBLISHER_NOT_REGISTERED (err u308))
(define-constant ERR_VIEW_ALREADY_COUNTED (err u309))
(define-constant ERR_INVALID_PUBLISHER (err u310))
(define-constant ERR_CONTRACT_PAUSED (err u311))
(define-constant ERR_SPEND_OVERFLOW (err u312))
(define-constant ERR_INVALID_AMOUNT (err u313))
(define-constant ERR_BLOCK_RATE_LIMIT (err u314))

;; Rate limit: max 10 views per viewer per campaign per day (~144 blocks)
(define-constant MAX_DAILY_VIEWS_PER_VIEWER u10)
;; Blocks per day approximation
(define-constant BLOCKS_PER_DAY u144)
;; Maximum views allowed per single block per viewer per campaign
(define-constant MAX_VIEWS_PER_BLOCK u3)
;; Minimum blocks between view submissions for the same viewer/campaign
(define-constant MIN_VIEW_INTERVAL_BLOCKS u2)

;; --- Data Variables ---

(define-data-var total-views uint u0)
(define-data-var total-valid-views uint u0)
(define-data-var contract-paused bool false)
(define-data-var total-campaigns-tracked uint u0)
(define-data-var total-spend-recorded uint u0)

;; --- Data Maps ---

;; Aggregate analytics per campaign
(define-map campaign-analytics
  { campaign-id: uint }
  {
    total-views: uint,
    unique-viewers: uint,
    total-spent: uint,
    last-view-block: uint,
  }
)

;; Track unique views: one entry per (campaign, viewer)
(define-map viewer-records
  { campaign-id: uint, viewer: principal }
  {
    view-count: uint,
    first-view-block: uint,
    last-view-block: uint,
  }
)

;; Daily rate limiting per viewer per campaign
(define-map daily-view-counts
  { campaign-id: uint, viewer: principal, day-block: uint }
  { count: uint }
)

;; Per-block rate limiting per viewer per campaign
(define-map block-view-counts
  { campaign-id: uint, viewer: principal, block-height: uint }
  { count: uint }
)

;; Publisher view counts per campaign
(define-map publisher-stats
  { campaign-id: uint, publisher: principal }
  {
    views-submitted: uint,
    valid-views: uint,
    last-submit-block: uint,
  }
)

;; Registered publisher whitelist
(define-map registered-publishers
  { publisher: principal }
  { registered-at: uint, is-active: bool }
)

;; --- Private Functions ---

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Calculate the day boundary block (round down to nearest 144)
(define-private (get-day-block (height uint))
  (* (/ height BLOCKS_PER_DAY) BLOCKS_PER_DAY)
)

;; --- Read-Only Functions ---

(define-read-only (get-analytics (campaign-id uint))
  (default-to
    {
      total-views: u0,
      unique-viewers: u0,
      total-spent: u0,
      last-view-block: u0,
    }
    (map-get? campaign-analytics { campaign-id: campaign-id })
  )
)

(define-read-only (get-viewer-record (campaign-id uint) (viewer principal))
  (map-get? viewer-records { campaign-id: campaign-id, viewer: viewer })
)

(define-read-only (get-publisher-stats (campaign-id uint) (publisher principal))
  (default-to
    {
      views-submitted: u0,
      valid-views: u0,
      last-submit-block: u0,
    }
    (map-get? publisher-stats { campaign-id: campaign-id, publisher: publisher })
  )
)

(define-read-only (get-total-views)
  (var-get total-views)
)

(define-read-only (get-total-valid-views)
  (var-get total-valid-views)
)

(define-read-only (has-viewed (campaign-id uint) (viewer principal))
  (is-some (map-get? viewer-records { campaign-id: campaign-id, viewer: viewer }))
)

(define-read-only (get-daily-views (campaign-id uint) (viewer principal))
  (let ((day (get-day-block stacks-block-height)))
    (default-to
      { count: u0 }
      (map-get? daily-view-counts { campaign-id: campaign-id, viewer: viewer, day-block: day })
    )
  )
)

(define-read-only (get-contract-version)
  CONTRACT_VERSION
)

(define-read-only (get-contract-paused)
  (var-get contract-paused)
)

(define-read-only (get-total-campaigns-tracked)
  (var-get total-campaigns-tracked)
)

(define-read-only (get-total-spend-recorded)
  (var-get total-spend-recorded)
)

;; Returns views used vs daily limit for a viewer/campaign pair
(define-read-only (get-daily-view-rate (campaign-id uint) (viewer principal))
  (let (
    (day (get-day-block stacks-block-height))
    (current (get count (default-to { count: u0 }
      (map-get? daily-view-counts { campaign-id: campaign-id, viewer: viewer, day-block: day }))))
  )
    {
      views-used: current,
      views-limit: MAX_DAILY_VIEWS_PER_VIEWER,
      is-at-limit: (>= current MAX_DAILY_VIEWS_PER_VIEWER),
    }
  )
)

;; Check if a publisher is registered and active
(define-read-only (is-publisher-registered (publisher principal))
  (match (map-get? registered-publishers { publisher: publisher })
    reg (get is-active reg)
    false
  )
)

;; Check if a view submission would be allowed (pre-flight check)
(define-read-only (is-view-submission-allowed (campaign-id uint) (viewer principal) (publisher principal))
  (let (
    (day (get-day-block stacks-block-height))
    (current-daily (get count (default-to { count: u0 }
      (map-get? daily-view-counts { campaign-id: campaign-id, viewer: viewer, day-block: day }))))
    (current-block (get count (default-to { count: u0 }
      (map-get? block-view-counts { campaign-id: campaign-id, viewer: viewer, block-height: stacks-block-height }))))
  )
    (and
      (not (var-get contract-paused))
      (> campaign-id u0)
      (not (is-eq publisher viewer))
      (< current-daily MAX_DAILY_VIEWS_PER_VIEWER)
      (< current-block MAX_VIEWS_PER_BLOCK)
    )
  )
)

;; Publisher performance metrics: valid/submitted ratio
(define-read-only (get-publisher-performance (campaign-id uint) (publisher principal))
  (let ((stats (get-publisher-stats campaign-id publisher)))
    {
      views-submitted: (get views-submitted stats),
      valid-views: (get valid-views stats),
      last-submit-block: (get last-submit-block stats),
      validity-ratio: (if (> (get views-submitted stats) u0)
        (/ (* (get valid-views stats) u10000) (get views-submitted stats))
        u0
      ),
    }
  )
)

;; Combined campaign analytics view for convenient frontend queries
(define-read-only (get-campaign-view-summary (campaign-id uint))
  (let ((analytics (get-analytics campaign-id)))
    {
      campaign-id: campaign-id,
      total-views: (get total-views analytics),
      unique-viewers: (get unique-viewers analytics),
      total-spent: (get total-spent analytics),
      last-view-block: (get last-view-block analytics),
      avg-views-per-viewer: (if (> (get unique-viewers analytics) u0)
        (/ (get total-views analytics) (get unique-viewers analytics))
        u0
      ),
    }
  )
)

;; --- Public Functions ---

;; Submit a view for a campaign (called by publishers)
;; The publisher (tx-sender) reports that a viewer saw an ad
(define-public (submit-view (campaign-id uint) (viewer principal))
  (let (
    (publisher tx-sender)
    (day-block (get-day-block stacks-block-height))
    (current-daily (get count (default-to { count: u0 }
      (map-get? daily-view-counts { campaign-id: campaign-id, viewer: viewer, day-block: day-block }))))
    (analytics (get-analytics campaign-id))
    (pub-stats (get-publisher-stats campaign-id publisher))
    (existing-record (map-get? viewer-records { campaign-id: campaign-id, viewer: viewer }))
    (current-block-views (get count (default-to { count: u0 }
      (map-get? block-view-counts { campaign-id: campaign-id, viewer: viewer, block-height: stacks-block-height }))))
  )
    ;; Contract must not be paused
    (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
    ;; Campaign ID must be positive
    (asserts! (> campaign-id u0) ERR_ZERO_CAMPAIGN_ID)
    ;; Campaign must have existing analytics or be a first view
    ;; (analytics default means campaign exists in the broader system)
    ;; Publisher cannot be the viewer (prevents self-dealing)
    (asserts! (not (is-eq publisher viewer)) ERR_INVALID_VIEWER)
    ;; Daily rate limit check
    (asserts! (< current-daily MAX_DAILY_VIEWS_PER_VIEWER) ERR_RATE_LIMIT)
    ;; Per-block rate limit check
    (asserts! (< current-block-views MAX_VIEWS_PER_BLOCK) ERR_BLOCK_RATE_LIMIT)

    ;; Update daily view count
    (map-set daily-view-counts
      { campaign-id: campaign-id, viewer: viewer, day-block: day-block }
      { count: (+ current-daily u1) }
    )

    ;; Update per-block view count
    (map-set block-view-counts
      { campaign-id: campaign-id, viewer: viewer, block-height: stacks-block-height }
      { count: (+ current-block-views u1) }
    )

    ;; Update or create viewer record
    (match existing-record
      record
        (map-set viewer-records
          { campaign-id: campaign-id, viewer: viewer }
          {
            view-count: (+ (get view-count record) u1),
            first-view-block: (get first-view-block record),
            last-view-block: stacks-block-height,
          }
        )
      (begin
        (map-set viewer-records
          { campaign-id: campaign-id, viewer: viewer }
          {
            view-count: u1,
            first-view-block: stacks-block-height,
            last-view-block: stacks-block-height,
          }
        )
        ;; Increment unique viewers only on first view
        (map-set campaign-analytics
          { campaign-id: campaign-id }
          (merge analytics {
            unique-viewers: (+ (get unique-viewers analytics) u1),
          })
        )
        ;; Track new campaign on first-ever view
        (if (is-eq (get unique-viewers analytics) u0)
          (var-set total-campaigns-tracked (+ (var-get total-campaigns-tracked) u1))
          true
        )
      )
    )

    ;; Update campaign analytics
    (let ((updated-analytics (get-analytics campaign-id)))
      (map-set campaign-analytics
        { campaign-id: campaign-id }
        (merge updated-analytics {
          total-views: (+ (get total-views updated-analytics) u1),
          last-view-block: stacks-block-height,
        })
      )
    )

    ;; Update publisher stats
    (map-set publisher-stats
      { campaign-id: campaign-id, publisher: publisher }
      {
        views-submitted: (+ (get views-submitted pub-stats) u1),
        valid-views: (+ (get valid-views pub-stats) u1),
        last-submit-block: stacks-block-height,
      }
    )

    ;; Update global counters with overflow protection
    (if (< (var-get total-views) u340282366920938463463374607431768211455)
      (var-set total-views (+ (var-get total-views) u1))
      true
    )
    (if (< (var-get total-valid-views) u340282366920938463463374607431768211455)
      (var-set total-valid-views (+ (var-get total-valid-views) u1))
      true
    )

    (print {
      event: "view-submitted",
      campaign-id: campaign-id,
      publisher: publisher,
      viewer: viewer,
      block-height: stacks-block-height,
      daily-views-used: (+ current-daily u1),
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; Record spending against campaign analytics (admin or authorized)
(define-public (record-campaign-spend (campaign-id uint) (amount uint))
  (let ((analytics (get-analytics campaign-id)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (> campaign-id u0) ERR_ZERO_CAMPAIGN_ID)
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    ;; Overflow protection: ensure addition will not wrap
    (asserts! (>= (- u340282366920938463463374607431768211455 (get total-spent analytics)) amount) ERR_SPEND_OVERFLOW)

    (map-set campaign-analytics
      { campaign-id: campaign-id }
      (merge analytics {
        total-spent: (+ (get total-spent analytics) amount),
      })
    )

    ;; Update global spend tracker
    (var-set total-spend-recorded (+ (var-get total-spend-recorded) amount))

    (print {
      event: "spend-tracked",
      campaign-id: campaign-id,
      amount: amount,
      recorded-by: tx-sender,
      block-height: stacks-block-height,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; Invalidate a fraudulent view (admin only)
;; Decrements valid view count for anti-fraud enforcement
(define-public (invalidate-view (campaign-id uint) (viewer principal) (publisher principal))
  (let (
    (record (unwrap! (map-get? viewer-records { campaign-id: campaign-id, viewer: viewer }) ERR_CAMPAIGN_NOT_FOUND))
    (analytics (get-analytics campaign-id))
    (pub-stats (get-publisher-stats campaign-id publisher))
  )
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)

    ;; Decrement global valid count (underflow-safe)
    (if (> (var-get total-valid-views) u0)
      (var-set total-valid-views (- (var-get total-valid-views) u1))
      true
    )

    ;; Decrement global total views (underflow-safe)
    (if (> (var-get total-views) u0)
      (var-set total-views (- (var-get total-views) u1))
      true
    )

    ;; Decrement publisher valid views count (underflow-safe)
    (if (> (get valid-views pub-stats) u0)
      (map-set publisher-stats
        { campaign-id: campaign-id, publisher: publisher }
        (merge pub-stats {
          valid-views: (- (get valid-views pub-stats) u1),
        })
      )
      true
    )

    ;; Decrement campaign-level total views (underflow-safe)
    (if (> (get total-views analytics) u0)
      (map-set campaign-analytics
        { campaign-id: campaign-id }
        (merge analytics {
          total-views: (- (get total-views analytics) u1),
        })
      )
      true
    )

    (print {
      event: "view-invalidated",
      campaign-id: campaign-id,
      viewer: viewer,
      publisher: publisher,
      invalidated-by: tx-sender,
      block-height: stacks-block-height,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; --- Admin Functions ---

;; Toggle contract pause state (admin only)
(define-public (set-contract-paused (paused bool))
  (begin
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (var-set contract-paused paused)
    (print {
      event: "contract-pause-toggled",
      paused: paused,
      toggled-by: tx-sender,
      block-height: stacks-block-height,
      timestamp: stacks-block-time,
    })
    (ok paused)
  )
)

;; Emergency reset of daily view count for a viewer/campaign (admin only)
(define-public (reset-daily-views (campaign-id uint) (viewer principal))
  (let ((day-block (get-day-block stacks-block-height)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (> campaign-id u0) ERR_ZERO_CAMPAIGN_ID)
    (map-set daily-view-counts
      { campaign-id: campaign-id, viewer: viewer, day-block: day-block }
      { count: u0 }
    )
    (print {
      event: "daily-views-reset",
      campaign-id: campaign-id,
      viewer: viewer,
      reset-by: tx-sender,
      block-height: stacks-block-height,
      timestamp: stacks-block-time,
    })
    (ok true)
  )
)

;; Register a publisher to allow view submissions (admin only)
(define-public (register-publisher (publisher principal))
  (begin
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (map-set registered-publishers
      { publisher: publisher }
      { registered-at: stacks-block-height, is-active: true }
    )
    (print {
      event: "publisher-registered",
      publisher: publisher,
      registered-by: tx-sender,
      block-height: stacks-block-height,
      timestamp: stacks-block-time,
    })
    (ok true)
  )
)

;; Deactivate a registered publisher (admin only)
(define-public (deactivate-publisher (publisher principal))
  (let ((reg (unwrap! (map-get? registered-publishers { publisher: publisher }) ERR_PUBLISHER_NOT_REGISTERED)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (map-set registered-publishers
      { publisher: publisher }
      (merge reg { is-active: false })
    )
    (print {
      event: "publisher-deactivated",
      publisher: publisher,
      deactivated-by: tx-sender,
      block-height: stacks-block-height,
      timestamp: stacks-block-time,
    })
    (ok true)
  )
)
