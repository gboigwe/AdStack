;; publisher-reputation.clar
;; On-chain reputation scoring for publishers with performance tracking

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u8000))
(define-constant ERR_PUBLISHER_NOT_FOUND (err u8001))
(define-constant ERR_INVALID_SCORE (err u8002))
(define-constant ERR_INVALID_PARAMS (err u8003))

;; Reputation tiers
(define-constant TIER_NOVICE u0)
(define-constant TIER_BRONZE u1)
(define-constant TIER_SILVER u2)
(define-constant TIER_GOLD u3)
(define-constant TIER_PLATINUM u4)

;; REPUTATION EVENTS
(define-event reputation-initialized
  (publisher principal)
  (initialized-by principal)
  (timestamp uint)
)

(define-event reputation-score-changed
  (publisher principal)
  (old-score uint)
  (new-score uint)
  (old-tier uint)
  (new-tier uint)
  (score-change int)
  (reason (string-ascii 256))
  (triggered-by principal)
  (timestamp uint)
)

(define-event campaign-recorded
  (publisher principal)
  (campaign-id uint)
  (successful bool)
  (performance-score uint)
  (revenue uint)
  (total-campaigns uint)
  (success-rate uint)
  (recorded-by principal)
  (timestamp uint)
)

(define-event penalty-applied
  (publisher principal)
  (penalty-id uint)
  (reason (string-ascii 256))
  (score-deduction uint)
  (duration-seconds (optional uint))
  (applied-by principal)
  (timestamp uint)
)

(define-event bonus-awarded
  (publisher principal)
  (reward-id uint)
  (reason (string-ascii 256))
  (score-addition uint)
  (criteria (string-ascii 128))
  (awarded-by principal)
  (timestamp uint)
)

(define-event fraud-flagged
  (publisher principal)
  (evidence (string-ascii 256))
  (fraud-flags uint)
  (penalty-applied bool)
  (flagged-by principal)
  (timestamp uint)
)

;; Score thresholds for tiers
(define-constant BRONZE_THRESHOLD u100)
(define-constant SILVER_THRESHOLD u250)
(define-constant GOLD_THRESHOLD u500)
(define-constant PLATINUM_THRESHOLD u1000)

;; Data variables
(define-data-var reputation-nonce uint u0)

;; Publisher reputation records
(define-map publisher-reputations
  { publisher: principal }
  {
    reputation-score: uint,
    tier: uint,
    total-campaigns: uint,
    successful-campaigns: uint,
    failed-campaigns: uint,
    total-revenue: uint,
    average-performance: uint,
    uptime-score: uint,
    fraud-flags: uint,
    last-updated: uint,
    created-at: uint
  }
)

;; Performance metrics
(define-map performance-metrics
  { publisher: principal, period: uint }
  {
    impressions: uint,
    clicks: uint,
    conversions: uint,
    ctr: uint,
    cvr: uint,
    revenue: uint,
    recorded-at: uint
  }
)

;; Reputation events
(define-map reputation-events
  { publisher: principal, event-id: uint }
  {
    event-type: (string-ascii 32),
    score-change: int,
    reason: (string-ascii 256),
    timestamp: uint,
    triggered-by: principal
  }
)

;; Event counter per publisher
(define-map publisher-event-count
  { publisher: principal }
  { count: uint }
)

;; Penalty records
(define-map penalties
  { publisher: principal, penalty-id: uint }
  {
    reason: (string-ascii 256),
    score-deduction: uint,
    applied-at: uint,
    expires-at: (optional uint),
    active: bool
  }
)

;; Reward records
(define-map rewards
  { publisher: principal, reward-id: uint }
  {
    reason: (string-ascii 256),
    score-addition: uint,
    awarded-at: uint,
    criteria-met: (string-ascii 128)
  }
)

;; Initialize publisher reputation
(define-public (initialize-reputation (publisher principal))
  (let
    (
      (existing (map-get? publisher-reputations { publisher: publisher }))
    )
    (asserts! (is-none existing) ERR_PUBLISHER_NOT_FOUND)

    (map-set publisher-reputations
      { publisher: publisher }
      {
        reputation-score: u0,
        tier: TIER_NOVICE,
        total-campaigns: u0,
        successful-campaigns: u0,
        failed-campaigns: u0,
        total-revenue: u0,
        average-performance: u0,
        uptime-score: u100,
        fraud-flags: u0,
        last-updated: stacks-block-time,
        created-at: stacks-block-time
      }
    )
    (emit-event (reputation-initialized publisher tx-sender stacks-block-time))
    (ok true)
  )
)

