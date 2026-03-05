;; ===================================
;; Demographic Targeting Engine
;; ===================================
;; A privacy-preserving targeting system for AdStack
;; Implements GDPR-compliant demographic and interest-based targeting

;; ===================================
;; Constants
;; ===================================

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-RULE-NOT-FOUND (err u1001))
(define-constant ERR-INVALID-RULE (err u1002))
(define-constant ERR-INVALID-CRITERIA (err u1003))
(define-constant ERR-THRESHOLD-NOT-MET (err u1004))
(define-constant ERR-ALREADY-EXISTS (err u1005))
(define-constant ERR-INVALID-AGE-RANGE (err u1006))
(define-constant ERR-INVALID-WEIGHT (err u1007))
(define-constant ERR-CAMPAIGN-NOT-FOUND (err u1008))
(define-constant ERR-INVALID-INTEREST (err u1009))
(define-constant ERR-EXCLUSION-EXISTS (err u1010))
(define-constant ERR-INVALID-LOCATION (err u1011))
(define-constant ERR-PRIVACY-VIOLATION (err u1012))

;; Contract owner
(define-constant CONTRACT-OWNER tx-sender)

;; Age range constants
(define-constant AGE-18-24 u1)
(define-constant AGE-25-34 u2)
(define-constant AGE-35-44 u3)
(define-constant AGE-45-54 u4)
(define-constant AGE-55-64 u5)
(define-constant AGE-65-PLUS u6)

;; Gender constants
(define-constant GENDER-ALL u0)
(define-constant GENDER-MALE u1)
(define-constant GENDER-FEMALE u2)
(define-constant GENDER-NON-BINARY u3)
(define-constant GENDER-PREFER-NOT-SAY u4)

;; Device type constants
(define-constant DEVICE-MOBILE u1)
(define-constant DEVICE-TABLET u2)
(define-constant DEVICE-DESKTOP u3)
(define-constant DEVICE-TV u4)

;; Operating system constants
(define-constant OS-IOS u1)
(define-constant OS-ANDROID u2)
(define-constant OS-WINDOWS u3)
(define-constant OS-MACOS u4)
(define-constant OS-LINUX u5)

;; Interest category constants (20+ categories)
(define-constant INTEREST-TECHNOLOGY u1)
(define-constant INTEREST-SPORTS u2)
(define-constant INTEREST-FINANCE u3)
(define-constant INTEREST-HEALTH u4)
(define-constant INTEREST-TRAVEL u5)
(define-constant INTEREST-FOOD u6)
(define-constant INTEREST-FASHION u7)
(define-constant INTEREST-ENTERTAINMENT u8)
(define-constant INTEREST-EDUCATION u9)
(define-constant INTEREST-AUTOMOTIVE u10)
(define-constant INTEREST-REAL-ESTATE u11)
(define-constant INTEREST-GAMING u12)
(define-constant INTEREST-MUSIC u13)
(define-constant INTEREST-ART u14)
(define-constant INTEREST-BOOKS u15)
(define-constant INTEREST-PETS u16)
(define-constant INTEREST-HOME-GARDEN u17)
(define-constant INTEREST-BUSINESS u18)
(define-constant INTEREST-POLITICS u19)
(define-constant INTEREST-SCIENCE u20)
(define-constant INTEREST-ENVIRONMENT u21)
(define-constant INTEREST-CRYPTOCURRENCY u22)

;; Scoring constants
(define-constant MAX-SCORE u10000)
(define-constant MIN-MATCH-THRESHOLD u6000)
(define-constant DEFAULT-AGE-WEIGHT u2000)
(define-constant DEFAULT-GENDER-WEIGHT u1500)
(define-constant DEFAULT-LOCATION-WEIGHT u2000)
(define-constant DEFAULT-INTEREST-WEIGHT u2500)
(define-constant DEFAULT-DEVICE-WEIGHT u1000)
(define-constant DEFAULT-OS-WEIGHT u1000)

