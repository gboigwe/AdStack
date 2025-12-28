;; title: governance-dao
;; version: 1.0.0
;; summary: Decentralized platform governance
;; description: Proposal system, voting, parameter changes, treasury management, and community governance

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-voting-closed (err u103))
(define-constant err-already-voted (err u104))
(define-constant err-proposal-active (err u105))
(define-constant err-quorum-not-met (err u106))
(define-constant err-insufficient-voting-power (err u107))

;; Proposal types
(define-constant PROPOSAL-FEE-CHANGE u1)
(define-constant PROPOSAL-PARAMETER-CHANGE u2)
(define-constant PROPOSAL-TREASURY-SPEND u3)
(define-constant PROPOSAL-EMERGENCY-PAUSE u4)

;; Proposal status
(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-PASSED u2)
(define-constant STATUS-REJECTED u3)
(define-constant STATUS-EXECUTED u4)

;; data vars
(define-data-var proposal-nonce uint u0)
(define-data-var quorum-threshold uint u1000) ;; Minimum votes required
(define-data-var voting-duration uint u2880) ;; ~20 days
(define-data-var min-voting-power uint u100)
(define-data-var treasury-balance uint u0)

;; data maps
(define-map proposals
    { proposal-id: uint }
    {
        proposer: principal,
        proposal-type: uint,
        title: (string-utf8 100),
        description: (string-utf8 500),
        status: uint,
        votes-for: uint,
        votes-against: uint,
        start-time: uint,
        end-time: uint,
        execution-delay: uint,
        executed: bool
    }
)

(define-map votes
    { proposal-id: uint, voter: principal }
    {
        voting-power: uint,
        vote-for: bool,
        timestamp: uint
    }
)

(define-map voting-power
    { user: principal }
    {
        power: uint,
        delegated-to: (optional principal),
        last-updated: uint
    }
)

(define-map delegations
    { delegator: principal, delegate: principal }
    {
        power: uint,
        active: bool
    }
)

(define-map treasury-transactions
    { tx-id: uint }
    {
        amount: uint,
        recipient: principal,
        reason: (string-utf8 200),
        proposal-id: uint,
        executed-at: uint
    }
)

(define-map proposal-parameters
    { proposal-id: uint }
    {
        parameter-name: (string-ascii 50),
        new-value: uint
    }
)

;; private functions
(define-private (has-quorum (votes-for uint) (votes-against uint))
    (>= (+ votes-for votes-against) (var-get quorum-threshold))
)

(define-private (is-passed (votes-for uint) (votes-against uint))
    (> votes-for votes-against)
)

;; read only functions
(define-read-only (get-proposal (proposal-id uint))
    (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
    (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-voting-power (user principal))
    (default-to { power: u0, delegated-to: none, last-updated: u0 }
        (map-get? voting-power { user: user })
    )
)

(define-read-only (get-delegation (delegator principal) (delegate principal))
    (map-get? delegations { delegator: delegator, delegate: delegate })
)

(define-read-only (get-treasury-balance)
    (var-get treasury-balance)
)

(define-read-only (can-vote (proposal-id uint) (voter principal))
    (let
        (
            (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) false))
            (user-power (get power (get-voting-power voter)))
            (has-voted (is-some (map-get? votes { proposal-id: proposal-id, voter: voter })))
        )
        (and
            (is-eq (get status proposal) STATUS-ACTIVE)
            (< stacks-block-time (get end-time proposal))
            (>= user-power (var-get min-voting-power))
            (not has-voted)
        )
    )
)

;; public functions
(define-public (create-proposal
    (proposal-type uint)
    (title (string-utf8 100))
    (description (string-utf8 500))
    (execution-delay uint)
)
    (let
        (
            (proposal-id (+ (var-get proposal-nonce) u1))
            (user-power (get power (get-voting-power tx-sender)))
        )
        (asserts! (>= user-power (var-get min-voting-power)) err-insufficient-voting-power)

        (map-set proposals
            { proposal-id: proposal-id }
            {
                proposer: tx-sender,
                proposal-type: proposal-type,
                title: title,
                description: description,
                status: STATUS-ACTIVE,
                votes-for: u0,
                votes-against: u0,
                start-time: stacks-block-time,
                end-time: (+ stacks-block-time (var-get voting-duration)),
                execution-delay: execution-delay,
                executed: false
            }
        )

        (var-set proposal-nonce proposal-id)
        (ok proposal-id)
    )
)

