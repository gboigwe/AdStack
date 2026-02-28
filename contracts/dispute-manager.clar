;; title: dispute-manager
;; version: 1.0.0
;; summary: Advanced dispute lifecycle management with tiered severity and SLA enforcement

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u400))
(define-constant err-not-found (err u401))
(define-constant err-unauthorized (err u402))
(define-constant err-invalid-status (err u403))
(define-constant err-already-exists (err u404))
(define-constant err-invalid-type (err u405))
(define-constant err-invalid-severity (err u406))
(define-constant err-expired (err u407))
(define-constant err-invalid-amount (err u408))
(define-constant err-cooldown-active (err u409))
(define-constant err-max-disputes (err u410))
(define-constant err-invalid-party (err u411))
(define-constant err-escalation-denied (err u412))
(define-constant err-sla-not-breached (err u413))

(define-constant STATUS-FILED u1)
(define-constant STATUS-ACKNOWLEDGED u2)
(define-constant STATUS-INVESTIGATION u3)
(define-constant STATUS-ARBITRATION u4)
(define-constant STATUS-RESOLVED u5)
(define-constant STATUS-APPEALED u6)
(define-constant STATUS-CLOSED u7)
(define-constant STATUS-DISMISSED u8)

(define-constant TYPE-PAYMENT u1)
(define-constant TYPE-FRAUD u2)
(define-constant TYPE-QUALITY u3)
(define-constant TYPE-CONTRACT-BREACH u4)
(define-constant TYPE-MISREPRESENTATION u5)
(define-constant TYPE-NON-DELIVERY u6)

(define-constant SEVERITY-LOW u1)
(define-constant SEVERITY-MEDIUM u2)
(define-constant SEVERITY-HIGH u3)
(define-constant SEVERITY-CRITICAL u4)

(define-constant PRIORITY-NORMAL u1)
(define-constant PRIORITY-ELEVATED u2)
(define-constant PRIORITY-URGENT u3)
(define-constant PRIORITY-EMERGENCY u4)

(define-data-var case-nonce uint u0)
(define-data-var total-filed uint u0)
(define-data-var total-resolved uint u0)
(define-data-var total-dismissed uint u0)
(define-data-var min-dispute-amount uint u1000000)
(define-data-var max-active-per-party uint u10)
(define-data-var default-sla-blocks uint u1440)
(define-data-var escalation-threshold uint u720)
(define-data-var filing-cooldown uint u144)
(define-data-var counter-claim-window uint u288)

(define-map cases
    { case-id: uint }
    {
        claimant: principal,
        respondent: principal,
        campaign-id: uint,
        dispute-type: uint,
        severity: uint,
        priority: uint,
        amount-at-stake: uint,
        status: uint,
        description: (string-utf8 500),
        filed-at: uint,
        acknowledged-at: uint,
        sla-deadline: uint,
        last-activity: uint,
        escalation-count: uint
    }
)

(define-map case-metadata
    { case-id: uint }
    {
        category-tags: (list 5 (string-ascii 30)),
        related-case-id: (optional uint),
        external-ref: (optional (string-ascii 64)),
        resolution-notes: (string-utf8 500),
        final-outcome: uint
    }
)

(define-map party-cases
    { party: principal }
    {
        active-cases: uint,
        total-filed: uint,
        total-as-respondent: uint,
        last-filing: uint,
        wins: uint,
        losses: uint
    }
)

(define-map case-timeline
    { case-id: uint, entry-id: uint }
    {
        actor: principal,
        action: (string-ascii 30),
        detail: (string-utf8 200),
        timestamp: uint
    }
)

(define-map timeline-count
    { case-id: uint }
    { total: uint }
)

(define-map counter-claims
    { case-id: uint }
    {
        counter-claimant: principal,
        amount: uint,
        reason: (string-utf8 500),
        filed-at: uint,
        accepted: bool
    }
)