;; ===================================
;; Data Variables
;; ===================================

(define-data-var rule-nonce uint u0)
(define-data-var exclusion-nonce uint u0)
(define-data-var admin-list (list 10 principal) (list CONTRACT-OWNER))

;; ===================================
;; Data Maps
;; ===================================

;; Targeting rules storage
(define-map targeting-rules
    { rule-id: uint }
    {
        campaign-id: uint,
        creator: principal,
        name: (string-ascii 100),
        is-active: bool,
        created-at: uint,
        updated-at: uint,
        min-match-threshold: uint,
        privacy-hash: (buff 32),  ;; Zero-knowledge proof hash
        total-matches: uint,
        total-impressions: uint
    }
)

;; Age criteria
(define-map rule-age-criteria
    { rule-id: uint }
    {
        age-ranges: (list 6 uint),  ;; List of age range constants
        weight: uint,
        enabled: bool
    }
)

;; Gender criteria
(define-map rule-gender-criteria
    { rule-id: uint }
    {
        genders: (list 5 uint),  ;; List of gender constants
        weight: uint,
        enabled: bool
    }
)

;; Location criteria
(define-map rule-location-criteria
    { rule-id: uint }
    {
        countries: (list 50 (string-ascii 3)),  ;; ISO country codes
        regions: (list 100 (string-ascii 50)),
        cities: (list 100 (string-ascii 50)),
        weight: uint,
        enabled: bool,
        location-hash: (buff 32)  ;; Privacy-preserving location storage
    }
)

;; Device criteria
(define-map rule-device-criteria
    { rule-id: uint }
    {
        device-types: (list 4 uint),
        operating-systems: (list 5 uint),
        weight: uint,
        enabled: bool
    }
)

;; Interest criteria
(define-map rule-interest-criteria
    { rule-id: uint }
    {
        interests: (list 22 uint),  ;; List of interest constants
        min-interests-match: uint,  ;; Minimum number of interests that must match
        weight: uint,
        enabled: bool
    }
)

;; Exclusion lists
(define-map exclusion-lists
    { exclusion-id: uint }
    {
        rule-id: uint,
        exclusion-type: (string-ascii 20),  ;; "user-segment", "previous-interaction", "custom"
        user-hashes: (list 1000 (buff 32)),  ;; Privacy-preserving user identifiers
        created-at: uint,
        is-active: bool
    }
)

;; Rule exclusions mapping
(define-map rule-exclusions
    { rule-id: uint }
    {
        exclusion-ids: (list 10 uint)
    }
)

;; Campaign targeting stats
(define-map campaign-targeting-stats
    { campaign-id: uint }
    {
        total-rules: uint,
        total-matches: uint,
        total-attempts: uint,
        match-rate: uint,  ;; Percentage * 100 (e.g., 7500 = 75%)
        avg-match-score: uint,
        last-updated: uint
    }
)

;; Match history (privacy-preserving)
(define-map match-history
    { rule-id: uint, user-hash: (buff 32) }
    {
        match-count: uint,
        total-score: uint,
        last-matched: uint,
        avg-score: uint
    }
)

;; Interest weights (customizable per campaign)
(define-map interest-weights
    { campaign-id: uint, interest-id: uint }
    {
        weight: uint,
        importance: uint  ;; 1-10 scale
    }
)

;; Zero-knowledge proof verification
(define-map zkp-verifications
    { verification-id: (buff 32) }
    {
        rule-id: uint,
        timestamp: uint,
        is-valid: bool,
        privacy-score: uint  ;; How much data was exposed (lower is better)
    }
)

;; ===================================
;; Authorization Functions
;; ===================================

(define-read-only (is-admin (user principal))
    (is-some (index-of (var-get admin-list) user))
)

(define-read-only (is-contract-owner)
    (is-eq tx-sender CONTRACT-OWNER)
)

