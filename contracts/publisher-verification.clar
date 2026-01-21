;; publisher-verification.clar
;; Multi-tier publisher verification system with domain proof and staking

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u6000))
(define-constant ERR_PUBLISHER_EXISTS (err u6001))
(define-constant ERR_PUBLISHER_NOT_FOUND (err u6002))
(define-constant ERR_INVALID_TIER (err u6003))
(define-constant ERR_INSUFFICIENT_STAKE (err u6004))
(define-constant ERR_DOMAIN_NOT_VERIFIED (err u6005))
(define-constant ERR_TRAFFIC_REQUIREMENT_NOT_MET (err u6006))
(define-constant ERR_ALREADY_VERIFIED (err u6007))

;; Verification tiers
(define-constant TIER_UNVERIFIED u0)
(define-constant TIER_BASIC u1)
(define-constant TIER_VERIFIED u2)
(define-constant TIER_PREMIUM u3)

;; Stake requirements (in microSTX)
(define-constant BASIC_STAKE u1000000000) ;; 1,000 STX
(define-constant VERIFIED_STAKE u5000000000) ;; 5,000 STX
(define-constant PREMIUM_STAKE u10000000000) ;; 10,000 STX

;; Traffic requirements (monthly views)
(define-constant BASIC_TRAFFIC_REQUIREMENT u10000)
(define-constant VERIFIED_TRAFFIC_REQUIREMENT u100000)
(define-constant PREMIUM_TRAFFIC_REQUIREMENT u1000000)

;; Data variables
(define-data-var publisher-nonce uint u0)

;; Publisher data
(define-map publishers
  { publisher-id: uint }
  {
    owner: principal,
    domain: (string-ascii 128),
    tier: uint,
    stake-amount: uint,
    domain-verified: bool,
    traffic-verified: bool,
    monthly-traffic: uint,
    verification-date: uint,
    registered-at: uint,
    active: bool
  }
)

;; Publisher by address
(define-map publisher-by-address
  { owner: principal }
  { publisher-id: uint }
)

;; Domain verification challenges
(define-map domain-challenges
  { publisher-id: uint }
  {
    challenge-code: (string-ascii 64),
    verification-method: (string-ascii 32),
    created-at: uint,
    verified: bool
  }
)

;; Traffic verification data
(define-map traffic-records
  { publisher-id: uint, month: uint }
  {
    views: uint,
    unique-visitors: uint,
    verified-by: principal,
    verified-at: uint
  }
)

;; Staking records
(define-map stakes
  { publisher-id: uint }
  {
    amount: uint,
    staked-at: uint,
    unlock-height: uint
  }
)

;; Tier upgrade requests
(define-map tier-upgrade-requests
  { publisher-id: uint, request-id: uint }
  {
    from-tier: uint,
    to-tier: uint,
    requested-at: uint,
    approved: bool,
    approved-by: (optional principal),
    approved-at: (optional uint)
  }
)

