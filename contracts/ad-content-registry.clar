;; title: ad-content-registry
;; version: 1.0.0
;; summary: Manages ad creative assets and validation
;; description: Store, validate, and track ad content including IPFS hashes, metadata, and performance metrics

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))
(define-constant err-invalid-content (err u103))
(define-constant err-unauthorized (err u104))
(define-constant err-invalid-status (err u105))
(define-constant err-content-flagged (err u106))
(define-constant err-invalid-format (err u107))

;; Content status constants
(define-constant STATUS-PENDING u0)
(define-constant STATUS-APPROVED u1)
(define-constant STATUS-REJECTED u2)
(define-constant STATUS-SUSPENDED u3)
(define-constant STATUS-ARCHIVED u4)

;; Content format constants
(define-constant FORMAT-IMAGE u1)
(define-constant FORMAT-VIDEO u2)
(define-constant FORMAT-TEXT u3)
(define-constant FORMAT-NATIVE u4)

;; data vars
(define-data-var content-nonce uint u0)
(define-data-var min-content-size uint u100)
(define-data-var max-content-size uint u10485760) ;; 10MB
(define-data-var flag-threshold uint u5)

;; data maps
(define-map ad-contents
    { content-id: uint }
    {
        campaign-id: uint,
        owner: principal,
        ipfs-hash: (string-ascii 64),
        format: uint,
        size: uint,
        status: uint,
        created-at: uint,
        updated-at: uint,
        flags-count: uint
    }
)

(define-map content-metadata
    { content-id: uint }
    {
        title: (string-utf8 100),
        description: (string-utf8 500),
        call-to-action: (string-utf8 50),
        landing-url: (string-utf8 200),
        tags: (list 10 (string-ascii 20))
    }
)

(define-map content-performance
    { content-id: uint }
    {
        total-views: uint,
        total-clicks: uint,
        unique-viewers: uint,
        click-through-rate: uint, ;; Multiplied by 10000 for precision (e.g., 525 = 5.25%)
        last-shown: uint
    }
)

(define-map flagged-content
    { content-id: uint, reporter: principal }
    {
        reason: (string-utf8 200),
        timestamp: uint,
        verified: bool
    }
)

(define-map campaign-contents
    { campaign-id: uint }
    {
        content-ids: (list 10 uint),
        active-content-id: uint
    }
)

(define-map content-variants
    { parent-content-id: uint }
    {
        variant-ids: (list 5 uint),
        test-mode: bool
    }
)

;; private functions
(define-private (is-valid-format (format uint))
    (or
        (is-eq format FORMAT-IMAGE)
        (is-eq format FORMAT-VIDEO)
        (is-eq format FORMAT-TEXT)
        (is-eq format FORMAT-NATIVE)
    )
)

(define-private (is-valid-status (status uint))
    (or
        (is-eq status STATUS-PENDING)
        (is-eq status STATUS-APPROVED)
        (is-eq status STATUS-REJECTED)
        (is-eq status STATUS-SUSPENDED)
        (is-eq status STATUS-ARCHIVED)
    )
)

(define-private (calculate-ctr (views uint) (clicks uint))
    (if (> views u0)
        (/ (* clicks u10000) views)
        u0
    )
)

;; read only functions
(define-read-only (get-content (content-id uint))
    (map-get? ad-contents { content-id: content-id })
)

(define-read-only (get-content-metadata (content-id uint))
    (map-get? content-metadata { content-id: content-id })
)

(define-read-only (get-content-performance (content-id uint))
    (map-get? content-performance { content-id: content-id })
)

(define-read-only (get-campaign-contents (campaign-id uint))
    (map-get? campaign-contents { campaign-id: campaign-id })
)

(define-read-only (get-content-variants (parent-content-id uint))
    (map-get? content-variants { parent-content-id: parent-content-id })
)

(define-read-only (get-flag-info (content-id uint) (reporter principal))
    (map-get? flagged-content { content-id: content-id, reporter: reporter })
)

(define-read-only (is-content-approved (content-id uint))
    (match (map-get? ad-contents { content-id: content-id })
        content (is-eq (get status content) STATUS-APPROVED)
        false
    )
)

(define-read-only (get-content-nonce)
    (var-get content-nonce)
)

;; public functions
(define-public (register-ad-content
    (campaign-id uint)
    (ipfs-hash (string-ascii 64))
    (format uint)
    (size uint)
    (title (string-utf8 100))
    (description (string-utf8 500))
    (call-to-action (string-utf8 50))
    (landing-url (string-utf8 200))
    (tags (list 10 (string-ascii 20)))
)
    (let
        (
            (content-id (+ (var-get content-nonce) u1))
        )
        (asserts! (is-valid-format format) err-invalid-format)
        (asserts! (and (>= size (var-get min-content-size)) (<= size (var-get max-content-size))) err-invalid-content)

        (map-set ad-contents
            { content-id: content-id }
            {
                campaign-id: campaign-id,
                owner: tx-sender,
                ipfs-hash: ipfs-hash,
                format: format,
                size: size,
                status: STATUS-PENDING,
                created-at: stacks-block-time,
                updated-at: stacks-block-time,
                flags-count: u0
            }
        )

        (map-set content-metadata
            { content-id: content-id }
            {
                title: title,
                description: description,
                call-to-action: call-to-action,
                landing-url: landing-url,
                tags: tags
            }
        )

        (map-set content-performance
            { content-id: content-id }
            {
                total-views: u0,
                total-clicks: u0,
                unique-viewers: u0,
                click-through-rate: u0,
                last-shown: u0
            }
        )

        (var-set content-nonce content-id)
        (ok content-id)
    )
)

