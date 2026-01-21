;; milestone-tracker.clar
;; Campaign progress monitoring with KPI milestones and bonus unlocking

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u3000))
(define-constant ERR_MILESTONE_NOT_FOUND (err u3001))
(define-constant ERR_ALREADY_ACHIEVED (err u3002))
(define-constant ERR_INVALID_PROGRESS (err u3003))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u3004))
(define-constant ERR_INSUFFICIENT_PERFORMANCE (err u3005))
(define-constant ERR_BONUS_ALREADY_CLAIMED (err u3006))
(define-constant ERR_MILESTONE_NOT_ACHIEVED (err u3007))

;; Milestone types
(define-constant MILESTONE_TYPE_VIEWS u1)
(define-constant MILESTONE_TYPE_CLICKS u2)
(define-constant MILESTONE_TYPE_CONVERSIONS u3)
(define-constant MILESTONE_TYPE_CTR u4)
(define-constant MILESTONE_TYPE_REVENUE u5)

;; Data variables
(define-data-var milestone-nonce uint u0)
(define-data-var nft-nonce uint u0)

;; Data maps
(define-map milestones
  { campaign-id: uint, milestone-id: uint }
  {
    milestone-type: uint,
    target-value: uint,
    current-value: uint,
    bonus-amount: uint,
    achieved: bool,
    achieved-at: uint,
    created-at: uint,
    created-by: principal,
    description: (string-ascii 256)
  }
)

(define-map campaign-milestones
  { campaign-id: uint }
  {
    total-milestones: uint,
    achieved-milestones: uint,
    total-bonus-pool: uint,
    claimed-bonuses: uint,
    last-updated: uint
  }
)

(define-map milestone-progress
  { campaign-id: uint, milestone-id: uint }
  {
    views: uint,
    clicks: uint,
    conversions: uint,
    revenue: uint,
    last-update: uint,
    updated-by: principal
  }
)

(define-map bonus-claims
  { campaign-id: uint, milestone-id: uint, claimer: principal }
  {
    amount: uint,
    claimed-at: uint,
    nft-id: uint
  }
)

(define-map milestone-nfts
  { nft-id: uint }
  {
    campaign-id: uint,
    milestone-id: uint,
    owner: principal,
    minted-at: uint,
    achievement-data: (string-ascii 512)
  }
)

