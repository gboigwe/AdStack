;; title: targeting-engine
;; version: 2.0.0
;; summary: Advanced demographic targeting engine with privacy-preserving matching
;; description: Privacy-preserving audience segmentation, demographic targeting,
;;   geo-targeting, device targeting, interest-based matching, and exclusion management.
;;   Integrates ZK proof verification for anonymous demographic matching.

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-invalid-criteria (err u103))
(define-constant err-segment-full (err u104))
(define-constant err-already-exists (err u105))
(define-constant err-invalid-score (err u106))
(define-constant err-invalid-proof (err u107))
(define-constant err-expired-proof (err u108))
(define-constant err-segment-inactive (err u109))
(define-constant err-cooldown-active (err u110))
(define-constant err-budget-exceeded (err u111))
(define-constant err-invalid-geo (err u112))
(define-constant err-invalid-device (err u113))

;; Targeting criteria types
(define-constant CRITERIA-AGE-RANGE u1)
(define-constant CRITERIA-LOCATION u2)
(define-constant CRITERIA-INTERESTS u(define-constant CRITERIA-INTERESTS u(define-constant CRITERIA-INTERESTS E u5)
(define-constant CRITERIA-LANGUAGE u6)
(define-constant CRITERIA-INCOME-BRACKET u7)
(define-constant CRITERIA-GENDER u8)

;; Segment status
(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-PAUSED u2)
(define-constant STATUS-ARCHIVED u3)

;; Match quality tiers
(de(de(de(de(de(de(de(de(de(de(de(de(de(de(de(donstan(de(de(de(de(de(de(de(de(de(de(de(de(de(de(d-TIER-MEDIUM u2)
(define-constant MATCH-TIER-LOW u1)
(define-constant MATCH-TIER-NONE u0)

;; Device type constants
(define-constant DEVICE-DESKTOP u1)
(define-constant DEVICE-MOBILE u2)
(define-constant DEVICE-TABLET u3)
(define-constant DEVICE-SMART-TV u4)

;; Proof validity window (blocks)
(define-constant PROOF-VALIDITY-WINDOW u144)

;; data vars
(define-data-var segment-nonce uint u0)
(define-data-var rule-nonce uint u0)
(define-data-var max-interests-(define-data-var max-interests-(definen-relevance-score uint u30)
(define-data-var max-segments-per-campaign uint u10)
(define-data-var total-matches-processed uint u0)
(define-data-var total-segments-created uint u0)
(define-data-var match-cooldown-blocks uint u6)
(define-data-(define-data-(define-data-(define-d
;;;;;;;;;;;;;;define;;;;;;;;;;;;;;define;;;;;;;;;;;;ment-id: uint }
    {
        owner: principal,
        name: (string-utf8 100),
        description: (string-utf8 300),
        status: uint,
        min-age: uint,
        max-age: uint,
        locations: (list 10 (string-ascii 30)),
        required-interests: (list 10 (string-ascii 30)),
        excluded-interests: (list 5 (string-ascii 30)),
        min-activity-score: uint,        min-activity-score: uint,nt        min-activity-score: uint,  (st        min-activity-score: uintracket-min: uint,
        income-bracket-max: uint,
        g        g        g        g        g  si        g        g        g       t,
        created-at: uint,
        updated-at: uint
    }
)

(define-map user-interests
    { user    { user    { user    { user erests: (list 20 (stri    { user    { user    { user    ights: (list 20     { user    { user    { user    { user erestsri    { user    { user    { user    { user eres       { user    { user    { user    { user erestsguage: (string-ascii 5),
        income-bracket: uint,
        gender: uint,
        last-updated: uint
    }
)

(define-map targeting-rules
    { campaign-id: uint, segment-id: uint }
    {
        bid-modifier: uint,
        priority: uint,
        active: bool,
        daily-budget-cap: uint,
        daily-spend: uint,
        last-reset-block: uint,
        created-at: uint
    }
)

(define-map segment-performance
    { segment-id: uint }
    {
        total-impressions: uint,
        total-clicks: uint,
        total-conversions: uint,
        conversion-rate: uint,
        avg-engagement-time: uint,
        cost-per-acquisition: uint,
        total-spend: uint,
        last-performance-update: uint
    }
)

(define-map campaign-segments
    { campaign-id: uint }
    {
        segment-ids: (list 10 uint),
        primary-segment: uint
    }
)

(define-map user-segment-matches
    { user: principal, segment-id: uint }
    {
        relevance-score: uint,
        match-tier: uint,
        last-matched: uint,
        match-count: uint
    }
)

(define-map exclusion-list
    { campaign-id: uint, user: principal }
    {
        excluded: bool,
        reason: (string-utf8 100),
        excluded-at: uint,
        expires-at: uint
    }
)

(define-map zk-proof-registry
    { user: principal, proof-hash: (buff 32) }
    {
        verified: bool,
        criteria-type: uint,
        submitted-at: uint,
        expires-at: uint
    }
)

(define-map demographic-rule-sets
    { rule-id: uint }
    {
        owner: principal,
        name: (string-utf8 100),
        criteria-type: uint,
        min-value: uint,
        max-value: uint,
        weight: uint,
        active: bool,
        created-at: uint
    }
)

(define-map geo-regions
    { region-code: (string-ascii 10) }
    {
        name: (string-ascii 50),
        parent-region: (string-ascii 10),
        active: bool,
        population-estimate: uint
    }
)

(define-map user-match-cooldowns
    { user: principal, segment-id: uint }
    {
        last-match-block: uint
    }
)

(define-map segment-daily-stats
    { segment-id:    { segment-id:    { segment-id:    {impr   ion    { segment-id:    {s:    { segment-id:    { segment-id
                             unique-matches: uint
    }
)

;; ;; ;; ;; ;; ;; ;; ;; ;; ;; ;ivate (calculate-age-score (user-age uint) (min-age uint) (max-age uint))
    (if (and (>= user-age min-age) (<= user-age max-age))
        u25
        (if (or
                (and (>= user-age (- min-age u5)) (< user-age min-age))
                (and (> user-age max-age) (<= user-age (+ max-age u5)))
            )
            u10
            u0
        )
    )
)

(define-private (calculate-activity-score (user-score uint) (min-required uint))
    (if (>= user-score min-required)
        u20
        (if (>= use        (if (>= use        (if           (if (>= use        (if (>  )
    )
)

(define-private (calculate-device-match (user-device(detring-(define-private (calculate-devist(define-private (calculate-device-match es) u0)
(define-private (calculate-d
)
)
define-private (calculate-language-matcdefine-private (calculate-language-matcdefine-private (calculate-language-matcdefine-private (calculate-language-matcdefin  define-private (calculate-language-matcdefine-prme-match (user-income uint) (min-income uint) (max-income uint))
    (if (is-eq min-income max-income)
        u15
        (if (and (>= user-income min-income) (<= user-income max-income))
            u            u            u            u            u            u     -i            u            u            u            u            u     r-          -income) (<= user-income (* max-income u2)))
                                                                                        
(define-private (calculate-relevance-score
    (user-data (tuple
        (interests (list 20 (string-ascii 30)))
        (interest-weights (list 20 uint))
        (age uint)
        (location (string-ascii 30))
        (activity-score uint)
        (device-type (string-ascii 20))
        (language (string-ascii 5))
        (income-bracket uint)
    ))
    (segment-data (tuple
        (min-age uint)
        (max-age uint)
        (locations (list 10 (string-ascii 30)))
        (required-interests (list 10 (string-ascii 30)))
        (min-activity-score uint)
        (device-types (list 4 uint))
        (language-codes (list 5 (string-ascii 5)))
        (income-bracket-min uint)
        (income-bracket-max uint)
    ))
)
    (let
        (
            (age-score (calculate-age-score
                (get age user-data)
                (get min-age segment-data)
                (get max-age segment-data)
            ))
            (activity-points (calculate-activity-score
                (get activity-score user-data)
                (get min-activity-score segment-data)
            ))
            (device-points (calculate-device-match
                (get device-                (               (get device-types segment-data)
            ))
            (language-points (calculate-language-match
                (get language user-data)
                (get language-codes segment-data)
            ))
            (income-points (ca            (income-points (ca         et income-bracket user-data)
                (get income-bracket-min segment-data)
                (get income-bracket-max segment-data)
            ))
            (raw-score (+ age-score (+ activity-points (+ device-points (+ language-points income-points)))))
        )
        (if (> raw-score u100) u100 raw-score)
    )
)

(define-private (score-to-tier (score uint))
    (if (>= score u80) MATCH-TIER-EXACT
        (if (>= score u60) MATCH-TIER-HIGH
            (if (>= score u40) MATCH-TIER-MEDIUM
                (if (>= score u20) MATCH-TIER-LOW
                    MATCH-TIER-NONE
                )
            )
        )
    )
)

(define-private (is-valid-criteria-type (criteria-type uint))
    (or
        (is-eq criteria-type CRITERIA-AGE-RANGE)
        (or (is-eq criteria-type CRITERIA-LOCATION)
            (or (is-eq criteria-type CRITERIA-INTERESTS)
                (or (is-eq criteria-type CRITERIA-BEHAVIOR)
                    (or (is-eq criteria-type CRITERIA-DEVICE)
                        (or (is-eq criteria-type CRITERIA-LAN                        (or (is-eq criteria-typeiteria-type CRITERIA-INCOME-BRACKET)
                                (is-eq criteria-type CRITERIA-GENDER)
                            )
                        )
                    )
                )
            )
        )
    )
)

(define-private (calculate-conversion-rate (conversions uint) (impressions uint))
    (if (> impressions u0)
        (/ (* conversions u10000) impressions)
        u0
    )
)

(define-private (calculate-cpa (total-spend uint) (conversions uint))
    (if (> conversions u0)
        (/ total-spend conversions)
        u0
    )
)

(define-private (get-day-block)
    (/ stacks-block-height u144)
)

(define-private (is-proof-valid (user principal) (proof-hash (buff 32)))
    (match (map-get? zk-proof-registry { user: user, proof-hash: proof-hash })
        proof-data (and
            (get verified proof-data)
            (<= stacks-block-height (get expires-at proof-data))
        )
        false
    )
)

;; read only functions
(define-read-only (get-segment (segment-id uint))
    (map-get? audience-segments { segment-id: segment-id })
)

(define-read-only (get-user-interests (user principal))
    (map-get? user-inter    (map-get? ser })
)

(define-read-only (get-targeting-rule (campaign-id uint) (segment-id uint))
    (map-get? targeting-rules { campaign-id: campaign-id, segment-id: segment-id })
)

(define-read-only (ge(define-read-only (ge(define-read-only (ge(de(map-get? segment-perf(define-read-only (ge(define-read-only (ge(define-read-only (ge(de(ign(define-read-only (ge(deint))
    (map-get? campaign-segments { campaign-id: campaign-id })
)

(define-read-only (g(define-read-only (g(define principal) (segment-id uint))
    (map-get? user-segment-matches { user: user, segment-id: segment-id })
)

(define-read-only (is-user-excluded (campaign-id uint) (user principal))
    (match (map-get? exclusion-list { campaign-id: campaign-id, user: user })
        exclusion (and
            (get excluded exclusion)
            (or (is-eq (get expires-at exclusion) u0)
                (> (get expires-at exclusion) stacks-block-height))
        )
                                                           )
                                      -read-only (get-rule-nonce)
    (var-get rule-nonce)
)

(define-read-only (get-total-matches)
    (var-get total-matches-processed)
)

(define-read-only (get-total-segments)
    (var-get total-segments-created)
)

(define-read-only (get-demographic-rule (rule-id uint))
    (map-get? demographic-rule-sets { rule-id: rule-id })
)

(define-read-only (get-geo-region (region-code (string-ascii 10)))
    (map-get? geo-regions { region-code: region-code })
)

(define-read-only (get-zk-proof (user principal) (proof-hash (buff 32)))
    (map-get? zk-proof-registry { user: user, proof-    (map-get? zk-proof-registry { user: user, proof-    (map-get? zk-prent-id uint) (day-block uint))
    (map-get? segment-daily-stats { segment-id: segment-id, day-block: day-block })
)

(define-read-only (get-match-quality-tier (score uint))
    (ok (score-to-ti    (ok (score-to-ti    (ok (score-to-ti    (ok (score-to-ti   e uin    (ok-ag    (ok (score-to-ti    (ok (score-to-ti    (ok (score-to-  (age-range (- max-age min-age))
            (age-factor (/ (* age-range u100) u80))
                                      or u100) u1                                    k estimated)
    )
)

;; public functions
(d(d(d(d(d(d(d(d(d(d(d(d(d(d(d(d(d(d(nt
                                                      utf8 300))
    (min-age uint)
    (max-age uint)
    (locations (    (locations (    (locations (    (locations (sts (list 10 (string-ascii 30)))
    (excluded-interests (list 5 (string-ascii 30)))
    (min-activity-score uint)
    (device-types (list 4 uint))
    (language-codes (list 5 (string-ascii 5)))
    (income-bracket-min uint)
    (income-bracket-max uint)
    (gender-target uint)
)
    (let
        (
            (segment-id (+ (var-get segment-nonce) u1))
        )
        (asserts! (< min-age max-age) err-invalid-criteria)
        (asserts! (<= min-activity-score u100) err-invalid-score)
        (asserts! (<= gender-target u3) err-invalid-criteria)
        (asserts! (<= income-bracket-min income-bracket-max) err-invalid-criteria)

        (map-set audience-segments
            { segment-id: segment-id }
            {
                owner: tx-sender,
                name: name,
                description: description,
                status: STATUS-ACTIVE,
                min-age: min-age,
                max-age: max-age,
                locations: locations,
                required-interests: required-interests,
                excluded-                excluded-                excludedn-activity-score: min-activity-score,
                device-types                device-types                es:                dev                           devin: income-                dev               e-        ma                device-types                device-typgender-target,
                estimated-size: u0,
                match-count: u0,
                created-at: stacks-block-time,
                updated-at: stacks-block-time
            }
        )        )        )        )        )        )        )        )        )    }
                                      pressions: u0,
                total-clicks: u0,
                total-conversions: u0,
                conversion-rate: u0,
                avg-engagement-time: u0,
                cost-per-acquisition: u0,
                total-spend: u0,
                last-performance-update: u0
            }
                                                              (var-set total-segments-created (+ (var-get total-segments-created) u1))
        (ok segment-id)
    )
)

(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(defin(dint))
    (language-codes (list 5 (string-ascii 5)))
    (income-bracket-min uint)
    (income-bracket-max uint)
)
    (let
        (
            (segment (unwrap! (map-get? audi            (segment (unwrap! (map-get? audi            (segment (unwrap! (map-get? a (            (segment (unwrap! (map-get? audi     ized)
        (asserts! (< min-age max-age) err-invalid-criteria)
        (asserts! (<= min-activity-score u100) err-invalid-score)
        (asserts! (<= i        (asserts! (<= i        (asserts!r-invalid-criteria)

        (map-set audience-segments
            { segment-id: segment-id }
            (merge segment {
                min-age: min-age,
                max-age: max-age,
                locations: locations                locatiired-intere                locations: locations                locatiired-intere                locations: locations                locatiired-intere                locations: locations                locatiired-intere                locations: locations              et-                locations: locations       date                loctime
            })
        )
        (ok true)
    )
)

(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defscii 20))
    (language (string-ascii 5))
    (income-bracket uint)
    (gender uint)
)
    (let
        (
            (existing-data (default-to
                {
                    interests: (list),
                    interest-weights: (list),
                    age: u0,
                    location: "",
                              core: u0,
                    device-type                    device-type                    device-type                    device-type                    device-type                    device-type                    device-type                    device-type                    device-type                    device-type                    device-type                    device-type                    device-type                    devic        (map-set user-interests
            { user: tx-sender }
            {
                interests: interests,
                interest-weights: interest-weights,
                age: age,
                location: location,
                activity                activity      is                activity               : device-type,
                language: language,
                income-bracket:                 income-bracket:      r:                income-bracket:        stacks-                income-bra                   income-bracket: 
(define-public (add-targeting-criteria
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          is-e                            S-ACTIVE) err-segment-inactive)

        (map-set targeting-rules
            { campaign-id: campaign-id, se          segment-id }
                                     ifier: bid-modifier,
                priority: priority,
                active: true,
                daily-bud                daily-bud                           daily-bud                daily-bud                           daily-bud                daily-bud                           daily-bud                daily-budign-seg                daily-bud            ai                daily-bud                daily-bud                           daily-bud                daily-bud                           daily-bud                daily-bud                           daily-bud                daily-budign-seg                daily-bud            ai                daily-bud                daily-bud                           daily-bud                daily-bud                           daily-bud                daily-bud                           daily-bud              ent-id }) err-not-foun                daily-bud  (unwrap! (map-get? user-interests { user: user }) err-not-found))
                                                     ast-match-                               p-get? user-match-cooldowns { user:                                                     ast-match-                               p-get? user-match-cooldowns { user:                                                     ast-match-                               p-get? user-match-cooldowns { user:                                                     ast-match-                               p-get? user-match-cooldowns { user:                                                     ast-match-                               p-get? user-match-cooldowns { user:                                                     ast-match-                               p-get? user-match-cooldowns { user:                                                     ast-match-                               p-get? user-match-cooldowns { user:                                                 required-interests: (get required-interests segment),
                    min-activity-score: (get min-activity-score segment),
                    device-types: (get device-types segment),
                    language-codes: (get language-codes segment),
                    income-bracket-min: (get income-bracket-min segment),
                    income-bracket-max: (get income-bracket-max segment)
                }
            ))
            (match-tier (score-to-tier relevance-score))
            (existing-match (default-to
                { relevance-score: u0, match-tier: u0, last-matched: u0, match-count: u0 }
                (map-get? user-segment-matches { user: user, segment-id: segment-id })
            ))
        )
        (asserts! (is-eq (get status segment) STATUS-ACTIVE) err-segment-inactive)
        (asserts! (>= relevance-score (var-get min-relevance-score)) err-invalid-score)
        (asserts! (>= (- stacks-block-height (get last-match-block cooldown))
                      (var-get match-cooldown-blocks)) err-cooldown-active)

        (map-set user-segment-matches
            { user: user, segment-id: segment-id }
            {
                relevance-score: relevance-score,
                match-tier: match-tier,
                last-matched: stacks-block-time,
                match-count: (+ (get match-count existing-match) u1)
            }
        )

        (map-set user-match-cooldowns
            { user: user, segment-id: segment-id }
            { last-match-block: stacks-block-height }
        )

        (map-set audience-segments
            { segment-id: segment-id }
            (merge segment {
                match-count: (+ (get match-count segment) u1),
                updated-at: stacks-block-time
            })
        )

        (var-set total-matches-processed (+ (var-get total-matches-processed) u1))
        (ok { score: relevance-score, tier: match-tier })
    )
)

(define-public (submit-zk-demographic-proof
    (proof-hash (buff 32))
    (criteria-type uint)
)
    (begin
        (asserts! (is-valid-criteria-type criteria-type) err-invalid-criteria)
        (asserts! (is-none (map-get? zk-proof-registry { user: tx-sender, proof-hash: proof-hash })) err-already-exists)

        (map-set zk-proof-registry
            { user: tx-sender, proof-hash: proof-hash }
            {
                verified: true,
                      ia-type: criteria-type,
                submitted-at: stacks-block-height,
                expires-at: (+ stacks-block-height (var-get proof-expiry-blocks))
            }
        )
        (ok true)
    )
)

(define-public (verify-zk-proof-for-segment
    (user principal)
    (segment-id uint)
    (proof-hash (buff 32))
)
    (let
        (
            (segment (unwrap! (map-get? audience-segments { segment-id: segment-id }) err-not-found))
            (proof (unwrap! (map-get? zk-proof-registry { user: user, proof-hash: proof-hash }) err-not-found))
        )
        (asserts! (get verified proof) err-invalid-proof)
        (asserts! (<= stacks-block-height (get expires-at proof)) err-expired-proof)
        (asserts! (is-eq (get status segment) STATUS-ACTIVE) err-segment-inactive)

        (ok { verified: true, criteria-type: (get criteria-type proof) })
    )
)

(define-public (create-demographic-rule
    (name (string-utf8 100))
    (criteria-type uint)
    (min-value uint)
    (max-value uint)
    (weight uint)
)
    (let
                      (rule-id (+ (var-get rule-nonce) u1                      (rule-id (+ (var-get rule-nonce) u1                     lid-criteria)
        (asserts! (<= min-value max-value) err-invalid-criteria)
        (asserts! (<= weight u100) err-invalid-score)

        (map-set demographic-rule-sets
            { rule-id: rule-id }
            {
                owner: tx-sender,
                name: name,
                criteria-type: criteria-type,
                min-value: min-value,
                max-value: max-value,
                                                     e: true,
                                                                                  -set rule-nonce rule-id)
        (ok rule-id)
    )
)

(define-public (register-geo-region
    (region-code (string-ascii 10))
    (name (string-ascii 50))
    (parent-region (string-ascii 10))
    (population-estimate uint)
)
    (begin
        (asserts! (is-eq tx-sender contract-owner) er        (assert       (map-set geo-regions
            { region-code: region-code }
            {
                name: name,
                parent-region: parent-region,
                active: true,
                population-estimate: population-estimate
            }
        )
        (ok true)
    )
)

(define-public (exclude-user-from-campaign
    (campaign-id uint)
    (user principal)
    (reason (string-utf8 100))
    (duration-blocks uint)
)
    (let
        (
            (expires (if (is-eq durat            (expi (+ stacks-block-height duration-blocks)))
        )
        (map-set exclusion-list
            { campaign-id: campaign-id, user: user }
            {
                excluded: true,
                reason: reason,
                excluded-at: stacks-block-time,
                expires-at: expires
            }
        )
        (ok true)
    )
)

(define-public (remove-user-exclusion (campaig(define-public (remove-user-e    (begin
        (map-delete exclusion-list { campaign-id: campaign-id, user: user })
        (ok true)
    )    )    )    )    )    )    )    )    ssion (segment-id uint))
    (let
        (
        (
    )    )    )    )    )map-get? se    )    )    )    )segment-id    )    )    )    )    )map-get? se    )    )    )    sions (+ (get total-impressions performance) u1))
                                                          ult-to
                { impressions: u0, clicks: u0, conversions: u0, spend: u0, unique-matches: u0 }
                                                                                                      ))
        )
        )
                 rformance
            { segment-id: segment-id }
            (merge performance {
                total-impressions: new-impressions,
                                     culate-conver                                  erformance) new- mpressions),
                last-performance-update: stacks-block-time
            })
        )
        (map-set segment-        (map-set segment-        (map-set segment-        (map-set segme       (merge daily { impressions: (+ (get impressions daily) u1) })
        )
        (ok true)
    )
)

(define-public (define-public (define-public (define-public (define-public (define-public (define-public (define-public (define-public (define-public (define-public (define-public (def          (day (get-day-block))
            (daily (default-to
                                                                                                                                                                                                                  
        (map-set segment-performance
            { segment-id: segment-id }
            (merge performance {
                total-clicks: (+ (get total-clicks performance) u1),
                last-performance-update: stacks-block-time
            })
        )
        (map-set segment-daily-stats
            { segment-id: segment-id, day-block: day }
            (merge daily { clicks: (+ (get clicks daily) u1) })
        )
        (ok true)
    )
)

(define-public (track-segment-conversion (segment-id uint))
    (let
        (
            (performance (unwrap! (map-get? segment-performance { segment-id: segment-id }) err-not-found))
            (new-conversions (+ (get total-conversions performance) u1))
            (day (get-day-block))
            (daily (default-to
                { impressions: u0, clicks: u0, conversions: u0, spend: u0, unique-matches: u0 }
                (map-get? segment-daily-stats { segment-id: segment-id, day-block: day })
            ))
        )
        (map-set segment-performance
            { segment-id: segment-id }
            (merge performance {
                total-conversions: new-conversions,
                conversion-rate: (calculate-conversion-rate new-conversions (get total-impressions performance)),
                cost-per-acquisition: (calculate-cpa (get total-spend performance) new-conversions),
                last-performance-update: stacks-block-time
            })
        )
        (map-set segment-daily-stats
            { segment-id: segment-id, day-block: day }
            (merge daily { conversions: (+ (get conversions daily) u1) })
        )
        (ok true)
    )
)

(define-public (update-segment-status (segment-id uint) (new-status uint))
    (let
        (
            (segment (unw            (segment (unw    nts { segment-id: segment-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get owner segment)) err-unauthorized)
        (asserts! (or (is-eq new-status STATUS-ACTIVE)
                      (or                       (or    ED)
                          (is-eq new-status                    err-invalid-criteria)

        (map-set audience-segments
            { segment-id: segment-id }
            (merge segment {
                status: new-status,
                updated-at: stacks-block-time
            })
        )
        (ok true)
    )
)

(define-public (update-user-activity-score (user principal) (new-score uint))
    (let
        (
            (user-data (unwrap! (map-get? user-interests { user: user }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= new-score u100) err-invalid-score)

        (map-set user-interests
            { user: user }
            (merge us            (merge us            (merge us            (merge us            (merge us            (ime
            })
        )
        (ok true)
    )
)

(define-public (update-targeting-rule-budget
    (campaign-id uint)
    (segment-id uint)
    (new-daily-cap uint)
)
    (let
        (
                                                                                          d: segm                                  )
        (map-set targeting-rules
            { campaign-id: campaign-id, segment-id: segment-id }
            (merge rule { daily-budget-cap: new-daily-cap })
        )
             rue)
    )    (define-public (deactivate-targeting-rule (campaign-id uint) (segment-id uint))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { campaign-id: campaign-id, segment-id: segment-id }) err-not-found))
        )
        (map-set targeting-rules
            { campaign-id: campaign-id, segment-id: segment-id }
            (merge rule { ac            (merge ru  )
                                                                                                                           (         (is-eq tx-sender contract-owner) err-owner-              (asserts! (<= new-score u100) e              re)
                    -releva                  e)
        (ok true)
    )
)

(define-public (set-max-segments-per-campaign (new-max uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set max-segments-per-campaign new-max)
        (ok true)
    )
)

(define-public (set-proof-expiry (new-expiry uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set proof-expiry-blocks new-expiry)
        (ok true)
    )
)

(define-public (set-match-cooldown (new-cooldown uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set match-cooldown-blocks new-cooldown)
        (ok true)
    )
)
