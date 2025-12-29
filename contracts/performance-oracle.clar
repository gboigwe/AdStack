;; Performance Oracle - Clarity v4
;; On-chain performance tracking with merkle proofs and fraud detection

;; ===================================
;; Constants
;; ===================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u4000))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u4001))
(define-constant ERR_INVALID_PROOF (err u4002))
(define-constant ERR_DATA_TOO_OLD (err u4003))
(define-constant ERR_THRESHOLD_NOT_MET (err u4004))
(define-constant ERR_ORACLE_NOT_AUTHORIZED (err u4005))

;; Performance thresholds
(define-constant MIN_VIEW_DURATION u3) ;; 3 seconds
(define-constant MAX_CLICK_RATE u20)   ;; 20% CTR (fraud detection)
(define-constant DATA_FRESHNESS_WINDOW u3600) ;; 1 hour

;; ===================================
;; Data Variables
;; ===================================

(define-data-var report-nonce uint u0)

;; Authorized oracles
(define-data-var oracle-registry (list 10 principal) (list))

;; ===================================
;; Data Maps
;; ===================================

;; Campaign performance metrics
(define-map campaign-performance
  { campaign-id: uint }
  {
    total-views: uint,
    valid-views: uint,
    total-clicks: uint,
    conversions: uint,
    total-spent: uint,
    avg-view-duration: uint,
    click-through-rate: uint, ;; Percentage * 100
    fraud-score: uint, ;; 0-100
    last-updated: uint, ;; stacks-block-time
    data-hash: (buff 32) ;; Merkle root of raw data
  }
)

;; Publisher-specific performance
(define-map publisher-performance
  { campaign-id: uint, publisher: principal }
  {
    views-delivered: uint,
    clicks-delivered: uint,
    conversions-delivered: uint,
    earnings: uint,
    quality-score: uint, ;; 0-100
    last-updated: uint
  }
)

;; Performance reports with merkle proofs
(define-map performance-reports
  { report-id: uint }
  {
    campaign-id: uint,
    reporter: principal,
    views: uint,
    clicks: uint,
    conversions: uint,
    timestamp: uint,
    merkle-root: (buff 32),
    verified: bool,
    verification-time: (optional uint)
  }
)

;; Merkle proof submissions
(define-map merkle-proofs
  { report-id: uint, proof-index: uint }
  {
    hash: (buff 32),
    position: uint ;; 0 = left, 1 = right
  }
)

;; Performance thresholds for campaigns
(define-map campaign-thresholds
  { campaign-id: uint }
  {
    min-views: uint,
    min-ctr: uint,
    max-fraud-score: uint,
    min-quality-score: uint
  }
)

;; Fraud alerts
(define-map fraud-alerts
  { campaign-id: uint, alert-index: uint }
  {
    detected-at: uint,
    fraud-type: (string-ascii 50),
    severity: uint, ;; 1-10
    description: (string-ascii 200),
    resolved: bool
  }
)

(define-map campaign-fraud-count
  { campaign-id: uint }
  { count: uint }
)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-campaign-performance (campaign-id uint))
  (map-get? campaign-performance { campaign-id: campaign-id })
)

(define-read-only (get-publisher-performance (campaign-id uint) (publisher principal))
  (map-get? publisher-performance { campaign-id: campaign-id, publisher: publisher })
)

(define-read-only (get-performance-report (report-id uint))
  (map-get? performance-reports { report-id: report-id })
)

(define-read-only (get-campaign-thresholds (campaign-id uint))
  (map-get? campaign-thresholds { campaign-id: campaign-id })
)

(define-read-only (is-oracle-authorized (oracle principal))
  (is-some (index-of (var-get oracle-registry) oracle))
)

(define-read-only (meets-performance-threshold (campaign-id uint))
  (match (get-campaign-performance campaign-id)
    perf
      (match (get-campaign-thresholds campaign-id)
        thresholds
          (ok (and
            (>= (get valid-views perf) (get min-views thresholds))
            (>= (get click-through-rate perf) (get min-ctr thresholds))
            (<= (get fraud-score perf) (get max-fraud-score thresholds))
          ))
        (ok true) ;; No thresholds set
      )
    ERR_CAMPAIGN_NOT_FOUND
  )
)