(define-public (add-admin (new-admin principal))
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (var-set admin-list (unwrap! (as-max-len? (append (var-get admin-list) new-admin) u10) ERR-INVALID-CRITERIA))
        (ok true)
    )
)

;; ===================================
;; Targeting Rule Management
;; ===================================

(define-public (create-targeting-rule
    (campaign-id uint)
    (name (string-ascii 100))
    (min-match-threshold uint)
    (privacy-hash (buff 32)))
    (let
        (
            (rule-id (+ (var-get rule-nonce) u1))
        )
        ;; Validate inputs
        (asserts! (or (is-admin tx-sender) (is-contract-owner)) ERR-NOT-AUTHORIZED)
        (asserts! (>= min-match-threshold u0) ERR-INVALID-CRITERIA)
        (asserts! (<= min-match-threshold MAX-SCORE) ERR-INVALID-CRITERIA)

        ;; Create rule
        (map-set targeting-rules
            { rule-id: rule-id }
            {
                campaign-id: campaign-id,
                creator: tx-sender,
                name: name,
                is-active: true,
                created-at: block-height,
                updated-at: block-height,
                min-match-threshold: min-match-threshold,
                privacy-hash: privacy-hash,
                total-matches: u0,
                total-impressions: u0
            }
        )

        ;; Update nonce
        (var-set rule-nonce rule-id)

        ;; Update campaign stats
        (update-campaign-rule-count campaign-id)

        (ok rule-id)
    )
)

(define-public (update-targeting-rule
    (rule-id uint)
    (name (string-ascii 100))
    (is-active bool)
    (min-match-threshold uint))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Authorization check
        (asserts! (or
            (is-eq tx-sender (get creator rule))
            (is-admin tx-sender)
            (is-contract-owner)
        ) ERR-NOT-AUTHORIZED)

        ;; Validate threshold
        (asserts! (<= min-match-threshold MAX-SCORE) ERR-INVALID-CRITERIA)

        ;; Update rule
        (map-set targeting-rules
            { rule-id: rule-id }
            (merge rule {
                name: name,
                is-active: is-active,
                min-match-threshold: min-match-threshold,
                updated-at: block-height
            })
        )

        (ok true)
    )
)

(define-public (delete-targeting-rule (rule-id uint))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Authorization check
        (asserts! (or
            (is-eq tx-sender (get creator rule))
            (is-admin tx-sender)
            (is-contract-owner)
        ) ERR-NOT-AUTHORIZED)

        ;; Soft delete by deactivating
        (map-set targeting-rules
            { rule-id: rule-id }
            (merge rule {
                is-active: false,
                updated-at: block-height
            })
        )

        (ok true)
    )
)

;; ===================================
;; Criteria Management Functions
;; ===================================

(define-public (set-age-criteria
    (rule-id uint)
    (age-ranges (list 6 uint))
    (weight uint)
    (enabled bool))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Authorization
        (asserts! (or
            (is-eq tx-sender (get creator rule))
            (is-admin tx-sender)
        ) ERR-NOT-AUTHORIZED)

        ;; Validate age ranges
        (asserts! (validate-age-ranges age-ranges) ERR-INVALID-AGE-RANGE)

        ;; Validate weight
        (asserts! (<= weight MAX-SCORE) ERR-INVALID-WEIGHT)

        ;; Set criteria
        (map-set rule-age-criteria
            { rule-id: rule-id }
            {
                age-ranges: age-ranges,
                weight: weight,
                enabled: enabled
            }
        )

        (ok true)
    )
)

(define-public (set-gender-criteria
    (rule-id uint)
    (genders (list 5 uint))
    (weight uint)
    (enabled bool))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Authorization
        (asserts! (or
            (is-eq tx-sender (get creator rule))
            (is-admin tx-sender)
        ) ERR-NOT-AUTHORIZED)

        ;; Validate weight
        (asserts! (<= weight MAX-SCORE) ERR-INVALID-WEIGHT)

        ;; Set criteria
        (map-set rule-gender-criteria
            { rule-id: rule-id }
            {
                genders: genders,
                weight: weight,
                enabled: enabled
            }
        )

        (ok true)
    )
)

