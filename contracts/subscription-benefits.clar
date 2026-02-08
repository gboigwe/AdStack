;; title: subscription-benefits
;; version: 1.0.0
;; summary: Subscription tier management with feature gating and usage limits
;; description: Manages feature access control, usage limits, tier transitions, quota enforcement, and benefit expiration for subscription-based services

;; ===================================
;; Constants
;; ===================================

(define-constant contract-owner tx-sender)

;; Error codes
(define-constant err-owner-only (err u900))
(define-constant err-not-found (err u901))
(define-constant err-unauthorized (err u902))
(define-constant err-feature-not-available (err u903))
(define-constant err-quota-exceeded (err u904))
(define-constant err-invalid-tier (err u905))
(define-constant err-subscription-expired (err u906))
(define-constant err-invalid-upgrade (err u907))
(define-constant err-invalid-limit (err u908))
(define-constant err-benefit-expired (err u909))
(define-constant err-cooldown-active (err u910))

;; Subscription tiers
(define-constant TIER-FREE u0)
(define-constant TIER-BASIC u1)
(define-constant TIER-PRO u2)
(define-constant TIER-ENTERPRISE u3)

;; Feature flags
(define-constant FEATURE-BASIC-CAMPAIGNS u1)
(define-constant FEATURE-ADVANCED-ANALYTICS u2)
(define-constant FEATURE-CUSTOM-TARGETING u3)
(define-constant FEATURE-API-ACCESS u4)
(define-constant FEATURE-PRIORITY-SUPPORT u5)
(define-constant FEATURE-WHITE-LABEL u6)
(define-constant FEATURE-ADVANCED-REPORTING u7)
(define-constant FEATURE-BULK-OPERATIONS u8)
(define-constant FEATURE-TEAM-COLLABORATION u9)
(define-constant FEATURE-CUSTOM-INTEGRATIONS u10)

;; Usage types
(define-constant USAGE-CAMPAIGNS u1)
(define-constant USAGE-IMPRESSIONS u2)
(define-constant USAGE-CLICKS u3)
(define-constant USAGE-CONVERSIONS u4)
(define-constant USAGE-API-CALLS u5)
(define-constant USAGE-TEAM-MEMBERS u6)
(define-constant USAGE-STORAGE-GB u7)
(define-constant USAGE-REPORTS u8)

;; Tier transition cooldown (7 days)
(define-constant TIER-CHANGE-COOLDOWN u604800)

;; ===================================
;; Data Variables
;; ===================================

(define-data-var tier-nonce uint u0)
(define-data-var benefit-nonce uint u0)
(define-data-var usage-reset-period uint u2592000) ;; 30 days
(define-data-var grace-period-enabled bool true)
(define-data-var grace-period-duration uint u259200) ;; 3 days

;; ===================================
;; Data Maps
;; ===================================

;; Subscription tier configurations
(define-map tier-configs
    { tier-id: uint }
    {
        tier-name: (string-utf8 50),
        tier-description: (string-utf8 500),
        monthly-price: uint,
        is-active: bool,
        created-at: uint,
        updated-at: uint
    }
)

;; Feature entitlements per tier
(define-map tier-features
    { tier-id: uint, feature-id: uint }
    {
        enabled: bool,
        feature-name: (string-utf8 100),
        feature-description: (string-utf8 300),
        added-at: uint
    }
)

;; Usage limits per tier
(define-map tier-usage-limits
    { tier-id: uint, usage-type: uint }
    {
        limit-name: (string-utf8 50),
        monthly-limit: uint,
        hard-limit: bool, ;; If true, block when exceeded; if false, allow overage
        overage-fee: uint, ;; Cost per unit over limit
        reset-period: uint
    }
)

;; User subscription benefits
(define-map user-benefits
    { user: principal }
    {
        current-tier: uint,
        subscription-id: uint,
        activated-at: uint,
        expires-at: uint,
        is-active: bool,
        in-grace-period: bool,
        grace-period-ends: uint,
        auto-renew: bool,
        last-tier-change: uint
    }
)

;; User usage tracking
(define-map user-usage
    { user: principal, usage-type: uint, period-start: uint }
    {
        current-usage: uint,
        limit: uint,
        overage: uint,
        overage-charges: uint,
        last-reset: uint,
        next-reset: uint
    }
)

