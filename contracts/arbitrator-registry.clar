;; title: arbitrator-registry
;; version: 1.0.0
;; summary: Arbitrator onboarding, reputation tracking, case assignment, and rewards

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u500))
(define-constant err-not-found (err u501))
(define-constant err-unauthorized (err u502))
(define-constant err-already-registered (err u503))
(define-constant err-not-active (err u504))
(define-constant err-insufficient-stake (err u505))
(define-constant err-cooldown-active (err u506))
(define-constant err-max-cases (err u507))
(define-constant err-invalid-tier (err u508))
(define-constant err-invalid-rating (err u509))
(define-constant err-self-assignment (err u510))
(define-constant err-already-assigned (err u511))
(define-constant err-not-assigned (err u512))

(define-constant TIER-JUNIOR u1)
(define-constant TIER-STANDARD u2)
(define-constant TIER-SENIOR u3)
(define-constant TIER-EXPERT u4)

(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-SUSPENDED u2)
(define-constant STATUS-RETIRED u3)
(define-constant STATUS-PROBATION u4)

(define-data-var arbitrator-nonce uint u0)
(define-data-var total-arbitrators uint u0)
(define-data-var total-active uint u0)
(define-data-var min-stake uint u10000000)
(define-data-var max-concurrent-cases uint u5)
(define-data-var case-cooldown-blocks uint u144)
(define-data-var junior-max-amount uint u10000000)
(define-data-var standard-max-amount uint u50000000)
(define-data-var senior-max-amount uint u200000000)
(define-data-var base-reward-rate uint u300)
(define-data-var reputation-decay-rate uint u1)
(define-data-var min-reputation-threshold uint u20)

(define-map arbitrators
    { arbitrator: principal }
    {
        arbitrator-id: uint,
        tier: uint,
        status: uint,
        reputation: uint,
        stake-amount: uint,
        registered-at: uint,
        last-case-at: uint,
        specializations: (list 5 (string-ascii 30)),
        display-name: (string-utf8 100),
        bio: (string-utf8 300)
    }
)

(define-map arbitrator-performance
    { arbitrator: principal }
    {
        total-cases: uint,
        cases-resolved: uint,
        cases-overturned: uint,
        active-cases: uint,
        avg-resolution-time: uint,
        total-rewards-earned: uint,
        total-slashed: uint,
        favorable-ratings: uint,
        unfavorable-ratings: uint
    }
)

(define-map case-assignments
    { case-id: uint }
    {
        arbitrator: principal,
        assigned-at: uint,
        accepted-at: uint,
        deadline: uint,
        reward-amount: uint,
        completed: bool
    }
)

(define-map arbitrator-case-list
    { arbitrator: principal, slot: uint }
    { case-id: uint }
)

(define-map arbitrator-ratings
    { case-id: uint, rater: principal }
    {
        arbitrator: principal,
        rating: uint,
        feedback: (string-utf8 200),
        rated-at: uint
    }
)

(define-map reward-claims
    { arbitrator: principal, case-id: uint }
    {
        amount: uint,
        claimed: bool,
        claimed-at: uint
    }
)

(define-map tier-requirements
    { tier: uint }
    {
        min-cases: uint,
        min-reputation: uint,
        min-stake: uint
    }
)

(define-private (is-valid-tier (tier uint))
    (and (>= tier TIER-JUNIOR) (<= tier TIER-EXPERT))
)

(define-private (calculate-reward (amount-at-stake uint) (tier uint))
    (let
        (
            (base (/ (* amount-at-stake (var-get base-reward-rate)) u10000))
            (tier-multiplier (if (is-eq tier TIER-EXPERT)
                u200
                (if (is-eq tier TIER-SENIOR)
                    u150
                    (if (is-eq tier TIER-STANDARD)
                        u120
                        u100
                    )
                )
            ))
        )
        (/ (* base tier-multiplier) u100)
    )
)

(define-private (can-handle-amount (tier uint) (amount uint))
    (if (is-eq tier TIER-EXPERT)
        true
        (if (is-eq tier TIER-SENIOR)
            (<= amount (var-get senior-max-amount))
            (if (is-eq tier TIER-STANDARD)
                (<= amount (var-get standard-max-amount))
                (<= amount (var-get junior-max-amount))
            )
        )
    )
)

(define-private (find-free-slot (arbitrator principal) (slot uint))
    (if (is-none (map-get? arbitrator-case-list { arbitrator: arbitrator, slot: slot }))
        slot
        (if (< slot (var-get max-concurrent-cases))
            (find-free-slot arbitrator (+ slot u1))
            u0
        )
    )
)

