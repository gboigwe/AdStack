;; title: audience-segments
;; version: 1.0.0
;; summary: Audience segment creation, membership verification, and lookalike modeling
;; description: Manages audience segment definitions, user-in-segment membership checks,
;;   segment analytics aggregation, and lookalike audience generation based on
;;   behavioral similarity scoring.

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u200))
(define-constant err-not-found (err u201))
(define-constant err-unauthorized (err u202))
(define-constant err-invalid-input (err u203))
(define-constant err-already-exists (err u204))
(define-constant err-segment-closed (err u205))
(define-constant err-max-members (err u206))
(define-constant err-not-member (err u207))
(define-constant err-invalid-threshold (err u208))
(define-constant err-lookalike-failed (err u209))
(define-constant err-cooldown (err u210))

;; Segment types
(define-constant SEGMENT-TYPE-CUSTOM u1)
(define-constant SEGMENT-TYPE-BEHAVIORAL u2)
(define-constant SEGMENT-TYPE-DEMOGRAPHIC u3)
(define-constant SEGMENT-TYPE-LOOKALIKE u4)
(define-constant SEGMENT-TYPE-RETARGETING u5)

;; Membership status
(define-constant MEMBERSHIP-ACTIVE u1)
(define-constant MEMBERSHIP-EXPIRED u2)
(define-constant MEMBERSHIP-REMOVED u3)

;; data vars
(define-data-var segment-counter uint u0)
(define-data-var lookalike-counter uint u0)
(define-data-var max-members-per-segment uint u10000)
(define-data-var membership-ttl-blocks uint u4320)
(define-data-var min-similarity-score uint u60)

;; data maps
(define-map segments
    { segment-id: uint }
    {
        owner: principal,
        name: (string-utf8 100),
        description: (string-utf8 300),
        segment-type: uint,
        tags: (list 10 (string-ascii 30)),
        member-count: uint,
        max-size: uint,
        is-open: bool,
        similarity-threshold: uint,
        source-segment-id: uint,
        created-at: uint,
        updated-at: uint
    }
)

(define-map segment-members
    { segment-id: uint, member: principal }
    {
        status: uint,
        similarity-score: uint,
        joined-at: uint,
        expires-at: uint,
        interaction-count: uint
    }
)

(define-map segment-analytics
    { segment-id: uint }
    {
        total-impressions: uint,
        total-clicks: uint,
        total-conversions: uint,
        avg-similarity: uint,
        reach-rate: uint,
        engagement-rate: uint,
        revenue-generated: uint,
        last-updated: uint
    }
)

(define-map user-segment-list
    { user: principal }
    {
        segment-ids: (list 20 uint),
        total-memberships: uint
    }
)

(define-map segment-behavioral-signals
    { segment-id: uint, signal-name: (string-ascii 30) }
    {
        weight: uint,
        min-value: uint,
        max-value: uint,
        required: bool
    }
)

(define-map lookalike-models
    { model-id: uint }
    {
        source-segment-id: uint,
        target-segment-id: uint,
        similarity-threshold: uint,
        expansion-factor: uint,
        members-found: uint,
        owner: principal,
        created-at: uint
    }
)

(define-map user-behavior-profiles
    { user: principal }
    {
        page-views: uint,
        ad-clicks: uint,
        conversions: uint,
        avg-session-duration: uint,
        visit-frequency: uint,
        last-activity: uint
    }
)

(define-map segment-overlap
    { segment-a: uint, segment-b: uint }
    {
        overlap-count: uint,
        overlap-percentage: uint,
        last-calculated: uint
    }
)

;; private functions
(define-private (is-valid-segment-type (seg-type uint))
    (or (is-eq seg-type SEGMENT-TYPE-CUSTOM)
        (or (is-eq seg-type SEGMENT-TYPE-BEHAVIORAL)
            (or (is-eq seg-type SEGMENT-TYPE-DEMOGRAPHIC)
                (or (is-eq seg-type SEGMENT-TYPE-LOOKALIKE)
                    (is-eq seg-type SEGMENT-TYPE-RETARGETING)
                )
            )
        )
    )
)