(define-map sla-records
    { case-id: uint }
    {
        sla-blocks: uint,
        breached: bool,
        breach-at: uint,
        penalty-applied: bool
    }
)

(define-map daily-stats
    { day: uint }
    {
        filed: uint,
        resolved: uint,
        dismissed: uint,
        escalated: uint
    }
)

(define-private (is-valid-type (dtype uint))
    (and (>= dtype TYPE-PAYMENT) (<= dtype TYPE-NON-DELIVERY))
)

(define-private (is-valid-severity (sev uint))
    (and (>= sev SEVERITY-LOW) (<= sev SEVERITY-CRITICAL))
)

(define-private (is-valid-status (s uint))
    (and (>= s STATUS-FILED) (<= s STATUS-DISMISSED))
)

(define-private (severity-to-sla (sev uint))
    (if (is-eq sev SEVERITY-CRITICAL)
        (/ (var-get default-sla-blocks) u4)
        (if (is-eq sev SEVERITY-HIGH)
            (/ (var-get default-sla-blocks) u2)
            (if (is-eq sev SEVERITY-MEDIUM)
                (var-get default-sla-blocks)
                (* (var-get default-sla-blocks) u2)
            )
        )
    )
)

(define-private (compute-priority (sev uint) (amount uint))
    (let
        (
            (amount-factor (if (> amount u100000000) u2 (if (> amount u10000000) u1 u0)))
            (base-priority (if (is-eq sev SEVERITY-CRITICAL)
                PRIORITY-EMERGENCY
                (if (is-eq sev SEVERITY-HIGH)
                    PRIORITY-URGENT
                    (if (is-eq sev SEVERITY-MEDIUM)
                        PRIORITY-ELEVATED
                        PRIORITY-NORMAL
                    )
                )
            ))
        )
        (if (> (+ base-priority amount-factor) PRIORITY-EMERGENCY)
            PRIORITY-EMERGENCY
            (+ base-priority amount-factor)
        )
    )
)

(define-private (add-timeline-entry (case-id uint) (actor principal) (action (string-ascii 30)) (detail (string-utf8 200)))
    (let
        (
            (count-data (default-to { total: u0 } (map-get? timeline-count { case-id: case-id })))
            (entry-id (+ (get total count-data) u1))
        )
        (map-set case-timeline
            { case-id: case-id, entry-id: entry-id }
            {
                actor: actor,
                action: action,
                detail: detail,
                timestamp: stacks-block-time
            }
        )
        (map-set timeline-count
            { case-id: case-id }
            { total: entry-id }
        )
        entry-id
    )
)

(define-private (update-daily-stats-filed)
    (let
        (
            (day (/ stacks-block-time u86400))
            (stats (default-to { filed: u0, resolved: u0, dismissed: u0, escalated: u0 }
                (map-get? daily-stats { day: day })))
        )
        (map-set daily-stats { day: day }
            (merge stats { filed: (+ (get filed stats) u1) }))
    )
)

(define-private (update-daily-stats-resolved)
    (let
        (
            (day (/ stacks-block-time u86400))
            (stats (default-to { filed: u0, resolved: u0, dismissed: u0, escalated: u0 }
                (map-get? daily-stats { day: day })))
        )
        (map-set daily-stats { day: day }
            (merge stats { resolved: (+ (get resolved stats) u1) }))
    )
)

(define-private (update-daily-stats-dismissed)
    (let
        (
            (day (/ stacks-block-time u86400))
            (stats (default-to { filed: u0, resolved: u0, dismissed: u0, escalated: u0 }
                (map-get? daily-stats { day: day })))
        )
        (map-set daily-stats { day: day }
            (merge stats { dismissed: (+ (get dismissed stats) u1) }))
    )
)

(define-private (update-daily-stats-escalated)
    (let
        (
            (day (/ stacks-block-time u86400))
            (stats (default-to { filed: u0, resolved: u0, dismissed: u0, escalated: u0 }
                (map-get? daily-stats { day: day })))
        )
        (map-set daily-stats { day: day }
            (merge stats { escalated: (+ (get escalated stats) u1) }))
    )
)