(define-read-only (get-arbitrator (who principal))
    (map-get? arbitrators { arbitrator: who })
)

(define-read-only (get-arbitrator-performance (who principal))
    (map-get? arbitrator-performance { arbitrator: who })
)

(define-read-only (get-case-assignment (case-id uint))
    (map-get? case-assignments { case-id: case-id })
)

(define-read-only (get-arbitrator-rating (case-id uint) (rater principal))
    (map-get? arbitrator-ratings { case-id: case-id, rater: rater })
)

(define-read-only (get-reward-claim (who principal) (case-id uint))
    (map-get? reward-claims { arbitrator: who, case-id: case-id })
)

(define-read-only (get-tier-requirements (tier uint))
    (map-get? tier-requirements { tier: tier })
)

(define-read-only (get-total-arbitrators)
    (var-get total-arbitrators)
)

(define-read-only (get-total-active)
    (var-get total-active)
)

(define-read-only (get-arbitrator-nonce)
    (var-get arbitrator-nonce)
)

(define-read-only (is-arbitrator-available (who principal))
    (match (map-get? arbitrators { arbitrator: who })
        arb (and
            (is-eq (get status arb) STATUS-ACTIVE)
            (match (map-get? arbitrator-performance { arbitrator: who })
                perf (< (get active-cases perf) (var-get max-concurrent-cases))
                true
            )
        )
        false
    )
)

(define-read-only (get-arbitrator-tier (who principal))
    (match (map-get? arbitrators { arbitrator: who })
        arb (get tier arb)
        u0
    )
)

(define-public (register-arbitrator
    (stake uint)
    (specializations (list 5 (string-ascii 30)))
    (display-name (string-utf8 100))
    (bio (string-utf8 300))
)
    (let
        (
            (arb-id (+ (var-get arbitrator-nonce) u1))
        )
        (asserts! (is-none (map-get? arbitrators { arbitrator: tx-sender })) err-already-registered)
        (asserts! (>= stake (var-get min-stake)) err-insufficient-stake)

        (map-set arbitrators
            { arbitrator: tx-sender }
            {
                arbitrator-id: arb-id,
                tier: TIER-JUNIOR,
                status: STATUS-ACTIVE,
                reputation: u50,
                stake-amount: stake,
                registered-at: stacks-block-time,
                last-case-at: u0,
                specializations: specializations,
                display-name: display-name,
                bio: bio
            }
        )

        (map-set arbitrator-performance
            { arbitrator: tx-sender }
            {
                total-cases: u0,
                cases-resolved: u0,
                cases-overturned: u0,
                active-cases: u0,
                avg-resolution-time: u0,
                total-rewards-earned: u0,
                total-slashed: u0,
                favorable-ratings: u0,
                unfavorable-ratings: u0
            }
        )

        (var-set arbitrator-nonce arb-id)
        (var-set total-arbitrators (+ (var-get total-arbitrators) u1))
        (var-set total-active (+ (var-get total-active) u1))
        (ok arb-id)
    )
)

(define-public (update-profile
    (specializations (list 5 (string-ascii 30)))
    (display-name (string-utf8 100))
    (bio (string-utf8 300))
)
    (let
        (
            (arb (unwrap! (map-get? arbitrators { arbitrator: tx-sender }) err-not-found))
        )
        (asserts! (is-eq (get status arb) STATUS-ACTIVE) err-not-active)

        (map-set arbitrators
            { arbitrator: tx-sender }
            (merge arb {
                specializations: specializations,
                display-name: display-name,
                bio: bio
            })
        )

        (ok true)
    )
)

(define-public (assign-case (case-id uint) (arbitrator principal) (amount-at-stake uint) (deadline-blocks uint))
    (let
        (
            (arb (unwrap! (map-get? arbitrators { arbitrator: arbitrator }) err-not-found))
            (perf (unwrap! (map-get? arbitrator-performance { arbitrator: arbitrator }) err-not-found))
            (reward (calculate-reward amount-at-stake (get tier arb)))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status arb) STATUS-ACTIVE) err-not-active)
        (asserts! (< (get active-cases perf) (var-get max-concurrent-cases)) err-max-cases)
        (asserts! (is-none (map-get? case-assignments { case-id: case-id })) err-already-assigned)
        (asserts! (can-handle-amount (get tier arb) amount-at-stake) err-invalid-tier)

        (map-set case-assignments
            { case-id: case-id }
            {
                arbitrator: arbitrator,
                assigned-at: stacks-block-time,
                accepted-at: u0,
                deadline: (+ stacks-block-time deadline-blocks),
                reward-amount: reward,
                completed: false
            }
        )

        (map-set arbitrator-performance
            { arbitrator: arbitrator }
            (merge perf {
                total-cases: (+ (get total-cases perf) u1),
                active-cases: (+ (get active-cases perf) u1)
            })
        )

        (map-set arbitrators
            { arbitrator: arbitrator }
            (merge arb { last-case-at: stacks-block-time })
        )

        (map-set reward-claims
            { arbitrator: arbitrator, case-id: case-id }
            {
                amount: reward,
                claimed: false,
                claimed-at: u0
            }
        )

        (ok reward)
    )
)

