;; campaign-orchestrator.clar
;; Advanced decentralized advertising campaign orchestration system
;; Version: 1.0.0

;; ============================================
;; Constants and Error Codes
;; ============================================

(define-constant contract-owner tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-INVALID-PARAMS (err u400))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-CAMPAIGN-EXPIRED (err u410))
(define-constant ERR-INSUFFICIENT-FUNDS (err u402))
(define-constant ERR-INVALID-STATE (err u403))
(define-constant ERR-CAMPAIGN-PAUSED (err u405))
(define-constant ERR-VIEW-LIMIT-REACHED (err u406))
(define-constant ERR-PUBLISHER-NOT-VERIFIED (err u407))

;; ============================================
;; Data Variables
;; ============================================

(define-data-var min-campaign-amount uint u100000)  ;; in micro-STX
(define-data-var platform-fee-percentage uint u2)    ;; 2% platform fee
(define-data-var campaign-counter uint u0)
(define-data-var total-platform-fees uint u0)

;; ============================================
;; Data Maps
;; ============================================

;; Campaign Types
(define-map CampaignTypes
    { type-id: uint }
    {
        name: (string-ascii 20),
        min-duration: uint,
        max-duration: uint,
        min-budget: uint
    }
)

;; Enhanced Campaigns Map
(define-map Campaigns
    { campaign-id: uint }
    {
        advertiser: principal,
        campaign-type: uint,
        budget: uint,
        remaining-budget: uint,
        cost-per-view: uint,
        start-height: uint,
        end-height: uint,
        status: (string-ascii 20),
        target-views: uint,
        current-views: uint,
        daily-view-limit: uint,
        targeting-data: (optional (string-utf8 500)),
        refundable: bool,
        platform-fee: uint,
        created-at: uint,
        last-updated: uint
    }
)

;; Publisher Verification Map
(define-map VerifiedPublishers
    { publisher: principal }
    {
        verified: bool,
        reputation-score: uint,
        total-earnings: uint,
        join-height: uint,
        last-active: uint
    }
)

;; Enhanced Advertiser Stats
(define-map AdvertiserStats
    { advertiser: principal }
    {
        total-campaigns: uint,
        active-campaigns: uint,
        total-spent: uint,
        total-views: uint,
        average-view-rate: uint,
        reputation-score: uint,
        last-campaign-id: uint,
        join-height: uint
    }
)

;; Daily View Tracking
(define-map DailyViews
    { campaign-id: uint, day: uint }
    { view-count: uint }
)

;; ============================================
;; Private Functions
;; ============================================

(define-private (calculate-platform-fee (amount uint))
    (/ (* amount (var-get platform-fee-percentage)) u100)
)

(define-private (is-contract-owner)
    (is-eq tx-sender contract-owner)
)

(define-private (is-verified-publisher (publisher principal))
    (match (map-get? VerifiedPublishers { publisher: publisher })
        verified-data (get verified verified-data)
        false
    )
)

(define-private (update-daily-views (campaign-id uint))
    (let
        (
            (current-day (/ stacks-block-time u86400))  ;; Daily based on Unix timestamp (seconds per day)
            (current-views (default-to { view-count: u0 }
                (map-get? DailyViews { campaign-id: campaign-id, day: current-day })))
        )
        (map-set DailyViews
            { campaign-id: campaign-id, day: current-day }
            { view-count: (+ u1 (get view-count current-views)) }
        )
        true  ;; Return boolean instead of (ok true)
    )
)

(define-private (check-daily-view-limit (campaign-id uint))
    (let
        (
            (campaign (unwrap-panic (map-get? Campaigns { campaign-id: campaign-id })))
            (current-day (/ stacks-block-time u86400))
            (daily-views (default-to { view-count: u0 }
                (map-get? DailyViews { campaign-id: campaign-id, day: current-day })))
        )
        (<= (get view-count daily-views) (get daily-view-limit campaign))
    )
)

;; ============================================
;; Public Functions
;; ============================================

;; Create Campaign with Advanced Options
(define-public (create-campaign 
    (campaign-type uint)
    (budget uint)
    (cost-per-view uint)
    (duration uint)
    (target-views uint)
    (daily-view-limit uint)
    (targeting-data (optional (string-utf8 500)))
    (refundable bool))
    
    (let
        (
            (campaign-id (+ (var-get campaign-counter) u1))
            (start-block stacks-block-height)
            (end-block (+ stacks-block-height duration))
            (platform-fee (calculate-platform-fee budget))
            (campaign-type-data (unwrap! (map-get? CampaignTypes { type-id: campaign-type }) ERR-INVALID-PARAMS))
        )
        ;; Validations
        (asserts! (>= budget (get min-budget campaign-type-data)) ERR-INVALID-PARAMS)
        (asserts! (and
            (>= duration (get min-duration campaign-type-data))
            (<= duration (get max-duration campaign-type-data))) ERR-INVALID-PARAMS)
        
        ;; Transfer funds including platform fee
        ;; In production, transfer funds to contract
        ;; (try! (stx-transfer? (+ budget platform-fee) tx-sender contract-owner))
        
        ;; Create campaign
        (map-set Campaigns
            { campaign-id: campaign-id }
            {
                advertiser: tx-sender,
                campaign-type: campaign-type,
                budget: budget,
                remaining-budget: budget,
                cost-per-view: cost-per-view,
                start-height: start-block,
                end-height: end-block,
                status: "active",
                target-views: target-views,
                current-views: u0,
                daily-view-limit: daily-view-limit,
                targeting-data: targeting-data,
                refundable: refundable,
                platform-fee: platform-fee,
                created-at: stacks-block-time,
                last-updated: stacks-block-time
            }
        )
        
        ;; Update platform fees
        (var-set total-platform-fees (+ (var-get total-platform-fees) platform-fee))
        
        ;; Update advertiser stats
        (update-advertiser-stats tx-sender campaign-id budget)
        
        ;; Increment campaign counter
        (var-set campaign-counter campaign-id)
        (ok campaign-id)
    )
)