(define-private (calculate-similarity
    (profile-a (tuple (page-views uint) (ad-clicks uint) (conversions uint) (avg-session-duration uint) (visit-frequency uint)))
    (profile-b (tuple (page-views uint) (ad-clicks uint) (conversions uint) (avg-session-duration uint) (visit-frequency uint)))
)
    (let
        (
            (pv-diff (if (> (get page-views profile-a) (get page-views profile-b))
                (- (get page-views profile-a) (get page-views profile-b))
                (- (get page-views profile-b) (get page-views profile-a))
            ))
            (click-diff (if (> (get ad-clicks profile-a) (get ad-clicks profile-b))
                (- (get ad-clicks profile-a) (get ad-clicks profile-b))
                (- (get ad-clicks profile-b) (get ad-clicks profile-a))
            ))
            (conv-diff (if (> (get conversions profile-a) (get conversions profile-b))
                (- (get conversions profile-a) (get conversions profile-b))
                (- (get conversions profile-b) (get conversions profile-a))
            ))
            (freq-diff (if (> (get visit-frequency profile-a) (get visit-frequency profile-b))
                (- (get visit-frequency profile-a) (get visit-frequency profile-b))
                (- (get visit-frequency profile-b) (get visit-frequency profile-a))
            ))
            (max-pv (if (> (get page-views profile-a) (get page-views profile-b))
                (get page-views profile-a) (get page-views profile-b)))
            (max-clicks (if (> (get ad-clicks profile-a) (get ad-clicks profile-b))
                (get ad-clicks profile-a) (get ad-clicks profile-b)))
            (pv-score (if (> max-pv u0) (- u100 (/ (* pv-diff u100) max-pv)) u100))
            (click-score (if (> max-clicks u0) (- u100 (/ (* click-diff u100) max-clicks)) u100))
            (raw-similarity (/ (+ pv-score click-score) u2))
        )
        (if (> raw-similarity u100) u100 raw-similarity)
    )
)

(define-private (calculate-engagement-rate (clicks uint) (impressions uint))
    (if (> impressions u0)
        (/ (* clicks u10000) impressions)
        u0
    )
)

;; read only functions
(define-read-only (get-segment (segment-id uint))
    (map-get? segments { segment-id: segment-id })
)

(define-read-only (get-segment-member (segment-id uint) (member principal))
    (map-get? segment-members { segment-id: segment-id, member: member })
)

(define-read-only (get-segment-analytics (segment-id uint))
    (map-get? segment-analytics { segment-id: segment-id })
)

(define-read-only (get-user-segments (user principal))
    (map-get? user-segment-list { user: user })
)

(define-read-only (get-user-behavior (user principal))
    (map-get? user-behavior-profiles { user: user })
)

(define-read-only (get-lookalike-model (model-id uint))
    (map-get? lookalike-models { model-id: model-id })
)

(define-read-only (get-segment-overlap-data (segment-a uint) (segment-b uint))
    (map-get? segment-overlap { segment-a: segment-a, segment-b: segment-b })
)

(define-read-only (get-segment-counter)
    (var-get segment-counter)
)

(define-read-only (is-member-active (segment-id uint) (member principal))
    (match (map-get? segment-members { segment-id: segment-id, member: member })
        membership (and
            (is-eq (get status membership) MEMBERSHIP-ACTIVE)
            (or (is-eq (get expires-at membership) u0)
                (> (get expires-at membership) stacks-block-height))
        )
        false
    )
)

(define-read-only (get-behavioral-signal (segment-id uint) (signal-name (string-ascii 30)))
    (map-get? segment-behavioral-signals { segment-id: segment-id, signal-name: signal-name })
)

