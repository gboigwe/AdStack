;; title: judgment-executor
;; version: 1.0.0
;; summary: Automated judgment execution with refunds, penalties, slashing, and appeals

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u700))
(define-constant err-not-found (err u701))
(define-constant err-unauthorized (err u702))
(define-constant err-already-executed (err u703))
(define-constant err-invalid-outcome (err u704))
(define-constant err-appeal-expired (err u705))
(define-constant err-already-appealed (err u706))
(define-constant err-invalid-amount (err u707))
(define-constant err-execution-failed (err u708))
(define-constant err-not-finalized (err u709))
(define-constant err-appeal-pending (err u710))
(define-constant err-max-appeals (err u711))

(define-constant OUTCOME-CLAIMANT-WINS u1)
(define-constant OUTCOME-RESPONDENT-WINS u2)
(define-constant OUTCOME-SPLIT u3)
(define-constant OUTCOME-DISMISSED u4)
(define-constant OUTCOME-SETTLEMENT u5)

(define-constant APPEAL-STATUS-PENDING u1)
(define-constant APPEAL-STATUS-GRANTED u2)
(define-constant APPEAL-STATUS-DENIED u3)

(define-constant PENALTY-NONE u0)
(define-constant PENALTY-WARNING u1)
(define-constant PENALTY-FINE u2)
(define-constant PENALTY-SUSPENSION u3)
(define-constant PENALTY-BAN u4)

(define-data-var judgment-nonce uint u0)
(define-data-var appeal-nonce uint u0)
(define-data-var total-executed uint u0)
(define-data-var total-appeals uint u0)
(define-data-var total-refunded uint u0)
(define-data-var total-penalties uint u0)
(define-data-var appeal-window-blocks uint u1440)
(define-data-var max-appeal-rounds uint u2)
(define-data-var appeal-fee-percentage uint u5)
(define-data-var default-split-ratio uint u50)
(define-data-var fraud-penalty-rate uint u2500)
(define-data-var breach-penalty-rate uint u1500)

(define-map judgments
    { judgment-id: uint }
    {
        case-id: uint,
        arbitrator: principal,
        claimant: principal,
        respondent: principal,
        outcome: uint,
        amount-at-stake: uint,
        claimant-award: uint,
        respondent-award: uint,
        platform-fee: uint,
        penalty-type: uint,
        penalty-target: (optional principal),
        penalty-amount: uint,
        reasoning: (string-utf8 500),
        issued-at: uint,
        executed: bool,
        executed-at: uint,
        finalized: bool
    }
)

(define-map judgment-by-case
    { case-id: uint }
    { judgment-id: uint }
)

(define-map appeals
    { appeal-id: uint }
    {
        judgment-id: uint,
        case-id: uint,
        appellant: principal,
        grounds: (string-utf8 500),
        status: uint,
        appeal-round: uint,
        filed-at: uint,
        decided-at: uint,
        decided-by: (optional principal),
        new-judgment-id: (optional uint)
    }
)

(define-map case-appeal-count
    { case-id: uint }
    { count: uint }
)

(define-map execution-records
    { judgment-id: uint }
    {
        refund-to-claimant: uint,
        refund-to-respondent: uint,
        penalty-collected: uint,
        platform-fee-collected: uint,
        executed-by: principal,
        executed-at: uint,
        execution-hash: (buff 32)
    }
)

(define-map settlement-offers
    { case-id: uint, offerer: principal }
    {
        amount-to-claimant: uint,
        amount-to-respondent: uint,
        offered-at: uint,
        accepted: bool,
        accepted-at: uint
    }
)

(define-map penalty-ledger
    { target: principal }
    {
        total-warnings: uint,
        total-fines: uint,
        total-fine-amount: uint,
        suspensions: uint,
        banned: bool,
        last-penalty-at: uint
    }
)

(define-map monthly-stats
    { month: uint }
    {
        judgments-issued: uint,
        total-awarded: uint,
        total-penalties: uint,
        appeals-filed: uint,
        appeals-granted: uint,
        settlements: uint
    }
)