;; Feature access history
(define-map feature-access-log
    { user: principal, feature-id: uint, access-id: uint }
    {
        accessed-at: uint,
        granted: bool,
        denial-reason: (optional (string-utf8 200))
    }
)

(define-data-var access-log-nonce uint u0)

;; Tier transition history
(define-map tier-transitions
    { user: principal, transition-id: uint }
    {
        from-tier: uint,
        to-tier: uint,
        transitioned-at: uint,
        reason: (string-utf8 200),
        prorated-amount: uint,
        effective-immediately: bool
    }
)

(define-data-var transition-nonce uint u0)

;; Benefit expiration events
(define-map expiration-events
    { user: principal, event-id: uint }
    {
        subscription-id: uint,
        tier: uint,
        expired-at: uint,
        auto-renewed: bool,
        grace-period-granted: bool
    }
)

(define-data-var expiration-nonce uint u0)

;; Usage quota alerts
(define-map quota-alerts
    { user: principal, usage-type: uint }
    {
        threshold-75-reached: bool,
        threshold-90-reached: bool,
        threshold-100-reached: bool,
        last-alert-sent: uint,
        overage-alert-sent: bool
    }
)

;; Tier analytics
(define-map tier-analytics
    { tier-id: uint }
    {
        total-subscribers: uint,
        active-subscribers: uint,
        churned-subscribers: uint,
        total-revenue: uint,
        average-lifetime: uint,
        upgrade-count: uint,
        downgrade-count: uint
    }
)

;; User engagement metrics
(define-map user-engagement
    { user: principal }
    {
        total-features-used: uint,
        most-used-feature: uint,
        last-feature-access: uint,
        feature-adoption-rate: uint,
        usage-intensity-score: uint,
        upgrade-likelihood-score: uint
    }
)

;; Custom benefits (one-off grants)
(define-map custom-benefits
    { user: principal, benefit-id: uint }
    {
        benefit-type: (string-utf8 100),
        benefit-value: uint,
        granted-by: principal,
        granted-at: uint,
        expires-at: (optional uint),
        is-active: bool
    }
)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-tier-config (tier-id uint))
    (map-get? tier-configs { tier-id: tier-id })
)

(define-read-only (get-tier-feature (tier-id uint) (feature-id uint))
    (map-get? tier-features { tier-id: tier-id, feature-id: feature-id })
)

(define-read-only (get-tier-usage-limit (tier-id uint) (usage-type uint))
    (map-get? tier-usage-limits { tier-id: tier-id, usage-type: usage-type })
)

(define-read-only (get-user-benefits (user principal))
    (map-get? user-benefits { user: user })
)

(define-read-only (get-user-usage (user principal) (usage-type uint) (period-start uint))
    (map-get? user-usage { user: user, usage-type: usage-type, period-start: period-start })
)

(define-read-only (get-user-engagement (user principal))
    (map-get? user-engagement { user: user })
)

(define-read-only (get-tier-analytics (tier-id uint))
    (map-get? tier-analytics { tier-id: tier-id })
)

(define-read-only (get-quota-alerts (user principal) (usage-type uint))
    (map-get? quota-alerts { user: user, usage-type: usage-type })
)

;; Check if user has access to a feature
(define-read-only (has-feature-access (user principal) (feature-id uint))
    (match (map-get? user-benefits { user: user })
        benefits (let
            (
                (tier (get current-tier benefits))
                (is-active (get is-active benefits))
                (not-expired (or
                    (> (get expires-at benefits) stacks-block-time)
                    (and
                        (get in-grace-period benefits)
                        (> (get grace-period-ends benefits) stacks-block-time)
                    )
                ))
            )
            (if (and is-active not-expired)
                (match (map-get? tier-features { tier-id: tier, feature-id: feature-id })
                    feature (ok (get enabled feature))
                    (ok false)
                )
                (ok false)
            )
        )
        (ok false)
    )
)