;; Record View with Enhanced Verification
(define-public (record-view
    (campaign-id uint)
    (publisher principal)
    (view-proof (optional (buff 32))))
    
    (let
        ((campaign (unwrap! (map-get? Campaigns { campaign-id: campaign-id }) ERR-NOT-FOUND))
         (publisher-data (unwrap! (map-get? VerifiedPublishers { publisher: publisher }) 
                                ERR-PUBLISHER-NOT-VERIFIED)))
        
        ;; Comprehensive validation
        (asserts! (is-verified-publisher publisher) ERR-PUBLISHER-NOT-VERIFIED)
        (asserts! (is-eq (get status campaign) "active") ERR-CAMPAIGN-PAUSED)
        (asserts! (<= stacks-block-height (get end-height campaign)) ERR-CAMPAIGN-EXPIRED)
        (asserts! (>= (get remaining-budget campaign) (get cost-per-view campaign)) 
                 ERR-INSUFFICIENT-FUNDS)
        (asserts! (check-daily-view-limit campaign-id) ERR-VIEW-LIMIT-REACHED)
        
        ;; Process payment
        ;; In production, transfer payment from contract to publisher
        ;; (try! (as-contract (stx-transfer? (get cost-per-view campaign) tx-sender publisher)))
        
        ;; Update campaign stats
        (try! (update-campaign-stats campaign-id))
        
        ;; Update daily views - now just call it directly since it returns a boolean
        (asserts! (update-daily-views campaign-id) ERR-NOT-FOUND)
        
        ;; Update publisher stats
        (try! (update-publisher-stats publisher (get cost-per-view campaign)))
        
        (ok true)
    )
)

;; ============================================
;; Admin Functions
;; ============================================

;; Update Platform Fee
(define-public (set-platform-fee (new-fee uint))
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (asserts! (<= new-fee u10) ERR-INVALID-PARAMS)  ;; Max 10% fee
        (var-set platform-fee-percentage new-fee)
        (ok true)
    )
)

;; Verify Publisher
(define-public (verify-publisher (publisher principal) (initial-score uint))
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (map-set VerifiedPublishers
            { publisher: publisher }
            {
                verified: true,
                reputation-score: initial-score,
                total-earnings: u0,
                join-height: stacks-block-time,
                last-active: stacks-block-time
            }
        )
        (ok true)
    )
)

;; ============================================
;; Read-Only Functions
;; ============================================

;; Get Campaign Details with Performance Metrics
(define-read-only (get-campaign-metrics (campaign-id uint))
    (match (map-get? Campaigns { campaign-id: campaign-id })
        campaign 
        (let
            ((total-spent (- (get budget campaign) (get remaining-budget campaign)))
             (completion-rate (/ (* (get current-views campaign) u100) 
                               (get target-views campaign))))
        (ok {
            campaign: campaign,
            total-spent: total-spent,
            completion-rate: completion-rate,
            roi: (/ (* (get current-views campaign) u100) total-spent)
        }))
        ERR-NOT-FOUND
    )
)

;; Get Publisher Performance
(define-read-only (get-publisher-metrics (publisher principal))
    (match (map-get? VerifiedPublishers { publisher: publisher })
        publisher-data (ok publisher-data)
        ERR-NOT-FOUND
    )
)

;; ============================================
;; Helper Functions
;; ============================================

(define-private (update-campaign-stats (campaign-id uint))
    (match (map-get? Campaigns { campaign-id: campaign-id })
        campaign
        (begin
            (map-set Campaigns
                { campaign-id: campaign-id }
                (merge campaign {
                    remaining-budget: (- (get remaining-budget campaign)
                                      (get cost-per-view campaign)),
                    current-views: (+ (get current-views campaign) u1),
                    last-updated: stacks-block-time
                })
            )
            (ok true)
        )
        ERR-NOT-FOUND
    )
)

(define-private (update-publisher-stats (publisher principal) (earning uint))
    (match (map-get? VerifiedPublishers { publisher: publisher })
        publisher-data
        (begin
            (map-set VerifiedPublishers
                { publisher: publisher }
                (merge publisher-data {
                    total-earnings: (+ (get total-earnings publisher-data) earning),
                    last-active: stacks-block-time
                })
            )
            (ok true)
        )
        ERR-NOT-FOUND
    )
)

(define-private (update-advertiser-stats (advertiser principal) (campaign-id uint) (amount uint))
    (let
        ((stats (map-get? AdvertiserStats { advertiser: advertiser })))
        (if (is-some stats)
            (let
                ((existing-stats (unwrap-panic stats)))
                (map-set AdvertiserStats
                    { advertiser: advertiser }
                    {
                        total-campaigns: (+ u1 (get total-campaigns existing-stats)),
                        active-campaigns: (+ u1 (get active-campaigns existing-stats)),
                        total-spent: (+ amount (get total-spent existing-stats)),
                        total-views: (get total-views existing-stats),
                        average-view-rate: u0,
                        reputation-score: u100,
                        last-campaign-id: campaign-id,
                        join-height: (get join-height existing-stats)
                    }
                )
            )
            ;; If no existing stats, create new entry
            (map-set AdvertiserStats
                { advertiser: advertiser }
                {
                    total-campaigns: u1,
                    active-campaigns: u1,
                    total-spent: amount,
                    total-views: u0,
                    average-view-rate: u0,
                    reputation-score: u100,
                    last-campaign-id: campaign-id,
                    join-height: stacks-block-time
                }
            )
        )
    )
)