(define-private (is-valid-outcome (o uint))
    (and (>= o OUTCOME-CLAIMANT-WINS) (<= o OUTCOME-SETTLEMENT))
)

(define-private (compute-awards (outcome uint) (amount uint) (split-ratio uint))
    (if (is-eq outcome OUTCOME-CLAIMANT-WINS)
        { claimant: amount, respondent: u0 }
        (if (is-eq outcome OUTCOME-RESPONDENT-WINS)
            { claimant: u0, respondent: amount }
            (if (is-eq outcome OUTCOME-SPLIT)
                {
                    claimant: (/ (* amount split-ratio) u100),
                    respondent: (/ (* amount (- u100 split-ratio)) u100)
                }
                { claimant: u0, respondent: u0 }
            )
        )
    )
)

(define-private (compute-penalty (dispute-type uint) (amount uint))
    (if (is-eq dispute-type u2)
        { penalty-type: PENALTY-FINE, penalty-amount: (/ (* amount (var-get fraud-penalty-rate)) u10000) }
        (if (is-eq dispute-type u4)
            { penalty-type: PENALTY-FINE, penalty-amount: (/ (* amount (var-get breach-penalty-rate)) u10000) }
            { penalty-type: PENALTY-WARNING, penalty-amount: u0 }
        )
    )
)

(define-private (update-penalty-ledger (target principal) (penalty-type uint) (amount uint))
    (let
        (
            (ledger (default-to
                { total-warnings: u0, total-fines: u0, total-fine-amount: u0, suspensions: u0, banned: false, last-penalty-at: u0 }
                (map-get? penalty-ledger { target: target })))
        )
        (map-set penalty-ledger
            { target: target }
            (merge ledger
                (if (is-eq penalty-type PENALTY-WARNING)
                    { total-warnings: (+ (get total-warnings ledger) u1), last-penalty-at: stacks-block-time }
                    (if (is-eq penalty-type PENALTY-FINE)
                        { total-fines: (+ (get total-fines ledger) u1), total-fine-amount: (+ (get total-fine-amount ledger) amount), last-penalty-at: stacks-block-time }
                        (if (is-eq penalty-type PENALTY-SUSPENSION)
                            { suspensions: (+ (get suspensions ledger) u1), last-penalty-at: stacks-block-time }
                            (if (is-eq penalty-type PENALTY-BAN)
                                { banned: true, last-penalty-at: stacks-block-time }
                                { last-penalty-at: stacks-block-time }
                            )
                        )
                    )
                )
            )
        )
    )
)

(define-private (update-monthly-stats-judgment (amount uint) (penalty uint))
    (let
        (
            (month (/ stacks-block-time u2592000))
            (stats (default-to
                { judgments-issued: u0, total-awarded: u0, total-penalties: u0, appeals-filed: u0, appeals-granted: u0, settlements: u0 }
                (map-get? monthly-stats { month: month })))
        )
        (map-set monthly-stats { month: month }
            (merge stats {
                judgments-issued: (+ (get judgments-issued stats) u1),
                total-awarded: (+ (get total-awarded stats) amount),
                total-penalties: (+ (get total-penalties stats) penalty)
            })
        )
    )
)

(define-private (update-monthly-stats-appeal (granted bool))
    (let
        (
            (month (/ stacks-block-time u2592000))
            (stats (default-to
                { judgments-issued: u0, total-awarded: u0, total-penalties: u0, appeals-filed: u0, appeals-granted: u0, settlements: u0 }
                (map-get? monthly-stats { month: month })))
        )
        (map-set monthly-stats { month: month }
            (merge stats {
                appeals-filed: (+ (get appeals-filed stats) u1),
                appeals-granted: (if granted (+ (get appeals-granted stats) u1) (get appeals-granted stats))
            })
        )
    )
)