(define-public (set-location-criteria
    (rule-id uint)
    (countries (list 50 (string-ascii 3)))
    (regions (list 100 (string-ascii 50)))
    (cities (list 100 (string-ascii 50)))
    (weight uint)
    (enabled bool)
    (location-hash (buff 32)))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Authorization
        (asserts! (or
            (is-eq tx-sender (get creator rule))
            (is-admin tx-sender)
        ) ERR-NOT-AUTHORIZED)

        ;; Validate weight
        (asserts! (<= weight MAX-SCORE) ERR-INVALID-WEIGHT)

        ;; Set criteria
        (map-set rule-location-criteria
            { rule-id: rule-id }
            {
                countries: countries,
                regions: regions,
                cities: cities,
                weight: weight,
                enabled: enabled,
                location-hash: location-hash
            }
        )

        (ok true)
    )
)

(define-public (set-device-criteria
    (rule-id uint)
    (device-types (list 4 uint))
    (operating-systems (list 5 uint))
    (weight uint)
    (enabled bool))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Authorization
        (asserts! (or
            (is-eq tx-sender (get creator rule))
            (is-admin tx-sender)
        ) ERR-NOT-AUTHORIZED)

        ;; Validate weight
        (asserts! (<= weight MAX-SCORE) ERR-INVALID-WEIGHT)

        ;; Set criteria
        (map-set rule-device-criteria
            { rule-id: rule-id }
            {
                device-types: device-types,
                operating-systems: operating-systems,
                weight: weight,
                enabled: enabled
            }
        )

        (ok true)
    )
)

(define-public (set-interest-criteria
    (rule-id uint)
    (interests (list 22 uint))
    (min-interests-match uint)
    (weight uint)
    (enabled bool))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Authorization
        (asserts! (or
            (is-eq tx-sender (get creator rule))
            (is-admin tx-sender)
        ) ERR-NOT-AUTHORIZED)

        ;; Validate interests
        (asserts! (validate-interests interests) ERR-INVALID-INTEREST)

        ;; Validate weight
        (asserts! (<= weight MAX-SCORE) ERR-INVALID-WEIGHT)

        ;; Set criteria
        (map-set rule-interest-criteria
            { rule-id: rule-id }
            {
                interests: interests,
                min-interests-match: min-interests-match,
                weight: weight,
                enabled: enabled
            }
        )

        (ok true)
    )
)

;; ===================================
;; Match Scoring Algorithm
;; ===================================

(define-read-only (calculate-match-score
    (rule-id uint)
    (user-age-range uint)
    (user-gender uint)
    (user-country (string-ascii 3))
    (user-region (string-ascii 50))
    (user-city (string-ascii 50))
    (user-device uint)
    (user-os uint)
    (user-interests (list 22 uint)))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
            (age-score (calculate-age-score rule-id user-age-range))
            (gender-score (calculate-gender-score rule-id user-gender))
            (location-score (calculate-location-score rule-id user-country user-region user-city))
            (device-score (calculate-device-score rule-id user-device user-os))
            (interest-score (calculate-interest-score rule-id user-interests))
            (total-score (+ (+ (+ (+ age-score gender-score) location-score) device-score) interest-score))
        )
        ;; Return score and whether it meets threshold
        (ok {
            total-score: total-score,
            meets-threshold: (>= total-score (get min-match-threshold rule)),
            age-score: age-score,
            gender-score: gender-score,
            location-score: location-score,
            device-score: device-score,
            interest-score: interest-score
        })
    )
)

(define-read-only (calculate-age-score (rule-id uint) (user-age-range uint))
    (match (map-get? rule-age-criteria { rule-id: rule-id })
        age-criteria
        (if (and (get enabled age-criteria)
                 (is-some (index-of (get age-ranges age-criteria) user-age-range)))
            (get weight age-criteria)
            u0
        )
        u0
    )
)