(define-read-only (get-case (case-id uint))
    (map-get? cases { case-id: case-id })
)

(define-read-only (get-case-metadata (case-id uint))
    (map-get? case-metadata { case-id: case-id })
)

(define-read-only (get-party-cases (party principal))
    (map-get? party-cases { party: party })
)

(define-read-only (get-timeline-entry (case-id uint) (entry-id uint))
    (map-get? case-timeline { case-id: case-id, entry-id: entry-id })
)

(define-read-only (get-timeline-count (case-id uint))
    (default-to { total: u0 } (map-get? timeline-count { case-id: case-id }))
)

(define-read-only (get-counter-claim (case-id uint))
    (map-get? counter-claims { case-id: case-id })
)

(define-read-only (get-sla-record (case-id uint))
    (map-get? sla-records { case-id: case-id })
)

(define-read-only (get-daily-stats (day uint))
    (default-to { filed: u0, resolved: u0, dismissed: u0, escalated: u0 }
        (map-get? daily-stats { day: day }))
)

(define-read-only (get-case-nonce)
    (var-get case-nonce)
)

(define-read-only (get-total-filed)
    (var-get total-filed)
)

(define-read-only (get-total-resolved)
    (var-get total-resolved)
)

(define-read-only (get-total-dismissed)
    (var-get total-dismissed)
)

(define-read-only (is-sla-breached (case-id uint))
    (match (map-get? cases { case-id: case-id })
        c (> stacks-block-time (get sla-deadline c))
        false
    )
)

(define-read-only (get-case-age (case-id uint))
    (match (map-get? cases { case-id: case-id })
        c (- stacks-block-time (get filed-at c))
        u0
    )
)

(define-public (file-dispute
    (respondent principal)
    (campaign-id uint)
    (dispute-type uint)
    (severity uint)
    (amount uint)
    (description (string-utf8 500))
    (tags (list 5 (string-ascii 30)))
)
    (let
        (
            (case-id (+ (var-get case-nonce) u1))
            (party-data (default-to
                { active-cases: u0, total-filed: u0, total-as-respondent: u0, last-filing: u0, wins: u0, losses: u0 }
                (map-get? party-cases { party: tx-sender })))
            (sla-blocks (severity-to-sla severity))
            (priority (compute-priority severity amount))
        )
        (asserts! (is-valid-type dispute-type) err-invalid-type)
        (asserts! (is-valid-severity severity) err-invalid-severity)
        (asserts! (>= amount (var-get min-dispute-amount)) err-invalid-amount)
        (asserts! (not (is-eq tx-sender respondent)) err-invalid-party)
        (asserts! (< (get active-cases party-data) (var-get max-active-per-party)) err-max-disputes)
        (asserts! (or
            (is-eq (get last-filing party-data) u0)
            (> (- stacks-block-time (get last-filing party-data)) (var-get filing-cooldown))
        ) err-cooldown-active)

        (map-set cases
            { case-id: case-id }
            {
                claimant: tx-sender,
                respondent: respondent,
                campaign-id: campaign-id,
                dispute-type: dispute-type,
                severity: severity,
                priority: priority,
                amount-at-stake: amount,
                status: STATUS-FILED,
                description: description,
                filed-at: stacks-block-time,
                acknowledged-at: u0,
                sla-deadline: (+ stacks-block-time sla-blocks),
                last-activity: stacks-block-time,
                escalation-count: u0
            }
        )

        (map-set case-metadata
            { case-id: case-id }
            {
                category-tags: tags,
                related-case-id: none,
                external-ref: none,
                resolution-notes: u"",
                final-outcome: u0
            }
        )

        (map-set sla-records
            { case-id: case-id }
            {
                sla-blocks: sla-blocks,
                breached: false,
                breach-at: u0,
                penalty-applied: false
            }
        )

        (map-set party-cases
            { party: tx-sender }
            (merge party-data {
                active-cases: (+ (get active-cases party-data) u1),
                total-filed: (+ (get total-filed party-data) u1),
                last-filing: stacks-block-time
            })
        )

        (let
            (
                (resp-data (default-to
                    { active-cases: u0, total-filed: u0, total-as-respondent: u0, last-filing: u0, wins: u0, losses: u0 }
                    (map-get? party-cases { party: respondent })))
            )
            (map-set party-cases
                { party: respondent }
                (merge resp-data {
                    active-cases: (+ (get active-cases resp-data) u1),
                    total-as-respondent: (+ (get total-as-respondent resp-data) u1)
                })
            )
        )

        (add-timeline-entry case-id tx-sender "FILED" u"Dispute case opened")
        (update-daily-stats-filed)
        (var-set case-nonce case-id)
        (var-set total-filed (+ (var-get total-filed) u1))
        (ok case-id)
    )
)

