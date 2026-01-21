;; campaign-analytics-v4.clar
;; Enhanced analytics with real-time aggregation for Clarity v4

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u5000))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u5001))
(define-constant ERR_INVALID_METRICS (err u5002))
(define-constant ERR_INVALID_TIME_RANGE (err u5003))
(define-constant ERR_SNAPSHOT_NOT_FOUND (err u5004))

;; Aggregation periods
(define-constant PERIOD_HOURLY u3600)
(define-constant PERIOD_DAILY u86400)
(define-constant PERIOD_WEEKLY u604800)
(define-constant PERIOD_MONTHLY u2592000)

;; Metric types
(define-constant METRIC_VIEWS u1)
(define-constant METRIC_CLICKS u2)
(define-constant METRIC_CONVERSIONS u3)
(define-constant METRIC_REVENUE u4)
(define-constant METRIC_SPEND u5)

;; Data variables
(define-data-var snapshot-nonce uint u0)

;; Real-time metrics
(define-map campaign-metrics
  { campaign-id: uint }
  {
    total-views: uint,
    total-clicks: uint,
    total-conversions: uint,
    total-revenue: uint,
    total-spend: uint,
    unique-visitors: uint,
    bounce-rate: uint,
    avg-session-duration: uint,
    ctr: uint,
    cvr: uint,
    roi: uint,
    roas: uint,
    cpm: uint,
    cpc: uint,
    cpa: uint,
    last-updated: uint
  }
)

;; Time-series snapshots
(define-map metric-snapshots
  { campaign-id: uint, snapshot-id: uint }
  {
    timestamp: uint,
    period-type: uint,
    views: uint,
    clicks: uint,
    conversions: uint,
    revenue: uint,
    spend: uint,
    ctr: uint,
    cvr: uint,
    roi: uint
  }
)

;; Channel analytics
(define-map channel-metrics
  { campaign-id: uint, channel: (string-ascii 64), period: uint }
  {
    views: uint,
    clicks: uint,
    conversions: uint,
    revenue: uint,
    spend: uint,
    ctr: uint,
    cvr: uint,
    roi: uint,
    last-updated: uint
  }
)

;; Geographic analytics
(define-map geographic-metrics
  { campaign-id: uint, country-code: (string-ascii 2) }
  {
    views: uint,
    clicks: uint,
    conversions: uint,
    revenue: uint,
    avg-ctr: uint,
    avg-cvr: uint,
    total-spend: uint
  }
)

;; Device analytics
(define-map device-metrics
  { campaign-id: uint, device-type: (string-ascii 32) }
  {
    views: uint,
    clicks: uint,
    conversions: uint,
    revenue: uint,
    avg-session-duration: uint,
    bounce-rate: uint
  }
)

;; Funnel analytics
(define-map conversion-funnels
  { campaign-id: uint, funnel-stage: uint }
  {
    stage-name: (string-ascii 64),
    entries: uint,
    exits: uint,
    conversions: uint,
    drop-off-rate: uint,
    avg-time-in-stage: uint
  }
)

;; Cohort analytics
(define-map cohort-metrics
  { campaign-id: uint, cohort-date: uint }
  {
    cohort-size: uint,
    day-1-retention: uint,
    day-7-retention: uint,
    day-30-retention: uint,
    lifetime-value: uint,
    cumulative-revenue: uint
  }
)

