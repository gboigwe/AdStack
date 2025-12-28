;; title: auction-system
;; version: 1.0.0
;; summary: Real-time bidding for premium placements
;; description: Ad slot auctions, bidding system, instant buyout, and automated winner selection

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-auction-ended (err u102))
(define-constant err-auction-active (err u103))
(define-constant err-bid-too-low (err u104))
(define-constant err-not-winner (err u105))
(define-constant err-already-claimed (err u106))

;; Auction status
(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-ENDED u2)
(define-constant STATUS-CLAIMED u3)
(define-constant STATUS-CANCELLED u4)

;; data vars
(define-data-var auction-nonce uint u0)
(define-data-var min-bid-increment uint u10000) ;; 0.01 STX
(define-data-var platform-auction-fee uint u2) ;; 2%

;; data maps
(define-map auctions
    { auction-id: uint }
    {
        slot-id: uint,
        publisher: principal,
        start-time: uint,
        end-time: uint,
        reserve-price: uint,
        buyout-price: uint,
        current-high-bid: uint,
        high-bidder: (optional principal),
        status: uint,
        total-bids: uint
    }
)

(define-map bids
    { auction-id: uint, bid-id: uint }
    {
        bidder: principal,
        amount: uint,
        timestamp: uint,
        auto-bid-limit: (optional uint)
    }
)

(define-map bid-count
    { auction-id: uint }
    {
        total: uint
    }
)

(define-map slot-inventory
    { slot-id: uint }
    {
        publisher: principal,
        ad-format: (string-ascii 30),
        estimated-impressions: uint,
        reserve-price: uint,
        available: bool
    }
)

(define-map auction-results
    { auction-id: uint }
    {
        winner: principal,
        final-price: uint,
        second-price: uint,
        settled-at: uint,
        claimed: bool
    }
)

(define-map bidder-stats
    { bidder: principal }
    {
        total-bids: uint,
        won-auctions: uint,
        total-spent: uint
    }
)

;; private functions
(define-private (calculate-auction-fee (amount uint))
    (/ (* amount (var-get platform-auction-fee)) u100)
)

;; read only functions
(define-read-only (get-auction (auction-id uint))
    (map-get? auctions { auction-id: auction-id })
)

(define-read-only (get-bid (auction-id uint) (bid-id uint))
    (map-get? bids { auction-id: auction-id, bid-id: bid-id })
)

(define-read-only (get-bid-count (auction-id uint))
    (default-to { total: u0 } (map-get? bid-count { auction-id: auction-id }))
)

(define-read-only (get-slot-inventory (slot-id uint))
    (map-get? slot-inventory { slot-id: slot-id })
)

(define-read-only (get-auction-result (auction-id uint))
    (map-get? auction-results { auction-id: auction-id })
)

(define-read-only (get-bidder-stats (bidder principal))
    (map-get? bidder-stats { bidder: bidder })
)

(define-read-only (is-auction-ended (auction-id uint))
    (match (map-get? auctions { auction-id: auction-id })
        auction (>= stacks-block-time (get end-time auction))
        false
    )
)

