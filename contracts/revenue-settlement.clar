;; revenue-settlement.clar
;; Complete revenue settlement system with advanced security and validation
;; Version: 1.0.0

;; ============================================
;; Error Codes
;; ============================================
(define-constant ERR-not-authorized (err u401))
(define-constant ERR-invalid-params (err u400))
(define-constant ERR-not-found (err u404))
(define-constant ERR-insufficient-funds (err u405))
(define-constant ERR-claim-expired (err u406))
(define-constant ERR-already-claimed (err u407))
(define-constant ERR-pool-expired (err u408))
(define-constant ERR-invalid-amount (err u409))
(define-constant ERR-pool-inactive (err u410))
(define-constant ERR-daily-limit-exceeded (err u411))
(define-constant ERR-blacklisted (err u412))
(define-constant ERR-rate-limit-exceeded (err u413))
(define-constant ERR-invalid-status (err u414))
(define-constant ERR-zero-amount (err u415))

;; ============================================
;; Constants
;; ============================================
(define-constant contract-owner tx-sender)
(define-constant platform-fee u2)
(define-constant min-pool-amount u1000000)    ;; 1 STX
(define-constant claim-duration u144)         ;; ~1 day in blocks
(define-constant max-daily-claims u5)
(define-constant max-amount-per-tx u1000000000)  ;; 1000 STX
(define-constant min-amount-per-tx u1000000)     ;; 1 STX
(define-constant max-daily-amount u100000000000) ;; 100,000 STX

;; ============================================
;; Data Variables
;; ============================================
(define-data-var treasury-balance uint u0)
(define-data-var payment-counter uint u0)
(define-data-var pool-counter uint u0)
(define-data-var contract-paused bool false)
(define-data-var total-volume uint u0)
(define-data-var total-fees-collected uint u0)

;; ============================================
;; Data Maps
;; ============================================

;; Security Maps
(define-map blacklisted-addresses
    { address: principal }
    { 
        blacklisted: bool, 
        reason: (string-ascii 50),
        blacklisted-at: uint
    }
)

(define-map daily-limits
    { address: principal, day: uint }
    { 
        tx-count: uint, 
        total-amount: uint,
        last-tx-height: uint
    }
)

;; Core Payment Maps
(define-map publisher-accounts
    { publisher: principal }
    {
        balance: uint,
        total-earned: uint,
        reward-points: uint,
        tier: (string-ascii 10),
        last-activity: uint,
        total-claims: uint,
        pending-claims: uint,
        status: (string-ascii 10)
    }
)

(define-map payments
    { payment-id: uint }
    {
        sender: principal,
        recipient: principal,
        amount: uint,
        fee: uint,
        net-amount: uint,
        timestamp: uint,
        status: (string-ascii 20),
        memo: (optional (string-ascii 100))
    }
)

(define-map revenue-pools
    { pool-id: uint }
    {
        total-amount: uint,
        remaining-amount: uint,
        start-height: uint,
        end-height: uint,
        participants: uint,
        min-claim: uint,
        max-claim: uint,
        creator: principal,
        status: (string-ascii 10),
        pool-type: (string-ascii 20)
    }
)

(define-map pool-participants
    { pool-id: uint, participant: principal }
    {
        total-claimed: uint,
        last-claim: uint,
        claims-count: uint
    }
)

(define-map payment-claims
    { claim-id: uint }
    {
        publisher: principal,
        pool-id: uint,
        amount: uint,
        created-at: uint,
        expires-at: uint,
        status: (string-ascii 10),
        processed-at: (optional uint)
    }
)

;; ============================================
;; Private Functions
;; ============================================

;; Basic Checks
(define-private (is-owner)
    (is-eq tx-sender contract-owner)
)

(define-private (is-contract-active)
    (not (var-get contract-paused))
)

;; Calculations
(define-private (calculate-fee (amount uint))
    (/ (* amount platform-fee) u100)
)

;; Validation Functions
(define-private (validate-amount (amount uint))
    (and 
        (> amount u0)
        (>= amount min-amount-per-tx)
        (<= amount max-amount-per-tx)
    )
)

(define-private (check-blacklist (address principal))
    (match (map-get? blacklisted-addresses { address: address })
        blacklist-data (not (get blacklisted blacklist-data))
        true
    )
)

(define-private (check-daily-limit (address principal) (amount uint))
    (let
        ((current-day (/ stacks-block-time u86400))
         (limit-data (default-to 
            { tx-count: u0, total-amount: u0, last-tx-height: u0 } 
            (map-get? daily-limits { address: address, day: current-day }))))
        
        (and
            (<= (+ (get total-amount limit-data) amount) max-daily-amount)
            (<= (get tx-count limit-data) max-daily-claims)
        )
    )
)

(define-private (update-daily-limit (address principal) (amount uint))
    (let
        ((current-day (/ stacks-block-time u86400))
         (limit-data (default-to 
            { tx-count: u0, total-amount: u0, last-tx-height: u0 } 
            (map-get? daily-limits { address: address, day: current-day }))))
        
        (map-set daily-limits
            { address: address, day: current-day }
            {
                tx-count: (+ (get tx-count limit-data) u1),
                total-amount: (+ (get total-amount limit-data) amount),
                last-tx-height: stacks-block-time
            }
        )
    )
)

(define-private (validate-pool (pool-id uint))
    (match (map-get? revenue-pools { pool-id: pool-id })
        pool (and
            (is-eq (get status pool) "active")
            (< stacks-block-time (get end-height pool))
            (> (get remaining-amount pool) u0)
        )
        false
    )
)

;; Publisher Account Management
(define-private (initialize-publisher-account (publisher principal))
    (map-set publisher-accounts
        { publisher: publisher }
        {
            balance: u0,
            total-earned: u0,
            reward-points: u0,
            tier: "bronze",
            last-activity: stacks-block-time,
            total-claims: u0,
            pending-claims: u0,
            status: "active"
        }
    )
)

(define-private (update-publisher-stats 
    (publisher principal) 
    (amount uint) 
    (points uint))
    
    (match (map-get? publisher-accounts { publisher: publisher })
        existing-data
        (map-set publisher-accounts
            { publisher: publisher }
            (merge existing-data {
                balance: (+ (get balance existing-data) amount),
                total-earned: (+ (get total-earned existing-data) amount),
                reward-points: (+ (get reward-points existing-data) points),
                last-activity: stacks-block-time
            })
        )
        (initialize-publisher-account publisher)
    )
)