;; Authorization
(define-read-only (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Create milestone
(define-public (create-milestone
  (campaign-id uint)
  (milestone-type uint)
  (target-value uint)
  (bonus-amount uint)
  (description (string-ascii 256))
)
  (let
    (
      (milestone-id (+ (var-get milestone-nonce) u1))
      (campaign-data (default-to
        { total-milestones: u0, achieved-milestones: u0, total-bonus-pool: u0, claimed-bonuses: u0, last-updated: u0 }
        (map-get? campaign-milestones { campaign-id: campaign-id })
      ))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (> target-value u0) ERR_INVALID_PROGRESS)
    (asserts! (<= milestone-type MILESTONE_TYPE_REVENUE) ERR_INVALID_PROGRESS)

    ;; Store milestone
    (map-set milestones
      { campaign-id: campaign-id, milestone-id: milestone-id }
      {
        milestone-type: milestone-type,
        target-value: target-value,
        current-value: u0,
        bonus-amount: bonus-amount,
        achieved: false,
        achieved-at: u0,
        created-at: stacks-block-time,
        created-by: tx-sender,
        description: description
      }
    )

    ;; Initialize progress
    (map-set milestone-progress
      { campaign-id: campaign-id, milestone-id: milestone-id }
      {
        views: u0,
        clicks: u0,
        conversions: u0,
        revenue: u0,
        last-update: stacks-block-time,
        updated-by: tx-sender
      }
    )

    ;; Update campaign milestones
    (map-set campaign-milestones
      { campaign-id: campaign-id }
      (merge campaign-data {
        total-milestones: (+ (get total-milestones campaign-data) u1),
        total-bonus-pool: (+ (get total-bonus-pool campaign-data) bonus-amount),
        last-updated: stacks-block-time
      })
    )

    (var-set milestone-nonce milestone-id)
    (ok milestone-id)
  )
)

;; Update milestone progress
(define-public (update-milestone-progress
  (campaign-id uint)
  (milestone-id uint)
  (views uint)
  (clicks uint)
  (conversions uint)
  (revenue uint)
)
  (let
    (
      (milestone (unwrap! (map-get? milestones { campaign-id: campaign-id, milestone-id: milestone-id }) ERR_MILESTONE_NOT_FOUND))
      (progress (unwrap! (map-get? milestone-progress { campaign-id: campaign-id, milestone-id: milestone-id }) ERR_MILESTONE_NOT_FOUND))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (not (get achieved milestone)) ERR_ALREADY_ACHIEVED)

    ;; Update progress
    (map-set milestone-progress
      { campaign-id: campaign-id, milestone-id: milestone-id }
      {
        views: views,
        clicks: clicks,
        conversions: conversions,
        revenue: revenue,
        last-update: stacks-block-time,
        updated-by: tx-sender
      }
    )

    ;; Calculate current value based on milestone type
    (let
      (
        (current-value (get-milestone-current-value (get milestone-type milestone) views clicks conversions revenue))
      )
      ;; Update milestone current value
      (map-set milestones
        { campaign-id: campaign-id, milestone-id: milestone-id }
        (merge milestone { current-value: current-value })
      )

      ;; Check if milestone achieved
      (if (>= current-value (get target-value milestone))
        (try! (mark-milestone-achieved campaign-id milestone-id))
        (ok true)
      )
    )
  )
)

;; Helper: Get current value based on milestone type
(define-private (get-milestone-current-value
  (milestone-type uint)
  (views uint)
  (clicks uint)
  (conversions uint)
  (revenue uint)
)
  (if (is-eq milestone-type MILESTONE_TYPE_VIEWS)
    views
    (if (is-eq milestone-type MILESTONE_TYPE_CLICKS)
      clicks
      (if (is-eq milestone-type MILESTONE_TYPE_CONVERSIONS)
        conversions
        (if (is-eq milestone-type MILESTONE_TYPE_CTR)
          (if (> views u0) (/ (* clicks u10000) views) u0)
          revenue
        )
      )
    )
  )
)

;; Mark milestone as achieved
(define-private (mark-milestone-achieved (campaign-id uint) (milestone-id uint))
  (let
    (
      (milestone (unwrap! (map-get? milestones { campaign-id: campaign-id, milestone-id: milestone-id }) ERR_MILESTONE_NOT_FOUND))
      (campaign-data (unwrap! (map-get? campaign-milestones { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    )
    ;; Update milestone
    (map-set milestones
      { campaign-id: campaign-id, milestone-id: milestone-id }
      (merge milestone {
        achieved: true,
        achieved-at: stacks-block-time
      })
    )

    ;; Update campaign stats
    (map-set campaign-milestones
      { campaign-id: campaign-id }
      (merge campaign-data {
        achieved-milestones: (+ (get achieved-milestones campaign-data) u1),
        last-updated: stacks-block-time
      })
    )

    (ok true)
  )
)

;; Claim milestone bonus
(define-public (claim-milestone-bonus
  (campaign-id uint)
  (milestone-id uint)
)
  (let
    (
      (milestone (unwrap! (map-get? milestones { campaign-id: campaign-id, milestone-id: milestone-id }) ERR_MILESTONE_NOT_FOUND))
      (existing-claim (map-get? bonus-claims { campaign-id: campaign-id, milestone-id: milestone-id, claimer: tx-sender }))
    )
    (asserts! (get achieved milestone) ERR_MILESTONE_NOT_ACHIEVED)
    (asserts! (is-none existing-claim) ERR_BONUS_ALREADY_CLAIMED)

    ;; Mint achievement NFT
    (let
      (
        (nft-id (+ (var-get nft-nonce) u1))
        (progress (unwrap! (map-get? milestone-progress { campaign-id: campaign-id, milestone-id: milestone-id }) ERR_MILESTONE_NOT_FOUND))
        (achievement-data (concat
          (concat "Campaign:" (uint-to-ascii campaign-id))
          (concat ",Milestone:" (uint-to-ascii milestone-id))
        ))
      )
      ;; Record NFT
      (map-set milestone-nfts
        { nft-id: nft-id }
        {
          campaign-id: campaign-id,
          milestone-id: milestone-id,
          owner: tx-sender,
          minted-at: stacks-block-time,
          achievement-data: achievement-data
        }
      )

      ;; Record bonus claim
      (map-set bonus-claims
        { campaign-id: campaign-id, milestone-id: milestone-id, claimer: tx-sender }
        {
          amount: (get bonus-amount milestone),
          claimed-at: stacks-block-time,
          nft-id: nft-id
        }
      )

      ;; Update campaign claimed bonuses
      (let
        (
          (campaign-data (unwrap! (map-get? campaign-milestones { campaign-id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
        )
        (map-set campaign-milestones
          { campaign-id: campaign-id }
          (merge campaign-data {
            claimed-bonuses: (+ (get claimed-bonuses campaign-data) (get bonus-amount milestone)),
            last-updated: stacks-block-time
          })
        )
      )

      (var-set nft-nonce nft-id)
      (ok { bonus-amount: (get bonus-amount milestone), nft-id: nft-id })
    )
  )
)

;; Helper: Convert uint to ascii (simplified)
(define-private (uint-to-ascii (value uint))
  (if (<= value u9)
    (unwrap-panic (element-at "0123456789" value))
    "0"
  )
)

;; Read-only functions
(define-read-only (get-milestone (campaign-id uint) (milestone-id uint))
  (map-get? milestones { campaign-id: campaign-id, milestone-id: milestone-id })
)

(define-read-only (get-milestone-progress (campaign-id uint) (milestone-id uint))
  (map-get? milestone-progress { campaign-id: campaign-id, milestone-id: milestone-id })
)

(define-read-only (get-campaign-milestones (campaign-id uint))
  (map-get? campaign-milestones { campaign-id: campaign-id })
)

(define-read-only (get-bonus-claim (campaign-id uint) (milestone-id uint) (claimer principal))
  (map-get? bonus-claims { campaign-id: campaign-id, milestone-id: milestone-id, claimer: claimer })
)

(define-read-only (get-milestone-nft (nft-id uint))
  (map-get? milestone-nfts { nft-id: nft-id })
)

(define-read-only (get-campaign-completion-rate (campaign-id uint))
  (match (map-get? campaign-milestones { campaign-id: campaign-id })
    campaign-data
      (if (> (get total-milestones campaign-data) u0)
        (ok (/ (* (get achieved-milestones campaign-data) u10000) (get total-milestones campaign-data)))
        (ok u0)
      )
    ERR_CAMPAIGN_NOT_FOUND
  )
)