;; Authorization
(define-read-only (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Update real-time metrics
(define-public (update-campaign-metrics
  (campaign-id uint)
  (views uint)
  (clicks uint)
  (conversions uint)
  (revenue uint)
  (spend uint)
  (unique-visitors uint)
  (bounce-rate uint)
  (avg-session-duration uint)
)
  (let
    (
      (existing (default-to
        {
          total-views: u0, total-clicks: u0, total-conversions: u0,
          total-revenue: u0, total-spend: u0, unique-visitors: u0,
          bounce-rate: u0, avg-session-duration: u0, ctr: u0, cvr: u0,
          roi: u0, roas: u0, cpm: u0, cpc: u0, cpa: u0, last-updated: u0
        }
        (map-get? campaign-metrics { campaign-id: campaign-id })
      ))
      (new-views (+ (get total-views existing) views))
      (new-clicks (+ (get total-clicks existing) clicks))
      (new-conversions (+ (get total-conversions existing) conversions))
      (new-revenue (+ (get total-revenue existing) revenue))
      (new-spend (+ (get total-spend existing) spend))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    ;; Calculate derived metrics
    (let
      (
        (ctr (if (> new-views u0) (/ (* new-clicks u10000) new-views) u0))
        (cvr (if (> new-clicks u0) (/ (* new-conversions u10000) new-clicks) u0))
        (roi (if (> new-spend u0) (/ (* (- new-revenue new-spend) u10000) new-spend) u0))
        (roas (if (> new-spend u0) (/ (* new-revenue u10000) new-spend) u0))
        (cpm (if (> new-views u0) (/ (* new-spend u1000000) new-views) u0))
        (cpc (if (> new-clicks u0) (/ (* new-spend u100) new-clicks) u0))
        (cpa (if (> new-conversions u0) (/ (* new-spend u100) new-conversions) u0))
      )
      (map-set campaign-metrics
        { campaign-id: campaign-id }
        {
          total-views: new-views,
          total-clicks: new-clicks,
          total-conversions: new-conversions,
          total-revenue: new-revenue,
          total-spend: new-spend,
          unique-visitors: unique-visitors,
          bounce-rate: bounce-rate,
          avg-session-duration: avg-session-duration,
          ctr: ctr,
          cvr: cvr,
          roi: roi,
          roas: roas,
          cpm: cpm,
          cpc: cpc,
          cpa: cpa,
          last-updated: stacks-block-time
        }
      )
      (ok { ctr: ctr, cvr: cvr, roi: roi, roas: roas })
    )
  )
)

;; Create metric snapshot
(define-public (create-snapshot
  (campaign-id uint)
  (period-type uint)
)
  (let
    (
      (snapshot-id (+ (var-get snapshot-nonce) u1))
      (metrics (unwrap! (map-get? campaign-metrics { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set metric-snapshots
      { campaign-id: campaign-id, snapshot-id: snapshot-id }
      {
        timestamp: stacks-block-time,
        period-type: period-type,
        views: (get total-views metrics),
        clicks: (get total-clicks metrics),
        conversions: (get total-conversions metrics),
        revenue: (get total-revenue metrics),
        spend: (get total-spend metrics),
        ctr: (get ctr metrics),
        cvr: (get cvr metrics),
        roi: (get roi metrics)
      }
    )

    (var-set snapshot-nonce snapshot-id)
    (ok snapshot-id)
  )
)

;; Update channel metrics
(define-public (update-channel-metrics
  (campaign-id uint)
  (channel (string-ascii 64))
  (period uint)
  (views uint)
  (clicks uint)
  (conversions uint)
  (revenue uint)
  (spend uint)
)
  (let
    (
      (ctr (if (> views u0) (/ (* clicks u10000) views) u0))
      (cvr (if (> clicks u0) (/ (* conversions u10000) clicks) u0))
      (roi (if (> spend u0) (/ (* (- revenue spend) u10000) spend) u0))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set channel-metrics
      { campaign-id: campaign-id, channel: channel, period: period }
      {
        views: views,
        clicks: clicks,
        conversions: conversions,
        revenue: revenue,
        spend: spend,
        ctr: ctr,
        cvr: cvr,
        roi: roi,
        last-updated: stacks-block-time
      }
    )
    (ok true)
  )
)

;; Update geographic metrics
(define-public (update-geographic-metrics
  (campaign-id uint)
  (country-code (string-ascii 2))
  (views uint)
  (clicks uint)
  (conversions uint)
  (revenue uint)
  (spend uint)
)
  (let
    (
      (existing (default-to
        { views: u0, clicks: u0, conversions: u0, revenue: u0, avg-ctr: u0, avg-cvr: u0, total-spend: u0 }
        (map-get? geographic-metrics { campaign-id: campaign-id, country-code: country-code })
      ))
      (new-views (+ (get views existing) views))
      (new-clicks (+ (get clicks existing) clicks))
      (new-conversions (+ (get conversions existing) conversions))
      (avg-ctr (if (> new-views u0) (/ (* new-clicks u10000) new-views) u0))
      (avg-cvr (if (> new-clicks u0) (/ (* new-conversions u10000) new-clicks) u0))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set geographic-metrics
      { campaign-id: campaign-id, country-code: country-code }
      {
        views: new-views,
        clicks: new-clicks,
        conversions: new-conversions,
        revenue: (+ (get revenue existing) revenue),
        avg-ctr: avg-ctr,
        avg-cvr: avg-cvr,
        total-spend: (+ (get total-spend existing) spend)
      }
    )
    (ok true)
  )
)

;; Update device metrics
(define-public (update-device-metrics
  (campaign-id uint)
  (device-type (string-ascii 32))
  (views uint)
  (clicks uint)
  (conversions uint)
  (revenue uint)
  (session-duration uint)
  (bounce-rate uint)
)
  (let
    (
      (existing (default-to
        { views: u0, clicks: u0, conversions: u0, revenue: u0, avg-session-duration: u0, bounce-rate: u0 }
        (map-get? device-metrics { campaign-id: campaign-id, device-type: device-type })
      ))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set device-metrics
      { campaign-id: campaign-id, device-type: device-type }
      {
        views: (+ (get views existing) views),
        clicks: (+ (get clicks existing) clicks),
        conversions: (+ (get conversions existing) conversions),
        revenue: (+ (get revenue existing) revenue),
        avg-session-duration: session-duration,
        bounce-rate: bounce-rate
      }
    )
    (ok true)
  )
)

;; Update conversion funnel
(define-public (update-conversion-funnel
  (campaign-id uint)
  (funnel-stage uint)
  (stage-name (string-ascii 64))
  (entries uint)
  (exits uint)
  (conversions uint)
  (avg-time-in-stage uint)
)
  (let
    (
      (drop-off-rate (if (> entries u0) (/ (* exits u10000) entries) u0))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set conversion-funnels
      { campaign-id: campaign-id, funnel-stage: funnel-stage }
      {
        stage-name: stage-name,
        entries: entries,
        exits: exits,
        conversions: conversions,
        drop-off-rate: drop-off-rate,
        avg-time-in-stage: avg-time-in-stage
      }
    )
    (ok true)
  )
)

;; Update cohort metrics
(define-public (update-cohort-metrics
  (campaign-id uint)
  (cohort-date uint)
  (cohort-size uint)
  (day-1-retention uint)
  (day-7-retention uint)
  (day-30-retention uint)
  (lifetime-value uint)
  (cumulative-revenue uint)
)
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set cohort-metrics
      { campaign-id: campaign-id, cohort-date: cohort-date }
      {
        cohort-size: cohort-size,
        day-1-retention: day-1-retention,
        day-7-retention: day-7-retention,
        day-30-retention: day-30-retention,
        lifetime-value: lifetime-value,
        cumulative-revenue: cumulative-revenue
      }
    )
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-campaign-metrics (campaign-id uint))
  (map-get? campaign-metrics { campaign-id: campaign-id })
)

(define-read-only (get-metric-snapshot (campaign-id uint) (snapshot-id uint))
  (map-get? metric-snapshots { campaign-id: campaign-id, snapshot-id: snapshot-id })
)

(define-read-only (get-channel-metrics (campaign-id uint) (channel (string-ascii 64)) (period uint))
  (map-get? channel-metrics { campaign-id: campaign-id, channel: channel, period: period })
)

(define-read-only (get-geographic-metrics (campaign-id uint) (country-code (string-ascii 2)))
  (map-get? geographic-metrics { campaign-id: campaign-id, country-code: country-code })
)

(define-read-only (get-device-metrics (campaign-id uint) (device-type (string-ascii 32)))
  (map-get? device-metrics { campaign-id: campaign-id, device-type: device-type })
)

(define-read-only (get-conversion-funnel (campaign-id uint) (funnel-stage uint))
  (map-get? conversion-funnels { campaign-id: campaign-id, funnel-stage: funnel-stage })
)

(define-read-only (get-cohort-metrics (campaign-id uint) (cohort-date uint))
  (map-get? cohort-metrics { campaign-id: campaign-id, cohort-date: cohort-date })
)

;; Calculate period-over-period growth
(define-read-only (calculate-growth-rate
  (campaign-id uint)
  (current-snapshot-id uint)
  (previous-snapshot-id uint)
  (metric-type uint)
)
  (let
    (
      (current (unwrap! (map-get? metric-snapshots { campaign-id: campaign-id, snapshot-id: current-snapshot-id }) ERR_SNAPSHOT_NOT_FOUND))
      (previous (unwrap! (map-get? metric-snapshots { campaign-id: campaign-id, snapshot-id: previous-snapshot-id }) ERR_SNAPSHOT_NOT_FOUND))
      (current-value (get-snapshot-metric-value current metric-type))
      (previous-value (get-snapshot-metric-value previous metric-type))
    )
    (if (> previous-value u0)
      (ok (/ (* (- current-value previous-value) u10000) previous-value))
      (ok u0)
    )
  )
)

;; Helper to extract metric value from snapshot
(define-private (get-snapshot-metric-value (snapshot { timestamp: uint, period-type: uint, views: uint, clicks: uint, conversions: uint, revenue: uint, spend: uint, ctr: uint, cvr: uint, roi: uint }) (metric-type uint))
  (if (is-eq metric-type METRIC_VIEWS)
    (get views snapshot)
    (if (is-eq metric-type METRIC_CLICKS)
      (get clicks snapshot)
      (if (is-eq metric-type METRIC_CONVERSIONS)
        (get conversions snapshot)
        (if (is-eq metric-type METRIC_REVENUE)
          (get revenue snapshot)
          (get spend snapshot)
        )
      )
    )
  )
)
