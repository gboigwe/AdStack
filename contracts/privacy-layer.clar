;; title: privacy-layer
;; version: 1.0.0
;; summary: User data encryption, consent management, and GDPR compliance
;; description: Manages user consent for data usage, enforces data minimization
;;   principles, tracks consent history for auditability, and provides
;;   GDPR-compliant data handling with right-to-erasure support.

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u300))
(define-constant err-not-found (err u301))
(define-constant err-unauthorized (err u302))
(define-constant err-invalid-input (err u303))
(define-constant err-already-exists (err u304))
(define-constant err-consent-required (err u305))
(define-constant err-consent-expired (err u306))
(define-constant err-data-locked (err u307))
(define-constant err-erasure-pending (err u308))
(define-constant err-invalid-purpose (err u309))
(define-constant err-processor-not-approved (err u310))

;; Consent purposes
(define-constant PURPOSE-TARGETING u1)
(define-constant PURPOSE-ANALYTICS u2)
(define-constant PURPOSE-PERSONALIZATION u3)
(define-constant PURPOSE-MARKETING u4)
(define-constant PURPOSE-MEASUREMENT u5)

;; Consent status
(define-constant CONSENT-GRANTED u1)
(define-constant CONSENT-DENIED u2)
(define-constant CONSENT-WITHDRAWN u3)

;; Data processing legal basis
(define-constant BASIS-CONSENT u1)
(define-constant BASIS-CONTRACT u2)
(define-constant BASIS-LEGITIMATE-INTEREST u3)

;; Erasure request status
(define-constant ERASURE-PENDING u1)
(define-constant ERASURE-PROCESSING u2)
(define-constant ERASURE-COMPLETED u3)
(define-constant ERASURE-DENIED u4)

;; data vars
(define-data-var consent-record-counter uint u0)
(define-data-var erasure-request-counter uint u0)
(define-data-var consent-validity-blocks uint u52560)
(define-data-var erasure-processing-deadline uint u4320)
(define-data-var total-consent-grants uint u0)
(define-data-var total-consent-withdrawals uint u0)
(define-data-var total-erasure-requests uint u0)

;; data maps
(define-map user-consents
    { user: principal, purpose: uint }
    {
        status: uint,
        legal-basis: uint,
        granted-at: uint,
        expires-at: uint,
        version: uint,
        ip-hash: (buff 32),
        last-updated: uint
    }
)

(define-map consent-history
    { record-id: uint }
    {
        user: principal,
        purpose: uint,
        action: uint,
        previous-status: uint,
        new-status: uint,
        timestamp: uint,
        block-height: uint
    }
)

(define-map user-data-inventory
    { user: principal }
    {
        data-categories: (list 10 (string-ascii 30)),
        processors: (list 5 principal),
        last-access: uint,
        access-count: uint,
        is-locked: bool,
        erasure-requested: bool
    }
)

(define-map data-processor-registry
    { processor: principal }
    {
        name: (string-utf8 100),
        purposes: (list 5 uint),
        approved: bool,
        data-categories: (list 10 (string-ascii 30)),
        registered-at: uint,
        last-audit: uint
    }
)

(define-map erasure-requests
    { request-id: uint }
    {
        user: principal,
        status: uint,
        requested-at: uint,
        deadline: uint,
        completed-at: uint,
        categories-erased: (list 10 (string-ascii 30)),
        processor: principal
    }
)

(define-map data-access-log
    { user: principal, accessor: principal, access-block: uint }
    {
        purpose: uint,
        categories-accessed: (list 5 (string-ascii 30)),
        timestamp: uint
    }
)

(define-map privacy-policy-versions
    { version: uint }
    {
        hash: (buff 32),
        effective-at: uint,
        description: (string-utf8 200),
        published-by: principal
    }
)

(define-map user-data-portability
    { user: principal }
    {
        export-hash: (buff 32),
        exported-at: uint,
        categories-exported: (list 10 (string-ascii 30)),
        format: (string-ascii 10)
    }
)

;; private functions
(define-private (is-valid-purpose (purpose uint))
    (or (is-eq purpose PURPOSE-TARGETING)
        (or (is-eq purpose PURPOSE-ANALYTICS)
            (or (is-eq purpose PURPOSE-PERSONALIZATION)
                (or (is-eq purpose PURPOSE-MARKETING)
                    (is-eq purpose PURPOSE-MEASUREMENT)
                )
            )
        )
    )
)

(define-private (is-valid-legal-basis (basis uint))
    (or (is-eq basis BASIS-CONSENT)
        (or (is-eq basis BASIS-CONTRACT)
            (is-eq basis BASIS-LEGITIMATE-INTEREST)
        )
    )
)