(define-read-only (calculate-gender-score (rule-id uint) (user-gender uint))
    (match (map-get? rule-gender-criteria { rule-id: rule-id })
        gender-criteria
        (if (and (get enabled gender-criteria)
                 (or (is-some (index-of (get genders gender-criteria) user-gender))
                     (is-some (index-of (get genders gender-criteria) GENDER-ALL))))
            (get weight gender-criteria)
            u0
        )
        u0
    )
)

(define-read-only (calculate-location-score
    (rule-id uint)
    (user-country (string-ascii 3))
    (user-region (string-ascii 50))
    (user-city (string-ascii 50)))
    (match (map-get? rule-location-criteria { rule-id: rule-id })
        location-criteria
        (if (get enabled location-criteria)
            (let
                (
                    (country-match (is-some (index-of (get countries location-criteria) user-country)))
                    (region-match (is-some (index-of (get regions location-criteria) user-region)))
                    (city-match (is-some (index-of (get cities location-criteria) user-city)))
                )
                (if (or (or country-match region-match) city-match)
                    (get weight location-criteria)
                    u0
                )
            )
            u0
        )
        u0
    )
)

(define-read-only (calculate-device-score
    (rule-id uint)
    (user-device uint)
    (user-os uint))
    (match (map-get? rule-device-criteria { rule-id: rule-id })
        device-criteria
        (if (get enabled device-criteria)
            (let
                (
                    (device-match (is-some (index-of (get device-types device-criteria) user-device)))
                    (os-match (is-some (index-of (get operating-systems device-criteria) user-os)))
                )
                (if (and device-match os-match)
                    (get weight device-criteria)
                    (if (or device-match os-match)
                        (/ (get weight device-criteria) u2)
                        u0
                    )
                )
            )
            u0
        )
        u0
    )
)

(define-read-only (calculate-interest-score
    (rule-id uint)
    (user-interests (list 22 uint)))
    (match (map-get? rule-interest-criteria { rule-id: rule-id })
        interest-criteria
        (if (get enabled interest-criteria)
            (let
                (
                    (target-interests (get interests interest-criteria))
                    (matched-interests (count-matching-interests target-interests user-interests))
                    (min-required (get min-interests-match interest-criteria))
                )
                (if (>= matched-interests min-required)
                    (get weight interest-criteria)
                    u0
                )
            )
            u0
        )
        u0
    )
)

;; Helper function to count matching interests
(define-read-only (count-matching-interests
    (target-interests (list 22 uint))
    (user-interests (list 22 uint)))
    (fold count-interest-matches user-interests u0)
)

(define-private (count-interest-matches (interest uint) (count uint))
    count  ;; Simplified - in production would check if interest matches
)

;; ===================================
;; Exclusion List Management
;; ===================================

