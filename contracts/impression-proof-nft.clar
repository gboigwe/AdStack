;; impression-proof-nft.clar
;; SIP-009 NFT contract for minting achievement badges based on ad impressions

;; SIP-009 NFT Trait
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u22000))
(define-constant ERR_NOT_FOUND (err u22001))
(define-constant ERR_ALREADY_MINTED (err u22002))
(define-constant ERR_THRESHOLD_NOT_MET (err u22003))

;; NFT Definition
(define-non-fungible-token impression-proof uint)

;; Data Variables
(define-data-var last-token-id uint u0)

;; Milestone Thresholds
(define-constant BRONZE_TIER u100000) ;; 100k impressions
(define-constant SILVER_TIER u500000) ;; 500k impressions
(define-constant GOLD_TIER u1000000) ;; 1M impressions
(define-constant PLATINUM_TIER u5000000) ;; 5M impressions
(define-constant DIAMOND_TIER u10000000) ;; 10M impressions

;; Proof Metadata
(define-map proofs
  { token-id: uint }
  {
    campaign-id: uint,
    creative-token-id: uint,
    advertiser: principal,
    total-impressions: uint,
    total-revenue: uint,
    tier: (string-ascii 16),
    minted-at: uint,
    start-block: uint,
    end-block: uint,
    metadata-uri: (string-ascii 256)
  }
)

;; Campaign Achievements
(define-map campaign-achievements
  { campaign-id: uint, tier: (string-ascii 16) }
  {
    achieved: bool,
    token-id: (optional uint),
    achieved-at: (optional uint)
  }
)

;; Advertiser Stats
(define-map advertiser-stats
  { advertiser: principal }
  {
    total-proofs: uint,
    total-impressions: uint,
    highest-tier: (string-ascii 16),
    bronze-count: uint,
    silver-count: uint,
    gold-count: uint,
    platinum-count: uint,
    diamond-count: uint
  }
)

;; SIP-009 Required Functions

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (match (map-get? proofs { token-id: token-id })
    proof (ok (some (get metadata-uri proof)))
    (ok none)
  )
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? impression-proof token-id))
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (asserts! (is-some (nft-get-owner? impression-proof token-id)) ERR_NOT_FOUND)
    (nft-transfer? impression-proof token-id sender recipient)
  )
)

;; Minting Function

(define-public (mint-impression-proof
  (campaign-id uint)
  (creative-token-id uint)
  (total-impressions uint)
  (total-revenue uint)
  (start-block uint)
  (end-block uint)
  (metadata-uri (string-ascii 256))
)
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
      (tier (calculate-tier total-impressions))
    )
    (asserts! (> total-impressions u0) ERR_THRESHOLD_NOT_MET)
    (asserts! (>= total-impressions BRONZE_TIER) ERR_THRESHOLD_NOT_MET)

    ;; Check if tier already achieved for this campaign
    (asserts!
      (is-none
        (get token-id
          (default-to
            { achieved: false, token-id: none, achieved-at: none }
            (map-get? campaign-achievements { campaign-id: campaign-id, tier: tier })
          )
        )
      )
      ERR_ALREADY_MINTED
    )

    ;; Mint NFT
    (try! (nft-mint? impression-proof token-id tx-sender))

    ;; Store proof metadata
    (map-set proofs
      { token-id: token-id }
      {
        campaign-id: campaign-id,
        creative-token-id: creative-token-id,
        advertiser: tx-sender,
        total-impressions: total-impressions,
        total-revenue: total-revenue,
        tier: tier,
        minted-at: stacks-block-height,
        start-block: start-block,
        end-block: end-block,
        metadata-uri: metadata-uri
      }
    )

    ;; Record achievement
    (map-set campaign-achievements
      { campaign-id: campaign-id, tier: tier }
      {
        achieved: true,
        token-id: (some token-id),
        achieved-at: (some stacks-block-height)
      }
    )

    ;; Update advertiser stats
    (update-advertiser-stats tx-sender total-impressions tier)

    (var-set last-token-id token-id)
    (ok token-id)
  )
)

;; Helper Functions