(define-public (vote-on-proposal (proposal-id uint) (vote-for bool))
    (let
        (
            (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-not-found))
            (user-power (get power (get-voting-power tx-sender)))
        )
        (asserts! (is-eq (get status proposal) STATUS-ACTIVE) err-voting-closed)
        (asserts! (< stacks-block-time (get end-time proposal)) err-voting-closed)
        (asserts! (>= user-power (var-get min-voting-power)) err-insufficient-voting-power)
        (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: tx-sender })) err-already-voted)

        (map-set votes
            { proposal-id: proposal-id, voter: tx-sender }
            {
                voting-power: user-power,
                vote-for: vote-for,
                timestamp: stacks-block-time
            }
        )

        (map-set proposals
            { proposal-id: proposal-id }
            (merge proposal {
                votes-for: (if vote-for (+ (get votes-for proposal) user-power) (get votes-for proposal)),
                votes-against: (if vote-for (get votes-against proposal) (+ (get votes-against proposal) user-power))
            })
        )

        (ok true)
    )
)

(define-public (execute-proposal (proposal-id uint))
    (let
        (
            (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-not-found))
        )
        (asserts! (is-eq (get status proposal) STATUS-ACTIVE) err-voting-closed)
        (asserts! (>= stacks-block-time (get end-time proposal)) err-proposal-active)
        (asserts! (not (get executed proposal)) err-unauthorized)
        (asserts! (has-quorum (get votes-for proposal) (get votes-against proposal)) err-quorum-not-met)

        (let
            (
                (passed (is-passed (get votes-for proposal) (get votes-against proposal)))
            )
            (map-set proposals
                { proposal-id: proposal-id }
                (merge proposal {
                    status: (if passed STATUS-PASSED STATUS-REJECTED),
                    executed: true
                })
            )

            (ok passed)
        )
    )
)

(define-public (delegate-voting-power (delegate principal) (amount uint))
    (let
        (
            (delegator-power (get-voting-power tx-sender))
        )
        (asserts! (>= (get power delegator-power) amount) err-insufficient-voting-power)

        (map-set delegations
            { delegator: tx-sender, delegate: delegate }
            {
                power: amount,
                active: true
            }
        )

        (map-set voting-power
            { user: tx-sender }
            (merge delegator-power {
                delegated-to: (some delegate),
                power: (- (get power delegator-power) amount)
            })
        )

        (let
            (
                (delegate-power (get-voting-power delegate))
            )
            (map-set voting-power
                { user: delegate }
                (merge delegate-power {
                    power: (+ (get power delegate-power) amount),
                    last-updated: stacks-block-time
                })
            )
        )

        (ok true)
    )
)

(define-public (revoke-delegation (delegate principal))
    (let
        (
            (delegation (unwrap! (map-get? delegations { delegator: tx-sender, delegate: delegate }) err-not-found))
            (delegator-power (get-voting-power tx-sender))
            (delegate-power (get-voting-power delegate))
        )
        (asserts! (get active delegation) err-unauthorized)

        (map-set delegations
            { delegator: tx-sender, delegate: delegate }
            (merge delegation { active: false })
        )

        (map-set voting-power
            { user: tx-sender }
            (merge delegator-power {
                power: (+ (get power delegator-power) (get power delegation)),
                delegated-to: none
            })
        )

        (map-set voting-power
            { user: delegate }
            (merge delegate-power {
                power: (- (get power delegate-power) (get power delegation))
            })
        )

        (ok true)
    )
)

(define-public (update-voting-power (user principal) (new-power uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set voting-power
            { user: user }
            {
                power: new-power,
                delegated-to: none,
                last-updated: stacks-block-time
            }
        )

        (ok true)
    )
)

(define-public (treasury-spend
    (proposal-id uint)
    (recipient principal)
    (amount uint)
    (reason (string-utf8 200))
)
    (let
        (
            (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) err-not-found))
            (tx-id (+ (var-get proposal-nonce) u1))
        )
        (asserts! (is-eq (get status proposal) STATUS-PASSED) err-unauthorized)
        (asserts! (>= (var-get treasury-balance) amount) err-unauthorized)

        ;; In production, transfer from treasury
        ;; (try! (as-contract (stx-transfer? amount tx-sender recipient)))

        (map-set treasury-transactions
            { tx-id: tx-id }
            {
                amount: amount,
                recipient: recipient,
                reason: reason,
                proposal-id: proposal-id,
                executed-at: stacks-block-time
            }
        )

        (var-set treasury-balance (- (var-get treasury-balance) amount))
        (ok true)
    )
)

;; Admin functions
(define-public (set-quorum-threshold (new-threshold uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set quorum-threshold new-threshold)
        (ok true)
    )
)

(define-public (set-voting-duration (new-duration uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set voting-duration new-duration)
        (ok true)
    )
)

(define-public (deposit-to-treasury (amount uint))
    (begin
        ;; In production, transfer to contract
        ;; (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

        (var-set treasury-balance (+ (var-get treasury-balance) amount))
        (ok true)
    )
)
