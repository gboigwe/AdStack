;; fraud-prevention.clar
;; Advanced fraud prevention and view verification system for ad campaigns
;; Version: 1.0.0

;; ============================================
;; Constants and Error Codes
;; ============================================

(define-constant contract-owner tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-INVALID-PARAMS (err u400))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-DUPLICATE-VIEW (err u405))
(define-constant ERR-RATE-LIMIT-EXCEEDED (err u406))
(define-constant ERR-INVALID-PROOF (err u407))
(define-constant ERR-SUSPICIOUS-ACTIVITY (err u408))
(define-constant ERR-VERIFICATION-FAILED (err u409))

;; ============================================
;; Data Variables
;; ============================================

(define-data-var verification-threshold uint u80)  ;; 80% confidence threshold
(define-data-var max-views-per-block uint u10)    ;; Rate limiting
(define-data-var suspicious-threshold uint u100)   ;; Suspicious activity threshold
(define-data-var verify-counter uint u0)          ;; Total verifications processed

;; ============================================
;; Data Maps
;; ============================================

;; View Records
(define-map ViewRecords
    { view-id: (buff 32) }
    {
        campaign-id: uint,
        publisher: principal,
        viewer: principal,
        timestamp: uint,
        verification-score: uint,
        proof-data: (buff 32),
        verified: bool
    }
)

;; Publisher View Tracking
(define-map PublisherViews
    { publisher: principal, block: uint }
    { view-count: uint }
)

;; Viewer Rate Limiting
(define-map ViewerRateLimit
    { viewer: principal, block: uint }
    { view-count: uint }
)

;; Suspicious Activity Tracking
(define-map SuspiciousActivity
    { publisher: principal }
    {
        suspicious-views: uint,
        last-flagged: uint,
        total-flags: uint,
        status: (string-ascii 20)
    }
)

;; View Verification Cache
(define-map VerificationCache
    { campaign-id: uint, day: uint }
    {
        total-views: uint,
        verified-views: uint,
        rejected-views: uint,
        average-score: uint
    }
)

;; ============================================
;; Private Functions
;; ============================================

(define-private (is-contract-owner)
    (is-eq tx-sender contract-owner)
)

(define-private (generate-view-id (campaign-id uint) (publisher principal) (viewer principal))
    (sha256 (concat (unwrap-panic (to-consensus-buff? campaign-id))
                   (concat (unwrap-panic (to-consensus-buff? publisher))
                          (unwrap-panic (to-consensus-buff? viewer)))))
)

(define-private (check-rate-limit (viewer principal))
    (let
        ((current-count (default-to { view-count: u0 }
            (map-get? ViewerRateLimit { viewer: viewer, block: stacks-block-time }))))
        (< (get view-count current-count) (var-get max-views-per-block))
    )
)

(define-private (update-rate-limit (viewer principal))
    (let
        ((current-count (default-to { view-count: u0 }
            (map-get? ViewerRateLimit { viewer: viewer, block: stacks-block-time }))))
        (map-set ViewerRateLimit
            { viewer: viewer, block: stacks-block-time }
            { view-count: (+ u1 (get view-count current-count)) }
        )
    )
)

(define-private (calculate-verification-score 
    (campaign-id uint) 
    (publisher principal) 
    (proof-data (buff 32)))
    
    (let
        ((base-score u80)  ;; Start with 80% base confidence
         (proof-factor (if (is-some (some proof-data)) u10 u0))
         (publisher-factor u10))
        
        ;; Add various factors to determine final score
        (+ (+ base-score proof-factor) publisher-factor)
    )
)

(define-private (update-verification-cache 
    (campaign-id uint) 
    (verification-score uint) 
    (verified bool))
    
    (let
        ((current-day (/ stacks-block-time u86400))
         (cache (default-to {
            total-views: u0,
            verified-views: u0,
            rejected-views: u0,
            average-score: u0
         } (map-get? VerificationCache { campaign-id: campaign-id, day: current-day }))))
        
        (map-set VerificationCache
            { campaign-id: campaign-id, day: current-day }
            {
                total-views: (+ (get total-views cache) u1),
                verified-views: (+ (get verified-views cache) (if verified u1 u0)),
                rejected-views: (+ (get rejected-views cache) (if verified u0 u1)),
                average-score: (/ (+ (* (get average-score cache) 
                                      (get total-views cache)) 
                                   verification-score)
                                (+ (get total-views cache) u1))
            }
        )
    )
)

