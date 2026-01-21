;; budget-optimizer.clar
;; Dynamic budget allocation with ROI-based reallocation

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u4000))
(define-constant ERR_ALLOCATION_NOT_FOUND (err u4001))
(define-constant ERR_INSUFFICIENT_BUDGET (err u4002))
(define-constant ERR_INVALID_ALLOCATION (err u4003))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u4004))
(define-constant ERR_REALLOCATION_TOO_SOON (err u4005))
(define-constant ERR_POOR_PERFORMANCE (err u4006))

;; Optimization strategies
(define-constant STRATEGY_EQUAL u1)
(define-constant STRATEGY_PERFORMANCE_BASED u2)
(define-constant STRATEGY_ROI_WEIGHTED u3)
(define-constant STRATEGY_CONVERSION_FOCUSED u4)

;; Thresholds
(define-constant MIN_ROI_THRESHOLD u5000) ;; 50% ROI minimum
(define-constant REALLOCATION_COOLDOWN u86400) ;; 24 hours in seconds
(define-constant MAX_ALLOCATIONS_PER_CAMPAIGN u50)

;; Data variables
(define-data-var allocation-nonce uint u0)

;; Data maps
(define-map budget-allocations
  { campaign-id: uint, allocation-id: uint }
  {
    channel: (string-ascii 64),
    allocated-amount: uint,
    spent-amount: uint,
    revenue-generated: uint,
    roi: uint,
    performance-score: uint,
    allocation-strategy: uint,
    created-at: uint,
    last-optimized: uint,
    active: bool
  }
)

(define-map campaign-budgets
  { campaign-id: uint }
  {
    total-budget: uint,
    allocated-budget: uint,
    spent-budget: uint,
    available-budget: uint,
    total-revenue: uint,
    overall-roi: uint,
    optimization-strategy: uint,
    last-reallocation: uint,
    allocation-count: uint
  }
)

(define-map channel-performance
  { campaign-id: uint, channel: (string-ascii 64) }
  {
    total-allocated: uint,
    total-spent: uint,
    total-revenue: uint,
    views: uint,
    clicks: uint,
    conversions: uint,
    avg-roi: uint,
    performance-trend: int,
    last-updated: uint
  }
)

(define-map reallocation-history
  { campaign-id: uint, timestamp: uint }
  {
    from-channel: (string-ascii 64),
    to-channel: (string-ascii 64),
    amount: uint,
    reason: (string-ascii 128),
    previous-roi: uint,
    expected-roi: uint,
    executed-by: principal
  }
)

;; Authorization
(define-read-only (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Initialize campaign budget
(define-public (initialize-campaign-budget
  (campaign-id uint)
  (total-budget uint)
  (optimization-strategy uint)
)
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (> total-budget u0) ERR_INSUFFICIENT_BUDGET)
    (asserts! (<= optimization-strategy STRATEGY_CONVERSION_FOCUSED) ERR_INVALID_ALLOCATION)

    (map-set campaign-budgets
      { campaign-id: campaign-id }
      {
        total-budget: total-budget,
        allocated-budget: u0,
        spent-budget: u0,
        available-budget: total-budget,
        total-revenue: u0,
        overall-roi: u0,
        optimization-strategy: optimization-strategy,
        last-reallocation: stacks-block-time,
        allocation-count: u0
      }
    )
    (ok true)
  )
)