;; public functions
(define-public (create-segment
    (name (string-utf8 100))
    (description (string-utf8 300))
    (segment-type uint)
    (tags (list 10 (string-ascii 30)))
    (max-size uint)
    (similarity-threshold uint)
)
    (let
        (
            (segment-id (+ (var-get segment-counter) u1))
        )
        (asserts! (is-valid-segment-type segment-type) err-invalid-input)
        (asserts! (<= similarity-threshold u100) err-invalid-threshold)
        (asserts! (> max-size u0) err-invalid-input)

        (map-set segments
            { segment-id: segment-id }
            {
                owner: tx-sender,
                name: name,
                description: description,
                segment-type: segment-type,
                tags: tags,
                member-count: u0,
                max-size: max-size,
                is-open: true,
                similarity-threshold: similarity-threshold,
                source-segment-id: u0,
                created-at: stacks-block-time,
                updated-at: stacks-block-time
            }
        )

        (map-set segment-analytics
            { segment-id: segment-id }
            {
                total-impressions: u0,
                total-clicks: u0,
                total-conversions: u0,
                avg-similarity: u0,
                reach-rate: u0,
                engagement-rate: u0,
                revenue-generated: u0,
                last-updated: u0
            }
        )

        (var-set segment-counter segment-id)
        (ok segment-id)
    )
)

(define-public (add-member-to-segment
    (segment-id uint)
    (member principal)
    (similarity-score uint)
)
    (let
        (
            (segment (unwrap! (map-get? segments { segment-id: segment-id }) err-not-found))
            (user-segs (default-to
                { segment-ids: (list), total-memberships: u0 }
                (map-get? user-segment-list { user: member })
            ))
        )
        (asserts! (or (is-eq tx-sender (get owner segment)) (is-eq tx-sender contract-owner)) err-unauthorized)
        (asserts! (get is-open segment) err-segment-closed)
        (asserts! (< (get member-count segment) (get max-size segment)) err-max-members)
        (asserts! (<= similarity-score u100) err-invalid-threshold)
        (asserts! (is-none (map-get? segment-members { segment-id: segment-id, member: member })) err-already-exists)

        (map-set segment-members
            { segment-id: segment-id, member: member }
            {
                status: MEMBERSHIP-ACTIVE,
                similarity-score: similarity-score,
                joined-at: stacks-block-time,
                expires-at: (+ stacks-block-height (var-get membership-ttl-blocks)),
                interaction-count: u0
            }
        )

        (map-set segments
            { segment-id: segment-id }
            (merge segment {
                member-count: (+ (get member-count segment) u1),
                updated-at: stacks-block-time
            })
        )

        (map-set user-segment-list
            { user: member }
            {
                segment-ids: (unwrap! (as-max-len? (append (get segment-ids user-segs) segment-id) u20) err-max-members),
                total-memberships: (+ (get total-memberships user-segs) u1)
            }
        )

        (ok true)
    )
)

(define-public (remove-member-from-segment (segment-id uint) (member principal))
    (let
        (
            (segment (unwrap! (map-get? segments { segment-id: segment-id }) err-not-found))
            (membership (unwrap! (map-get? segment-members { segment-id: segment-id, member: member }) err-not-member))
        )
        (asserts! (or (is-eq tx-sender (get owner segment)) (is-eq tx-sender contract-owner)) err-unauthorized)

        (map-set segment-members
            { segment-id: segment-id, member: member }
            (merge membership {
                status: MEMBERSHIP-REMOVED
            })
        )

        (map-set segments
            { segment-id: segment-id }
            (merge segment {
                member-count: (if (> (get member-count segment) u0)
                    (- (get member-count segment) u1)
                    u0
                ),
                updated-at: stacks-block-time
            })
        )
        (ok true)
    )
)

(define-public (update-behavior-profile
    (page-views uint)
    (ad-clicks uint)
    (conversions uint)
    (avg-session-duration uint)
    (visit-frequency uint)
)
    (begin
        (map-set user-behavior-profiles
            { user: tx-sender }
            {
                page-views: page-views,
                ad-clicks: ad-clicks,
                conversions: conversions,
                avg-session-duration: avg-session-duration,
                visit-frequency: visit-frequency,
                last-activity: stacks-block-time
            }
        )
        (ok true)
    )
)

