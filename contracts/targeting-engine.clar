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
(define-constant CRITERIA-INTERESTS u(define-constant CRITERIA-INTERESTS u(define-constant CRITERIA-INTERESTS u(define-cone-co(define-constant CRITERIA-INTERESTS u(define-constant CRITERIA-INTERESu7)
(define-constant CRITERIA-GENDER u8)

;; Segment status
(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-PAUSED u2)
(define-constant STATUS-ARCHIVED u3)

;; Match quality tiers
(define-constant MATCH-TIER-EXACT u4)
(define-constant MATCH-TIER-HIGH u3)
(define-constant MATCH-TIER-MEDIUM u2)
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
(define-data-var max-interests-per-user uint u20)
(define-data-var min-relevance-score uint u30)
(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(define-data-(de-v(define-data-(define-daed uint u0)

;; data maps
(define(define(define(define(define(defien(define(define(define(define(defi p(define(defi      name: (string-utf8 100),
        description: (string-utf8 300),
        status: uint,
        min-age: uint,
        max-age: uint,
        locations: (list 10 (string-ascii 30)),
        required-interests: (list 10 (string-ascii 30)),
        excluded-interests: (list 5 (string-ascii 30)),
        min-activity-score: uint,
        device-types: (list 4 uint),
        language-codes: (list 5 (string-ascii 5)),
        income-bracket-min: uint,
        income-bracket-max: uint,
        gender-target: uint,
        estimated-size: uint,
        match-count: uint,
        created-at: uint,
        updated-at: uint
    }
)

(define-map user-interests
    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { nguage: (string-    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { user    { ung-    { us  { campaign-id: uint, segment-i    { user    { use       { user    { uset,
                      ,
        active: bool,
        daily-budget-cap:         daily-budget-cap:         daily-budget-cap:    ck: uint,
        created-at: uint
    }
)

(define-map segment-performance
    { segment-id: uint }
    {
        total-impressi        total-impressi        total-im
        tota        tota        tota      onversion-rate: uint,
        avg-engagement-time: uint,
        cost-per-acquisition: uint,
        total-spend: uint,
        last-performance-update: uint
    }
)

(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map campa(define-gn(define-map campa(define-map ces-at:(define-map campa(defi-m(define-map campa(de
                                                                                          ri                      submitted-at                              nt                       eo-regions
    { region-code: (string-ascii 10) }
    {
        name:        name:        name:        name:        name:        na        active: bool,
        population-estimate: uint
    }
)

(define-map user-match-cooldowns
    { user: principal, segment-id: uint }
    {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               ne-private (calculate-age-score (user-age uint) (min-age uint) (max-age uint))
    (if (and (>= user-age min-age) (<= user-age max-age))
        u25
        (if (or
                (and (>= user-age (- min-age u5)) (< user-age min-age))
                                                               ge u5)))
            )
            u10
            u0
        )
    )
)

(define-private (calculate-activity-score (user-score uint) (min-required uint))
    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=    (if (x-    (if (>=    (if (>=    (if (>=    (if (>=    (if (>=  min-income) (<= user-income max-income))
            u15
            (if (or
                    (and (>= user-income (/ min-income u2)) (< user-income min-income))
                    (and (> user-income max-income) (<= user-income (* max-income u2)))
                )
                u5
                u0
            )
        )
    )
)

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
                (get device-type user-data)
                (get device-types segment-data)
            ))
            (language-points (calculate-language-match
                (get language user-data)
                (get language-codes segment-data)
            ))
            (income-points (calculate-income-match
                (get income-bracket user-data)
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
                        (or (is-eq criteria-type CRITERIA-LANGUAGE)
                            (or (is-eq criteria-type CRITERIA-INCOME-BRACKET)
                                (is-eq criteria-type CRITERIA-GENDER)
                            )
                        )
                    )
                )
            )
        )
    )
)

(define-private(define-private(define-private(define-pr uint(define-private(define-private(d impressions u0)
        (/ (* conversions u10000) impressions)
        u0
    )
)

(define-private (calculate-cpa (total-spend uint) (conversions uint))
    (if (> conversions u0)
                     d conversions)
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
    (map-get? user-interests { user: user })
)

(define-read-only (get-targeting-rule (campaign-id uint) (segment-id uint))
    (map-get? targeting-rules { campaign-id: campaign-id, segment-id: segment-id })
)

(define-read-only (get-segment-performance (segment-id uint))
    (map-get? segment-performance { segment-id: segment-id })
)

(define-read-only (get-campaign-segments (campaign-id uint))
    (map-get? campaign-segments { campaign-id: campaign-id })
)

(define-read-only (get-user-segment-match (user principal) (segment-id uint))
    (map-get? user-segment-matches { user: user, segment-id: segment-id })
)

(define-read-only (is-user-excluded (campaign-id uint) (user principal))
    (match (map-get? exclusion-list { campaign-id: campaign-id, user: user })
        exclusion (and
            (get excluded exclusion)
            (or (is-eq (get expires-at exclusion) u0)
                (> (get expires-at exclusion) stacks-block-height))
        )
        false
    )
)

(define-read-only (get-segment-nonce)
    (var-get segment-nonce)
)

(define-read-only (get-rule-nonce)
    (var-get rule-nonce)
)

(define-read-only (get-total-matches)
    (var-get total-matches-processed)
)

(define-read-only (get-total-segments)(define-read-only (-segments-created)
)

(define-read-only (get-demographic-rule (rule-id uint))
    (map-get? demographic-rule    (map-get? demographic-rule    (map-get? demographic-ruregion (region-code (string-ascii 10)))
    (map-get? geo-regions {     (map-get? geo-regions {     (map-get? geo-regions {     (map-get? geo-repr    (map-get? geo-regions {     (map-get? geo-regions {     (map-get? geouser, proof-hash: proof-hash })
)

(define-read-only (get-segment-daily-stats (segment-id uint) (day-block uint))
    (map-get? segment-daily-stats { segment-id: segment-id, day-block: day-block })
)

(define-read-only (get-match-quality-tier (score uint))
    (ok (score-to-tier score))
)

(define-read-only (estimate-segment-reach
    (min-age uint) (max-age uint) (min-activity uint))
    (let
        (
            (age-range (- max-age min-age))
            (age-factor (/ (* age-range u100) u80))
            (age-factor (/ (* age(> mi            (age-factor (/ (* age(    (es            (age-factor (/ (* age(> mi            (age-factor (/ (* age(  imated)
    )
)

;; public functions
(define-public (create-a(define-public (create-a(define-public (create-a(define-public (create-a(define-public (create-a(define-public (create-a(definca(define-public (create-a(define-public (create-a(define-public (create-a(define-public (create-a(define-public (create-a(define-public (create-a(definca(define-public (create-a(define-public (create-a()
    (langua    (langua    (langua    (langua    (langua    (langua    (langua    (langua-b    (langua    (langua    (langua    (langua    (langua    (langua    (langua    (t-id     (langua    (langua    (langua    (langua    (languer    (langua    (langua    (lanvali    (langua    (langua    (langua    (lcti    (langua    (langua    (langua    (langua    (lang (    (laer-target u3    (langua    (langua    (langua    (lang(<= income-bracket-min income-bracket-max) err-invalid-criteria)

        (map-set audience-segments
            { segment-id: segment-id }
            {
                owner: tx-sender,
                name: name,
                          n: description,
                status: STATUS-ACTIVE,
                min-age: min-age,
                max-age: max-age,
                locations: locations,
                required-interests: required-interests,
                excluded-interests: excluded-interests,
                min-activity-score: min-activity-score,
                device-types: device-types,
                language-codes: language-codes,
                income-bracket-min: income-bracket-min,
                income-bracket-max: income-bracket-max,
                gender-target: gender-target,
                estimated-size: u0,
                match-count: u0,
                created-at: stacks-block-time,
                updated-at: stacks-block-time
            }
        )

        (map-set segment-performance
            { segment-id: segment-id }
            {
                total-impressions: u0,
                total-clicks: u0,
                total-conversions: u0,
                conversion-rate: u0,
                avg-engagement-time: u0,
                cost-per-acquisition: u0,
                total-spend: u0,
                last-performance-update: u0
            }
        )

        (var-set segment-nonce segment-id)
        (var-set total-segments-created (+ (var-get total-segments-created) u1))
        (ok segment-id)
    )
)

(define-public (update-segment-criteria
    (segment-id uint)
    (min-age uint)
    (max-age uint)
    (locations (list 10 (string-ascii 30)))
    (required-interests (list 10 (string-ascii 30)))
    (min-activity-score uint)
    (device-types (list 4 uint))
    (language-codes (list 5 (string-ascii 5)))
    (income-bracket-min uint)
    (income-bracket-max uint)
)
    (let
        (
            (segment (unwrap! (map-get? audience-segments { segment-id: segment-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get owner segment)) err-unauthorized)
        (asserts! (< min-age max-age) err-invalid-criteria)
        (asserts! (<= min-activity-score u100) err-invalid-score)
        (asserts! (<= income-bracket-min income-bracket-max) err-invalid-criteria)

        (map-set audience-segments
            { segment-id: segment-id }
            (merge segment {
                min-age: min-age,
                max-age: max-age,
                locations: locations,
                required-interests: required-interests,
                min-activity-score: min-activity-score,
                device-types: device-types,
                language-codes: language-codes,
                income-bracket-min: income-bracket-min,
                income-bracket-max: income-bracket-max,
                updated-at: stacks-block-time
            })
        )
        (ok true)
    )
)

(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defi(defeights (list 20 uint))
    (age uint)
    (location (string-ascii 30))
    (device-type (string-ascii 20))
    (language (string-ascii 5))
    (income-bracket uint)
    (gender uint)
)
    (let
        (
            (existing-data (default-to
                {
                    interests: (list),
                               ights:                             age: u0,
                    location: "",
                    activity-score: u0,
                    device-type: "",
                    language: "",
                    income-bracket: u0,
                                                           dated: u0
                }
                (map-get? user-interests { user: tx-sender })
            ))
        )
        (asserts! (is-eq (len interes        (asserts! (is-eq (len interes        (asserts!    (asserts! (<= gender u3) err-invalid-criteria)

        (map-set user-interests
            { user: tx-sender }
            {
                interests: interests,
                interest-weights: interest-weights,
                a                a        location: location,
                activity-score: (get activity-score existing-data),
                device-type: device-type,
                language: language,
                income-bracket: income-bracket,
                gender: gender,
                last-updated: stacks-block-time
            }
        )
        (ok true)
    )
)

(define-public (add-targeting-criteria
    (campaign-id uint)
    (segment-id uint)
    (bid-modifier uint)
    (priority uint)
    (daily-budget-cap uint)
)
    (let
        (
            (segment (unwrap! (map-get? audi     segments { segment-id: segment-id }) err-not-found))
            (campaign-data (default-to
                { segment-ids: (list), primary-segment: u0 }
                (map-get? campaign-segments { campaign-id: campaign-id })
            ))
        )
        (asserts! (is-eq (get status segment) STATUS-ACTIVE) err-segment-inactive)

        (map-set target        (map-set target        (map-set target d, se        (map-set target        (map-set target        (map-sifier: bid-modifier,
                priority: priority,
                active: true,
                daily-budget-cap: daily-budget-cap,
                                                   st-res                    ck-height,
                                                          }
        )

        (map-set campaign-segments
            { campaign-id: campaign-id }
            {
                segment                segmex-len? (append (get seg                segment   gment-id) u10  err-segment-full),
                primary-segment: (if (is-eq (get primary-segment campaign-data) u0) segment                primary-segmeaign-data))
            }
        )
        (ok true)
    )
)

(define-public (match-user-to-segment (segment-id uint) (user principal))
    (let
        (
            (segment (unwrap! (map-get? audience-segments { segment-id: segment-id }) err-not-found))
            (user-data (unwrap! (map-get? user-interests { user: user }) err-not-found))
            (cooldown (default-to
                { last-match-                { last-match-    get? user-match-cooldowns { user: user, segment-id: segment-id })
            ))
            (relevance-score (calculate-relevance-score
                {
                    interests: (get interests user-data),
                    interest-weights: (get interest-weights user-data),
                    age: (get age user-data),
                    location: (get location user-data),
                    activity-score: (get activity-score user-data),
                    device-type: (get device-type user-data),
                    language: (get language user-data),
                    income-bracket: (get income-bracket user-data)
                }
                {
                    min-age: (get min-age segment),
                    max-age: (get max-age segment),
                    locations: (get locations segment),
                    required-interests: (get required-interests segment),
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
                u             acks-block-time
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
            { user: tx-sender, proof-hash:             { user: tx-sender, proof-hash:             { u
                 riteria    e: criteria-type,
                submitted-at: stacks-block-height,
                expires-at: (+ stacks-block-height (var-get proof-expiry-blocks))
            }
        )
        (ok true)
    )
)

(define-public (verify-zk-proof-for-segment
    (user principa    (user gment-id uint)
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
        (
            (rule-id (+ (var-get rule-nonce) u1))
        )
        (asserts! (is-valid-criteria-type criteria-type) err-invalid-criteria)
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
                weight: weight,
                active: true,
                created-at: stacks-block-time
            }
        )
        (var-set rule-nonce rule-id)
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
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (map-set geo-regions
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
            (expires (if (is-eq duration-blocks u0) u0 (+ stacks-block-height duration-blocks)))
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

(define-public (remove-user-exclusion (campaign-id uint) (user principal))
    (begin
        (map-delete exclusion-list { campaign-id: campaign-id, user: user })
        (ok true)
    )
)

(define-public (track-segment-impression (segment-id uint))
    (let
        (
            (performance (unwrap! (map-get? segment-performance { segment-id: segment-id }) err-not-found))
            (new-impressions (+ (get total-impressions performance) u1))
            (day (get-day-block))
            (daily (default-to
                { impressions: u0, clicks: u0, conversions: u0, spend: u0, unique-matches: u0 }
                (map-get? segment-daily-stats { segment-id: segment-id, day-block: day })
            ))
        )
        (map-set segment-performance
            { segment-id: segment-id }
            (merge performance {
                total-impressions: new-impressions,
                conversion-rate: (calculate-conversion-rate (get total-conversions performance) new-impressions),
                last-pe                last-pe                last-pe                last-  (map-set segment-                last-pe                last-pe                last-pe                       { impression                last-pe                last-pe
        (ok t               defi        (ok t               defi        (ok t               defi        (ok t               defi        (op-        (ok t               defi        (okent-id }) err-not-found))
                                                                                                                                                                                                                                                                       ))
        )
                                                 { segment-id: segment-id }
                                                                                       formance) u1),
                last-performance-update: stacks-block-time
            })
        )
        (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set              (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set     (        (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         (map-set         ( { segment-id: segment-id, day-block: day })
            ))
        )
        (map-set s        (map-set s        (map-set s        (map-set s        (map-set s        (map-set s        (m       total-conversions: new-conversions,
                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                conversion-rate: (calculate                cis-e             get owner segment)) err-unauthorized)
        (asserts! (or (is-eq new-status STATUS-ACTIVE)
                      (or (is-eq new-status STATUS-PAUSED)
                          (is-eq new-status STATUS-ARCHIVED))) err-invalid-criteria)

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
            (merge user-data {
                activity-score: new-score,
                last-updated: stacks-block-time
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
            (rule (unwrap! (map-get? targeting-rules { campaign-id: campaign-id, segment-id: segment-id }) err-not-found))
        )
        (map-set targeting-rules
            { campaign-id: campaign-id, segment-id: segment-id }
            (merge rule { daily-budget-cap: new-daily-cap })
        )
               e)
    )
)

(define-public (deactivate-targeting-rule (campaign-id uint) (segment-id uint))
    (let
        (
            (rule (unwrap! (map-get? targeting-rules { campaign-id: campaign-id, segment-id: segment-i            (rule (unwrap! (map-get? targeting-rules { camrules
            { campaign-id: campaign-id, segment-id: segment-id }
            (merge rule { active: false })
        )
        (ok true)
    )
)

;; Adm;; Adm;; Adm;; Adm;; Adm;; Adm;; Adm;; leva;; Adm;; Adm;; Adm;; Adm;; Adm;; Adm;; Adm;    (asserts! (is-eq tx-sender;; Adm;; Adm;; A err-owner-only)
        (asserts! (<= new-score u100) e        (d-score)
        (var-set min-releva        (var--score)
        (ok true)
    )
)))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))ct-owner) err-owner-only)
        (var-set max-segments-per-campaign new-max)
        (ok true)
    )
)

(define-pu(define-pu(define-pu(define-pu(define-pu(define-pu(def       (asserts! (is-eq tx-sender contract-o(define-pu(define-pu(define-pu(define-pu(define-pu(define-pu(def       (assert (ok true)
    )
)

(define-public (set-match-cooldown (new-cooldown uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set match-cooldown-blocks new-cooldown)
        (ok true)
    )
)
