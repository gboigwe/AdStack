;; title: publisher-network
;; version: 1.0.0
;; summary: Publisher relationships and network effects
;; description: Publisher tiers, alliances, revenue sharing, and quality certification

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-invalid-tier (err u103))
(define-constant err-alliance-full (err u104))
(define-constant err-not-qualified (err u105))

;; Publisher tiers
(define-constant TIER-BRONZE u1)
(define-constant TIER-SILVER u2)
(define-constant TIER-GOLD u3)
(define-constant TIER-PLATINUM u4)

;; data vars
(define-data-var alliance-nonce uint u0)
(define-data-var max-alliance-members uint u20)
(define-data-var tier-upgrade-threshold uint u1000) ;; Views needed

;; data maps
(define-map publisher-tiers
    { publisher: principal }
    {
        tier: uint,
        total-views: uint,
        total-earnings: uint,
        quality-score: uint,
        tier-since: uint,
        benefits-active: bool
    }
)

(define-map tier-requirements
    { tier: uint }
    {
        min-views: uint,
        min-quality-score: uint,
        fee-discount: uint, ;; Percentage
        exclusive-campaigns: bool
    }
)

(define-map alliances
    { alliance-id: uint }
    {
        name: (string-utf8 100),
        creator: principal,
        total-members: uint,
        total-reach: uint,
        revenue-pool: uint,
        active: bool,
        created-at: uint
    }
)

(define-map alliance-members
    { alliance-id: uint, member: principal }
    {
        joined-at: uint,
        contribution: uint,
        rewards-claimed: uint
    }
)

(define-map quality-certifications
    { publisher: principal }
    {
        certified: bool,
        certifier: principal,
        certification-date: uint,
        expires-at: uint,
        cert-level: uint
    }
)

(define-map network-stats
    { publisher: principal }
    {
        total-referrals: uint,
        network-size: uint,
        network-earnings: uint
    }
)

;; read only functions
(define-read-only (get-publisher-tier (publisher principal))
    (map-get? publisher-tiers { publisher: publisher })
)

(define-read-only (get-tier-requirements (tier uint))
    (map-get? tier-requirements { tier: tier })
)

(define-read-only (get-alliance (alliance-id uint))
    (map-get? alliances { alliance-id: alliance-id })
)

(define-read-only (get-alliance-member (alliance-id uint) (member principal))
    (map-get? alliance-members { alliance-id: alliance-id, member: member })
)

(define-read-only (get-certification (publisher principal))
    (map-get? quality-certifications { publisher: publisher })
)

(define-read-only (get-network-stats (publisher principal))
    (map-get? network-stats { publisher: publisher })
)

(define-read-only (is-qualified-for-tier (publisher principal) (tier uint))
    (let
        (
            (pub-data (unwrap! (map-get? publisher-tiers { publisher: publisher }) false))
            (tier-reqs (unwrap! (map-get? tier-requirements { tier: tier }) false))
        )
        (and
            (>= (get total-views pub-data) (get min-views tier-reqs))
            (>= (get quality-score pub-data) (get min-quality-score tier-reqs))
        )
    )
)

;; public functions
(define-public (register-publisher)
    (begin
        (map-set publisher-tiers
            { publisher: tx-sender }
            {
                tier: TIER-BRONZE,
                total-views: u0,
                total-earnings: u0,
                quality-score: u100,
                tier-since: stacks-block-time,
                benefits-active: true
            }
        )

        (map-set network-stats
            { publisher: tx-sender }
            {
                total-referrals: u0,
                network-size: u0,
                network-earnings: u0
            }
        )

        (ok true)
    )
)

(define-public (upgrade-publisher-tier (new-tier uint))
    (let
        (
            (pub-data (unwrap! (map-get? publisher-tiers { publisher: tx-sender }) err-not-found))
            (tier-reqs (unwrap! (map-get? tier-requirements { tier: new-tier }) err-not-found))
        )
        (asserts! (and (>= new-tier TIER-BRONZE) (<= new-tier TIER-PLATINUM)) err-invalid-tier)
        (asserts! (>= (get total-views pub-data) (get min-views tier-reqs)) err-not-qualified)
        (asserts! (>= (get quality-score pub-data) (get min-quality-score tier-reqs)) err-not-qualified)

        (map-set publisher-tiers
            { publisher: tx-sender }
            (merge pub-data {
                tier: new-tier,
                tier-since: stacks-block-time
            })
        )

        (ok true)
    )
)