(define-public (record-member-interaction (segment-id uint) (member principal))
    (let
        (
            (membership (unwrap! (map-get? segment-members { segment-id: segment-id, member: member }) err-not-member))
        )
        (asserts! (is-eq (get status membership) MEMBERSHIP-ACTIVE) err-not-member)

        (map-set segment-members
            { segment-id: segment-id, member: member }
            (merge membership {
                interaction-count: (+ (get interaction-count membership) u1)
            })
        )
        (ok true)
    )
)

(define-public (create-lookalike-model
    (source-segment-id uint)
    (similarity-threshold uint)
    (expansion-factor uint)
)
    (let
        (
            (source (unwrap! (map-get? segments { segment-id: source-segment-id }) err-not-found))
            (model-id (+ (var-get lookalike-counter) u1))
            (target-max (* (get member-count source) expansion-factor))
            (target-segment-id (+ (var-get segment-counter) u1))
        )
        (asserts! (is-eq tx-sender (get owner source)) err-unauthorized)
        (asserts! (<= similarity-threshold u100) err-invalid-threshold)
        (asserts! (> expansion-factor u0) err-invalid-input)
        (asserts! (> (get member-count source) u0) err-invalid-input)

        (map-set segments
            { segment-id: target-segment-id }
            {
                owner: tx-sender,
                name: (get name source),
                description: (get description source),
                segment-type: SEGMENT-TYPE-LOOKALIKE,
                tags: (get tags source),
                member-count: u0,
                max-size: target-max,
                is-open: true,
                similarity-threshold: similarity-threshold,
                source-segment-id: source-segment-id,
                created-at: stacks-block-time,
                updated-at: stacks-block-time
            }
        )

        (map-set segment-analytics
            { segment-id: target-segment-id }
            {
                total-impressions: u0,
                total-clicks: u0,
                total-conversions: u0,
                avg-similarity: u0,
                reach-rate: u0,
                engagement-rate: u0,
                revenue-generated: u0,
                last-updated: u0
            }
        )

        (map-set lookalike-models
            { model-id: model-id }
            {
                source-segment-id: source-segment-id,
                target-segment-id: target-segment-id,
                similarity-threshold: similarity-threshold,
                expansion-factor: expansion-factor,
                members-found: u0,
                owner: tx-sender,
                created-at: stacks-block-time
            }
        )

        (var-set lookalike-counter model-id)
        (var-set segment-counter target-segment-id)
        (ok { model-id: model-id, target-segment-id: target-segment-id })
    )
)

(define-public (evaluate-lookalike-candidate
    (model-id uint)
    (candidate principal)
    (reference-profile (tuple (page-views uint) (ad-clicks uint) (conversions uint) (avg-session-duration uint) (visit-frequency uint)))
)
    (let
        (
            (model (unwrap! (map-get? lookalike-models { model-id: model-id }) err-not-found))
            (candidate-profile (unwrap! (map-get? user-behavior-profiles { user: candidate }) err-not-found))
            (similarity (calculate-similarity
                reference-profile
                {
                    page-views: (get page-views candidate-profile),
                    ad-clicks: (get ad-clicks candidate-profile),
                    conversions: (get conversions candidate-profile),
                    avg-session-duration: (get avg-session-duration candidate-profile),
                    visit-frequency: (get visit-frequency candidate-profile)
                }
            ))
        )
        (asserts! (is-eq tx-sender (get owner model)) err-unauthorized)
        (asserts! (>= similarity (get similarity-threshold model)) err-lookalike-failed)

        (map-set segment-members
            { segment-id: (get target-segment-id model), member: candidate }
            {
                status: MEMBERSHIP-ACTIVE,
                similarity-score: similarity,
                joined-at: stacks-block-time,
                expires-at: (+ stacks-block-height (var-get membership-ttl-blocks)),
                interaction-count: u0
            }
        )

        (map-set lookalike-models
            { model-id: model-id }
            (merge model {
                members-found: (+ (get members-found model) u1)
            })
        )

        (ok { similarity: similarity, accepted: true })
    )
)