(define-public (accept-assignment (case-id uint))
    (let
        (
            (assignment (unwrap! (map-get? case-assignments { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get arbitrator assignment)) err-unauthorized)
        (asserts! (is-eq (get accepted-at assignment) u0) err-already-assigned)

        (map-set case-assignments
            { case-id: case-id }
            (merge assignment { accepted-at: stacks-block-time })
        )

        (ok true)
    )
)

(define-public (complete-case (case-id uint) (resolution-blocks uint))
    (let
        (
            (assignment (unwrap! (map-get? case-assignments { case-id: case-id }) err-not-found))
            (arb (unwrap! (map-get? arbitrators { arbitrator: (get arbitrator assignment) }) err-not-found))
            (perf (unwrap! (map-get? arbitrator-performance { arbitrator: (get arbitrator assignment) }) err-not-found))
            (new-avg (if (is-eq (get cases-resolved perf) u0)
                resolution-blocks
                (/ (+ (* (get avg-resolution-time perf) (get cases-resolved perf)) resolution-blocks)
                   (+ (get cases-resolved perf) u1))
            ))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (not (get completed assignment)) err-already-assigned)

        (map-set case-assignments
            { case-id: case-id }
            (merge assignment { completed: true })
        )

        (map-set arbitrator-performance
            { arbitrator: (get arbitrator assignment) }
            (merge perf {
                cases-resolved: (+ (get cases-resolved perf) u1),
                active-cases: (if (> (get active-cases perf) u0) (- (get active-cases perf) u1) u0),
                avg-resolution-time: new-avg
            })
        )

        (let
            (
                (new-rep (+ (get reputation arb) u2))
            )
            (map-set arbitrators
                { arbitrator: (get arbitrator assignment) }
                (merge arb { reputation: (if (> new-rep u100) u100 new-rep) })
            )
        )

        (ok true)
    )
)

(define-public (rate-arbitrator (case-id uint) (rating uint) (feedback (string-utf8 200)))
    (let
        (
            (assignment (unwrap! (map-get? case-assignments { case-id: case-id }) err-not-found))
            (perf (unwrap! (map-get? arbitrator-performance { arbitrator: (get arbitrator assignment) }) err-not-found))
        )
        (asserts! (get completed assignment) err-not-assigned)
        (asserts! (not (is-eq tx-sender (get arbitrator assignment))) err-self-assignment)
        (asserts! (is-none (map-get? arbitrator-ratings { case-id: case-id, rater: tx-sender })) err-already-registered)
        (asserts! (and (>= rating u1) (<= rating u5)) err-invalid-rating)

        (map-set arbitrator-ratings
            { case-id: case-id, rater: tx-sender }
            {
                arbitrator: (get arbitrator assignment),
                rating: rating,
                feedback: feedback,
                rated-at: stacks-block-time
            }
        )

        (if (>= rating u3)
            (map-set arbitrator-performance
                { arbitrator: (get arbitrator assignment) }
                (merge perf { favorable-ratings: (+ (get favorable-ratings perf) u1) })
            )
            (map-set arbitrator-performance
                { arbitrator: (get arbitrator assignment) }
                (merge perf { unfavorable-ratings: (+ (get unfavorable-ratings perf) u1) })
            )
        )

        (ok true)
    )
)

(define-public (claim-reward (case-id uint))
    (let
        (
            (claim (unwrap! (map-get? reward-claims { arbitrator: tx-sender, case-id: case-id }) err-not-found))
            (assignment (unwrap! (map-get? case-assignments { case-id: case-id }) err-not-found))
            (perf (unwrap! (map-get? arbitrator-performance { arbitrator: tx-sender }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get arbitrator assignment)) err-unauthorized)
        (asserts! (get completed assignment) err-not-assigned)
        (asserts! (not (get claimed claim)) err-already-registered)

        (map-set reward-claims
            { arbitrator: tx-sender, case-id: case-id }
            (merge claim {
                claimed: true,
                claimed-at: stacks-block-time
            })
        )

        (map-set arbitrator-performance
            { arbitrator: tx-sender }
            (merge perf {
                total-rewards-earned: (+ (get total-rewards-earned perf) (get amount claim))
            })
        )

        (ok (get amount claim))
    )
)

(define-public (promote-tier (arbitrator principal) (new-tier uint))
    (let
        (
            (arb (unwrap! (map-get? arbitrators { arbitrator: arbitrator }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-valid-tier new-tier) err-invalid-tier)
        (asserts! (> new-tier (get tier arb)) err-invalid-tier)

        (map-set arbitrators
            { arbitrator: arbitrator }
            (merge arb { tier: new-tier })
        )

        (ok true)
    )
)

(define-public (suspend-arbitrator (arbitrator principal))
    (let
        (
            (arb (unwrap! (map-get? arbitrators { arbitrator: arbitrator }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status arb) STATUS-ACTIVE) err-not-active)

        (map-set arbitrators
            { arbitrator: arbitrator }
            (merge arb { status: STATUS-SUSPENDED })
        )

        (var-set total-active (if (> (var-get total-active) u0) (- (var-get total-active) u1) u0))
        (ok true)
    )
)

(define-public (reactivate-arbitrator (arbitrator principal))
    (let
        (
            (arb (unwrap! (map-get? arbitrators { arbitrator: arbitrator }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status arb) STATUS-SUSPENDED) err-not-active)

        (map-set arbitrators
            { arbitrator: arbitrator }
            (merge arb { status: STATUS-ACTIVE })
        )

        (var-set total-active (+ (var-get total-active) u1))
        (ok true)
    )
)

(define-public (slash-stake (arbitrator principal) (amount uint) (reason (string-utf8 200)))
    (let
        (
            (arb (unwrap! (map-get? arbitrators { arbitrator: arbitrator }) err-not-found))
            (perf (unwrap! (map-get? arbitrator-performance { arbitrator: arbitrator }) err-not-found))
            (slash-amount (if (> amount (get stake-amount arb)) (get stake-amount arb) amount))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set arbitrators
            { arbitrator: arbitrator }
            (merge arb {
                stake-amount: (- (get stake-amount arb) slash-amount),
                reputation: (if (> (get reputation arb) u10) (- (get reputation arb) u10) u0)
            })
        )

        (map-set arbitrator-performance
            { arbitrator: arbitrator }
            (merge perf {
                total-slashed: (+ (get total-slashed perf) slash-amount)
            })
        )

        (ok slash-amount)
    )
)

(define-public (record-overturned-case (arbitrator principal))
    (let
        (
            (arb (unwrap! (map-get? arbitrators { arbitrator: arbitrator }) err-not-found))
            (perf (unwrap! (map-get? arbitrator-performance { arbitrator: arbitrator }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set arbitrator-performance
            { arbitrator: arbitrator }
            (merge perf {
                cases-overturned: (+ (get cases-overturned perf) u1)
            })
        )

        (map-set arbitrators
            { arbitrator: arbitrator }
            (merge arb {
                reputation: (if (> (get reputation arb) u5) (- (get reputation arb) u5) u0)
            })
        )

        (ok true)
    )
)

(define-public (retire-arbitrator)
    (let
        (
            (arb (unwrap! (map-get? arbitrators { arbitrator: tx-sender }) err-not-found))
            (perf (unwrap! (map-get? arbitrator-performance { arbitrator: tx-sender }) err-not-found))
        )
        (asserts! (is-eq (get active-cases perf) u0) err-max-cases)

        (map-set arbitrators
            { arbitrator: tx-sender }
            (merge arb { status: STATUS-RETIRED })
        )

        (if (is-eq (get status arb) STATUS-ACTIVE)
            (var-set total-active (if (> (var-get total-active) u0) (- (var-get total-active) u1) u0))
            true
        )

        (ok true)
    )
)

(define-public (set-min-stake (amount uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set min-stake amount)
        (ok true)
    )
)

(define-public (set-max-concurrent-cases (max-val uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set max-concurrent-cases max-val)
        (ok true)
    )
)

(define-public (set-base-reward-rate (rate uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set base-reward-rate rate)
        (ok true)
    )
)

(define-public (initialize-tier-requirements)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (map-set tier-requirements { tier: TIER-JUNIOR }
            { min-cases: u0, min-reputation: u0, min-stake: u10000000 })
        (map-set tier-requirements { tier: TIER-STANDARD }
            { min-cases: u10, min-reputation: u60, min-stake: u25000000 })
        (map-set tier-requirements { tier: TIER-SENIOR }
            { min-cases: u50, min-reputation: u75, min-stake: u50000000 })
        (map-set tier-requirements { tier: TIER-EXPERT }
            { min-cases: u100, min-reputation: u90, min-stake: u100000000 })
        (ok true)
    )
)