;; Check if user can perform action within usage limits
(define-read-only (check-usage-limit (user principal) (usage-type uint) (requested-units uint))
    (match (map-get? user-benefits { user: user })
        benefits (let
            (
                (tier (get current-tier benefits))
                (current-period (/ stacks-block-time (var-get usage-reset-period)))
            )
            (match (map-get? tier-usage-limits { tier-id: tier, usage-type: usage-type })
                limit-config (let
                    (
                        (usage (default-to
                            {
                                current-usage: u0,
                                limit: (get monthly-limit limit-config),
                                overage: u0,
                                overage-charges: u0,
                                last-reset: stacks-block-time,
                                next-reset: (+ stacks-block-time (var-get usage-reset-period))
                            }
                            (map-get? user-usage { user: user, usage-type: usage-type, period-start: current-period })
                        ))
                        (new-usage (+ (get current-usage usage) requested-units))
                        (limit (get monthly-limit limit-config))
                    )
                    (if (get hard-limit limit-config)
                        ;; Hard limit - deny if exceeded
                        (ok {
                            allowed: (<= new-usage limit),
                            remaining: (if (>= limit new-usage) (- limit new-usage) u0),
                            overage: (if (> new-usage limit) (- new-usage limit) u0),
                            overage-fee: u0
                        })
                        ;; Soft limit - allow but charge overage
                        (ok {
                            allowed: true,
                            remaining: u0,
                            overage: (if (> new-usage limit) (- new-usage limit) u0),
                            overage-fee: (if (> new-usage limit)
                                (* (- new-usage limit) (get overage-fee limit-config))
                                u0
                            )
                        })
                    )
                )
                (ok { allowed: false, remaining: u0, overage: u0, overage-fee: u0 })
            )
        )
        (ok { allowed: false, remaining: u0, overage: u0, overage-fee: u0 })
    )
)

;; Check if subscription is active
(define-read-only (is-subscription-active (user principal))
    (match (map-get? user-benefits { user: user })
        benefits (ok (and
            (get is-active benefits)
            (or
                (> (get expires-at benefits) stacks-block-time)
                (and
                    (get in-grace-period benefits)
                    (> (get grace-period-ends benefits) stacks-block-time)
                )
            )
        ))
        (ok false)
    )
)

;; Get user's current tier
(define-read-only (get-user-tier (user principal))
    (match (map-get? user-benefits { user: user })
        benefits (ok (get current-tier benefits))
        (ok TIER-FREE)
    )
)

;; Calculate prorated upgrade cost
(define-read-only (calculate-upgrade-cost
    (user principal)
    (from-tier uint)
    (to-tier uint)
)
    (let
        (
            (from-config (unwrap! (map-get? tier-configs { tier-id: from-tier }) err-invalid-tier))
            (to-config (unwrap! (map-get? tier-configs { tier-id: to-tier }) err-invalid-tier))
            (benefits (unwrap! (map-get? user-benefits { user: user }) err-not-found))
            (time-remaining (- (get expires-at benefits) stacks-block-time))
            (days-remaining (/ time-remaining u86400))
            (from-price (get monthly-price from-config))
            (to-price (get monthly-price to-config))
            (price-diff (- to-price from-price))
            (prorated-cost (/ (* price-diff days-remaining) u30))
        )
        (ok prorated-cost)
    )
)

;; ===================================
;; Private Functions
;; ===================================

(define-private (record-feature-access
    (user principal)
    (feature-id uint)
    (granted bool)
    (denial-reason (optional (string-utf8 200)))
)
    (let
        (
            (access-id (+ (var-get access-log-nonce) u1))
        )
        (map-set feature-access-log
            { user: user, feature-id: feature-id, access-id: access-id }
            {
                accessed-at: stacks-block-time,
                granted: granted,
                denial-reason: denial-reason
            }
        )
        (var-set access-log-nonce access-id)
    )
)

(define-private (update-tier-analytics
    (tier-id uint)
    (subscriber-delta int)
    (revenue-delta uint)
    (is-upgrade bool)
    (is-downgrade bool)
)
    (let
        (
            (analytics (default-to
                {
                    total-subscribers: u0,
                    active-subscribers: u0,
                    churned-subscribers: u0,
                    total-revenue: u0,
                    average-lifetime: u0,
                    upgrade-count: u0,
                    downgrade-count: u0
                }
                (map-get? tier-analytics { tier-id: tier-id })
            ))
        )
        (map-set tier-analytics
            { tier-id: tier-id }
            {
                total-subscribers: (if (> subscriber-delta 0)
                    (+ (get total-subscribers analytics) (to-uint subscriber-delta))
                    (get total-subscribers analytics)
                ),
                active-subscribers: (if (> subscriber-delta 0)
                    (+ (get active-subscribers analytics) (to-uint subscriber-delta))
                    (if (< subscriber-delta 0)
                        (- (get active-subscribers analytics) (to-uint (* subscriber-delta -1)))
                        (get active-subscribers analytics)
                    )
                ),
                churned-subscribers: (get churned-subscribers analytics),
                total-revenue: (+ (get total-revenue analytics) revenue-delta),
                average-lifetime: (get average-lifetime analytics),
                upgrade-count: (if is-upgrade (+ (get upgrade-count analytics) u1) (get upgrade-count analytics)),
                downgrade-count: (if is-downgrade (+ (get downgrade-count analytics) u1) (get downgrade-count analytics))
            }
        )
    )
)