;; public functions
(define-public (create-ad-slot-auction
    (slot-id uint)
    (duration uint)
    (reserve-price uint)
    (buyout-price uint)
)
    (let
        (
            (auction-id (+ (var-get auction-nonce) u1))
            (slot (unwrap! (map-get? slot-inventory { slot-id: slot-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get publisher slot)) err-owner-only)
        (asserts! (get available slot) err-auction-active)

        (map-set auctions
            { auction-id: auction-id }
            {
                slot-id: slot-id,
                publisher: tx-sender,
                start-time: stacks-block-time,
                end-time: (+ stacks-block-time duration),
                reserve-price: reserve-price,
                buyout-price: buyout-price,
                current-high-bid: u0,
                high-bidder: none,
                status: STATUS-ACTIVE,
                total-bids: u0
            }
        )

        (map-set bid-count { auction-id: auction-id } { total: u0 })
        (map-set slot-inventory
            { slot-id: slot-id }
            (merge slot { available: false })
        )

        (var-set auction-nonce auction-id)
        (ok auction-id)
    )
)

(define-public (place-bid
    (auction-id uint)
    (bid-amount uint)
)
    (let
        (
            (auction (unwrap! (map-get? auctions { auction-id: auction-id }) err-not-found))
            (count-data (get-bid-count auction-id))
            (bid-id (+ (get total count-data) u1))
            (min-bid (+ (get current-high-bid auction) (var-get min-bid-increment)))
        )
        (asserts! (is-eq (get status auction) STATUS-ACTIVE) err-auction-ended)
        (asserts! (< stacks-block-time (get end-time auction)) err-auction-ended)
        (asserts! (>= bid-amount min-bid) err-bid-too-low)
        (asserts! (>= bid-amount (get reserve-price auction)) err-bid-too-low)

        ;; In production, escrow bid amount
        ;; (try! (stx-transfer? bid-amount tx-sender (as-contract tx-sender)))

        (map-set bids
            { auction-id: auction-id, bid-id: bid-id }
            {
                bidder: tx-sender,
                amount: bid-amount,
                timestamp: stacks-block-time,
                auto-bid-limit: none
            }
        )

        (map-set auctions
            { auction-id: auction-id }
            (merge auction {
                current-high-bid: bid-amount,
                high-bidder: (some tx-sender),
                total-bids: (+ (get total-bids auction) u1)
            })
        )

        (map-set bid-count { auction-id: auction-id } { total: bid-id })

        (let
            (
                (bidder-data (default-to
                    { total-bids: u0, won-auctions: u0, total-spent: u0 }
                    (map-get? bidder-stats { bidder: tx-sender })
                ))
            )
            (map-set bidder-stats
                { bidder: tx-sender }
                (merge bidder-data {
                    total-bids: (+ (get total-bids bidder-data) u1)
                })
            )
        )

        (ok bid-id)
    )
)

(define-public (instant-buyout (auction-id uint))
    (let
        (
            (auction (unwrap! (map-get? auctions { auction-id: auction-id }) err-not-found))
        )
        (asserts! (is-eq (get status auction) STATUS-ACTIVE) err-auction-ended)

        ;; In production, transfer buyout price
        ;; (try! (stx-transfer? (get buyout-price auction) tx-sender (get publisher auction)))

        (map-set auctions
            { auction-id: auction-id }
            (merge auction {
                current-high-bid: (get buyout-price auction),
                high-bidder: (some tx-sender),
                status: STATUS-ENDED
            })
        )

        (map-set auction-results
            { auction-id: auction-id }
            {
                winner: tx-sender,
                final-price: (get buyout-price auction),
                second-price: (get current-high-bid auction),
                settled-at: stacks-block-time,
                claimed: false
            }
        )

        (ok true)
    )
)

(define-public (execute-auction (auction-id uint))
    (let
        (
            (auction (unwrap! (map-get? auctions { auction-id: auction-id }) err-not-found))
            (winner (unwrap! (get high-bidder auction) err-not-found))
            (count-data (get-bid-count auction-id))
            (second-highest-bid (if (> (get total count-data) u1)
                (get-second-highest-bid auction-id (get current-high-bid auction))
                (get reserve-price auction)
            ))
            (final-price (if (< second-highest-bid (get current-high-bid auction))
                (+ second-highest-bid (var-get min-bid-increment))
                (get current-high-bid auction)
            ))
        )
        (asserts! (is-eq (get status auction) STATUS-ACTIVE) err-auction-ended)
        (asserts! (>= stacks-block-time (get end-time auction)) err-auction-active)

        (map-set auctions
            { auction-id: auction-id }
            (merge auction { status: STATUS-ENDED })
        )

        (map-set auction-results
            { auction-id: auction-id }
            {
                winner: winner,
                final-price: final-price,
                second-price: second-highest-bid,
                settled-at: stacks-block-time,
                claimed: false
            }
        )

        (let
            (
                (bidder-data (unwrap! (map-get? bidder-stats { bidder: winner }) err-not-found))
            )
            (map-set bidder-stats
                { bidder: winner }
                (merge bidder-data {
                    won-auctions: (+ (get won-auctions bidder-data) u1),
                    total-spent: (+ (get total-spent bidder-data) final-price)
                })
            )
        )

        (ok final-price)
    )
)

(define-public (claim-auction-slot (auction-id uint))
    (let
        (
            (result (unwrap! (map-get? auction-results { auction-id: auction-id }) err-not-found))
            (auction (unwrap! (map-get? auctions { auction-id: auction-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get winner result)) err-not-winner)
        (asserts! (not (get claimed result)) err-already-claimed)

        (map-set auction-results
            { auction-id: auction-id }
            (merge result { claimed: true })
        )

        (map-set auctions
            { auction-id: auction-id }
            (merge auction { status: STATUS-CLAIMED })
        )

        (ok true)
    )
)

(define-public (register-ad-slot
    (slot-id uint)
    (ad-format (string-ascii 30))
    (estimated-impressions uint)
    (reserve-price uint)
)
    (begin
        (map-set slot-inventory
            { slot-id: slot-id }
            {
                publisher: tx-sender,
                ad-format: ad-format,
                estimated-impressions: estimated-impressions,
                reserve-price: reserve-price,
                available: true
            }
        )
        (ok true)
    )
)

;; Helper function to get second highest bid (simplified)
(define-private (get-second-highest-bid (auction-id uint) (highest uint))
    u0 ;; Simplified - would iterate through bids
)

;; Admin functions
(define-public (set-min-bid-increment (new-increment uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set min-bid-increment new-increment)
        (ok true)
    )
)

(define-public (cancel-auction (auction-id uint))
    (let
        (
            (auction (unwrap! (map-get? auctions { auction-id: auction-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get publisher auction)) err-owner-only)
        (asserts! (is-eq (get status auction) STATUS-ACTIVE) err-auction-ended)

        (map-set auctions
            { auction-id: auction-id }
            (merge auction { status: STATUS-CANCELLED })
        )

        (ok true)
    )
)