(define-public (update-segment-analytics
    (segment-id uint)
    (impressions uint)
    (clicks uint)
    (conversions uint)
    (revenue uint)
)
    (let
        (
            (segment (unwrap! (map-get? segments { segment-id: segment-id }) err-not-found))
            (analytics (default-to
                {
                    total-impressions: u0, total-clicks: u0, total-conversions: u0,
                    avg-similarity: u0, reach-rate: u0, engagement-rate: u0,
                    revenue-generated: u0, last-updated: u0
                }
                (map-get? segment-analytics { segment-id: segment-id })
            ))
            (new-impressions (+ (get total-impressions analytics) impressions))
            (new-clicks (+ (get total-clicks analytics) clicks))
        )
        (asserts! (or (is-eq tx-sender (get owner segment)) (is-eq tx-sender contract-owner)) err-unauthorized)

        (map-set segment-analytics
            { segment-id: segment-id }
            {
                total-impressions: new-impressions,
                total-clicks: new-clicks,
                total-conversions: (+ (get total-conversions analytics) conversions),
                avg-similarity: (get avg-similarity analytics),
                reach-rate: (if (> (get max-size segment) u0)
                    (/ (* (get member-count segment) u10000) (get max-size segment))
                    u0
                ),
                engagement-rate: (calculate-engagement-rate new-clicks new-impressions),
                revenue-generated: (+ (get revenue-generated analytics) revenue),
                last-updated: stacks-block-time
            }
        )
        (ok true)
    )
)

(define-public (record-segment-overlap
    (segment-a uint)
    (segment-b uint)
    (overlap-count uint)
)
    (let
        (
            (seg-a (unwrap! (map-get? segments { segment-id: segment-a }) err-not-found))
            (seg-b (unwrap! (map-get? segments { segment-id: segment-b }) err-not-found))
            (min-members (if (< (get member-count seg-a) (get member-count seg-b))
                (get member-count seg-a)
                (get member-count seg-b)
            ))
            (overlap-pct (if (> min-members u0) (/ (* overlap-count u10000) min-members) u0))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set segment-overlap
            { segment-a: segment-a, segment-b: segment-b }
            {
                overlap-count: overlap-count,
                overlap-percentage: overlap-pct,
                last-calculated: stacks-block-time
            }
        )
        (ok true)
    )
)

(define-public (close-segment (segment-id uint))
    (let
        (
            (segment (unwrap! (map-get? segments { segment-id: segment-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get owner segment)) err-unauthorized)

        (map-set segments
            { segment-id: segment-id }
            (merge segment {
                is-open: false,
                updated-at: stacks-block-time
            })
        )
        (ok true)
    )
)

(define-public (reopen-segment (segment-id uint))
    (let
        (
            (segment (unwrap! (map-get? segments { segment-id: segment-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get owner segment)) err-unauthorized)

        (map-set segments
            { segment-id: segment-id }
            (merge segment {
                is-open: true,
                updated-at: stacks-block-time
            })
        )
        (ok true)
    )
)

(define-public (add-behavioral-signal
    (segment-id uint)
    (signal-name (string-ascii 30))
    (weight uint)
    (min-value uint)
    (max-value uint)
    (required bool)
)
    (let
        (
            (segment (unwrap! (map-get? segments { segment-id: segment-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get owner segment)) err-unauthorized)
        (asserts! (<= weight u100) err-invalid-threshold)
        (asserts! (<= min-value max-value) err-invalid-input)

        (map-set segment-behavioral-signals
            { segment-id: segment-id, signal-name: signal-name }
            {
                weight: weight,
                min-value: min-value,
                max-value: max-value,
                required: required
            }
        )
        (ok true)
    )
)

;; Admin functions
(define-public (set-max-members (new-max uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set max-members-per-segment new-max)
        (ok true)
    )
)

(define-public (set-membership-ttl (new-ttl uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set membership-ttl-blocks new-ttl)
        (ok true)
    )
)

(define-public (set-min-similarity (new-min uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= new-min u100) err-invalid-threshold)
        (var-set min-similarity-score new-min)
        (ok true)
    )
)