;; Create budget allocation
(define-public (create-allocation
  (campaign-id uint)
  (channel (string-ascii 64))
  (amount uint)
)
  (let
    (
      (allocation-id (+ (var-get allocation-nonce) u1))
      (campaign (unwrap! (map-get? campaign-budgets { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_ALLOCATION)
    (asserts! (<= amount (get available-budget campaign)) ERR_INSUFFICIENT_BUDGET)
    (asserts! (< (get allocation-count campaign) MAX_ALLOCATIONS_PER_CAMPAIGN) ERR_INVALID_ALLOCATION)

    ;; Create allocation
    (map-set budget-allocations
      { campaign-id: campaign-id, allocation-id: allocation-id }
      {
        channel: channel,
        allocated-amount: amount,
        spent-amount: u0,
        revenue-generated: u0,
        roi: u0,
        performance-score: u0,
        allocation-strategy: (get optimization-strategy campaign),
        created-at: stacks-block-time,
        last-optimized: stacks-block-time,
        active: true
      }
    )

    ;; Update campaign budget
    (map-set campaign-budgets
      { campaign-id: campaign-id }
      (merge campaign {
        allocated-budget: (+ (get allocated-budget campaign) amount),
        available-budget: (- (get available-budget campaign) amount),
        allocation-count: (+ (get allocation-count campaign) u1)
      })
    )

    ;; Initialize channel performance
    (let
      (
        (existing-perf (default-to
          { total-allocated: u0, total-spent: u0, total-revenue: u0, views: u0, clicks: u0, conversions: u0, avg-roi: u0, performance-trend: 0, last-updated: u0 }
          (map-get? channel-performance { campaign-id: campaign-id, channel: channel })
        ))
      )
      (map-set channel-performance
        { campaign-id: campaign-id, channel: channel }
        (merge existing-perf {
          total-allocated: (+ (get total-allocated existing-perf) amount),
          last-updated: stacks-block-time
        })
      )
    )

    (var-set allocation-nonce allocation-id)
    (ok allocation-id)
  )
)

;; Update allocation performance
(define-public (update-allocation-performance
  (campaign-id uint)
  (allocation-id uint)
  (spent-amount uint)
  (revenue-generated uint)
  (views uint)
  (clicks uint)
  (conversions uint)
)
  (let
    (
      (allocation (unwrap! (map-get? budget-allocations { campaign-id: campaign-id, allocation-id: allocation-id }) ERR_ALLOCATION_NOT_FOUND))
      (campaign (unwrap! (map-get? campaign-budgets { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (<= spent-amount (get allocated-amount allocation)) ERR_INSUFFICIENT_BUDGET)

    ;; Calculate ROI (in basis points)
    (let
      (
        (roi (if (> spent-amount u0)
          (/ (* (- revenue-generated spent-amount) u10000) spent-amount)
          u0
        ))
        (performance-score (calculate-performance-score views clicks conversions revenue-generated))
      )
      ;; Update allocation
      (map-set budget-allocations
        { campaign-id: campaign-id, allocation-id: allocation-id }
        (merge allocation {
          spent-amount: spent-amount,
          revenue-generated: revenue-generated,
          roi: roi,
          performance-score: performance-score,
          last-optimized: stacks-block-time
        })
      )

      ;; Update channel performance
      (let
        (
          (channel-perf (unwrap! (map-get? channel-performance { campaign-id: campaign-id, channel: (get channel allocation) }) ERR_ALLOCATION_NOT_FOUND))
        )
        (map-set channel-performance
          { campaign-id: campaign-id, channel: (get channel allocation) }
          (merge channel-perf {
            total-spent: (+ (get total-spent channel-perf) spent-amount),
            total-revenue: (+ (get total-revenue channel-perf) revenue-generated),
            views: (+ (get views channel-perf) views),
            clicks: (+ (get clicks channel-perf) clicks),
            conversions: (+ (get conversions channel-perf) conversions),
            avg-roi: roi,
            last-updated: stacks-block-time
          })
        )
      )

      ;; Update campaign totals
      (let
        (
          (new-spent (+ (get spent-budget campaign) spent-amount))
          (new-revenue (+ (get total-revenue campaign) revenue-generated))
          (overall-roi (if (> new-spent u0)
            (/ (* (- new-revenue new-spent) u10000) new-spent)
            u0
          ))
        )
        (map-set campaign-budgets
          { campaign-id: campaign-id }
          (merge campaign {
            spent-budget: new-spent,
            total-revenue: new-revenue,
            overall-roi: overall-roi
          })
        )
      )

      (ok { roi: roi, performance-score: performance-score })
    )
  )
)

;; Calculate performance score
(define-private (calculate-performance-score
  (views uint)
  (clicks uint)
  (conversions uint)
  (revenue uint)
)
  (let
    (
      (ctr (if (> views u0) (/ (* clicks u10000) views) u0))
      (cvr (if (> clicks u0) (/ (* conversions u10000) clicks) u0))
      (score (+
        (/ ctr u100)
        (/ cvr u100)
        (/ revenue u1000000)
      ))
    )
    score
  )
)

;; Reallocate budget based on performance
(define-public (reallocate-budget
  (campaign-id uint)
  (from-allocation-id uint)
  (to-allocation-id uint)
  (amount uint)
  (reason (string-ascii 128))
)
  (let
    (
      (from-alloc (unwrap! (map-get? budget-allocations { campaign-id: campaign-id, allocation-id: from-allocation-id }) ERR_ALLOCATION_NOT_FOUND))
      (to-alloc (unwrap! (map-get? budget-allocations { campaign-id: campaign-id, allocation-id: to-allocation-id }) ERR_ALLOCATION_NOT_FOUND))
      (campaign (unwrap! (map-get? campaign-budgets { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (>= (- (get allocated-amount from-alloc) (get spent-amount from-alloc)) amount) ERR_INSUFFICIENT_BUDGET)
    (asserts! (>= (- stacks-block-time (get last-reallocation campaign)) REALLOCATION_COOLDOWN) ERR_REALLOCATION_TOO_SOON)

    ;; Validate performance improvement
    (asserts! (> (get roi to-alloc) (get roi from-alloc)) ERR_POOR_PERFORMANCE)

    ;; Update from allocation
    (map-set budget-allocations
      { campaign-id: campaign-id, allocation-id: from-allocation-id }
      (merge from-alloc {
        allocated-amount: (- (get allocated-amount from-alloc) amount)
      })
    )

    ;; Update to allocation
    (map-set budget-allocations
      { campaign-id: campaign-id, allocation-id: to-allocation-id }
      (merge to-alloc {
        allocated-amount: (+ (get allocated-amount to-alloc) amount)
      })
    )

    ;; Record reallocation
    (map-set reallocation-history
      { campaign-id: campaign-id, timestamp: stacks-block-time }
      {
        from-channel: (get channel from-alloc),
        to-channel: (get channel to-alloc),
        amount: amount,
        reason: reason,
        previous-roi: (get roi from-alloc),
        expected-roi: (get roi to-alloc),
        executed-by: tx-sender
      }
    )

    ;; Update campaign last reallocation
    (map-set campaign-budgets
      { campaign-id: campaign-id }
      (merge campaign { last-reallocation: stacks-block-time })
    )

    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-allocation (campaign-id uint) (allocation-id uint))
  (map-get? budget-allocations { campaign-id: campaign-id, allocation-id: allocation-id })
)

(define-read-only (get-campaign-budget (campaign-id uint))
  (map-get? campaign-budgets { campaign-id: campaign-id })
)

(define-read-only (get-channel-performance (campaign-id uint) (channel (string-ascii 64)))
  (map-get? channel-performance { campaign-id: campaign-id, channel: channel })
)

(define-read-only (get-reallocation-history (campaign-id uint) (timestamp uint))
  (map-get? reallocation-history { campaign-id: campaign-id, timestamp: timestamp })
)

(define-read-only (calculate-optimal-allocation
  (campaign-id uint)
  (total-amount uint)
  (channel-rois (list 10 { channel: (string-ascii 64), roi: uint }))
)
  (ok (fold allocate-by-roi channel-rois { remaining: total-amount, allocations: (list) }))
)

;; Helper for ROI-based allocation
(define-private (allocate-by-roi
  (channel-data { channel: (string-ascii 64), roi: uint })
  (acc { remaining: uint, allocations: (list 10 { channel: (string-ascii 64), amount: uint }) })
)
  (let
    (
      (allocation-amount (if (>= (get roi channel-data) MIN_ROI_THRESHOLD)
        (/ (get remaining acc) u2)
        u0
      ))
    )
    {
      remaining: (- (get remaining acc) allocation-amount),
      allocations: (unwrap-panic (as-max-len?
        (append (get allocations acc) { channel: (get channel channel-data), amount: allocation-amount })
        u10
      ))
    }
  )
)