(define-public (create-alliance (name (string-utf8 100)))
    (let
        (
            (alliance-id (+ (var-get alliance-nonce) u1))
            (pub-data (unwrap! (map-get? publisher-tiers { publisher: tx-sender }) err-not-found))
        )
        (asserts! (>= (get tier pub-data) TIER-SILVER) err-not-qualified)

        (map-set alliances
            { alliance-id: alliance-id }
            {
                name: name,
                creator: tx-sender,
                total-members: u1,
                total-reach: (get total-views pub-data),
                revenue-pool: u0,
                active: true,
                created-at: stacks-block-time
            }
        )

        (map-set alliance-members
            { alliance-id: alliance-id, member: tx-sender }
            {
                joined-at: stacks-block-time,
                contribution: u0,
                rewards-claimed: u0
            }
        )

        (var-set alliance-nonce alliance-id)
        (ok alliance-id)
    )
)

(define-public (join-alliance (alliance-id uint))
    (let
        (
            (alliance (unwrap! (map-get? alliances { alliance-id: alliance-id }) err-not-found))
            (pub-data (unwrap! (map-get? publisher-tiers { publisher: tx-sender }) err-not-found))
        )
        (asserts! (get active alliance) err-unauthorized)
        (asserts! (< (get total-members alliance) (var-get max-alliance-members)) err-alliance-full)

        (map-set alliance-members
            { alliance-id: alliance-id, member: tx-sender }
            {
                joined-at: stacks-block-time,
                contribution: u0,
                rewards-claimed: u0
            }
        )

        (map-set alliances
            { alliance-id: alliance-id }
            (merge alliance {
                total-members: (+ (get total-members alliance) u1),
                total-reach: (+ (get total-reach alliance) (get total-views pub-data))
            })
        )

        (ok true)
    )
)

(define-public (distribute-alliance-revenue (alliance-id uint) (member principal) (amount uint))
    (let
        (
            (alliance (unwrap! (map-get? alliances { alliance-id: alliance-id }) err-not-found))
            (member-data (unwrap! (map-get? alliance-members { alliance-id: alliance-id, member: member }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get creator alliance)) err-unauthorized)

        ;; In production, transfer revenue
        ;; (try! (as-contract (stx-transfer? amount tx-sender member)))

        (map-set alliance-members
            { alliance-id: alliance-id, member: member }
            (merge member-data {
                rewards-claimed: (+ (get rewards-claimed member-data) amount)
            })
        )

        (ok true)
    )
)

(define-public (certify-publisher
    (publisher principal)
    (cert-level uint)
    (duration uint)
)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set quality-certifications
            { publisher: publisher }
            {
                certified: true,
                certifier: tx-sender,
                certification-date: stacks-block-time,
                expires-at: (+ stacks-block-time duration),
                cert-level: cert-level
            }
        )

        (ok true)
    )
)

(define-public (update-publisher-stats
    (publisher principal)
    (views uint)
    (earnings uint)
    (quality uint)
)
    (let
        (
            (pub-data (unwrap! (map-get? publisher-tiers { publisher: publisher }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set publisher-tiers
            { publisher: publisher }
            (merge pub-data {
                total-views: (+ (get total-views pub-data) views),
                total-earnings: (+ (get total-earnings pub-data) earnings),
                quality-score: quality
            })
        )

        (ok true)
    )
)

(define-public (add-network-referral (referrer principal) (referral-earnings uint))
    (let
        (
            (net-stats (default-to
                { total-referrals: u0, network-size: u0, network-earnings: u0 }
                (map-get? network-stats { publisher: referrer })
            ))
        )
        (map-set network-stats
            { publisher: referrer }
            {
                total-referrals: (+ (get total-referrals net-stats) u1),
                network-size: (+ (get network-size net-stats) u1),
                network-earnings: (+ (get network-earnings net-stats) referral-earnings)
            }
        )

        (ok true)
    )
)

;; Admin functions
(define-public (initialize-tier-requirements)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set tier-requirements { tier: TIER-BRONZE } {
            min-views: u0,
            min-quality-score: u50,
            fee-discount: u0,
            exclusive-campaigns: false
        })

        (map-set tier-requirements { tier: TIER-SILVER } {
            min-views: u1000,
            min-quality-score: u70,
            fee-discount: u5,
            exclusive-campaigns: false
        })

        (map-set tier-requirements { tier: TIER-GOLD } {
            min-views: u5000,
            min-quality-score: u85,
            fee-discount: u10,
            exclusive-campaigns: true
        })

        (map-set tier-requirements { tier: TIER-PLATINUM } {
            min-views: u10000,
            min-quality-score: u95,
            fee-discount: u15,
            exclusive-campaigns: true
        })

        (ok true)
    )
)

(define-public (set-max-alliance-members (new-max uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set max-alliance-members new-max)
        (ok true)
    )
)