;; ============================================
;; Public Functions
;; ============================================

;; Verify View
(define-public (verify-view
    (campaign-id uint)
    (publisher principal)
    (viewer principal)
    (proof-data (optional (buff 32))))
    
    (let
        (
            (view-id (generate-view-id campaign-id publisher viewer))
            (verification-score (calculate-verification-score 
                campaign-id 
                publisher 
                (default-to 0x00 proof-data)))
        )
        
        ;; Validations
        (asserts! (check-rate-limit viewer) ERR-RATE-LIMIT-EXCEEDED)
        (asserts! (is-none (map-get? ViewRecords { view-id: view-id })) 
                 ERR-DUPLICATE-VIEW)
        
        ;; Update rate limit
        (update-rate-limit viewer)
        
        ;; Check verification score against threshold
        (if (>= verification-score (var-get verification-threshold))
            (begin
                ;; Record verified view
                (map-set ViewRecords
                    { view-id: view-id }
                    {
                        campaign-id: campaign-id,
                        publisher: publisher,
                        viewer: viewer,
                        timestamp: stacks-block-time,
                        verification-score: verification-score,
                        proof-data: (default-to 0x00 proof-data),
                        verified: true
                    }
                )
                
                ;; Update verification cache
                (update-verification-cache campaign-id verification-score true)
                
                ;; Increment verify counter
                (var-set verify-counter (+ (var-get verify-counter) u1))
                
                (ok true)
            )
            (begin
                ;; Record rejected view
                (map-set ViewRecords
                    { view-id: view-id }
                    {
                        campaign-id: campaign-id,
                        publisher: publisher,
                        viewer: viewer,
                        timestamp: stacks-block-time,
                        verification-score: verification-score,
                        proof-data: (default-to 0x00 proof-data),
                        verified: false
                    }
                )
                
                ;; Update verification cache
                (update-verification-cache campaign-id verification-score false)
                
                ERR-VERIFICATION-FAILED
            )
        )
    )
)

;; Flag Suspicious Activity
(define-public (flag-suspicious-activity
    (publisher principal)
    (reason (string-ascii 50)))
    
    (let
        ((current-flags (default-to {
            suspicious-views: u0,
            last-flagged: u0,
            total-flags: u0,
            status: "active"
        } (map-get? SuspiciousActivity { publisher: publisher }))))
        
        (map-set SuspiciousActivity
            { publisher: publisher }
            {
                suspicious-views: (+ (get suspicious-views current-flags) u1),
                last-flagged: stacks-block-time,
                total-flags: (+ (get total-flags current-flags) u1),
                status: (if (> (+ (get suspicious-views current-flags) u1) 
                             (var-get suspicious-threshold))
                          "suspended"
                          "active")
            }
        )
        (ok true)
    )
)

;; ============================================
;; Admin Functions
;; ============================================

;; Update Verification Threshold
(define-public (set-verification-threshold (new-threshold uint))
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (asserts! (and (>= new-threshold u50) (<= new-threshold u100)) 
                 ERR-INVALID-PARAMS)
        (var-set verification-threshold new-threshold)
        (ok true)
    )
)

;; Update Rate Limit
(define-public (set-rate-limit (new-limit uint))
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (var-set max-views-per-block new-limit)
        (ok true)
    )
)

;; ============================================
;; Read-Only Functions
;; ============================================

;; Get View Details
(define-read-only (get-view-details (view-id (buff 32)))
    (match (map-get? ViewRecords { view-id: view-id })
        record (ok record)
        ERR-NOT-FOUND
    )
)

;; Get Publisher Verification Stats
(define-read-only (get-publisher-verification-stats 
    (campaign-id uint) 
    (publisher principal))
    
    (let
        ((current-day (/ stacks-block-time u86400)))
        (match (map-get? VerificationCache 
            { campaign-id: campaign-id, day: current-day })
            stats (ok stats)
            ERR-NOT-FOUND
        )
    )
)

;; Get Suspicious Activity Status
(define-read-only (get-suspicious-activity-status (publisher principal))
    (match (map-get? SuspiciousActivity { publisher: publisher })
        status (ok status)
        ERR-NOT-FOUND
    )
)