(define-private (update-user-engagement
    (user principal)
    (feature-id uint)
)
    (let
        (
            (engagement (default-to
                {
                    total-features-used: u0,
                    most-used-feature: u0,
                    last-feature-access: u0,
                    feature-adoption-rate: u0,
                    usage-intensity-score: u0,
                    upgrade-likelihood-score: u0
                }
                (map-get? user-engagement { user: user })
            ))
        )
        (map-set user-engagement
            { user: user }
            {
                total-features-used: (+ (get total-features-used engagement) u1),
                most-used-feature: feature-id,
                last-feature-access: stacks-block-time,
                feature-adoption-rate: (get feature-adoption-rate engagement),
                usage-intensity-score: (get usage-intensity-score engagement),
                upgrade-likelihood-score: (get upgrade-likelihood-score engagement)
            }
        )
    )
)

(define-private (check-and-send-quota-alerts
    (user principal)
    (usage-type uint)
    (usage-percentage uint)
)
    (let
        (
            (alerts (default-to
                {
                    threshold-75-reached: false,
                    threshold-90-reached: false,
                    threshold-100-reached: false,
                    last-alert-sent: u0,
                    overage-alert-sent: false
                }
                (map-get? quota-alerts { user: user, usage-type: usage-type })
            ))
        )
        (map-set quota-alerts
            { user: user, usage-type: usage-type }
            {
                threshold-75-reached: (or (get threshold-75-reached alerts) (>= usage-percentage u7500)),
                threshold-90-reached: (or (get threshold-90-reached alerts) (>= usage-percentage u9000)),
                threshold-100-reached: (or (get threshold-100-reached alerts) (>= usage-percentage u10000)),
                last-alert-sent: stacks-block-time,
                overage-alert-sent: (> usage-percentage u10000)
            }
        )
    )
)

;; ===================================
;; Public Functions
;; ===================================

;; Initialize a subscription tier
(define-public (create-tier
    (tier-name (string-utf8 50))
    (tier-description (string-utf8 500))
    (monthly-price uint)
)
    (let
        (
            (tier-id (+ (var-get tier-nonce) u1))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set tier-configs
            { tier-id: tier-id }
            {
                tier-name: tier-name,
                tier-description: tier-description,
                monthly-price: monthly-price,
                is-active: true,
                created-at: stacks-block-time,
                updated-at: stacks-block-time
            }
        )

        (var-set tier-nonce tier-id)
        (ok tier-id)
    )
)

;; Add feature to tier
(define-public (add-tier-feature
    (tier-id uint)
    (feature-id uint)
    (feature-name (string-utf8 100))
    (feature-description (string-utf8 300))
)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-some (map-get? tier-configs { tier-id: tier-id })) err-invalid-tier)

        (map-set tier-features
            { tier-id: tier-id, feature-id: feature-id }
            {
                enabled: true,
                feature-name: feature-name,
                feature-description: feature-description,
                added-at: stacks-block-time
            }
        )

        (ok true)
    )
)

;; Set usage limit for tier
(define-public (set-tier-usage-limit
    (tier-id uint)
    (usage-type uint)
    (limit-name (string-utf8 50))
    (monthly-limit uint)
    (hard-limit bool)
    (overage-fee uint)
)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-some (map-get? tier-configs { tier-id: tier-id })) err-invalid-tier)

        (map-set tier-usage-limits
            { tier-id: tier-id, usage-type: usage-type }
            {
                limit-name: limit-name,
                monthly-limit: monthly-limit,
                hard-limit: hard-limit,
                overage-fee: overage-fee,
                reset-period: (var-get usage-reset-period)
            }
        )

        (ok true)
    )
)

