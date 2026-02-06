;; Anomaly Detector Contract
;; Statistical analysis and behavioral scoring for fraud detection

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u200))
(define-constant err-not-found (err u201))
(define-constant err-invalid-threshold (err u202))
(define-constant err-unauthorized (err u203))

;; Z-score thresholds for anomaly detection
(define-constant z-score-threshold-warning u200)  ;; 2.0 standard deviations
(define-constant z-score-threshold-critical u300) ;; 3.0 standard deviations

;; Data Variables
(define-data-var detector-admin principal contract-owner)
(define-data-var global-sensitivity uint u70) ;; 0-100, higher = more sensitive

;; Behavioral baselines for publishers
(define-map publisher-baselines
  principal
  {
    avg-impressions: uint,
    avg-clicks: uint,
    avg-ctr: uint,              ;; Click-through rate (0-10000 = 0-100%)
    avg-session-duration: uint, ;; seconds
    avg-bounce-rate: uint,      ;; 0-10000 = 0-100%
    std-impressions: uint,      ;; Standard deviation
    std-clicks: uint,
    std-ctr: uint,
    sample-size: uint,
    last-updated: uint
  }
)

;; Campaign behavioral baselines
(define-map campaign-baselines
  uint ;; campaign-id
  {
    avg-daily-impressions: uint,
    avg-daily-clicks: uint,
    avg-conversion-rate: uint,  ;; 0-10000 = 0-100%
    avg-cost-per-click: uint,
    std-daily-impressions: uint,
    std-daily-clicks: uint,
    sample-days: uint,
    last-updated: uint
  }
)

;; Real-time anomaly detection results
(define-map anomaly-detections
  { campaign-id: uint, publisher-id: principal, detection-id: uint }
  {
    detected-at: uint,
    anomaly-type: (string-ascii 32), ;; "ctr", "volume", "velocity", "pattern"
    severity: (string-ascii 16),      ;; "low", "medium", "high", "critical"
    z-score: uint,                    ;; Multiplied by 100 for precision
    actual-value: uint,
    expected-value: uint,
    deviation-pct: uint,              ;; Percentage deviation
    auto-flagged: bool,
    confirmed: (optional bool)
  }
)

;; Velocity tracking (rate of change detection)
(define-map velocity-tracking
  { campaign-id: uint, publisher-id: principal }
  {
    last-hour-impressions: uint,
    last-hour-clicks: uint,
    current-hour-impressions: uint,
    current-hour-clicks: uint,
    velocity-score: uint,           ;; 0-100, higher = more suspicious
    last-reset: uint
  }
)

;; Pattern analysis (time-based patterns)
(define-map traffic-patterns
  { campaign-id: uint, publisher-id: principal, hour: uint }
  {
    avg-impressions: uint,
    avg-clicks: uint,
    std-impressions: uint,
    sample-count: uint,
    last-updated: uint
  }
)

;; Behavioral scoring
(define-map behavioral-scores
  { campaign-id: uint, publisher-id: principal }
  {
    overall-score: uint,            ;; 0-100, lower = more suspicious
    ctr-score: uint,
    velocity-score: uint,
    pattern-score: uint,
    consistency-score: uint,
    last-calculated: uint
  }
)

;; Detection counters
(define-data-var detection-counter uint u0)

;; Admin Functions

;; Set detector admin
(define-public (set-detector-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get detector-admin)) err-owner-only)
    (ok (var-set detector-admin new-admin))
  )
)

;; Update global sensitivity
(define-public (set-global-sensitivity (sensitivity uint))
  (begin
    (asserts! (is-eq tx-sender (var-get detector-admin)) err-owner-only)
    (asserts! (<= sensitivity u100) err-invalid-threshold)
    (ok (var-set global-sensitivity sensitivity))
  )
)

;; Core Detection Functions

;; Update publisher baseline metrics
(define-public (update-publisher-baseline
  (publisher principal)
  (impressions uint)
  (clicks uint)
  (ctr uint)
  (session-duration uint)
  (bounce-rate uint)
)
  (let
    (
      (existing (map-get? publisher-baselines publisher))
    )
    (match existing
      baseline
        ;; Update existing baseline using exponential moving average
        (let
          (
            (alpha u20) ;; 20% weight to new data
            (new-avg-impressions (/ (+ (* (get avg-impressions baseline) u80) (* impressions alpha)) u100))
            (new-avg-clicks (/ (+ (* (get avg-clicks baseline) u80) (* clicks alpha)) u100))
            (new-avg-ctr (/ (+ (* (get avg-ctr baseline) u80) (* ctr alpha)) u100))
            (new-sample-size (+ (get sample-size baseline) u1))
          )
          (ok (map-set publisher-baselines publisher {
            avg-impressions: new-avg-impressions,
            avg-clicks: new-avg-clicks,
            avg-ctr: new-avg-ctr,
            avg-session-duration: (/ (+ (* (get avg-session-duration baseline) u80) (* session-duration alpha)) u100),
            avg-bounce-rate: (/ (+ (* (get avg-bounce-rate baseline) u80) (* bounce-rate alpha)) u100),
            std-impressions: (calculate-std-dev impressions new-avg-impressions),
            std-clicks: (calculate-std-dev clicks new-avg-clicks),
            std-ctr: (calculate-std-dev ctr new-avg-ctr),
            sample-size: new-sample-size,
            last-updated: block-height
          }))
        )
      ;; Create new baseline
      (ok (map-set publisher-baselines publisher {
        avg-impressions: impressions,
        avg-clicks: clicks,
        avg-ctr: ctr,
        avg-session-duration: session-duration,
        avg-bounce-rate: bounce-rate,
        std-impressions: u0,
        std-clicks: u0,
        std-ctr: u0,
        sample-size: u1,
        last-updated: block-height
      }))
    )
  )
)