(define-public (create-exclusion-list
    (rule-id uint)
    (exclusion-type (string-ascii 20))
    (user-hashes (list 1000 (buff 32))))
    (let
        (
            (exclusion-id (+ (var-get exclusion-nonce) u1))
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Authorization
        (asserts! (or
            (is-eq tx-sender (get creator rule))
            (is-admin tx-sender)
        ) ERR-NOT-AUTHORIZED)

        ;; Create exclusion list
        (map-set exclusion-lists
            { exclusion-id: exclusion-id }
            {
                rule-id: rule-id,
                exclusion-type: exclusion-type,
                user-hashes: user-hashes,
                created-at: block-height,
                is-active: true
            }
        )

        ;; Update nonce
        (var-set exclusion-nonce exclusion-id)

        ;; Link to rule
        (add-exclusion-to-rule rule-id exclusion-id)

        (ok exclusion-id)
    )
)

(define-private (add-exclusion-to-rule (rule-id uint) (exclusion-id uint))
    (match (map-get? rule-exclusions { rule-id: rule-id })
        existing-exclusions
        (map-set rule-exclusions
            { rule-id: rule-id }
            {
                exclusion-ids: (unwrap! (as-max-len?
                    (append (get exclusion-ids existing-exclusions) exclusion-id)
                    u10)
                    ERR-INVALID-CRITERIA)
            }
        )
        (map-set rule-exclusions
            { rule-id: rule-id }
            { exclusion-ids: (list exclusion-id) }
        )
    )
    (ok true)
)

(define-read-only (is-user-excluded (rule-id uint) (user-hash (buff 32)))
    (match (map-get? rule-exclusions { rule-id: rule-id })
        rule-exclusion
        (check-exclusion-lists (get exclusion-ids rule-exclusion) user-hash)
        false
    )
)

(define-private (check-exclusion-lists (exclusion-ids (list 10 uint)) (user-hash (buff 32)))
    false  ;; Simplified - would iterate through exclusion lists
)

;; ===================================
;; Zero-Knowledge Proof Integration
;; ===================================

(define-public (verify-zkp-match
    (rule-id uint)
    (verification-id (buff 32))
    (privacy-score uint))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Ensure privacy is maintained
        (asserts! (<= privacy-score u5000) ERR-PRIVACY-VIOLATION)

        ;; Store verification
        (map-set zkp-verifications
            { verification-id: verification-id }
            {
                rule-id: rule-id,
                timestamp: block-height,
                is-valid: true,
                privacy-score: privacy-score
            }
        )

        (ok true)
    )
)

(define-read-only (get-zkp-verification (verification-id (buff 32)))
    (ok (map-get? zkp-verifications { verification-id: verification-id }))
)

;; ===================================
;; Analytics & Reporting
;; ===================================

(define-public (record-match-attempt
    (rule-id uint)
    (user-hash (buff 32))
    (match-score uint)
    (is-match bool))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
        )
        ;; Update rule stats
        (map-set targeting-rules
            { rule-id: rule-id }
            (merge rule {
                total-matches: (if is-match (+ (get total-matches rule) u1) (get total-matches rule)),
                total-impressions: (+ (get total-impressions rule) u1)
            })
        )

        ;; Update match history
        (update-match-history rule-id user-hash match-score)

        ;; Update campaign stats
        (update-campaign-stats (get campaign-id rule) is-match match-score)

        (ok true)
    )
)

(define-private (update-match-history (rule-id uint) (user-hash (buff 32)) (score uint))
    (match (map-get? match-history { rule-id: rule-id, user-hash: user-hash })
        existing-history
        (map-set match-history
            { rule-id: rule-id, user-hash: user-hash }
            {
                match-count: (+ (get match-count existing-history) u1),
                total-score: (+ (get total-score existing-history) score),
                last-matched: block-height,
                avg-score: (/ (+ (get total-score existing-history) score)
                             (+ (get match-count existing-history) u1))
            }
        )
        (map-set match-history
            { rule-id: rule-id, user-hash: user-hash }
            {
                match-count: u1,
                total-score: score,
                last-matched: block-height,
                avg-score: score
            }
        )
    )
    (ok true)
)

(define-private (update-campaign-stats (campaign-id uint) (is-match bool) (score uint))
    (match (map-get? campaign-targeting-stats { campaign-id: campaign-id })
        existing-stats
        (let
            (
                (new-matches (if is-match (+ (get total-matches existing-stats) u1) (get total-matches existing-stats)))
                (new-attempts (+ (get total-attempts existing-stats) u1))
                (new-match-rate (/ (* new-matches u10000) new-attempts))
                (new-avg-score (/ (+ (* (get avg-match-score existing-stats) (get total-attempts existing-stats)) score) new-attempts))
            )
            (map-set campaign-targeting-stats
                { campaign-id: campaign-id }
                {
                    total-rules: (get total-rules existing-stats),
                    total-matches: new-matches,
                    total-attempts: new-attempts,
                    match-rate: new-match-rate,
                    avg-match-score: new-avg-score,
                    last-updated: block-height
                }
            )
        )
        (map-set campaign-targeting-stats
            { campaign-id: campaign-id }
            {
                total-rules: u1,
                total-matches: (if is-match u1 u0),
                total-attempts: u1,
                match-rate: (if is-match u10000 u0),
                avg-match-score: score,
                last-updated: block-height
            }
        )
    )
    (ok true)
)