(define-private (record-consent-change
    (user principal)
    (purpose uint)
    (prev-status uint)
    (new-status uint)
)
    (let
        (
            (record-id (+ (var-get consent-record-counter) u1))
        )
        (map-set consent-history
            { record-id: record-id }
            {
                user: user,
                purpose: purpose,
                action: new-status,
                previous-status: prev-status,
                new-status: new-status,
                timestamp: stacks-block-time,
                block-height: stacks-block-height
            }
        )
        (var-set consent-record-counter record-id)
        record-id
    )
)

;; read only functions
(define-read-only (get-user-consent (user principal) (purpose uint))
    (map-get? user-consents { user: user, purpose: purpose })
)

(define-read-only (has-valid-consent (user principal) (purpose uint))
    (match (map-get? user-consents { user: user, purpose: purpose })
        consent (and
            (is-eq (get status consent) CONSENT-GRANTED)
            (or (is-eq (get expires-at consent) u0)
                (> (get expires-at consent) stacks-block-height))
        )
        false
    )
)

(define-read-only (get-consent-history-record (record-id uint))
    (map-get? consent-history { record-id: record-id })
)

(define-read-only (get-user-data-inventory (user principal))
    (map-get? user-data-inventory { user: user })
)

(define-read-only (get-data-processor (processor principal))
    (map-get? data-processor-registry { processor: processor })
)

(define-read-only (get-erasure-request (request-id uint))
    (map-get? erasure-requests { request-id: request-id })
)

(define-read-only (get-privacy-policy (version uint))
    (map-get? privacy-policy-versions { version: version })
)

(define-read-only (get-data-portability (user principal))
    (map-get? user-data-portability { user: user })
)

(define-read-only (get-consent-stats)
    (ok {
        total-grants: (var-get total-consent-grants),
        total-withdrawals: (var-get total-consent-withdrawals),
        total-erasure-requests: (var-get total-erasure-requests)
    })
)

(define-read-only (is-processor-approved (processor principal))
    (match (map-get? data-processor-registry { processor: processor })
        reg (get approved reg)
        false
    )
)

;; public functions
(define-public (grant-consent
    (purpose uint)
    (legal-basis uint)
    (ip-hash (buff 32))
    (policy-version uint)
)
    (let
        (
            (existing (map-get? user-consents { user: tx-sender, purpose: purpose }))
            (prev-status (match existing
                e (get status e)
                u0
            ))
        )
        (asserts! (is-valid-purpose purpose) err-invalid-purpose)
        (asserts! (is-valid-legal-basis legal-basis) err-invalid-input)

        (map-set user-consents
            { user: tx-sender, purpose: purpose }
            {
                status: CONSENT-GRANTED,
                legal-basis: legal-basis,
                granted-at: stacks-block-time,
                expires-at: (+ stacks-block-height (var-get consent-validity-blocks)),
                version: policy-version,
                ip-hash: ip-hash,
                last-updated: stacks-block-time
            }
        )

        (record-consent-change tx-sender purpose prev-status CONSENT-GRANTED)
        (var-set total-consent-grants (+ (var-get total-consent-grants) u1))
        (ok true)
    )
)

(define-public (withdraw-consent (purpose uint))
    (let
        (
            (existing (unwrap! (map-get? user-consents { user: tx-sender, purpose: purpose }) err-not-found))
        )
        (asserts! (is-eq (get status existing) CONSENT-GRANTED) err-invalid-input)

        (map-set user-consents
            { user: tx-sender, purpose: purpose }
            (merge existing {
                status: CONSENT-WITHDRAWN,
                last-updated: stacks-block-time
            })
        )

        (record-consent-change tx-sender purpose CONSENT-GRANTED CONSENT-WITHDRAWN)
        (var-set total-consent-withdrawals (+ (var-get total-consent-withdrawals) u1))
        (ok true)
    )
)

(define-public (register-data-processor
    (processor principal)
    (name (string-utf8 100))
    (purposes (list 5 uint))
    (data-categories (list 10 (string-ascii 30)))
)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-none (map-get? data-processor-registry { processor: processor })) err-already-exists)

        (map-set data-processor-registry
            { processor: processor }
            {
                name: name,
                purposes: purposes,
                approved: true,
                data-categories: data-categories,
                registered-at: stacks-block-time,
                last-audit: stacks-block-time
            }
        )
        (ok true)
    )
)