(define-read-only (get-fraud-alerts (campaign-id uint))
  (let
    (
      (alert-count (default-to { count: u0 } (map-get? campaign-fraud-count { campaign-id: campaign-id })))
    )
    (ok (get count alert-count))
  )
)

;; ===================================
;; Private Helper Functions
;; ===================================

(define-private (calculate-ctr (clicks uint) (views uint))
  (if (is-eq views u0)
    u0
    (/ (* clicks u10000) views) ;; CTR * 100 (basis points)
  )
)

(define-private (calculate-fraud-score (perf {
  total-views: uint,
  valid-views: uint,
  total-clicks: uint,
  conversions: uint,
  total-spent: uint,
  avg-view-duration: uint,
  click-through-rate: uint,
  fraud-score: uint,
  last-updated: uint,
  data-hash: (buff 32)
}))
  (let
    (
      (invalid-views (- (get total-views perf) (get valid-views perf)))
      (invalid-rate (if (is-eq (get total-views perf) u0)
        u0
        (/ (* invalid-views u100) (get total-views perf))
      ))
      (ctr (get click-through-rate perf))
      (suspicious-ctr (if (> ctr MAX_CLICK_RATE) u30 u0))
      (short-duration (if (< (get avg-view-duration perf) MIN_VIEW_DURATION) u20 u0))
    )
    (+ invalid-rate (+ suspicious-ctr short-duration))
  )
)

(define-private (is-data-fresh (timestamp uint))
  (let
    (
      (age (- stacks-block-time timestamp))
    )
    (< age DATA_FRESHNESS_WINDOW)
  )
)

;; ===================================
;; Public Functions
;; ===================================

;; Submit performance report (oracle only)
(define-public (submit-performance-report
  (campaign-id uint)
  (views uint)
  (clicks uint)
  (conversions uint)
  (merkle-root (buff 32))
)
  (let
    (
      (report-id (var-get report-nonce))
    )
    ;; Validate oracle
    (asserts! (is-oracle-authorized tx-sender) ERR_ORACLE_NOT_AUTHORIZED)

    ;; Create report
    (map-set performance-reports
      { report-id: report-id }
      {
        campaign-id: campaign-id,
        reporter: tx-sender,
        views: views,
        clicks: clicks,
        conversions: conversions,
        timestamp: stacks-block-time,
        merkle-root: merkle-root,
        verified: false,
        verification-time: none
      }
    )

    ;; Increment nonce
    (var-set report-nonce (+ report-id u1))

    (ok report-id)
  )
)

;; Verify performance report with merkle proof
(define-public (verify-performance-report
  (report-id uint)
  (proof-hashes (list 20 (buff 32)))
  (proof-positions (list 20 uint))
)
  (let
    (
      (report (unwrap! (get-performance-report report-id) ERR_CAMPAIGN_NOT_FOUND))
      ;; TODO: Implement actual merkle proof verification
      (is-valid true)
    )
    ;; Validate
    (asserts! is-valid ERR_INVALID_PROOF)

    ;; Mark as verified
    (map-set performance-reports
      { report-id: report-id }
      (merge report {
        verified: true,
        verification-time: (some stacks-block-time)
      })
    )

    ;; Update campaign performance
    (try! (update-campaign-performance
      (get campaign-id report)
      (get views report)
      (get clicks report)
      (get conversions report)
    ))

    (ok true)
  )
)

;; Update campaign performance metrics
(define-private (update-campaign-performance
  (campaign-id uint)
  (new-views uint)
  (new-clicks uint)
  (new-conversions uint)
)
  (let
    (
      (current (default-to {
        total-views: u0,
        valid-views: u0,
        total-clicks: u0,
        conversions: u0,
        total-spent: u0,
        avg-view-duration: u0,
        click-through-rate: u0,
        fraud-score: u0,
        last-updated: u0,
        data-hash: 0x00
      } (get-campaign-performance campaign-id)))
      (updated-views (+ (get total-views current) new-views))
      (updated-clicks (+ (get total-clicks current) new-clicks))
      (updated-conversions (+ (get conversions current) new-conversions))
      (new-ctr (calculate-ctr updated-clicks updated-views))
    )
    ;; Update performance
    (map-set campaign-performance
      { campaign-id: campaign-id }
      (merge current {
        total-views: updated-views,
        valid-views: updated-views, ;; Simplified, should filter invalid
        total-clicks: updated-clicks,
        conversions: updated-conversions,
        click-through-rate: new-ctr,
        last-updated: stacks-block-time,
        fraud-score: (calculate-fraud-score (merge current {
          total-views: updated-views,
          total-clicks: updated-clicks,
          click-through-rate: new-ctr
        }))
      })
    )

    (ok true)
  )
)