;; Detect CTR anomaly
(define-public (detect-ctr-anomaly
  (campaign-id uint)
  (publisher-id principal)
  (observed-ctr uint)
)
  (let
    (
      (baseline (unwrap! (map-get? publisher-baselines publisher-id) err-not-found))
      (expected-ctr (get avg-ctr baseline))
      (std-ctr (get std-ctr baseline))
      (z-score (if (> std-ctr u0)
        (/ (* (if (> observed-ctr expected-ctr)
          (- observed-ctr expected-ctr)
          (- expected-ctr observed-ctr)
        ) u100) std-ctr)
        u0
      ))
      (deviation-pct (if (> expected-ctr u0)
        (/ (* (if (> observed-ctr expected-ctr)
          (- observed-ctr expected-ctr)
          (- expected-ctr observed-ctr)
        ) u10000) expected-ctr)
        u0
      ))
      (severity (calculate-severity z-score))
      (is-critical (>= z-score z-score-threshold-critical))
    )
    ;; Record detection
    (record-anomaly
      campaign-id
      publisher-id
      "ctr"
      severity
      z-score
      observed-ctr
      expected-ctr
      deviation-pct
      is-critical
    )
  )
)

;; Detect volume anomaly (sudden traffic spikes)
(define-public (detect-volume-anomaly
  (campaign-id uint)
  (publisher-id principal)
  (observed-impressions uint)
)
  (let
    (
      (baseline (unwrap! (map-get? publisher-baselines publisher-id) err-not-found))
      (expected-impressions (get avg-impressions baseline))
      (std-impressions (get std-impressions baseline))
      (z-score (if (> std-impressions u0)
        (/ (* (if (> observed-impressions expected-impressions)
          (- observed-impressions expected-impressions)
          (- expected-impressions observed-impressions)
        ) u100) std-impressions)
        u0
      ))
      (deviation-pct (if (> expected-impressions u0)
        (/ (* (if (> observed-impressions expected-impressions)
          (- observed-impressions expected-impressions)
          (- expected-impressions observed-impressions)
        ) u10000) expected-impressions)
        u0
      ))
      (severity (calculate-severity z-score))
      (is-critical (>= z-score z-score-threshold-critical))
    )
    (record-anomaly
      campaign-id
      publisher-id
      "volume"
      severity
      z-score
      observed-impressions
      expected-impressions
      deviation-pct
      is-critical
    )
  )
)

;; Track velocity (rate of change)
(define-public (update-velocity
  (campaign-id uint)
  (publisher-id principal)
  (current-impressions uint)
  (current-clicks uint)
)
  (let
    (
      (existing (map-get? velocity-tracking { campaign-id: campaign-id, publisher-id: publisher-id }))
    )
    (match existing
      velocity
        (let
          (
            ;; Calculate velocity (rate of change)
            (impression-delta (if (> current-impressions (get current-hour-impressions velocity))
              (- current-impressions (get current-hour-impressions velocity))
              u0
            ))
            (click-delta (if (> current-clicks (get current-hour-clicks velocity))
              (- current-clicks (get current-hour-clicks velocity))
              u0
            ))
            (velocity-score (calculate-velocity-score impression-delta click-delta))
          )
          (ok (map-set velocity-tracking
            { campaign-id: campaign-id, publisher-id: publisher-id }
            {
              last-hour-impressions: (get current-hour-impressions velocity),
              last-hour-clicks: (get current-hour-clicks velocity),
              current-hour-impressions: current-impressions,
              current-hour-clicks: current-clicks,
              velocity-score: velocity-score,
              last-reset: block-height
            }
          ))
        )
      ;; Initialize tracking
      (ok (map-set velocity-tracking
        { campaign-id: campaign-id, publisher-id: publisher-id }
        {
          last-hour-impressions: u0,
          last-hour-clicks: u0,
          current-hour-impressions: current-impressions,
          current-hour-clicks: current-clicks,
          velocity-score: u0,
          last-reset: block-height
        }
      ))
    )
  )
)

