;; user-registry.clar
;; Advanced user management and profile system
;; Version: 1.0.0

;; ============================================
;; Error Codes
;; ============================================
(define-constant ERR-not-authorized (err u401))
(define-constant ERR-invalid-params (err u400))
(define-constant ERR-not-found (err u404))
(define-constant ERR-user-exists (err u405))
(define-constant ERR-invalid-role (err u406))
(define-constant ERR-user-inactive (err u407))
(define-constant ERR-invalid-status (err u408))
(define-constant ERR-not-verified (err u409))
(define-constant ERR-verification-expired (err u410))
(define-constant ERR-max-profiles-reached (err u411))
(define-constant ERR-invalid-profile-type (err u412))

;; ============================================
;; Constants
;; ============================================
(define-constant contract-owner tx-sender)
(define-constant max-profiles-per-user u3)
(define-constant verification-duration u1440)  ;; 10 days in blocks
(define-constant PROFILE-TYPE-ADVERTISER "advertiser")
(define-constant PROFILE-TYPE-PUBLISHER "publisher")
(define-constant PROFILE-TYPE-VIEWER "viewer")
(define-constant STATUS-ACTIVE "active")
(define-constant STATUS-INACTIVE "inactive")
(define-constant STATUS-SUSPENDED "suspended")
(define-constant STATUS-BANNED "banned")
(define-constant VERIFICATION-PENDING "pending")
(define-constant VERIFICATION-VERIFIED "verified")
(define-constant VERIFICATION-REJECTED "rejected")

;; ============================================
;; Data Variables
;; ============================================
(define-data-var user-counter uint u0)
(define-data-var total-advertisers uint u0)
(define-data-var total-publishers uint u0)
(define-data-var total-viewers uint u0)

;; ============================================
;; Data Maps
;; ============================================

;; Core User Maps
(define-map users 
    { user-id: principal }
    {
        status: (string-ascii 10),
        roles: (list 3 (string-ascii 20)),
        join-height: uint,
        last-active: uint,
        verification-status: (string-ascii 10),
        verification-expires: uint,
        profiles-count: uint,
        metadata: (optional (string-utf8 500))
    }
)

;; User Profiles
(define-map user-profiles
    { user-id: principal, profile-type: (string-ascii 20) }
    {
        profile-id: uint,
        display-name: (string-ascii 50),
        bio: (string-utf8 500),              ;; This needs to match
        website: (optional (string-ascii 100)), ;; This needs to match
        social-links: (list 3 {              ;; This needs to match
            platform: (string-ascii 20),
            url: (string-ascii 100)
        }),
        created-at: uint,
        updated-at: uint,
        status: (string-ascii 10)
    }
)

;; User Stats
(define-map user-stats
    { user-id: principal }
    {
        total-campaigns: uint,
        total-spent: uint,
        total-earned: uint,
        reputation-score: uint,
        activity-score: uint,
        last-updated: uint
    }
)

;; Verification Records
(define-map verification-records
    { user-id: principal }
    {
        verifier: principal,
        verification-type: (string-ascii 20),
        verification-data: (buff 32),
        verified-at: uint,
        expires-at: uint,
        status: (string-ascii 10)
    }
)

;; Role Permissions
(define-map role-permissions
    { role: (string-ascii 20) }
    {
        can-create-campaigns: bool,
        can-publish-ads: bool,
        can-view-ads: bool,
        can-earn-rewards: bool,
        max-campaigns: uint,
        min-balance: uint
    }
)

;; ============================================
;; Private Functions
;; ============================================

;; Basic Checks
(define-private (is-owner)
    (is-eq tx-sender contract-owner)
)

(define-private (is-user-active (user-id principal))
    (match (map-get? users { user-id: user-id })
        user (is-eq (get status user) STATUS-ACTIVE)
        false
    )
)

(define-private (is-valid-profile-type (profile-type (string-ascii 20)))
    (or 
        (is-eq profile-type PROFILE-TYPE-ADVERTISER)
        (is-eq profile-type PROFILE-TYPE-PUBLISHER)
        (is-eq profile-type PROFILE-TYPE-VIEWER)
    )
)

(define-private (is-valid-status (status (string-ascii 10)))
    (or
        (is-eq status STATUS-ACTIVE)
        (is-eq status STATUS-INACTIVE)
        (is-eq status STATUS-SUSPENDED)
        (is-eq status STATUS-BANNED)
    )
)

;; User Management Helpers
(define-private (generate-profile-id)
    (let ((counter (var-get user-counter)))
        (var-set user-counter (+ counter u1))
        counter
    )
)

(define-private (update-user-stats 
    (user-id principal) 
    (campaigns uint) 
    (spent uint) 
    (earned uint))
    
    (match (map-get? user-stats { user-id: user-id })
        existing-stats 
        (map-set user-stats
            { user-id: user-id }
            (merge existing-stats {
                total-campaigns: (+ (get total-campaigns existing-stats) campaigns),
                total-spent: (+ (get total-spent existing-stats) spent),
                total-earned: (+ (get total-earned existing-stats) earned),
                last-updated: block-height
            })
        )
        (map-set user-stats
            { user-id: user-id }
            {
                total-campaigns: campaigns,
                total-spent: spent,
                total-earned: earned,
                reputation-score: u100,
                activity-score: u0,
                last-updated: block-height
            }
        )
    )
)