;; Update publisher performance
(define-public (update-publisher-metrics
  (campaign-id uint)
  (publisher principal)
  (views uint)
  (clicks uint)
  (conversions uint)
  (quality-score uint)
)
  (let
    (
      (current (default-to {
        views-delivered: u0,
        clicks-delivered: u0,
        conversions-delivered: u0,
        earnings: u0,
        quality-score: u0,
        last-updated: u0
      } (get-publisher-performance campaign-id publisher)))
    )
    ;; Validate oracle
    (asserts! (is-oracle-authorized tx-sender) ERR_ORACLE_NOT_AUTHORIZED)

    ;; Update metrics
    (map-set publisher-performance
      { campaign-id: campaign-id, publisher: publisher }
      {
        views-delivered: (+ (get views-delivered current) views),
        clicks-delivered: (+ (get clicks-delivered current) clicks),
        conversions-delivered: (+ (get conversions-delivered current) conversions),
        earnings: (get earnings current), ;; Updated by payout contract
        quality-score: quality-score,
        last-updated: stacks-block-time
      }
    )

    (ok true)
  )
)

;; Set campaign performance thresholds
(define-public (set-campaign-thresholds
  (campaign-id uint)
  (min-views uint)
  (min-ctr uint)
  (max-fraud-score uint)
  (min-quality-score uint)
)
  (begin
    ;; TODO: Add campaign owner authorization
    (map-set campaign-thresholds
      { campaign-id: campaign-id }
      {
        min-views: min-views,
        min-ctr: min-ctr,
        max-fraud-score: max-fraud-score,
        min-quality-score: min-quality-score
      }
    )

    (ok true)
  )
)

;; Report fraud
(define-public (report-fraud
  (campaign-id uint)
  (fraud-type (string-ascii 50))
  (severity uint)
  (description (string-ascii 200))
)
  (let
    (
      (alert-count (default-to { count: u0 } (map-get? campaign-fraud-count { campaign-id: campaign-id })))
      (alert-index (get count alert-count))
    )
    ;; Validate oracle
    (asserts! (is-oracle-authorized tx-sender) ERR_ORACLE_NOT_AUTHORIZED)

    ;; Record alert
    (map-set fraud-alerts
      { campaign-id: campaign-id, alert-index: alert-index }
      {
        detected-at: stacks-block-time,
        fraud-type: fraud-type,
        severity: severity,
        description: description,
        resolved: false
      }
    )

    ;; Increment count
    (map-set campaign-fraud-count
      { campaign-id: campaign-id }
      { count: (+ alert-index u1) }
    )

    (ok alert-index)
  )
)

;; Resolve fraud alert
(define-public (resolve-fraud-alert (campaign-id uint) (alert-index uint))
  (let
    (
      (alert (unwrap! (map-get? fraud-alerts { campaign-id: campaign-id, alert-index: alert-index }) ERR_CAMPAIGN_NOT_FOUND))
    )
    ;; Only contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)

    ;; Mark as resolved
    (map-set fraud-alerts
      { campaign-id: campaign-id, alert-index: alert-index }
      (merge alert { resolved: true })
    )

    (ok true)
  )
)

;; Administrative functions
(define-public (add-oracle (oracle principal))
  (let
    (
      (current-oracles (var-get oracle-registry))
    )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)

    ;; Add to registry
    (var-set oracle-registry (unwrap-panic (as-max-len? (append current-oracles oracle) u10)))

    (ok true)
  )
)

(define-public (remove-oracle (oracle principal))
  (let
    (
      (current-oracles (var-get oracle-registry))
      (filtered (filter is-not-target current-oracles))
    )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)

    ;; Remove from registry
    (var-set oracle-registry filtered)

    (ok true)
  )
)

(define-private (is-not-target (item principal))
  (not (is-eq item tx-sender))
)