;; Update reputation score
(define-public (update-score (publisher principal) (score-change int) (reason (string-ascii 256)))
  (let
    (
      (reputation (unwrap! (map-get? publisher-reputations { publisher: publisher }) ERR_PUBLISHER_NOT_FOUND))
      (current-score (get reputation-score reputation))
      (new-score (if (> score-change 0)
        (+ current-score (to-uint score-change))
        (if (> current-score (to-uint (* score-change -1)))
          (- current-score (to-uint (* score-change -1)))
          u0
        )
      ))
      (new-tier (calculate-tier new-score))
      (event-count (get count (default-to { count: u0 } (map-get? publisher-event-count { publisher: publisher }))))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    ;; Update reputation
    (map-set publisher-reputations
      { publisher: publisher }
      (merge reputation {
        reputation-score: new-score,
        tier: new-tier,
        last-updated: stacks-block-time
      })
    )

    ;; Record event
    (map-set reputation-events
      { publisher: publisher, event-id: event-count }
      {
        event-type: "score_update",
        score-change: score-change,
        reason: reason,
        timestamp: stacks-block-time,
        triggered-by: tx-sender
      }
    )

    ;; Update event count
    (map-set publisher-event-count
      { publisher: publisher }
      { count: (+ event-count u1) }
    )
     (emit-event (reputation-score-changed
      publisher
      current-score
      new-score
      current-tier
      new-tier
      score-change
      reason
      tx-sender
      stacks-block-time
    ))

    (ok new-score)
  )
)

;; Record campaign outcome
(define-public (record-campaign-outcome
  (publisher principal)
  (campaign-id uint)
  (successful bool)
  (performance-score uint)
  (revenue uint)
)
  (let
    (
      (reputation (unwrap! (map-get? publisher-reputations { publisher: publisher }) ERR_PUBLISHER_NOT_FOUND))
      (total-campaigns (+ (get total-campaigns reputation) u1))
      (successful-campaigns (if successful
        (+ (get successful-campaigns reputation) u1)
        (get successful-campaigns reputation)
      ))
      (failed-campaigns (if successful
        (get failed-campaigns reputation)
        (+ (get failed-campaigns reputation) u1)
      ))
      (total-revenue (+ (get total-revenue reputation) revenue))
      (new-avg-performance (/ (+ (* (get average-performance reputation) (get total-campaigns reputation)) performance-score) total-campaigns))
      (score-change (if successful 10 -5))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (<= performance-score u100) ERR_INVALID_SCORE)

    ;; Update reputation
    (map-set publisher-reputations
      { publisher: publisher }
      (merge reputation {
        total-campaigns: total-campaigns,
        successful-campaigns: successful-campaigns,
        failed-campaigns: failed-campaigns,
        total-revenue: total-revenue,
        average-performance: new-avg-performance,
        last-updated: stacks-block-time
      })
    )

    ;; Update score
    (try! (update-score publisher score-change (if successful "Campaign success" "Campaign failure")))
       (emit-event (campaign-recorded
      publisher
      campaign-id
      successful
      performance-score
      revenue
      total-campaigns
      success-rate
      tx-sender
      stacks-block-time
    ))
    (ok true)
  )
)

;; Apply penalty
(define-public (apply-penalty
  (publisher principal)
  (reason (string-ascii 256))
  (score-deduction uint)
  (duration-seconds (optional uint))
)
  (let
    (
      (reputation (unwrap! (map-get? publisher-reputations { publisher: publisher }) ERR_PUBLISHER_NOT_FOUND))
      (event-count (get count (default-to { count: u0 } (map-get? publisher-event-count { publisher: publisher }))))
      (expires-at (match duration-seconds
        seconds (some (+ stacks-block-time seconds))
        none
      ))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (> score-deduction u0) ERR_INVALID_PARAMS)

    ;; Record penalty
    (map-set penalties
      { publisher: publisher, penalty-id: event-count }
      {
        reason: reason,
        score-deduction: score-deduction,
        applied-at: stacks-block-time,
        expires-at: expires-at,
        active: true
      }
    )

    ;; Update score
    (try! (update-score publisher (* -1 (to-int score-deduction)) reason))
       (emit-event (penalty-applied
      publisher
      event-count
      reason
      score-deduction
      duration-seconds
      tx-sender
      stacks-block-time
    ))
    (ok true)
  )
)

;; Award bonus
(define-public (award-bonus
  (publisher principal)
  (reason (string-ascii 256))
  (score-addition uint)
  (criteria (string-ascii 128))
)
  (let
    (
      (reputation (unwrap! (map-get? publisher-reputations { publisher: publisher }) ERR_PUBLISHER_NOT_FOUND))
      (event-count (get count (default-to { count: u0 } (map-get? publisher-event-count { publisher: publisher }))))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (> score-addition u0) ERR_INVALID_PARAMS)

    ;; Record reward
    (map-set rewards
      { publisher: publisher, reward-id: event-count }
      {
        reason: reason,
        score-addition: score-addition,
        awarded-at: stacks-block-time,
        criteria-met: criteria
      }
    )

    ;; Update score
    (try! (update-score publisher (to-int score-addition) reason))
      (emit-event (bonus-awarded
      publisher
      event-count
      reason
      score-addition
      criteria
      tx-sender
      stacks-block-time
    ))
    (ok true)
  )
)

;; Flag for fraud
(define-public (flag-fraud (publisher principal) (evidence (string-ascii 256)))
  (let
    (
      (reputation (unwrap! (map-get? publisher-reputations { publisher: publisher }) ERR_PUBLISHER_NOT_FOUND))
      (fraud-flags (+ (get fraud-flags reputation) u1))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    ;; Update fraud flags
    (map-set publisher-reputations
      { publisher: publisher }
      (merge reputation {
        fraud-flags: fraud-flags,
        last-updated: stacks-block-time
      })
    )

    ;; Apply penalty
    (try! (apply-penalty publisher evidence u50 (some u2592000))) ;; 30 days
      (emit-event (fraud-flagged
      publisher
      evidence
      fraud-flags
      true  ;; penalty applied
      tx-sender
      stacks-block-time
    ))

    (ok fraud-flags)
  )
)

;; Record performance metrics
(define-public (record-performance
  (publisher principal)
  (period uint)
  (impressions uint)
  (clicks uint)
  (conversions uint)
  (revenue uint)
)
  (let
    (
      (ctr (if (> impressions u0) (/ (* clicks u10000) impressions) u0))
      (cvr (if (> clicks u0) (/ (* conversions u10000) clicks) u0))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set performance-metrics
      { publisher: publisher, period: period }
      {
        impressions: impressions,
        clicks: clicks,
        conversions: conversions,
        ctr: ctr,
        cvr: cvr,
        revenue: revenue,
        recorded-at: stacks-block-time
      }
    )

    (ok true)
  )
)

;; Helper: Calculate tier from score
(define-private (calculate-tier (score uint))
  (if (>= score PLATINUM_THRESHOLD)
    TIER_PLATINUM
    (if (>= score GOLD_THRESHOLD)
      TIER_GOLD
      (if (>= score SILVER_THRESHOLD)
        TIER_SILVER
        (if (>= score BRONZE_THRESHOLD)
          TIER_BRONZE
          TIER_NOVICE
        )
      )
    )
  )
)

;; Helper: Check if contract owner
(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Read-only functions
(define-read-only (get-reputation (publisher principal))
  (map-get? publisher-reputations { publisher: publisher })
)

(define-read-only (get-reputation-score (publisher principal))
  (match (map-get? publisher-reputations { publisher: publisher })
    reputation (ok (get reputation-score reputation))
    ERR_PUBLISHER_NOT_FOUND
  )
)

(define-read-only (get-tier (publisher principal))
  (match (map-get? publisher-reputations { publisher: publisher })
    reputation (ok (get tier reputation))
    ERR_PUBLISHER_NOT_FOUND
  )
)

(define-read-only (get-performance (publisher principal) (period uint))
  (map-get? performance-metrics { publisher: publisher, period: period })
)

(define-read-only (get-reputation-event (publisher principal) (event-id uint))
  (map-get? reputation-events { publisher: publisher, event-id: event-id })
)

(define-read-only (get-penalty (publisher principal) (penalty-id uint))
  (map-get? penalties { publisher: publisher, penalty-id: penalty-id })
)

(define-read-only (get-reward (publisher principal) (reward-id uint))
  (map-get? rewards { publisher: principal, reward-id: reward-id })
)

(define-read-only (get-tier-name (tier uint))
  (if (is-eq tier TIER_PLATINUM)
    "Platinum"
    (if (is-eq tier TIER_GOLD)
      "Gold"
      (if (is-eq tier TIER_SILVER)
        "Silver"
        (if (is-eq tier TIER_BRONZE)
          "Bronze"
          "Novice"
        )
      )
    )
  )
)

(define-read-only (get-success-rate (publisher principal))
  (match (map-get? publisher-reputations { publisher: publisher })
    reputation
      (let
        (
          (total (get total-campaigns reputation))
          (successful (get successful-campaigns reputation))
        )
        (ok (if (> total u0)
          (/ (* successful u100) total)
          u0
        ))
      )
    ERR_PUBLISHER_NOT_FOUND
  )
)