(define-private (validate-social-links 
    (links (list 3 {platform: (string-ascii 20), url: (string-ascii 100)})))
    (>= u3 (len links))
)

;; ============================================
;; Public Functions
;; ============================================

;; User Registration
(define-public (register-user 
    (profile-type (string-ascii 20)) 
    (display-name (string-ascii 50))
    (metadata (optional (string-utf8 500))))
    
    (let
        ((user tx-sender))
        
        ;; Validations
        (asserts! (is-valid-profile-type profile-type) ERR-invalid-profile-type)
        (asserts! (is-none (map-get? users { user-id: user })) ERR-user-exists)
        
        ;; Create user record
        (map-set users
            { user-id: user }
            {
                status: STATUS-ACTIVE,
                roles: (list profile-type),
                join-height: block-height,
                last-active: block-height,
                verification-status: VERIFICATION-PENDING,
                verification-expires: (+ block-height verification-duration),
                profiles-count: u1,
                metadata: metadata
            }
        )
        
        ;; Create initial profile
        (try! (create-profile profile-type display-name))
        
        ;; Update counters based on profile type using if/else
        (if (is-eq profile-type PROFILE-TYPE-ADVERTISER)
            (var-set total-advertisers (+ (var-get total-advertisers) u1))
            (if (is-eq profile-type PROFILE-TYPE-PUBLISHER)
                (var-set total-publishers (+ (var-get total-publishers) u1))
                (if (is-eq profile-type PROFILE-TYPE-VIEWER)
                    (var-set total-viewers (+ (var-get total-viewers) u1))
                    false
                )
            )
        )
        
        (ok true)
    )
)

;; Profile Management
(define-public (create-profile
    (profile-type (string-ascii 20))
    (display-name (string-ascii 50)))
    
    (let
        ((user tx-sender)
         (user-data (unwrap! (map-get? users { user-id: user }) ERR-not-found)))
        
        ;; Validations
        (asserts! (is-valid-profile-type profile-type) ERR-invalid-profile-type)
        (asserts! (< (get profiles-count user-data) max-profiles-per-user) 
                 ERR-max-profiles-reached)
        
        ;; Create profile with correct types
        (map-set user-profiles
            { user-id: user, profile-type: profile-type }
            {
                profile-id: (generate-profile-id),
                display-name: display-name,
                bio: u"",                     ;; Fixed: empty UTF-8 string
                website: (some ""),           ;; Fixed: optional string
                social-links: (list          ;; Fixed: empty list with correct type
                    {
                        platform: "",
                        url: ""
                    }
                ),
                created-at: block-height,
                updated-at: block-height,
                status: STATUS-ACTIVE
            }
        )
        
        ;; Update user record
        (map-set users
            { user-id: user }
            (merge user-data {
                profiles-count: (+ (get profiles-count user-data) u1),
                last-active: block-height
            })
        )
        
        (ok true)
    )
)

;; ============================================
;; Admin Functions
;; ============================================

;; Update User Status
(define-public (update-user-status 
    (user-id principal) 
    (new-status (string-ascii 10)))
    
    (begin
        (asserts! (is-owner) ERR-not-authorized)
        (asserts! (is-valid-status new-status) ERR-invalid-status)
        
        (match (map-get? users { user-id: user-id })
            user-data
            (ok (map-set users
                { user-id: user-id }
                (merge user-data {
                    status: new-status,
                    last-active: block-height
                })
            ))
            ERR-not-found
        )
    )
)
;; Verify User
(define-public (verify-user 
    (user-id principal)
    (verification-type (string-ascii 20))
    (verification-data (buff 32)))
    
    (begin
        (asserts! (is-owner) ERR-not-authorized)
        
        ;; Set verification record first
        (map-set verification-records
            { user-id: user-id }
            {
                verifier: tx-sender,
                verification-type: verification-type,
                verification-data: verification-data,
                verified-at: block-height,
                expires-at: (+ block-height verification-duration),
                status: VERIFICATION-VERIFIED
            }
        )
        
        ;; Update user verification status
        (match (map-get? users { user-id: user-id })
            user-data
            (ok (begin
                (map-set users
                    { user-id: user-id }
                    (merge user-data {
                        verification-status: VERIFICATION-VERIFIED,
                        verification-expires: (+ block-height verification-duration)
                    })
                )
                true
            ))
            ERR-not-found
        )
    )
)

;; ============================================
;; Read-Only Functions
;; ============================================

;; Get User Details
(define-read-only (get-user-details (user-id principal))
    (match (map-get? users { user-id: user-id })
        user (ok user)
        ERR-not-found
    )
)

;; Get User Profile
(define-read-only (get-user-profile 
    (user-id principal) 
    (profile-type (string-ascii 20)))
    
    (match (map-get? user-profiles { user-id: user-id, profile-type: profile-type })
        profile (ok profile)
        ERR-not-found
    )
)

;; Get User Stats
(define-read-only (get-user-stats (user-id principal))
    (match (map-get? user-stats { user-id: user-id })
        stats (ok stats)
        ERR-not-found
    )
)

;; Check Verification Status
(define-read-only (get-verification-status (user-id principal))
    (match (map-get? verification-records { user-id: user-id })
        record (ok record)
        ERR-not-found
    )
)