(define-private (update-monthly-stats-settlement)
    (let
        (
            (month (/ stacks-block-time u2592000))
            (stats (default-to
                { judgments-issued: u0, total-awarded: u0, total-penalties: u0, appeals-filed: u0, appeals-granted: u0, settlements: u0 }
                (map-get? monthly-stats { month: month })))
        )
        (map-set monthly-stats { month: month }
            (merge stats { settlements: (+ (get settlements stats) u1) }))
    )
)

(define-read-only (get-judgment (judgment-id uint))
    (map-get? judgments { judgment-id: judgment-id })
)

(define-read-only (get-judgment-by-case (case-id uint))
    (match (map-get? judgment-by-case { case-id: case-id })
        j (map-get? judgments { judgment-id: (get judgment-id j) })
        none
    )
)

(define-read-only (get-appeal (appeal-id uint))
    (map-get? appeals { appeal-id: appeal-id })
)

(define-read-only (get-case-appeal-count (case-id uint))
    (default-to { count: u0 } (map-get? case-appeal-count { case-id: case-id }))
)

(define-read-only (get-execution-record (judgment-id uint))
    (map-get? execution-records { judgment-id: judgment-id })
)

(define-read-only (get-settlement-offer (case-id uint) (offerer principal))
    (map-get? settlement-offers { case-id: case-id, offerer: offerer })
)

(define-read-only (get-penalty-ledger (target principal))
    (default-to
        { total-warnings: u0, total-fines: u0, total-fine-amount: u0, suspensions: u0, banned: false, last-penalty-at: u0 }
        (map-get? penalty-ledger { target: target })
    )
)

(define-read-only (get-monthly-stats (month uint))
    (default-to
        { judgments-issued: u0, total-awarded: u0, total-penalties: u0, appeals-filed: u0, appeals-granted: u0, settlements: u0 }
        (map-get? monthly-stats { month: month })
    )
)

(define-read-only (get-judgment-nonce)
    (var-get judgment-nonce)
)

(define-read-only (get-appeal-nonce)
    (var-get appeal-nonce)
)

(define-read-only (get-total-executed)
    (var-get total-executed)
)

(define-read-only (get-total-appeals)
    (var-get total-appeals)
)

(define-read-only (can-appeal-judgment (judgment-id uint))
    (match (map-get? judgments { judgment-id: judgment-id })
        j (and
            (get finalized j)
            (< (- stacks-block-time (get issued-at j)) (var-get appeal-window-blocks))
            (let
                (
                    (appeal-count (get-case-appeal-count (get case-id j)))
                )
                (< (get count appeal-count) (var-get max-appeal-rounds))
            )
        )
        false
    )
)

(define-public (issue-judgment
    (case-id uint)
    (arbitrator principal)
    (claimant principal)
    (respondent principal)
    (outcome uint)
    (amount-at-stake uint)
    (dispute-type uint)
    (reasoning (string-utf8 500))
    (platform-fee-rate uint)
)
    (let
        (
            (jid (+ (var-get judgment-nonce) u1))
            (awards (compute-awards outcome amount-at-stake (var-get default-split-ratio)))
            (platform-fee (/ (* amount-at-stake platform-fee-rate) u10000))
            (penalty-info (if (or (is-eq outcome OUTCOME-CLAIMANT-WINS) (is-eq outcome OUTCOME-RESPONDENT-WINS))
                (compute-penalty dispute-type amount-at-stake)
                { penalty-type: PENALTY-NONE, penalty-amount: u0 }
            ))
            (penalty-target (if (is-eq outcome OUTCOME-CLAIMANT-WINS)
                (some respondent)
                (if (is-eq outcome OUTCOME-RESPONDENT-WINS)
                    (some claimant)
                    none
                )
            ))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-valid-outcome outcome) err-invalid-outcome)
        (asserts! (> amount-at-stake u0) err-invalid-amount)
        (asserts! (is-none (map-get? judgment-by-case { case-id: case-id })) err-already-executed)

        (map-set judgments
            { judgment-id: jid }
            {
                case-id: case-id,
                arbitrator: arbitrator,
                claimant: claimant,
                respondent: respondent,
                outcome: outcome,
                amount-at-stake: amount-at-stake,
                claimant-award: (get claimant awards),
                respondent-award: (get respondent awards),
                platform-fee: platform-fee,
                penalty-type: (get penalty-type penalty-info),
                penalty-target: penalty-target,
                penalty-amount: (get penalty-amount penalty-info),
                reasoning: reasoning,
                issued-at: stacks-block-time,
                executed: false,
                executed-at: u0,
                finalized: false
            }
        )

        (map-set judgment-by-case
            { case-id: case-id }
            { judgment-id: jid }
        )

        (match penalty-target
            target (begin
                (update-penalty-ledger target (get penalty-type penalty-info) (get penalty-amount penalty-info))
                true
            )
            true
        )

        (update-monthly-stats-judgment amount-at-stake (get penalty-amount penalty-info))
        (var-set judgment-nonce jid)
        (var-set total-penalties (+ (var-get total-penalties) (get penalty-amount penalty-info)))
        (ok jid)
    )
)

