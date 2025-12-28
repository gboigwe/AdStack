;; title: oracle-integration
;; version: 1.0.0
;; summary: Connect off-chain data to smart contracts
;; description: Oracle registration, data feed requests, price feeds, and reputation tracking

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-oracle-inactive (err u103))
(define-constant err-insufficient-stake (err u104))
(define-constant err-invalid-signature (err u105))
(define-constant err-request-expired (err u106))

;; data vars
(define-data-var request-nonce uint u0)
(define-data-var min-oracle-stake uint u1000000000) ;; 1000 STX
(define-data-var response-window uint u144) ;; ~1 day
(define-data-var min-consensus-oracles uint u3)

;; data maps
(define-map registered-oracles
    { oracle: principal }
    {
        stake: uint,
        reputation: uint,
        total-responses: uint,
        correct-responses: uint,
        active: bool,
        registered-at: uint
    }
)

(define-map data-requests
    { request-id: uint }
    {
        requester: principal,
        query: (string-utf8 200),
        callback-contract: (optional principal),
        status: uint,
        created-at: uint,
        expires-at: uint
    }
)

(define-map oracle-responses
    { request-id: uint, oracle: principal }
    {
        data: (buff 256),
        timestamp: uint,
        signature: (buff 65)
    }
)

(define-map response-count
    { request-id: uint }
    {
        total: uint
    }
)

(define-map price-feeds
    { asset-pair: (string-ascii 20) }
    {
        price: uint,
        decimals: uint,
        last-updated: uint,
        oracle: principal
    }
)

(define-map consensus-results
    { request-id: uint }
    {
        result-data: (buff 256),
        oracle-count: uint,
        finalized-at: uint
    }
)

;; read only functions
(define-read-only (get-oracle (oracle principal))
    (map-get? registered-oracles { oracle: oracle })
)

(define-read-only (get-data-request (request-id uint))
    (map-get? data-requests { request-id: request-id })
)

(define-read-only (get-oracle-response (request-id uint) (oracle principal))
    (map-get? oracle-responses { request-id: request-id, oracle: oracle })
)

(define-read-only (get-response-count (request-id uint))
    (default-to { total: u0 } (map-get? response-count { request-id: request-id }))
)

(define-read-only (get-price-feed (asset-pair (string-ascii 20)))
    (map-get? price-feeds { asset-pair: asset-pair })
)

(define-read-only (get-consensus-result (request-id uint))
    (map-get? consensus-results { request-id: request-id })
)

(define-read-only (is-oracle-active (oracle principal))
    (match (map-get? registered-oracles { oracle: oracle })
        oracle-data (get active oracle-data)
        false
    )
)

;; public functions
(define-public (register-oracle (stake-amount uint))
    (begin
        (asserts! (>= stake-amount (var-get min-oracle-stake)) err-insufficient-stake)

        ;; In production, transfer stake
        ;; (try! (stx-transfer? stake-amount tx-sender (as-contract tx-sender)))

        (map-set registered-oracles
            { oracle: tx-sender }
            {
                stake: stake-amount,
                reputation: u100,
                total-responses: u0,
                correct-responses: u0,
                active: true,
                registered-at: stacks-block-time
            }
        )

        (ok true)
    )
)

(define-public (deactivate-oracle)
    (let
        (
            (oracle-data (unwrap! (map-get? registered-oracles { oracle: tx-sender }) err-not-found))
        )
        (map-set registered-oracles
            { oracle: tx-sender }
            (merge oracle-data { active: false })
        )

        ;; In production, return stake
        ;; (try! (as-contract (stx-transfer? (get stake oracle-data) tx-sender tx-sender)))

        (ok true)
    )
)

(define-public (request-data-feed
    (query (string-utf8 200))
    (callback-contract (optional principal))
)
    (let
        (
            (request-id (+ (var-get request-nonce) u1))
            (expires-at (+ stacks-block-time (var-get response-window)))
        )
        (map-set data-requests
            { request-id: request-id }
            {
                requester: tx-sender,
                query: query,
                callback-contract: callback-contract,
                status: u1, ;; Active
                created-at: stacks-block-time,
                expires-at: expires-at
            }
        )

        (map-set response-count { request-id: request-id } { total: u0 })
        (var-set request-nonce request-id)
        (ok request-id)
    )
)

(define-public (submit-oracle-data
    (request-id uint)
    (data (buff 256))
    (signature (buff 65))
)
    (let
        (
            (request (unwrap! (map-get? data-requests { request-id: request-id }) err-not-found))
            (oracle-data (unwrap! (map-get? registered-oracles { oracle: tx-sender }) err-not-found))
            (count-data (get-response-count request-id))
        )
        (asserts! (get active oracle-data) err-oracle-inactive)
        (asserts! (< stacks-block-time (get expires-at request)) err-request-expired)

        (map-set oracle-responses
            { request-id: request-id, oracle: tx-sender }
            {
                data: data,
                timestamp: stacks-block-time,
                signature: signature
            }
        )

        (map-set response-count
            { request-id: request-id }
            { total: (+ (get total count-data) u1) }
        )

        (map-set registered-oracles
            { oracle: tx-sender }
            (merge oracle-data {
                total-responses: (+ (get total-responses oracle-data) u1)
            })
        )

        (ok true)
    )
)

(define-public (update-price-feed
    (asset-pair (string-ascii 20))
    (price uint)
    (decimals uint)
)
    (let
        (
            (oracle-data (unwrap! (map-get? registered-oracles { oracle: tx-sender }) err-not-found))
        )
        (asserts! (get active oracle-data) err-oracle-inactive)

        (map-set price-feeds
            { asset-pair: asset-pair }
            {
                price: price,
                decimals: decimals,
                last-updated: stacks-block-time,
                oracle: tx-sender
            }
        )

        (ok true)
    )
)

(define-public (finalize-consensus (request-id uint) (result-data (buff 256)))
    (let
        (
            (request (unwrap! (map-get? data-requests { request-id: request-id }) err-not-found))
            (count-data (get-response-count request-id))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (>= (get total count-data) (var-get min-consensus-oracles)) err-unauthorized)

        (map-set consensus-results
            { request-id: request-id }
            {
                result-data: result-data,
                oracle-count: (get total count-data),
                finalized-at: stacks-block-time
            }
        )

        (ok true)
    )
)

(define-public (update-oracle-reputation (oracle principal) (correct bool))
    (let
        (
            (oracle-data (unwrap! (map-get? registered-oracles { oracle: oracle }) err-not-found))
            (new-correct (if correct (+ (get correct-responses oracle-data) u1) (get correct-responses oracle-data)))
            (new-reputation (if (> (get total-responses oracle-data) u0)
                (/ (* new-correct u100) (get total-responses oracle-data))
                u100
            ))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set registered-oracles
            { oracle: oracle }
            (merge oracle-data {
                correct-responses: new-correct,
                reputation: new-reputation
            })
        )

        (ok new-reputation)
    )
)

;; Admin functions
(define-public (set-min-oracle-stake (new-stake uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set min-oracle-stake new-stake)
        (ok true)
    )
)

(define-public (set-response-window (new-window uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set response-window new-window)
        (ok true)
    )
)

(define-public (set-min-consensus (new-min uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set min-consensus-oracles new-min)
        (ok true)
    )
)