(define-public (acknowledge-dispute (case-id uint))
    (let
        (
            (c (unwrap! (map-get? cases { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get respondent c)) err-unauthorized)
        (asserts! (is-eq (get status c) STATUS-FILED) err-invalid-status)

        (map-set cases
            { case-id: case-id }
            (merge c {
                status: STATUS-ACKNOWLEDGED,
                acknowledged-at: stacks-block-time,
                last-activity: stacks-block-time
            })
        )

        (add-timeline-entry case-id tx-sender "ACKNOWLEDGED" u"Respondent acknowledged the dispute")
        (ok true)
    )
)

(define-public (move-to-investigation (case-id uint))
    (let
        (
            (c (unwrap! (map-get? cases { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (or
            (is-eq (get status c) STATUS-FILED)
            (is-eq (get status c) STATUS-ACKNOWLEDGED)
        ) err-invalid-status)

        (map-set cases
            { case-id: case-id }
            (merge c {
                status: STATUS-INVESTIGATION,
                last-activity: stacks-block-time
            })
        )

        (add-timeline-entry case-id tx-sender "INVESTIGATION" u"Case moved to investigation phase")
        (ok true)
    )
)

(define-public (escalate-to-arbitration (case-id uint))
    (let
        (
            (c (unwrap! (map-get? cases { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get status c) STATUS-INVESTIGATION) err-invalid-status)

        (map-set cases
            { case-id: case-id }
            (merge c {
                status: STATUS-ARBITRATION,
                last-activity: stacks-block-time,
                escalation-count: (+ (get escalation-count c) u1)
            })
        )

        (add-timeline-entry case-id tx-sender "ESCALATED" u"Case escalated to arbitration")
        (update-daily-stats-escalated)
        (ok true)
    )
)

(define-public (resolve-case (case-id uint) (outcome uint) (notes (string-utf8 500)))
    (let
        (
            (c (unwrap! (map-get? cases { case-id: case-id }) err-not-found))
            (meta (unwrap! (map-get? case-metadata { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (or
            (is-eq (get status c) STATUS-INVESTIGATION)
            (is-eq (get status c) STATUS-ARBITRATION)
        ) err-invalid-status)

        (map-set cases
            { case-id: case-id }
            (merge c {
                status: STATUS-RESOLVED,
                last-activity: stacks-block-time
            })
        )

        (map-set case-metadata
            { case-id: case-id }
            (merge meta {
                resolution-notes: notes,
                final-outcome: outcome
            })
        )

        (let
            (
                (claimant-data (default-to
                    { active-cases: u0, total-filed: u0, total-as-respondent: u0, last-filing: u0, wins: u0, losses: u0 }
                    (map-get? party-cases { party: (get claimant c) })))
                (respondent-data (default-to
                    { active-cases: u0, total-filed: u0, total-as-respondent: u0, last-filing: u0, wins: u0, losses: u0 }
                    (map-get? party-cases { party: (get respondent c) })))
            )
            (if (is-eq outcome u1)
                (begin
                    (map-set party-cases { party: (get claimant c) }
                        (merge claimant-data {
                            active-cases: (if (> (get active-cases claimant-data) u0) (- (get active-cases claimant-data) u1) u0),
                            wins: (+ (get wins claimant-data) u1)
                        }))
                    (map-set party-cases { party: (get respondent c) }
                        (merge respondent-data {
                            active-cases: (if (> (get active-cases respondent-data) u0) (- (get active-cases respondent-data) u1) u0),
                            losses: (+ (get losses respondent-data) u1)
                        }))
                )
                (begin
                    (map-set party-cases { party: (get claimant c) }
                        (merge claimant-data {
                            active-cases: (if (> (get active-cases claimant-data) u0) (- (get active-cases claimant-data) u1) u0),
                            losses: (+ (get losses claimant-data) u1)
                        }))
                    (map-set party-cases { party: (get respondent c) }
                        (merge respondent-data {
                            active-cases: (if (> (get active-cases respondent-data) u0) (- (get active-cases respondent-data) u1) u0),
                            wins: (+ (get wins respondent-data) u1)
                        }))
                )
            )
        )

        (add-timeline-entry case-id tx-sender "RESOLVED" u"Case resolved with final outcome")
        (update-daily-stats-resolved)
        (var-set total-resolved (+ (var-get total-resolved) u1))
        (ok true)
    )
)

(define-public (dismiss-case (case-id uint) (reason (string-utf8 500)))
    (let
        (
            (c (unwrap! (map-get? cases { case-id: case-id }) err-not-found))
            (meta (unwrap! (map-get? case-metadata { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (or
            (is-eq (get status c) STATUS-FILED)
            (is-eq (get status c) STATUS-ACKNOWLEDGED)
            (is-eq (get status c) STATUS-INVESTIGATION)
        ) err-invalid-status)

        (map-set cases
            { case-id: case-id }
            (merge c {
                status: STATUS-DISMISSED,
                last-activity: stacks-block-time
            })
        )

        (map-set case-metadata
            { case-id: case-id }
            (merge meta { resolution-notes: reason })
        )

        (let
            (
                (claimant-data (default-to
                    { active-cases: u0, total-filed: u0, total-as-respondent: u0, last-filing: u0, wins: u0, losses: u0 }
                    (map-get? party-cases { party: (get claimant c) })))
                (respondent-data (default-to
                    { active-cases: u0, total-filed: u0, total-as-respondent: u0, last-filing: u0, wins: u0, losses: u0 }
                    (map-get? party-cases { party: (get respondent c) })))
            )
            (map-set party-cases { party: (get claimant c) }
                (merge claimant-data {
                    active-cases: (if (> (get active-cases claimant-data) u0) (- (get active-cases claimant-data) u1) u0)
                }))
            (map-set party-cases { party: (get respondent c) }
                (merge respondent-data {
                    active-cases: (if (> (get active-cases respondent-data) u0) (- (get active-cases respondent-data) u1) u0)
                }))
        )

        (add-timeline-entry case-id tx-sender "DISMISSED" u"Case dismissed")
        (update-daily-stats-dismissed)
        (var-set total-dismissed (+ (var-get total-dismissed) u1))
        (ok true)
    )
)

(define-public (file-counter-claim (case-id uint) (amount uint) (reason (string-utf8 500)))
    (let
        (
            (c (unwrap! (map-get? cases { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get respondent c)) err-unauthorized)
        (asserts! (is-none (map-get? counter-claims { case-id: case-id })) err-already-exists)
        (asserts! (or
            (is-eq (get status c) STATUS-FILED)
            (is-eq (get status c) STATUS-ACKNOWLEDGED)
            (is-eq (get status c) STATUS-INVESTIGATION)
        ) err-invalid-status)
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (<
            (- stacks-block-time (get filed-at c))
            (var-get counter-claim-window)
        ) err-expired)

        (map-set counter-claims
            { case-id: case-id }
            {
                counter-claimant: tx-sender,
                amount: amount,
                reason: reason,
                filed-at: stacks-block-time,
                accepted: false
            }
        )

        (add-timeline-entry case-id tx-sender "COUNTER_CLAIM" u"Counter-claim filed by respondent")
        (ok true)
    )
)

(define-public (accept-counter-claim (case-id uint))
    (let
        (
            (cc (unwrap! (map-get? counter-claims { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set counter-claims
            { case-id: case-id }
            (merge cc { accepted: true })
        )

        (add-timeline-entry case-id tx-sender "COUNTER_ACCEPTED" u"Counter-claim accepted for review")
        (ok true)
    )
)

(define-public (flag-sla-breach (case-id uint))
    (let
        (
            (c (unwrap! (map-get? cases { case-id: case-id }) err-not-found))
            (sla (unwrap! (map-get? sla-records { case-id: case-id }) err-not-found))
        )
        (asserts! (> stacks-block-time (get sla-deadline c)) err-sla-not-breached)
        (asserts! (not (get breached sla)) err-already-exists)

        (map-set sla-records
            { case-id: case-id }
            (merge sla {
                breached: true,
                breach-at: stacks-block-time
            })
        )

        (add-timeline-entry case-id tx-sender "SLA_BREACH" u"SLA deadline exceeded")
        (ok true)
    )
)

(define-public (link-related-case (case-id uint) (related-id uint))
    (let
        (
            (meta (unwrap! (map-get? case-metadata { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-some (map-get? cases { case-id: related-id })) err-not-found)

        (map-set case-metadata
            { case-id: case-id }
            (merge meta { related-case-id: (some related-id) })
        )

        (ok true)
    )
)

(define-public (update-severity (case-id uint) (new-severity uint))
    (let
        (
            (c (unwrap! (map-get? cases { case-id: case-id }) err-not-found))
            (new-sla (severity-to-sla new-severity))
            (new-priority (compute-priority new-severity (get amount-at-stake c)))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-valid-severity new-severity) err-invalid-severity)
        (asserts! (not (is-eq (get status c) STATUS-CLOSED)) err-invalid-status)
        (asserts! (not (is-eq (get status c) STATUS-DISMISSED)) err-invalid-status)

        (map-set cases
            { case-id: case-id }
            (merge c {
                severity: new-severity,
                priority: new-priority,
                sla-deadline: (+ stacks-block-time new-sla),
                last-activity: stacks-block-time
            })
        )

        (map-set sla-records
            { case-id: case-id }
            {
                sla-blocks: new-sla,
                breached: false,
                breach-at: u0,
                penalty-applied: false
            }
        )

        (add-timeline-entry case-id tx-sender "SEVERITY_UPDATED" u"Case severity level changed")
        (ok true)
    )
)

(define-public (close-resolved-case (case-id uint))
    (let
        (
            (c (unwrap! (map-get? cases { case-id: case-id }) err-not-found))
        )
        (asserts! (is-eq (get status c) STATUS-RESOLVED) err-invalid-status)

        (map-set cases
            { case-id: case-id }
            (merge c {
                status: STATUS-CLOSED,
                last-activity: stacks-block-time
            })
        )

        (add-timeline-entry case-id tx-sender "CLOSED" u"Case closed")
        (ok true)
    )
)

(define-public (set-min-dispute-amount (amount uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set min-dispute-amount amount)
        (ok true)
    )
)

(define-public (set-max-active-per-party (max-val uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set max-active-per-party max-val)
        (ok true)
    )
)

(define-public (set-default-sla (blocks uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set default-sla-blocks blocks)
        (ok true)
    )
)

(define-public (set-filing-cooldown (blocks uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set filing-cooldown blocks)
        (ok true)
    )
)