;; Calculate behavioral score
(define-public (calculate-behavioral-score
  (campaign-id uint)
  (publisher-id principal)
)
  (let
    (
      (baseline (map-get? publisher-baselines publisher-id))
      (velocity (map-get? velocity-tracking { campaign-id: campaign-id, publisher-id: publisher-id }))
    )
    (match baseline
      pub-baseline
        (let
          (
            (ctr-score (calculate-ctr-score (get avg-ctr pub-baseline)))
            (vel-score (match velocity
              v (- u100 (get velocity-score v))
              u50
            ))
            (pattern-score u70) ;; TODO: Implement pattern analysis
            (consistency-score (calculate-consistency-score (get sample-size pub-baseline)))
            (overall (/ (+ (+ ctr-score vel-score) (+ pattern-score consistency-score)) u4))
          )
          (map-set behavioral-scores
            { campaign-id: campaign-id, publisher-id: publisher-id }
            {
              overall-score: overall,
              ctr-score: ctr-score,
              velocity-score: vel-score,
              pattern-score: pattern-score,
              consistency-score: consistency-score,
              last-calculated: block-height
            }
          )
          (ok overall)
        )
      (ok u50) ;; Default score if no baseline
    )
  )
)

;; Private Helper Functions

;; Record anomaly detection
(define-private (record-anomaly
  (campaign-id uint)
  (publisher-id principal)
  (anomaly-type (string-ascii 32))
  (severity (string-ascii 16))
  (z-score uint)
  (actual uint)
  (expected uint)
  (deviation uint)
  (auto-flag bool)
)
  (let
    (
      (detection-id (+ (var-get detection-counter) u1))
    )
    (var-set detection-counter detection-id)
    (map-set anomaly-detections
      { campaign-id: campaign-id, publisher-id: publisher-id, detection-id: detection-id }
      {
        detected-at: block-height,
        anomaly-type: anomaly-type,
        severity: severity,
        z-score: z-score,
        actual-value: actual,
        expected-value: expected,
        deviation-pct: deviation,
        auto-flagged: auto-flag,
        confirmed: none
      }
    )
    (ok detection-id)
  )
)

;; Calculate severity based on z-score
(define-private (calculate-severity (z-score uint))
  (if (>= z-score z-score-threshold-critical) "critical"
    (if (>= z-score z-score-threshold-warning) "high"
      (if (>= z-score u150) "medium" "low")
    )
  )
)

;; Calculate standard deviation (simplified)
(define-private (calculate-std-dev (value uint) (mean uint))
  (if (> value mean)
    (- value mean)
    (- mean value)
  )
)

;; Calculate velocity score
(define-private (calculate-velocity-score (impression-delta uint) (click-delta uint))
  (let
    (
      (total-delta (+ impression-delta click-delta))
    )
    ;; Higher delta = higher velocity score (more suspicious)
    (if (> total-delta u10000) u100
      (if (> total-delta u5000) u80
        (if (> total-delta u1000) u60
          (if (> total-delta u500) u40 u20)
        )
      )
    )
  )
)

;; Calculate CTR score (normal CTR ranges)
(define-private (calculate-ctr-score (ctr uint))
  ;; Normal CTR is typically 200-500 (2-5%)
  ;; Score higher for normal ranges
  (if (and (>= ctr u200) (<= ctr u500)) u90
    (if (and (>= ctr u100) (<= ctr u1000)) u70
      (if (and (>= ctr u50) (<= ctr u1500)) u50 u30)
    )
  )
)

;; Calculate consistency score based on sample size
(define-private (calculate-consistency-score (sample-size uint))
  ;; More samples = more consistent = higher score
  (if (>= sample-size u100) u95
    (if (>= sample-size u50) u85
      (if (>= sample-size u20) u70
        (if (>= sample-size u10) u50 u30)
      )
    )
  )
)

;; Read-Only Functions

;; Get publisher baseline
(define-read-only (get-publisher-baseline (publisher principal))
  (map-get? publisher-baselines publisher)
)

;; Get campaign baseline
(define-read-only (get-campaign-baseline (campaign-id uint))
  (map-get? campaign-baselines campaign-id)
)

;; Get anomaly detection
(define-read-only (get-anomaly-detection
  (campaign-id uint)
  (publisher-id principal)
  (detection-id uint)
)
  (map-get? anomaly-detections
    { campaign-id: campaign-id, publisher-id: publisher-id, detection-id: detection-id }
  )
)

;; Get velocity tracking
(define-read-only (get-velocity
  (campaign-id uint)
  (publisher-id principal)
)
  (map-get? velocity-tracking { campaign-id: campaign-id, publisher-id: publisher-id })
)

;; Get behavioral score
(define-read-only (get-behavioral-score
  (campaign-id uint)
  (publisher-id principal)
)
  (map-get? behavioral-scores { campaign-id: campaign-id, publisher-id: publisher-id })
)

;; Get global sensitivity
(define-read-only (get-sensitivity)
  (ok (var-get global-sensitivity))
)

;; Check if publisher behavior is suspicious
(define-read-only (is-suspicious
  (campaign-id uint)
  (publisher-id principal)
)
  (match (map-get? behavioral-scores { campaign-id: campaign-id, publisher-id: publisher-id })
    score
      (ok (< (get overall-score score) u40)) ;; Score below 40 is suspicious
    (ok false)
  )
)