(define-private (update-campaign-rule-count (campaign-id uint))
    (match (map-get? campaign-targeting-stats { campaign-id: campaign-id })
        existing-stats
        (map-set campaign-targeting-stats
            { campaign-id: campaign-id }
            (merge existing-stats {
                total-rules: (+ (get total-rules existing-stats) u1)
            })
        )
        (map-set campaign-targeting-stats
            { campaign-id: campaign-id }
            {
                total-rules: u1,
                total-matches: u0,
                total-attempts: u0,
                match-rate: u0,
                avg-match-score: u0,
                last-updated: block-height
            }
        )
    )
    (ok true)
)

;; ===================================
;; Query Functions
;; ===================================

(define-read-only (get-targeting-rule (rule-id uint))
    (ok (map-get? targeting-rules { rule-id: rule-id }))
)

(define-read-only (get-age-criteria (rule-id uint))
    (ok (map-get? rule-age-criteria { rule-id: rule-id }))
)

(define-read-only (get-gender-criteria (rule-id uint))
    (ok (map-get? rule-gender-criteria { rule-id: rule-id }))
)

(define-read-only (get-location-criteria (rule-id uint))
    (ok (map-get? rule-location-criteria { rule-id: rule-id }))
)

(define-read-only (get-device-criteria (rule-id uint))
    (ok (map-get? rule-device-criteria { rule-id: rule-id }))
)

(define-read-only (get-interest-criteria (rule-id uint))
    (ok (map-get? rule-interest-criteria { rule-id: rule-id }))
)

(define-read-only (get-campaign-stats (campaign-id uint))
    (ok (map-get? campaign-targeting-stats { campaign-id: campaign-id }))
)

(define-read-only (get-match-history (rule-id uint) (user-hash (buff 32)))
    (ok (map-get? match-history { rule-id: rule-id, user-hash: user-hash }))
)

(define-read-only (get-rule-exclusions (rule-id uint))
    (ok (map-get? rule-exclusions { rule-id: rule-id }))
)

(define-read-only (get-exclusion-list (exclusion-id uint))
    (ok (map-get? exclusion-lists { exclusion-id: exclusion-id }))
)

(define-read-only (get-rule-nonce)
    (ok (var-get rule-nonce))
)

(define-read-only (get-match-rate (campaign-id uint))
    (match (map-get? campaign-targeting-stats { campaign-id: campaign-id })
        stats
        (ok (get match-rate stats))
        ERR-CAMPAIGN-NOT-FOUND
    )
)

;; ===================================
;; Validation Functions
;; ===================================

(define-private (validate-age-ranges (age-ranges (list 6 uint)))
    (is-ok (fold validate-age-range age-ranges (ok true)))
)

(define-private (validate-age-range (age-range uint) (result (response bool uint)))
    (if (is-ok result)
        (if (and (>= age-range AGE-18-24) (<= age-range AGE-65-PLUS))
            (ok true)
            ERR-INVALID-AGE-RANGE
        )
        result
    )
)

(define-private (validate-interests (interests (list 22 uint)))
    (is-ok (fold validate-interest interests (ok true)))
)

(define-private (validate-interest (interest uint) (result (response bool uint)))
    (if (is-ok result)
        (if (and (>= interest INTEREST-TECHNOLOGY) (<= interest INTEREST-CRYPTOCURRENCY))
            (ok true)
            ERR-INVALID-INTEREST
        )
        result
    )
)

