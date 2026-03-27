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

;; Publisher view counts per campaign
(define-map publisher-stats
  { campaign-id: uint, publisher: principal }
  {
    views-submitted: uint,
    valid-views: uint,
    last-submit-block: uint,
  }
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
  )
    ;; Publisher cannot be the viewer (prevents self-dealing)
    (asserts! (not (is-eq publisher viewer)) ERR_INVALID_VIEWER)
    ;; Rate limit check
    (asserts! (< current-daily MAX_DAILY_VIEWS_PER_VIEWER) ERR_RATE_LIMIT)

    ;; Update daily view count
    (map-set daily-view-counts
      { campaign-id: campaign-id, viewer: viewer, day-block: day-block }
      { count: (+ current-daily u1) }
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

    ;; Update global counters
    (var-set total-views (+ (var-get total-views) u1))
    (var-set total-valid-views (+ (var-get total-valid-views) u1))

    (print {
      event: "view-submitted",
      campaign-id: campaign-id,
      publisher: publisher,
      viewer: viewer,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; Record spending against campaign analytics (admin or authorized)
(define-public (record-campaign-spend (campaign-id uint) (amount uint))
  (let ((analytics (get-analytics campaign-id)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)

    (map-set campaign-analytics
      { campaign-id: campaign-id }
      (merge analytics {
        total-spent: (+ (get total-spent analytics) amount),
      })
    )

    (print {
      event: "spend-tracked",
      campaign-id: campaign-id,
      amount: amount,
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

    ;; Decrement global valid count
    (if (> (var-get total-valid-views) u0)
      (var-set total-valid-views (- (var-get total-valid-views) u1))
      true
    )

    ;; Decrement publisher valid views count
    (if (> (get valid-views pub-stats) u0)
      (map-set publisher-stats
        { campaign-id: campaign-id, publisher: publisher }
        (merge pub-stats {
          valid-views: (- (get valid-views pub-stats) u1),
        })
      )
      true
    )

    ;; Decrement campaign-level total views
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
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)