(define-public (revoke-data-processor (processor principal))
    (let
        (
            (reg (unwrap! (map-get? data-processor-registry { processor: processor }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set data-processor-registry
            { processor: processor }
            (merge reg { approved: false })
        )
        (ok true)
    )
)

(define-public (log-data-access
    (user principal)
    (purpose uint)
    (categories (list 5 (string-ascii 30)))
)
    (let
        (
            (inventory (default-to
                {
                    data-categories: (list),
                    processors: (list),
                    last-access: u0,
                    access-count: u0,
                    is-locked: false,
                    erasure-requested: false
                }
                (map-get? user-data-inventory { user: user })
            ))
        )
        (asserts! (has-valid-consent user purpose) err-consent-required)
        (asserts! (not (get is-locked inventory)) err-data-locked)
        (asserts! (not (get erasure-requested inventory)) err-erasure-pending)

        (map-set data-access-log
            { user: user, accessor: tx-sender, access-block: stacks-block-height }
            {
                purpose: purpose,
                categories-accessed: categories,
                timestamp: stacks-block-time
            }
        )

        (map-set user-data-inventory
            { user: user }
            (merge inventory {
                last-access: stacks-block-time,
                access-count: (+ (get access-count inventory) u1)
            })
        )
        (ok true)
    )
)

(define-public (request-data-erasure)
    (let
        (
            (request-id (+ (var-get erasure-request-counter) u1))
            (inventory (default-to
                {
                    data-categories: (list),
                    processors: (list),
                    last-access: u0,
                    access-count: u0,
                    is-locked: false,
                    erasure-requested: false
                }
                (map-get? user-data-inventory { user: tx-sender })
            ))
        )
        (asserts! (not (get erasure-requested inventory)) err-erasure-pending)

        (map-set erasure-requests
            { request-id: request-id }
            {
                user: tx-sender,
                status: ERASURE-PENDING,
                requested-at: stacks-block-time,
                deadline: (+ stacks-block-height (var-get erasure-processing-deadline)),
                completed-at: u0,
                categories-erased: (list),
                processor: tx-sender
            }
        )

        (map-set user-data-inventory
            { user: tx-sender }
            (merge inventory {
                erasure-requested: true,
                is-locked: true
            })
        )

        (var-set erasure-request-counter request-id)
        (var-set total-erasure-requests (+ (var-get total-erasure-requests) u1))
        (ok request-id)
    )
)

(define-public (process-erasure-request
    (request-id uint)
    (categories-erased (list 10 (string-ascii 30)))
)
    (let
        (
            (request (unwrap! (map-get? erasure-requests { request-id: request-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status request) ERASURE-PENDING) err-invalid-input)

        (map-set erasure-requests
            { request-id: request-id }
            (merge request {
                status: ERASURE-COMPLETED,
                completed-at: stacks-block-time,
                categories-erased: categories-erased,
                processor: tx-sender
            })
        )

        (map-set user-data-inventory
            { user: (get user request) }
            {
                data-categories: (list),
                processors: (list),
                last-access: u0,
                access-count: u0,
                is-locked: false,
                erasure-requested: false
            }
        )
        (ok true)
    )
)

(define-public (export-user-data
    (export-hash (buff 32))
    (categories (list 10 (string-ascii 30)))
    (format (string-ascii 10))
)
    (begin
        (map-set user-data-portability
            { user: tx-sender }
            {
                export-hash: export-hash,
                exported-at: stacks-block-time,
                categories-exported: categories,
                format: format
            }
        )
        (ok true)
    )
)

(define-public (publish-privacy-policy
    (version uint)
    (hash (buff 32))
    (description (string-utf8 200))
)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-none (map-get? privacy-policy-versions { version: version })) err-already-exists)

        (map-set privacy-policy-versions
            { version: version }
            {
                hash: hash,
                effective-at: stacks-block-time,
                description: description,
                published-by: tx-sender
            }
        )
        (ok true)
    )
)

(define-public (update-data-inventory
    (data-categories (list 10 (string-ascii 30)))
    (processors (list 5 principal))
)
    (let
        (
            (existing (default-to
                {
                    data-categories: (list),
                    processors: (list),
                    last-access: u0,
                    access-count: u0,
                    is-locked: false,
                    erasure-requested: false
                }
                (map-get? user-data-inventory { user: tx-sender })
            ))
        )
        (asserts! (not (get is-locked existing)) err-data-locked)

        (map-set user-data-inventory
            { user: tx-sender }
            (merge existing {
                data-categories: data-categories,
                processors: processors
            })
        )
        (ok true)
    )
)

;; Admin functions
(define-public (set-consent-validity (new-validity uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set consent-validity-blocks new-validity)
        (ok true)
    )
)

(define-public (set-erasure-deadline (new-deadline uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set erasure-processing-deadline new-deadline)
        (ok true)
    )
)