(define-private (calculate-tier (impressions uint)) (string-ascii 16)
  (if (>= impressions DIAMOND_TIER)
    "diamond"
    (if (>= impressions PLATINUM_TIER)
      "platinum"
      (if (>= impressions GOLD_TIER)
        "gold"
        (if (>= impressions SILVER_TIER)
          "silver"
          "bronze"
        )
      )
    )
  )
)

(define-private (update-advertiser-stats
  (advertiser principal)
  (impressions uint)
  (tier (string-ascii 16))
)
  (let
    (
      (current-stats (default-to
        {
          total-proofs: u0,
          total-impressions: u0,
          highest-tier: "bronze",
          bronze-count: u0,
          silver-count: u0,
          gold-count: u0,
          platinum-count: u0,
          diamond-count: u0
        }
        (map-get? advertiser-stats { advertiser: advertiser })
      ))
    )
    (map-set advertiser-stats
      { advertiser: advertiser }
      {
        total-proofs: (+ (get total-proofs current-stats) u1),
        total-impressions: (+ (get total-impressions current-stats) impressions),
        highest-tier: (get-higher-tier (get highest-tier current-stats) tier),
        bronze-count: (+ (get bronze-count current-stats) (if (is-eq tier "bronze") u1 u0)),
        silver-count: (+ (get silver-count current-stats) (if (is-eq tier "silver") u1 u0)),
        gold-count: (+ (get gold-count current-stats) (if (is-eq tier "gold") u1 u0)),
        platinum-count: (+ (get platinum-count current-stats) (if (is-eq tier "platinum") u1 u0)),
        diamond-count: (+ (get diamond-count current-stats) (if (is-eq tier "diamond") u1 u0))
      }
    )
    true
  )
)

(define-private (get-higher-tier (tier1 (string-ascii 16)) (tier2 (string-ascii 16))) (string-ascii 16)
  (let
    (
      (rank1 (tier-rank tier1))
      (rank2 (tier-rank tier2))
    )
    (if (> rank1 rank2) tier1 tier2)
  )
)

(define-private (tier-rank (tier (string-ascii 16))) uint
  (if (is-eq tier "diamond") u5
    (if (is-eq tier "platinum") u4
      (if (is-eq tier "gold") u3
        (if (is-eq tier "silver") u2
          u1
        )
      )
    )
  )
)

;; Read-only Functions

(define-read-only (get-proof-info (token-id uint))
  (map-get? proofs { token-id: token-id })
)

(define-read-only (get-campaign-achievement (campaign-id uint) (tier (string-ascii 16)))
  (map-get? campaign-achievements { campaign-id: campaign-id, tier: tier })
)

(define-read-only (get-advertiser-stats (advertiser principal))
  (map-get? advertiser-stats { advertiser: advertiser })
)

(define-read-only (get-tier-thresholds)
  (ok {
    bronze: BRONZE_TIER,
    silver: SILVER_TIER,
    gold: GOLD_TIER,
    platinum: PLATINUM_TIER,
    diamond: DIAMOND_TIER
  })
)

(define-read-only (check-tier-eligibility (impressions uint))
  (ok {
    eligible: (>= impressions BRONZE_TIER),
    tier: (calculate-tier impressions),
    impressions: impressions
  })
)

(define-read-only (get-next-tier-info (current-impressions uint))
  (let
    (
      (current-tier (calculate-tier current-impressions))
    )
    (ok {
      current-tier: current-tier,
      current-impressions: current-impressions,
      next-threshold: (get-next-threshold current-tier),
      impressions-needed: (if (>= current-impressions DIAMOND_TIER)
        u0
        (- (get-next-threshold current-tier) current-impressions)
      )
    })
  )
)

(define-private (get-next-threshold (tier (string-ascii 16))) uint
  (if (is-eq tier "diamond") u0
    (if (is-eq tier "platinum") DIAMOND_TIER
      (if (is-eq tier "gold") PLATINUM_TIER
        (if (is-eq tier "silver") GOLD_TIER
          (if (is-eq tier "bronze") SILVER_TIER
            BRONZE_TIER
          )
        )
      )
    )
  )
)

;; Admin Functions

(define-public (burn (token-id uint))
  (let
    (
      (owner (unwrap! (nft-get-owner? impression-proof token-id) ERR_NOT_FOUND))
    )
    (asserts! (is-eq tx-sender owner) ERR_UNAUTHORIZED)
    (nft-burn? impression-proof token-id owner)
  )
)