;; Activate user benefits
(define-public (activate-benefits
    (user principal)
    (tier-id uint)
    (subscription-id uint)
    (duration uint)
)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-some (map-get? tier-configs { tier-id: tier-id })) err-invalid-tier)

        (map-set user-benefits
            { user: user }
            {
                current-tier: tier-id,
                subscription-id: subscription-id,
                activated-at: stacks-block-time,
                expires-at: (+ stacks-block-time duration),
                is-active: true,
                in-grace-period: false,
                grace-period-ends: u0,
                auto-renew: true,
                last-tier-change: stacks-block-time
            }
        )

        ;; Update analytics
        (update-tier-analytics tier-id 1 u0 false false)

        (ok true)
    )
)

;; Request feature access
(define-public (request-feature-access (feature-id uint))
    (let
        (
            (has-access (unwrap! (has-feature-access tx-sender feature-id) err-feature-not-available))
        )
        (if has-access
            (begin
                (record-feature-access tx-sender feature-id true none)
                (update-user-engagement tx-sender feature-id)
                (ok true)
            )
            (begin
                (record-feature-access tx-sender feature-id false (some u"Feature not available in current tier"))
                err-feature-not-available
            )
        )
    )
)

;; Track usage
(define-public (track-usage
    (usage-type uint)
    (units uint)
)
    (let
        (
            (benefits (unwrap! (map-get? user-benefits { user: tx-sender }) err-not-found))
            (tier (get current-tier benefits))
            (current-period (/ stacks-block-time (var-get usage-reset-period)))
            (limit-check (unwrap! (check-usage-limit tx-sender usage-type units) err-quota-exceeded))
        )
        ;; Check if active subscription
        (asserts! (unwrap! (is-subscription-active tx-sender) err-subscription-expired) err-subscription-expired)

        ;; Check if allowed
        (asserts! (get allowed limit-check) err-quota-exceeded)

        ;; Update usage
        (let
            (
                (current-usage-data (default-to
                    {
                        current-usage: u0,
                        limit: u0,
                        overage: u0,
                        overage-charges: u0,
                        last-reset: stacks-block-time,
                        next-reset: (+ stacks-block-time (var-get usage-reset-period))
                    }
                    (map-get? user-usage { user: tx-sender, usage-type: usage-type, period-start: current-period })
                ))
                (limit-config (unwrap! (map-get? tier-usage-limits { tier-id: tier, usage-type: usage-type }) err-invalid-limit))
                (new-usage (+ (get current-usage current-usage-data) units))
                (limit (get monthly-limit limit-config))
                (usage-percentage (if (> limit u0) (/ (* new-usage u10000) limit) u0))
            )
            (map-set user-usage
                { user: tx-sender, usage-type: usage-type, period-start: current-period }
                {
                    current-usage: new-usage,
                    limit: limit,
                    overage: (get overage limit-check),
                    overage-charges: (+ (get overage-charges current-usage-data) (get overage-fee limit-check)),
                    last-reset: (get last-reset current-usage-data),
                    next-reset: (get next-reset current-usage-data)
                }
            )

            ;; Check and send quota alerts
            (check-and-send-quota-alerts tx-sender usage-type usage-percentage)

            (ok {
                new-usage: new-usage,
                remaining: (get remaining limit-check),
                overage-fee: (get overage-fee limit-check)
            })
        )
    )
)

;; Upgrade tier
(define-public (upgrade-tier (new-tier uint))
    (let
        (
            (benefits (unwrap! (map-get? user-benefits { user: tx-sender }) err-not-found))
            (current-tier (get current-tier benefits))
            (last-change (get last-tier-change benefits))
            (transition-id (+ (var-get transition-nonce) u1))
        )
        ;; Validations
        (asserts! (is-some (map-get? tier-configs { tier-id: new-tier })) err-invalid-tier)
        (asserts! (> new-tier current-tier) err-invalid-upgrade)
        (asserts! (>= (- stacks-block-time last-change) TIER-CHANGE-COOLDOWN) err-cooldown-active)

        ;; Calculate prorated cost
        (let
            (
                (prorated-cost (unwrap! (calculate-upgrade-cost tx-sender current-tier new-tier) err-invalid-upgrade))
            )
            ;; Process upgrade
            (map-set user-benefits
                { user: tx-sender }
                (merge benefits {
                    current-tier: new-tier,
                    last-tier-change: stacks-block-time
                })
            )

            ;; Record transition
            (map-set tier-transitions
                { user: tx-sender, transition-id: transition-id }
                {
                    from-tier: current-tier,
                    to-tier: new-tier,
                    transitioned-at: stacks-block-time,
                    reason: u"User-initiated upgrade",
                    prorated-amount: prorated-cost,
                    effective-immediately: true
                }
            )
            (var-set transition-nonce transition-id)

            ;; Update analytics
            (update-tier-analytics current-tier -1 u0 false false)
            (update-tier-analytics new-tier 1 prorated-cost true false)

            (ok { transition-id: transition-id, prorated-cost: prorated-cost })
        )
    )
)