;; Authorization
(define-read-only (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; Register new publisher
(define-public (register-publisher (domain (string-ascii 128)))
  (let
    (
      (publisher-id (+ (var-get publisher-nonce) u1))
      (existing (map-get? publisher-by-address { owner: tx-sender }))
    )
    (asserts! (is-none existing) ERR_PUBLISHER_EXISTS)

    ;; Create publisher record
    (map-set publishers
      { publisher-id: publisher-id }
      {
        owner: tx-sender,
        domain: domain,
        tier: TIER_UNVERIFIED,
        stake-amount: u0,
        domain-verified: false,
        traffic-verified: false,
        monthly-traffic: u0,
        verification-date: u0,
        registered-at: stacks-block-time,
        active: true
      }
    )

    ;; Link address to publisher ID
    (map-set publisher-by-address
      { owner: tx-sender }
      { publisher-id: publisher-id }
    )

    (var-set publisher-nonce publisher-id)
    (ok publisher-id)
  )
)

;; Generate domain verification challenge
(define-public (create-domain-challenge
  (publisher-id uint)
  (verification-method (string-ascii 32))
)
  (let
    (
      (publisher (unwrap! (map-get? publishers { publisher-id: publisher-id }) ERR_PUBLISHER_NOT_FOUND))
      (challenge-code (generate-challenge-code))
    )
    (asserts! (is-eq (get owner publisher) tx-sender) ERR_UNAUTHORIZED)

    (map-set domain-challenges
      { publisher-id: publisher-id }
      {
        challenge-code: challenge-code,
        verification-method: verification-method,
        created-at: stacks-block-time,
        verified: false
      }
    )

    (ok challenge-code)
  )
)

;; Verify domain ownership
(define-public (verify-domain (publisher-id uint) (proof (string-ascii 256)))
  (let
    (
      (publisher (unwrap! (map-get? publishers { publisher-id: publisher-id }) ERR_PUBLISHER_NOT_FOUND))
      (challenge (unwrap! (map-get? domain-challenges { publisher-id: publisher-id }) ERR_DOMAIN_NOT_VERIFIED))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (not (get verified challenge)) ERR_ALREADY_VERIFIED)

    ;; Update domain challenge
    (map-set domain-challenges
      { publisher-id: publisher-id }
      (merge challenge { verified: true })
    )

    ;; Update publisher
    (map-set publishers
      { publisher-id: publisher-id }
      (merge publisher { domain-verified: true })
    )

    (ok true)
  )
)

;; Stake tokens for tier upgrade
(define-public (stake-for-tier (publisher-id uint) (target-tier uint) (amount uint))
  (let
    (
      (publisher (unwrap! (map-get? publishers { publisher-id: publisher-id }) ERR_PUBLISHER_NOT_FOUND))
      (required-stake (get-stake-requirement target-tier))
    )
    (asserts! (is-eq (get owner publisher) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (<= target-tier TIER_PREMIUM) ERR_INVALID_TIER)
    (asserts! (>= amount required-stake) ERR_INSUFFICIENT_STAKE)

    ;; Transfer stake
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    ;; Record stake
    (map-set stakes
      { publisher-id: publisher-id }
      {
        amount: amount,
        staked-at: stacks-block-time,
        unlock-height: (+ stacks-block-height u4320) ;; ~30 days
      }
    )

    ;; Update publisher
    (map-set publishers
      { publisher-id: publisher-id }
      (merge publisher { stake-amount: amount })
    )

    (ok true)
  )
)

;; Submit traffic verification data
(define-public (submit-traffic-data
  (publisher-id uint)
  (month uint)
  (views uint)
  (unique-visitors uint)
)
  (let
    (
      (publisher (unwrap! (map-get? publishers { publisher-id: publisher-id }) ERR_PUBLISHER_NOT_FOUND))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    ;; Record traffic data
    (map-set traffic-records
      { publisher-id: publisher-id, month: month }
      {
        views: views,
        unique-visitors: unique-visitors,
        verified-by: tx-sender,
        verified-at: stacks-block-time
      }
    )

    ;; Update publisher traffic
    (map-set publishers
      { publisher-id: publisher-id }
      (merge publisher {
        monthly-traffic: views,
        traffic-verified: true
      })
    )

    (ok true)
  )
)

;; Request tier upgrade
(define-public (request-tier-upgrade (publisher-id uint) (target-tier uint))
  (let
    (
      (publisher (unwrap! (map-get? publishers { publisher-id: publisher-id }) ERR_PUBLISHER_NOT_FOUND))
      (current-tier (get tier publisher))
      (request-id (+ current-tier u1))
    )
    (asserts! (is-eq (get owner publisher) tx-sender) ERR_UNAUTHORIZED)
    (asserts! (> target-tier current-tier) ERR_INVALID_TIER)
    (asserts! (get domain-verified publisher) ERR_DOMAIN_NOT_VERIFIED)
    (asserts! (>= (get stake-amount publisher) (get-stake-requirement target-tier)) ERR_INSUFFICIENT_STAKE)
    (asserts! (>= (get monthly-traffic publisher) (get-traffic-requirement target-tier)) ERR_TRAFFIC_REQUIREMENT_NOT_MET)

    ;; Create upgrade request
    (map-set tier-upgrade-requests
      { publisher-id: publisher-id, request-id: request-id }
      {
        from-tier: current-tier,
        to-tier: target-tier,
        requested-at: stacks-block-time,
        approved: false,
        approved-by: none,
        approved-at: none
      }
    )

    (ok request-id)
  )
)

;; Approve tier upgrade
(define-public (approve-tier-upgrade (publisher-id uint) (request-id uint))
  (let
    (
      (publisher (unwrap! (map-get? publishers { publisher-id: publisher-id }) ERR_PUBLISHER_NOT_FOUND))
      (request (unwrap! (map-get? tier-upgrade-requests { publisher-id: publisher-id, request-id: request-id }) ERR_PUBLISHER_NOT_FOUND))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)
    (asserts! (not (get approved request)) ERR_ALREADY_VERIFIED)

    ;; Approve request
    (map-set tier-upgrade-requests
      { publisher-id: publisher-id, request-id: request-id }
      (merge request {
        approved: true,
        approved-by: (some tx-sender),
        approved-at: (some stacks-block-time)
      })
    )

    ;; Update publisher tier
    (map-set publishers
      { publisher-id: publisher-id }
      (merge publisher {
        tier: (get to-tier request),
        verification-date: stacks-block-time
      })
    )

    (ok true)
  )
)

;; Helper: Generate challenge code
(define-private (generate-challenge-code)
  (concat "verify-" (uint-to-ascii stacks-block-time))
)

;; Helper: Convert uint to ascii
(define-private (uint-to-ascii (value uint))
  (if (<= value u9)
    (unwrap-panic (element-at "0123456789" value))
    "0"
  )
)

;; Helper: Get stake requirement
(define-private (get-stake-requirement (tier uint))
  (if (is-eq tier TIER_BASIC)
    BASIC_STAKE
    (if (is-eq tier TIER_VERIFIED)
      VERIFIED_STAKE
      (if (is-eq tier TIER_PREMIUM)
        PREMIUM_STAKE
        u0
      )
    )
  )
)

;; Helper: Get traffic requirement
(define-private (get-traffic-requirement (tier uint))
  (if (is-eq tier TIER_BASIC)
    BASIC_TRAFFIC_REQUIREMENT
    (if (is-eq tier TIER_VERIFIED)
      VERIFIED_TRAFFIC_REQUIREMENT
      (if (is-eq tier TIER_PREMIUM)
        PREMIUM_TRAFFIC_REQUIREMENT
        u0
      )
    )
  )
)

;; Read-only functions
(define-read-only (get-publisher (publisher-id uint))
  (map-get? publishers { publisher-id: publisher-id })
)

(define-read-only (get-publisher-by-address (owner principal))
  (map-get? publisher-by-address { owner: owner })
)

(define-read-only (get-domain-challenge (publisher-id uint))
  (map-get? domain-challenges { publisher-id: publisher-id })
)

(define-read-only (get-traffic-record (publisher-id uint) (month uint))
  (map-get? traffic-records { publisher-id: publisher-id, month: month })
)

(define-read-only (get-stake (publisher-id uint))
  (map-get? stakes { publisher-id: publisher-id })
)

(define-read-only (get-tier-name (tier uint))
  (if (is-eq tier TIER_BASIC)
    "Basic"
    (if (is-eq tier TIER_VERIFIED)
      "Verified"
      (if (is-eq tier TIER_PREMIUM)
        "Premium"
        "Unverified"
      )
    )
  )
)