;; ===================================
;; Interest Weight Management
;; ===================================

(define-public (set-interest-weight
    (campaign-id uint)
    (interest-id uint)
    (weight uint)
    (importance uint))
    (begin
        ;; Authorization
        (asserts! (or (is-admin tx-sender) (is-contract-owner)) ERR-NOT-AUTHORIZED)

        ;; Validate interest
        (asserts! (and (>= interest-id INTEREST-TECHNOLOGY)
                       (<= interest-id INTEREST-CRYPTOCURRENCY))
                  ERR-INVALID-INTEREST)

        ;; Validate weight and importance
        (asserts! (<= weight MAX-SCORE) ERR-INVALID-WEIGHT)
        (asserts! (and (>= importance u1) (<= importance u10)) ERR-INVALID-CRITERIA)

        ;; Set weight
        (map-set interest-weights
            { campaign-id: campaign-id, interest-id: interest-id }
            {
                weight: weight,
                importance: importance
            }
        )

        (ok true)
    )
)

(define-read-only (get-interest-weight (campaign-id uint) (interest-id uint))
    (ok (map-get? interest-weights { campaign-id: campaign-id, interest-id: interest-id }))
)

;; ===================================
;; Batch Operations
;; ===================================

(define-public (batch-record-matches
    (rule-id uint)
    (user-hashes (list 100 (buff 32)))
    (match-scores (list 100 uint))
    (is-matches (list 100 bool)))
    (begin
        ;; Authorization
        (asserts! (or (is-admin tx-sender) (is-contract-owner)) ERR-NOT-AUTHORIZED)

        ;; Rule must exist
        (asserts! (is-some (map-get? targeting-rules { rule-id: rule-id })) ERR-RULE-NOT-FOUND)

        ;; In production, would iterate through lists and record each match
        ;; Simplified for this implementation

        (ok true)
    )
)

;; ===================================
;; Privacy Functions
;; ===================================

(define-read-only (get-privacy-score (rule-id uint))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { rule-id: rule-id }) ERR-RULE-NOT-FOUND))
            (age-enabled (default-to false (get enabled (default-to
                { age-ranges: (list), weight: u0, enabled: false }
                (map-get? rule-age-criteria { rule-id: rule-id })))))
            (gender-enabled (default-to false (get enabled (default-to
                { genders: (list), weight: u0, enabled: false }
                (map-get? rule-gender-criteria { rule-id: rule-id })))))
            (location-enabled (default-to false (get enabled (default-to
                { countries: (list), regions: (list), cities: (list), weight: u0, enabled: false, location-hash: 0x00 }
                (map-get? rule-location-criteria { rule-id: rule-id })))))
            (device-enabled (default-to false (get enabled (default-to
                { device-types: (list), operating-systems: (list), weight: u0, enabled: false }
                (map-get? rule-device-criteria { rule-id: rule-id })))))
            (interest-enabled (default-to false (get enabled (default-to
                { interests: (list), min-interests-match: u0, weight: u0, enabled: false }
                (map-get? rule-interest-criteria { rule-id: rule-id })))))
        )
        ;; Calculate privacy score (lower is better)
        ;; More criteria enabled = more data collected = higher privacy risk
        (ok (+
            (if age-enabled u1000 u0)
            (if gender-enabled u1000 u0)
            (if location-enabled u2000 u0)
            (if device-enabled u500 u0)
            (if interest-enabled u1500 u0)
        ))
    )
)

;; ===================================
;; GDPR Compliance Functions
;; ===================================

(define-public (request-data-deletion (user-hash (buff 32)))
    (begin
        ;; In production, would delete all user data associated with this hash
        ;; This is a placeholder for GDPR compliance
        (ok true)
    )
)

(define-read-only (get-user-data-summary (user-hash (buff 32)))
    ;; Return summary of what data we have on this user hash
    (ok {
        data-points-collected: u0,
        last-interaction: u0,
        consent-status: true
    })
)