;; Downgrade tier
(define-public (downgrade-tier (new-tier uint))
    (let
        (
            (benefits (unwrap! (map-get? user-benefits { user: tx-sender }) err-not-found))
            (current-tier (get current-tier benefits))
            (last-change (get last-tier-change benefits))
            (transition-id (+ (var-get transition-nonce) u1))
        )
        ;; Validations
        (asserts! (is-some (map-get? tier-configs { tier-id: new-tier })) err-invalid-tier)
        (asserts! (< new-tier current-tier) err-invalid-upgrade)
        (asserts! (>= (- stacks-block-time last-change) TIER-CHANGE-COOLDOWN) err-cooldown-active)

        ;; Process downgrade (effective at next billing cycle)
        (map-set tier-transitions
            { user: tx-sender, transition-id: transition-id }
            {
                from-tier: current-tier,
                to-tier: new-tier,
                transitioned-at: stacks-block-time,
                reason: u"User-initiated downgrade",
                prorated-amount: u0,
                effective-immediately: false
            }
        )
        (var-set transition-nonce transition-id)

        ;; Update analytics
        (update-tier-analytics current-tier 0 u0 false true)

        (ok { transition-id: transition-id, effective-at: (get expires-at benefits) })
    )
)

;; Handle benefit expiration
(define-public (expire-benefits (user principal))
    (let
        (
            (benefits (unwrap! (map-get? user-benefits { user: user }) err-not-found))
            (event-id (+ (var-get expiration-nonce) u1))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= (get expires-at benefits) stacks-block-time) err-benefit-expired)

        ;; Check if grace period should be granted
        (if (and
            (var-get grace-period-enabled)
            (not (get in-grace-period benefits))
        )
            (begin
                ;; Grant grace period
                (map-set user-benefits
                    { user: user }
                    (merge benefits {
                        in-grace-period: true,
                        grace-period-ends: (+ stacks-block-time (var-get grace-period-duration))
                    })
                )

                ;; Record event
                (map-set expiration-events
                    { user: user, event-id: event-id }
                    {
                        subscription-id: (get subscription-id benefits),
                        tier: (get current-tier benefits),
                        expired-at: stacks-block-time,
                        auto-renewed: false,
                        grace-period-granted: true
                    }
                )
                (var-set expiration-nonce event-id)

                (ok { grace-period: true, ends-at: (+ stacks-block-time (var-get grace-period-duration)) })
            )
            (begin
                ;; Deactivate benefits
                (map-set user-benefits
                    { user: user }
                    (merge benefits { is-active: false })
                )

                ;; Record event
                (map-set expiration-events
                    { user: user, event-id: event-id }
                    {
                        subscription-id: (get subscription-id benefits),
                        tier: (get current-tier benefits),
                        expired-at: stacks-block-time,
                        auto-renewed: false,
                        grace-period-granted: false
                    }
                )
                (var-set expiration-nonce event-id)

                ;; Update analytics
                (update-tier-analytics (get current-tier benefits) -1 u0 false false)

                (ok { grace-period: false, ends-at: u0 })
            )
        )
    )
)

;; Grant custom benefit
(define-public (grant-custom-benefit
    (user principal)
    (benefit-type (string-utf8 100))
    (benefit-value uint)
    (expires-at (optional uint))
)
    (let
        (
            (benefit-id (+ (var-get benefit-nonce) u1))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set custom-benefits
            { user: user, benefit-id: benefit-id }
            {
                benefit-type: benefit-type,
                benefit-value: benefit-value,
                granted-by: tx-sender,
                granted-at: stacks-block-time,
                expires-at: expires-at,
                is-active: true
            }
        )

        (var-set benefit-nonce benefit-id)
        (ok benefit-id)
    )
)

;; Admin: Toggle grace period
(define-public (toggle-grace-period (enabled bool))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set grace-period-enabled enabled)
        (ok true)
    )
)

;; Admin: Set grace period duration
(define-public (set-grace-period-duration (duration uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set grace-period-duration duration)
        (ok true)
    )
)