(define-public (execute-judgment (judgment-id uint) (execution-hash (buff 32)))
    (let
        (
            (j (unwrap! (map-get? judgments { judgment-id: judgment-id }) err-not-found))
            (appeal-count (get-case-appeal-count (get case-id j)))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (not (get executed j)) err-already-executed)
        (asserts! (get finalized j) err-not-finalized)

        (map-set judgments
            { judgment-id: judgment-id }
            (merge j {
                executed: true,
                executed-at: stacks-block-time
            })
        )

        (map-set execution-records
            { judgment-id: judgment-id }
            {
                refund-to-claimant: (get claimant-award j),
                refund-to-respondent: (get respondent-award j),
                penalty-collected: (get penalty-amount j),
                platform-fee-collected: (get platform-fee j),
                executed-by: tx-sender,
                executed-at: stacks-block-time,
                execution-hash: execution-hash
            }
        )

        (var-set total-executed (+ (var-get total-executed) u1))
        (var-set total-refunded (+ (var-get total-refunded) (+ (get claimant-award j) (get respondent-award j))))
        (ok true)
    )
)

(define-public (finalize-judgment (judgment-id uint))
    (let
        (
            (j (unwrap! (map-get? judgments { judgment-id: judgment-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (not (get finalized j)) err-already-executed)

        (map-set judgments
            { judgment-id: judgment-id }
            (merge j { finalized: true })
        )

        (ok true)
    )
)

(define-public (file-appeal
    (judgment-id uint)
    (grounds (string-utf8 500))
)
    (let
        (
            (j (unwrap! (map-get? judgments { judgment-id: judgment-id }) err-not-found))
            (aid (+ (var-get appeal-nonce) u1))
            (appeal-count (get-case-appeal-count (get case-id j)))
        )
        (asserts! (or (is-eq tx-sender (get claimant j)) (is-eq tx-sender (get respondent j))) err-unauthorized)
        (asserts! (get finalized j) err-not-finalized)
        (asserts! (not (get executed j)) err-already-executed)
        (asserts! (< (- stacks-block-time (get issued-at j)) (var-get appeal-window-blocks)) err-appeal-expired)
        (asserts! (< (get count appeal-count) (var-get max-appeal-rounds)) err-max-appeals)

        (map-set appeals
            { appeal-id: aid }
            {
                judgment-id: judgment-id,
                case-id: (get case-id j),
                appellant: tx-sender,
                grounds: grounds,
                status: APPEAL-STATUS-PENDING,
                appeal-round: (+ (get count appeal-count) u1),
                filed-at: stacks-block-time,
                decided-at: u0,
                decided-by: none,
                new-judgment-id: none
            }
        )

        (map-set case-appeal-count
            { case-id: (get case-id j) }
            { count: (+ (get count appeal-count) u1) }
        )

        (update-monthly-stats-appeal false)
        (var-set appeal-nonce aid)
        (var-set total-appeals (+ (var-get total-appeals) u1))
        (ok aid)
    )
)

(define-public (decide-appeal (appeal-id uint) (granted bool))
    (let
        (
            (appeal (unwrap! (map-get? appeals { appeal-id: appeal-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status appeal) APPEAL-STATUS-PENDING) err-already-appealed)

        (map-set appeals
            { appeal-id: appeal-id }
            (merge appeal {
                status: (if granted APPEAL-STATUS-GRANTED APPEAL-STATUS-DENIED),
                decided-at: stacks-block-time,
                decided-by: (some tx-sender)
            })
        )

        (if granted
            (update-monthly-stats-appeal true)
            true
        )

        (ok granted)
    )
)

(define-public (offer-settlement (case-id uint) (amount-to-claimant uint) (amount-to-respondent uint))
    (begin
        (asserts! (> (+ amount-to-claimant amount-to-respondent) u0) err-invalid-amount)

        (map-set settlement-offers
            { case-id: case-id, offerer: tx-sender }
            {
                amount-to-claimant: amount-to-claimant,
                amount-to-respondent: amount-to-respondent,
                offered-at: stacks-block-time,
                accepted: false,
                accepted-at: u0
            }
        )

        (ok true)
    )
)

(define-public (accept-settlement (case-id uint) (offerer principal))
    (let
        (
            (offer (unwrap! (map-get? settlement-offers { case-id: case-id, offerer: offerer }) err-not-found))
        )
        (asserts! (not (is-eq tx-sender offerer)) err-unauthorized)
        (asserts! (not (get accepted offer)) err-already-executed)

        (map-set settlement-offers
            { case-id: case-id, offerer: offerer }
            (merge offer {
                accepted: true,
                accepted-at: stacks-block-time
            })
        )

        (let
            (
                (jid (+ (var-get judgment-nonce) u1))
                (total-amount (+ (get amount-to-claimant offer) (get amount-to-respondent offer)))
            )
            (map-set judgments
                { judgment-id: jid }
                {
                    case-id: case-id,
                    arbitrator: contract-owner,
                    claimant: offerer,
                    respondent: tx-sender,
                    outcome: OUTCOME-SETTLEMENT,
                    amount-at-stake: total-amount,
                    claimant-award: (get amount-to-claimant offer),
                    respondent-award: (get amount-to-respondent offer),
                    platform-fee: u0,
                    penalty-type: PENALTY-NONE,
                    penalty-target: none,
                    penalty-amount: u0,
                    reasoning: u"Settlement agreed by both parties",
                    issued-at: stacks-block-time,
                    executed: false,
                    executed-at: u0,
                    finalized: true
                }
            )

            (map-set judgment-by-case
                { case-id: case-id }
                { judgment-id: jid }
            )

            (update-monthly-stats-settlement)
            (var-set judgment-nonce jid)
        )

        (ok true)
    )
)

(define-public (apply-penalty (target principal) (penalty-type uint) (amount uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (and (>= penalty-type PENALTY-NONE) (<= penalty-type PENALTY-BAN)) err-invalid-outcome)

        (update-penalty-ledger target penalty-type amount)
        (var-set total-penalties (+ (var-get total-penalties) amount))
        (ok true)
    )
)

(define-public (set-appeal-window (blocks uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set appeal-window-blocks blocks)
        (ok true)
    )
)

(define-public (set-max-appeal-rounds (rounds uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set max-appeal-rounds rounds)
        (ok true)
    )
)

(define-public (set-default-split-ratio (ratio uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= ratio u100) err-invalid-amount)
        (var-set default-split-ratio ratio)
        (ok true)
    )
)

(define-public (set-fraud-penalty-rate (rate uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set fraud-penalty-rate rate)
        (ok true)
    )
)

(define-public (set-breach-penalty-rate (rate uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set breach-penalty-rate rate)
        (ok true)
    )
)