(define-public (update-content-status (content-id uint) (new-status uint))
    (let
        (
            (content (unwrap! (map-get? ad-contents { content-id: content-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-valid-status new-status) err-invalid-status)

        (map-set ad-contents
            { content-id: content-id }
            (merge content {
                status: new-status,
                updated-at: stacks-block-time
            })
        )
        (ok true)
    )
)

(define-public (flag-content (content-id uint) (reason (string-utf8 200)))
    (let
        (
            (content (unwrap! (map-get? ad-contents { content-id: content-id }) err-not-found))
            (new-flags (+ (get flags-count content) u1))
        )
        (asserts! (not (is-eq tx-sender (get owner content))) err-unauthorized)

        (map-set flagged-content
            { content-id: content-id, reporter: tx-sender }
            {
                reason: reason,
                timestamp: stacks-block-time,
                verified: false
            }
        )

        (map-set ad-contents
            { content-id: content-id }
            (merge content {
                flags-count: new-flags,
                status: (if (>= new-flags (var-get flag-threshold)) STATUS-SUSPENDED (get status content)),
                updated-at: stacks-block-time
            })
        )
        (ok true)
    )
)

(define-public (verify-flag (content-id uint) (reporter principal) (is-valid bool))
    (let
        (
            (flag (unwrap! (map-get? flagged-content { content-id: content-id, reporter: reporter }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set flagged-content
            { content-id: content-id, reporter: reporter }
            (merge flag { verified: is-valid })
        )

        (if is-valid
            (update-content-status content-id STATUS-SUSPENDED)
            (ok true)
        )
    )
)

(define-public (track-content-view (content-id uint))
    (let
        (
            (content (unwrap! (map-get? ad-contents { content-id: content-id }) err-not-found))
            (performance (unwrap! (map-get? content-performance { content-id: content-id }) err-not-found))
            (new-views (+ (get total-views performance) u1))
        )
        (asserts! (is-eq (get status content) STATUS-APPROVED) err-invalid-status)

        (map-set content-performance
            { content-id: content-id }
            (merge performance {
                total-views: new-views,
                unique-viewers: (+ (get unique-viewers performance) u1),
                click-through-rate: (calculate-ctr new-views (get total-clicks performance)),
                last-shown: stacks-block-time
            })
        )
        (ok true)
    )
)

(define-public (track-content-click (content-id uint))
    (let
        (
            (performance (unwrap! (map-get? content-performance { content-id: content-id }) err-not-found))
            (new-clicks (+ (get total-clicks performance) u1))
        )
        (map-set content-performance
            { content-id: content-id }
            (merge performance {
                total-clicks: new-clicks,
                click-through-rate: (calculate-ctr (get total-views performance) new-clicks)
            })
        )
        (ok true)
    )
)

(define-public (add-content-to-campaign (campaign-id uint) (content-id uint))
    (let
        (
            (content (unwrap! (map-get? ad-contents { content-id: content-id }) err-not-found))
            (campaign-data (default-to
                { content-ids: (list), active-content-id: u0 }
                (map-get? campaign-contents { campaign-id: campaign-id })
            ))
        )
        (asserts! (is-eq tx-sender (get owner content)) err-unauthorized)
        (asserts! (is-eq (get campaign-id content) campaign-id) err-invalid-content)

        (map-set campaign-contents
            { campaign-id: campaign-id }
            {
                content-ids: (unwrap! (as-max-len? (append (get content-ids campaign-data) content-id) u10) err-invalid-content),
                active-content-id: (if (is-eq (get active-content-id campaign-data) u0) content-id (get active-content-id campaign-data))
            }
        )
        (ok true)
    )
)

(define-public (set-active-content (campaign-id uint) (content-id uint))
    (let
        (
            (content (unwrap! (map-get? ad-contents { content-id: content-id }) err-not-found))
            (campaign-data (unwrap! (map-get? campaign-contents { campaign-id: campaign-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get owner content)) err-unauthorized)
        (asserts! (is-eq (get status content) STATUS-APPROVED) err-invalid-status)

        (map-set campaign-contents
            { campaign-id: campaign-id }
            (merge campaign-data { active-content-id: content-id })
        )
        (ok true)
    )
)

(define-public (create-content-variant (parent-content-id uint) (variant-content-id uint))
    (let
        (
            (parent (unwrap! (map-get? ad-contents { content-id: parent-content-id }) err-not-found))
            (variant (unwrap! (map-get? ad-contents { content-id: variant-content-id }) err-not-found))
            (variants-data (default-to
                { variant-ids: (list), test-mode: false }
                (map-get? content-variants { parent-content-id: parent-content-id })
            ))
        )
        (asserts! (is-eq tx-sender (get owner parent)) err-unauthorized)
        (asserts! (is-eq (get campaign-id parent) (get campaign-id variant)) err-invalid-content)

        (map-set content-variants
            { parent-content-id: parent-content-id }
            {
                variant-ids: (unwrap! (as-max-len? (append (get variant-ids variants-data) variant-content-id) u5) err-invalid-content),
                test-mode: true
            }
        )
        (ok true)
    )
)

(define-public (archive-content (content-id uint))
    (let
        (
            (content (unwrap! (map-get? ad-contents { content-id: content-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get owner content)) err-unauthorized)

        (map-set ad-contents
            { content-id: content-id }
            (merge content {
                status: STATUS-ARCHIVED,
                updated-at: stacks-block-time
            })
        )
        (ok true)
    )
)

;; Admin functions
(define-public (set-flag-threshold (new-threshold uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set flag-threshold new-threshold)
        (ok true)
    )
)

(define-public (set-content-size-limits (min-size uint) (max-size uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (< min-size max-size) err-invalid-content)
        (var-set min-content-size min-size)
        (var-set max-content-size max-size)
        (ok true)
    )
)
